"""Dependency-free Admin MVP service."""

from __future__ import annotations

from uuid import uuid4

from common_core.admin.schemas import (
    GraphRAGSearchTestRequest,
    IndexJobRequest,
    IndexJobResponse,
    IndexJobStepResponse,
    IndexJobStepStatus,
    IndexJobStatus,
    SourceCreateRequest,
    SourcePreviewResponse,
    SourceResponse,
    SourceStatus,
)
from common_core.ai_pipeline.document import DocumentPipeline, DocumentSource
from common_core.ai_pipeline.graphrag import (
    AuthContext,
    EntityResolver,
    EntityQuery,
    EvidenceQuery,
    EvidenceLinker,
    HybridRetriever,
    InMemoryGraphStore,
    RelationQuery,
    RelationExtractor,
    RetrievalRequest,
    RetrievalStrategy,
    SchemaRegistry,
)
from common_core.ai_pipeline.graphrag.entity_extractor import EntityExtractor
from common_core.ai_pipeline.vectorstores import ChunkQuery, InMemoryVectorStore, VectorWriteOptions


INDEX_JOB_STEPS = [
    "LOAD_SOURCE",
    "PARSE_DOCUMENT",
    "CHUNK_DOCUMENT",
    "EMBED_CHUNK",
    "SAVE_VECTOR",
    "EXTRACT_ENTITY",
    "EXTRACT_RELATION",
    "LINK_EVIDENCE",
    "SAVE_GRAPH",
    "FINALIZE",
]


