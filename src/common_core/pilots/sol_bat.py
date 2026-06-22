"""Sol-Bat pilot GraphRAG integration helpers."""

from __future__ import annotations

from dataclasses import dataclass

from common_core.ai_pipeline.document import DocumentPipeline, DocumentSource, SourceType
from common_core.ai_pipeline.graphrag import (
    AuthContext,
    EntityResolver,
    EvidenceLinker,
    HybridRetriever,
    InMemoryGraphStore,
    RelationExtractor,
    RetrievalRequest,
    RetrievalStrategy,
    SchemaRegistry,
)
from common_core.ai_pipeline.graphrag.entity_extractor import EntityExtractor
from common_core.ai_pipeline.vectorstores import InMemoryVectorStore, VectorWriteOptions


SOL_BAT_SAMPLE_SOURCES = [
    DocumentSource(
        source_id="solbat-pilot-tomato",
        domain="sol_bat",
        source_type=SourceType.TEXT,
        name="tomato-disease-guide",
        content=(
            "토마토 개화기에는 다습한 환경에서 잿빛곰팡이병 발생 위험이 증가하므로 "
            "환기와 예방 방제를 실시한다."
        ),
        metadata={"filename": "tomato-disease-guide.txt", "pilot": "sol_bat"},
        scope="GLOBAL",
    ),
    DocumentSource(
        source_id="solbat-pilot-pepper",
        domain="sol_bat",
        source_type=SourceType.TEXT,
        name="pepper-anthracnose-guide",
        content=(
            "강우 후 고추 탄저병이 확산될 수 있어 살균제를 살포하고 병든 과실을 제거한다."
        ),
        metadata={"filename": "pepper-anthracnose-guide.txt", "pilot": "sol_bat"},
        scope="GLOBAL",
    ),
]


@dataclass
class SolBatGraphRAGPilot:
    """Small in-memory Sol-Bat GraphRAG PoC runtime."""

    vector_store: InMemoryVectorStore
    graph_store: InMemoryGraphStore
    retriever: HybridRetriever
    metrics: dict[str, int]


def create_sol_bat_pilot_runtime(
    sources: list[DocumentSource] | None = None,
) -> SolBatGraphRAGPilot:
    """Index sample Sol-Bat sources and return a ready-to-search runtime."""

    source_list = sources or SOL_BAT_SAMPLE_SOURCES
    pipeline = DocumentPipeline()
    schema = SchemaRegistry.with_defaults().get("sol_bat")
    vector_store = InMemoryVectorStore()
    graph_store = InMemoryGraphStore()
    entity_extractor = EntityExtractor()
    entity_resolver = EntityResolver()
    relation_extractor = RelationExtractor()
    evidence_linker = EvidenceLinker()

    metrics = {
        "source_count": 0,
        "chunk_count": 0,
        "entity_count": 0,
        "relation_count": 0,
        "evidence_count": 0,
    }
    for source in source_list:
        result = pipeline.process(source)
        vector_store.add_chunks(result.chunks, VectorWriteOptions(collection_name="default"))
        metrics["source_count"] += 1
        metrics["chunk_count"] += len(result.chunks)

        for chunk in result.chunks:
            candidates = entity_extractor.extract(chunk, schema)
            resolved = entity_resolver.resolve(candidates, schema)
            upserted_entities = graph_store.upsert_entities(resolved)
            metrics["entity_count"] += len(upserted_entities)
            entity_by_name = {entity.normalized_name: entity for entity in upserted_entities}
            resolved_with_ids = [
                entity.model_copy(update={"entity_id": entity_by_name[entity.normalized_name].entity_id})
                for entity in resolved
                if entity.normalized_name in entity_by_name
            ]
            relations = graph_store.upsert_relations(
                relation_extractor.extract(chunk, resolved_with_ids, schema)
            )
            metrics["relation_count"] += len(relations)
            evidence_bundle = graph_store.upsert_evidence(
                evidence_linker.link(chunk, resolved_with_ids, relations)
            )
            metrics["evidence_count"] += len(evidence_bundle.evidence)

    retriever = HybridRetriever(vector_store=vector_store, graph_store=graph_store)
    return SolBatGraphRAGPilot(
        vector_store=vector_store,
        graph_store=graph_store,
        retriever=retriever,
        metrics=metrics,
    )


def build_sol_bat_retrieval_query(state: dict) -> str:
    """Build a GraphRAG retrieval query from a Sol-Bat FarmingState-like dict."""

    crops = state.get("target_crops") or []
    if isinstance(crops, str):
        crops = [crops]
    risks = [
        risk.get("name", "")
        for risk in state.get("detected_risks", [])
        if isinstance(risk, dict)
    ]
    weather = state.get("weather_context", {})
    soil = state.get("soil_context", {})
    query_parts = [
        state.get("region", ""),
        " ".join(crops),
        state.get("growth_stage", ""),
        " ".join(risks),
        str(weather.get("humidity", "")),
        str(weather.get("rainfall", "")),
        str(soil.get("ph", "")),
    ]
    return " ".join(str(part) for part in query_parts if str(part).strip())


def retrieve_knowledge_with_graphrag(
    state: dict,
    retriever: HybridRetriever,
    *,
    top_k: int = 5,
    strategy: RetrievalStrategy = RetrievalStrategy.HYBRID,
) -> dict:
    """Return a Sol-Bat state updated with GraphRAG retrieval context."""

    query = build_sol_bat_retrieval_query(state)
    response = retriever.search(
        RetrievalRequest(
            domain="sol_bat",
            query=query,
            top_k=top_k,
            strategy=strategy,
            auth=AuthContext(roles=["ADMIN"]),
        )
    )
    updated_state = dict(state)
    updated_state["knowledge_context"] = response.context
    updated_state["graphrag_context"] = response.model_dump(mode="json")
    updated_state["ontology_relations"] = [
        {
            "relation_type": item.metadata.get("relation_type"),
            "source_entity_ref": item.metadata.get("source_entity_ref"),
            "target_entity_ref": item.metadata.get("target_entity_ref"),
            "score": item.score,
        }
        for item in response.results
        if item.result_type == "RELATION"
    ]
    return updated_state
