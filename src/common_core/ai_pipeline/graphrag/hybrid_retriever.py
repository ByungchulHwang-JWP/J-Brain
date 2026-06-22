"""Hybrid retrieval orchestration."""

from time import perf_counter

from common_core.ai_pipeline.graphrag.context_assembler import ContextAssembler
from common_core.ai_pipeline.graphrag.graph_store import (
    EntityQuery,
    EvidenceQuery,
    GraphStoreAdapter,
    GraphTraversalRequest,
)
from common_core.ai_pipeline.graphrag.schemas import (
    AuthContext,
    ContextAssembleRequest,
    RetrievalItem,
    RetrievalRequest,
    RetrievalResponse,
    RetrievalStatus,
    RetrievalStrategy,
)
from common_core.ai_pipeline.graphrag.scoring import calculate_hybrid_score, normalize_score
from common_core.ai_pipeline.vectorstores.base import VectorSearchRequest, VectorStoreAdapter


class HybridRetriever:
    """Combine vector search, graph traversal, evidence, and context assembly."""

    def __init__(
        self,
        vector_store: VectorStoreAdapter | None = None,
        graph_store: GraphStoreAdapter | None = None,
        context_assembler: ContextAssembler | None = None,
    ) -> None:
        self.vector_store = vector_store
        self.graph_store = graph_store
        self.context_assembler = context_assembler or ContextAssembler()

    def search(self, request: RetrievalRequest) -> RetrievalResponse:
        """Run retrieval and return evidence-aware context."""

        started_at = perf_counter()
        auth = request.auth or AuthContext()
        items_by_key: dict[tuple[str, str], RetrievalItem] = {}
        evidence_by_id = {}
        vector_count = 0
        graph_count = 0

        if request.strategy in {RetrievalStrategy.VECTOR_ONLY, RetrievalStrategy.HYBRID}:
            if self.vector_store:
                vector_results = self.vector_store.search(
                    VectorSearchRequest(
                        domain=request.domain,
                        query=request.query,
                        filters=request.filters,
                        top_k=request.top_k,
                        collection_name=request.filters.get("collection_name", "default"),
                        auth=auth,
                    )
                )
                vector_count = len(vector_results)
                for result in vector_results:
                    score = calculate_hybrid_score(vector_score=normalize_score(result.score))
                    self._merge_item(
                        items_by_key,
                        RetrievalItem(
                            rank=0,
                            result_type="CHUNK",
                            chunk_id=result.chunk_id,
                            text=result.text,
                            score=score.final_score,
                            vector_score=normalize_score(result.score),
                            metadata={**result.metadata, "source_id": result.source_id},
                        ),
                    )

        if request.strategy in {RetrievalStrategy.GRAPH_ONLY, RetrievalStrategy.HYBRID}:
            if self.graph_store:
                seed_entities = self._find_seed_entities(request, auth)
                seed_ids = [entity.entity_id or entity.normalized_name for entity in seed_entities]
                if seed_ids:
                    graph_result = self.graph_store.traverse(
                        GraphTraversalRequest(
                            domain=request.domain,
                            seed_entity_ids=seed_ids,
                            max_depth=request.max_graph_depth,
                            limit=request.top_k * 5,
                        ),
                        auth,
                    )
                    graph_count = len(graph_result.relations)
                    for evidence in graph_result.evidence:
                        if evidence.evidence_id:
                            evidence_by_id[evidence.evidence_id] = evidence
                        else:
                            evidence_by_id[f"{evidence.source_id}:{evidence.chunk_id}:{len(evidence_by_id)}"] = evidence

                    for relation in graph_result.relations:
                        relation_evidence = self._relation_evidence(relation.candidate_id, graph_result.evidence)
                        evidence_score = 0.80 if relation_evidence else 0.30
                        score = calculate_hybrid_score(
                            graph_score=normalize_score(relation.confidence_score),
                            evidence_score=evidence_score,
                        )
                        self._merge_item(
                            items_by_key,
                            RetrievalItem(
                                rank=0,
                                result_type="RELATION",
                                relation_id=relation.candidate_id,
                                text=relation.rationale or relation.relation_type,
                                score=score.final_score,
                                graph_score=normalize_score(relation.confidence_score),
                                evidence_score=evidence_score,
                                evidence_ids=[
                                    evidence.evidence_id
                                    for evidence in relation_evidence
                                    if evidence.evidence_id
                                ],
                                metadata={
                                    "source_id": relation.source_id,
                                    "source_entity_ref": relation.source_entity_ref,
                                    "target_entity_ref": relation.target_entity_ref,
                                    "relation_type": relation.relation_type,
                                },
                            ),
                        )

                if self.graph_store and not evidence_by_id and items_by_key:
                    for evidence in self.graph_store.get_evidence(
                        EvidenceQuery(domain=request.domain, limit=request.top_k * 5),
                        auth,
                    ):
                        evidence_by_id[evidence.evidence_id or f"{evidence.source_id}:{evidence.chunk_id}"] = evidence

        ranked = sorted(items_by_key.values(), key=lambda item: item.score, reverse=True)[: request.top_k]
        ranked = [item.model_copy(update={"rank": index}) for index, item in enumerate(ranked, 1)]
        evidence = list(evidence_by_id.values())
        context = self.context_assembler.assemble(
            ContextAssembleRequest(
                query=request.query,
                domain=request.domain,
                items=ranked,
                evidence=evidence,
            )
        )

        status = RetrievalStatus.HIT if ranked else RetrievalStatus.MISS
        elapsed_ms = round((perf_counter() - started_at) * 1000, 3)
        return RetrievalResponse(
            domain=request.domain,
            query=request.query,
            status=status,
            results=ranked,
            context=context.context,
            evidence=evidence,
            metrics={
                "result_count": len(ranked),
                "vector_result_count": vector_count,
                "graph_relation_count": graph_count,
                "evidence_count": len(evidence),
                "strategy": request.strategy.value,
                "latency_ms": elapsed_ms,
            },
        )

    @staticmethod
    def _merge_item(
        items_by_key: dict[tuple[str, str], RetrievalItem],
        item: RetrievalItem,
    ) -> None:
        key = (
            item.result_type,
            item.chunk_id or item.relation_id or item.entity_id or item.text,
        )
        existing = items_by_key.get(key)
        if existing is None:
            items_by_key[key] = item
            return

        merged_score = calculate_hybrid_score(
            vector_score=max(existing.vector_score or 0.0, item.vector_score or 0.0),
            graph_score=max(existing.graph_score or 0.0, item.graph_score or 0.0),
            evidence_score=max(existing.evidence_score or 0.0, item.evidence_score or 0.0),
        )
        items_by_key[key] = existing.model_copy(
            update={
                "score": merged_score.final_score,
                "vector_score": merged_score.vector_score,
                "graph_score": merged_score.graph_score,
                "evidence_score": merged_score.evidence_score,
                "evidence_ids": sorted(set(existing.evidence_ids) | set(item.evidence_ids)),
                "metadata": {**existing.metadata, **item.metadata},
            }
        )

    @staticmethod
    def _relation_evidence(relation_id: str, evidence: list) -> list:
        # Current EvidenceRecord does not carry target links directly. During
        # graph traversal, stores may already filter relation evidence; keep the
        # method isolated so provider-specific evidence matching can evolve.
        if not relation_id:
            return []
        return evidence

    def _find_seed_entities(self, request: RetrievalRequest, auth: AuthContext) -> list:
        if not self.graph_store:
            return []
        seeds = self.graph_store.find_entities(
            EntityQuery(domain=request.domain, text=request.query, limit=request.top_k),
            auth,
        )
        if seeds:
            return seeds

        seen = set()
        token_seeds = []
        for token in request.query.split():
            if len(token) < 2:
                continue
            for entity in self.graph_store.find_entities(
                EntityQuery(domain=request.domain, text=token, limit=request.top_k),
                auth,
            ):
                key = entity.entity_id or entity.normalized_name
                if key in seen:
                    continue
                seen.add(key)
                token_seeds.append(entity)
                if len(token_seeds) >= request.top_k:
                    return token_seeds
        return token_seeds