class AdminService:
    """In-memory admin service for MVP API and screen integration tests."""

    def __init__(
        self,
        document_pipeline: DocumentPipeline | None = None,
        vector_store: InMemoryVectorStore | None = None,
        graph_store: InMemoryGraphStore | None = None,
        schema_registry: SchemaRegistry | None = None,
    ) -> None:
        self.document_pipeline = document_pipeline or DocumentPipeline()
        self.vector_store = vector_store or InMemoryVectorStore()
        self.graph_store = graph_store or InMemoryGraphStore()
        self.schema_registry = schema_registry or SchemaRegistry.with_defaults()
        self.entity_extractor = EntityExtractor()
        self.entity_resolver = EntityResolver()
        self.relation_extractor = RelationExtractor()
        self.evidence_linker = EvidenceLinker()
        self.sources: dict[str, SourceCreateRequest] = {}
        self.source_status: dict[str, SourceResponse] = {}
        self.jobs: dict[str, IndexJobResponse] = {}

    def create_source(self, request: SourceCreateRequest) -> SourceResponse:
        """Register source content."""

        source_id = str(uuid4())
        self.sources[source_id] = request
        response = SourceResponse(
            source_id=source_id,
            domain=request.domain,
            source_type=request.source_type,
            name=request.name,
            status=SourceStatus.REGISTERED,
            scope=request.scope,
            tags=request.tags,
            metadata=request.metadata,
        )
        self.source_status[source_id] = response
        return response

    def list_sources(self) -> list[SourceResponse]:
        """List active sources."""

        return [
            source
            for source in self.source_status.values()
            if source.status != SourceStatus.DELETED
        ]

    def get_source(self, source_id: str) -> SourceResponse:
        """Return source status."""

        return self.source_status[source_id]

    def delete_source(self, source_id: str) -> SourceResponse:
        """Mark source deleted and remove indexed data."""

        source = self.source_status[source_id]
        self.vector_store.delete_by_source(source_id, AuthContext(roles=["ADMIN"]))
        self.graph_store.delete_by_source(source_id, AuthContext(roles=["ADMIN"]))
        deleted = source.model_copy(update={"status": SourceStatus.DELETED})
        self.source_status[source_id] = deleted
        return deleted

    def create_index_job(self, request: IndexJobRequest) -> IndexJobResponse:
        """Create an index job."""

        job_id = str(uuid4())
        job = IndexJobResponse(
            job_id=job_id,
            source_id=request.source_id,
            status=IndexJobStatus.PENDING,
            step="PENDING",
            steps=self._new_job_steps(),
        )
        self.jobs[job_id] = job
        self.source_status[request.source_id] = self.source_status[request.source_id].model_copy(
            update={"last_job_id": job_id}
        )
        return job

    def run_index_job(self, job_id: str) -> IndexJobResponse:
        """Run an index job synchronously for MVP."""

        job = self.jobs[job_id].model_copy(update={"status": IndexJobStatus.RUNNING, "step": "LOAD_SOURCE"})
        self.jobs[job_id] = job
        source_request = self.sources[job.source_id]
        source = DocumentSource(
            source_id=job.source_id,
            domain=source_request.domain,
            source_type=source_request.source_type,
            name=source_request.name,
            content=source_request.content,
            metadata=source_request.metadata,
            tenant_id=source_request.tenant_id,
            user_id=source_request.user_id,
            scope=source_request.scope,
        )

        try:
            self._complete_step(job_id, "LOAD_SOURCE", {"source_type": source.source_type.value})
            self._start_step(job_id, "PARSE_DOCUMENT")
            pipeline_result = self.document_pipeline.process(source)
            self._complete_step(job_id, "PARSE_DOCUMENT", {"document_count": len(pipeline_result.documents)})
            self._complete_step(job_id, "CHUNK_DOCUMENT", {"chunk_count": len(pipeline_result.chunks)})
            self._start_step(job_id, "EMBED_CHUNK")
            self.vector_store.add_chunks(
                pipeline_result.chunks,
                VectorWriteOptions(collection_name="default"),
            )
            self._complete_step(job_id, "EMBED_CHUNK", {"chunk_count": len(pipeline_result.chunks)})
            self._complete_step(job_id, "SAVE_VECTOR", {"collection_name": "default"})
            schema = self.schema_registry.get(source.domain)
            entity_count = 0
            relation_count = 0
            evidence_count = 0
            for chunk in pipeline_result.chunks:
                self._start_step(job_id, "EXTRACT_ENTITY")
                candidates = self.entity_extractor.extract(chunk, schema)
                resolved = self.entity_resolver.resolve(candidates, schema)
                upserted_entities = self.graph_store.upsert_entities(resolved)
                entity_count += len(upserted_entities)
                self._complete_step(job_id, "EXTRACT_ENTITY", {"entity_count": entity_count})
                entity_by_name = {entity.normalized_name: entity for entity in upserted_entities}
                resolved_with_ids = [
                    entity.model_copy(update={"entity_id": entity_by_name[entity.normalized_name].entity_id})
                    for entity in resolved
                    if entity.normalized_name in entity_by_name
                ]
                self._start_step(job_id, "EXTRACT_RELATION")
                relations = self.relation_extractor.extract(chunk, resolved_with_ids, schema)
                upserted_relations = self.graph_store.upsert_relations(relations)
                relation_count += len(upserted_relations)
                self._complete_step(job_id, "EXTRACT_RELATION", {"relation_count": relation_count})
                self._start_step(job_id, "LINK_EVIDENCE")
                evidence_bundle = self.graph_store.upsert_evidence(
                    self.evidence_linker.link(chunk, resolved_with_ids, upserted_relations)
                )
                evidence_count += len(evidence_bundle.evidence)
                self._complete_step(job_id, "LINK_EVIDENCE", {"evidence_count": evidence_count})
            self._complete_step(job_id, "SAVE_GRAPH", {"entity_count": entity_count, "relation_count": relation_count})

            source_status = self.source_status[job.source_id].model_copy(
                update={
                    "status": SourceStatus.INDEXED,
                    "chunk_count": len(pipeline_result.chunks),
                    "entity_count": entity_count,
                    "relation_count": relation_count,
                    "evidence_count": evidence_count,
                    "last_job_id": job_id,
                }
            )
            self.source_status[job.source_id] = source_status
            self._complete_step(job_id, "FINALIZE")
            completed = job.model_copy(
                update={
                    "status": IndexJobStatus.COMPLETED,
                    "step": "COMPLETED",
                    "message": "index completed",
                    "metrics": {
                        "document_count": len(pipeline_result.documents),
                        "chunk_count": len(pipeline_result.chunks),
                        "entity_count": entity_count,
                        "relation_count": relation_count,
                        "evidence_count": evidence_count,
                    },
                    "steps": self.jobs[job_id].steps,
                }
            )
            self.jobs[job_id] = completed
            return completed
        except Exception as exc:
            failed = job.model_copy(
                update={
                    "status": IndexJobStatus.FAILED,
                    "step": "FAILED",
                    "message": "index failed",
                    "error": {"code": "INDEX_FAILED", "detail": str(exc)},
                    "steps": self._fail_current_step(job_id, exc),
                }
            )
            self.jobs[job_id] = failed
            self.source_status[job.source_id] = self.source_status[job.source_id].model_copy(
                update={"status": SourceStatus.FAILED}
            )
            return failed

    def get_index_job(self, job_id: str) -> IndexJobResponse:
        """Return index job status."""

        return self.jobs[job_id]

    def list_index_jobs(self) -> list[IndexJobResponse]:
        """List index jobs."""

        return list(self.jobs.values())

    def retry_index_job(self, job_id: str) -> IndexJobResponse:
        """Retry a failed or completed index job by creating a new step timeline."""

        job = self.jobs[job_id].model_copy(
            update={
                "status": IndexJobStatus.PENDING,
                "step": "PENDING",
                "message": "retry requested",
                "steps": self._new_job_steps(),
                "error": None,
            }
        )
        self.jobs[job_id] = job
        return self.run_index_job(job_id)

    def get_source_preview(self, source_id: str, limit: int = 20) -> SourcePreviewResponse:
        """Return Chunk/Entity/Relation/Evidence preview for one source."""

        source = self.source_status[source_id]
        auth = AuthContext(roles=["ADMIN"])
        chunks = self.vector_store.get_chunks(source_id, ChunkQuery(limit=limit))
        chunk_ids = {item.chunk.chunk_id for item in chunks}
        entities = [
            entity
            for entity in self.graph_store.find_entities(
                EntityQuery(domain=source.domain, limit=limit * 2),
                auth,
            )
            if chunk_ids.intersection(entity.evidence_chunk_ids)
        ][:limit]
        entity_ids = {entity.entity_id for entity in entities if entity.entity_id}
        relations = [
            relation
            for relation in self.graph_store.find_relations(
                RelationQuery(domain=source.domain, limit=limit * 2),
                auth,
            )
            if relation.source_id == source_id
            or relation.source_entity_ref in entity_ids
            or relation.target_entity_ref in entity_ids
        ][:limit]
        evidence = self.graph_store.get_evidence(
            EvidenceQuery(domain=source.domain, source_ids=[source_id], limit=limit),
            auth,
        )
        return SourcePreviewResponse(
            source_id=source_id,
            chunks=[item.chunk for item in chunks],
            entities=entities,
            relations=relations,
            evidence=evidence,
            metrics={
                "chunk_count": len(chunks),
                "entity_count": len(entities),
                "relation_count": len(relations),
                "evidence_count": len(evidence),
            },
        )

    def search_test(self, request: GraphRAGSearchTestRequest):
        """Run GraphRAG search test."""

        retriever = HybridRetriever(
            vector_store=self.vector_store,
            graph_store=self.graph_store,
        )
        return retriever.search(
            RetrievalRequest(
                domain=request.domain,
                query=request.query,
                top_k=request.top_k,
                strategy=RetrievalStrategy(request.strategy),
                filters=request.filters,
                include_evidence=request.include_evidence,
                auth=AuthContext(roles=["ADMIN"]),
            )
        )

    @staticmethod
    def _new_job_steps() -> list[IndexJobStepResponse]:
        return [
            IndexJobStepResponse(
                step=step,
                status=IndexJobStepStatus.PENDING,
                sequence=index + 1,
            )
            for index, step in enumerate(INDEX_JOB_STEPS)
        ]

    def _start_step(self, job_id: str, step: str) -> None:
        job = self.jobs[job_id]
        steps = [
            item.model_copy(update={"status": IndexJobStepStatus.RUNNING})
            if item.step == step and item.status == IndexJobStepStatus.PENDING
            else item
            for item in job.steps
        ]
        self.jobs[job_id] = job.model_copy(update={"step": step, "steps": steps})

    def _complete_step(self, job_id: str, step: str, metrics: dict | None = None) -> None:
        job = self.jobs[job_id]
        steps = [
            item.model_copy(
                update={
                    "status": IndexJobStepStatus.COMPLETED,
                    "message": "completed",
                    "metrics": {**item.metrics, **(metrics or {})},
                }
            )
            if item.step == step
            else item
            for item in job.steps
        ]
        next_step = step
        pending_steps = [item.step for item in steps if item.status == IndexJobStepStatus.PENDING]
        if pending_steps:
            next_step = pending_steps[0]
        self.jobs[job_id] = job.model_copy(update={"step": next_step, "steps": steps})

    def _fail_current_step(self, job_id: str, exc: Exception) -> list[IndexJobStepResponse]:
        job = self.jobs[job_id]
        failed_step = job.step
        return [
            item.model_copy(
                update={
                    "status": IndexJobStepStatus.FAILED,
                    "message": "failed",
                    "error": {"code": "INDEX_STEP_FAILED", "detail": str(exc)},
                }
            )
            if item.step == failed_step
            else item
            for item in job.steps
        ]
