from common_core.ai_pipeline.graphrag import (
    AuthContext,
    EvidenceBundle,
    EvidenceLinkRecord,
    EvidenceRecord,
    HybridRetriever,
    InMemoryGraphStore,
    RelationCandidate,
    ResolvedEntity,
    RetrievalRequest,
    RetrievalStrategy,
)
from common_core.ai_pipeline.graphrag.scoring import calculate_hybrid_score, normalize_score
from common_core.ai_pipeline.vectorstores import InMemoryVectorStore, VectorWriteOptions
from common_core.ai_pipeline.graphrag.schemas import ChunkInput


def _chunk(chunk_id: str, text: str) -> ChunkInput:
    return ChunkInput(
        chunk_id=chunk_id,
        source_id="source-1",
        document_id="doc-1",
        domain="sol_bat",
        content=text,
        chunk_index=0,
        metadata={"collection_name": "default"},
    )


def _graph_store() -> InMemoryGraphStore:
    store = InMemoryGraphStore()
    disease, crop = store.upsert_entities(
        [
            ResolvedEntity(
                domain="sol_bat",
                entity_type="DISEASE",
                name="Disease",
                normalized_name="disease",
                evidence_chunk_ids=["chunk-1"],
            ),
            ResolvedEntity(
                domain="sol_bat",
                entity_type="CROP",
                name="Tomato",
                normalized_name="tomato",
                evidence_chunk_ids=["chunk-1"],
            ),
        ]
    )
    relation = store.upsert_relations(
        [
            RelationCandidate(
                domain="sol_bat",
                relation_type="AFFECTS",
                source_entity_ref=disease.entity_id,
                target_entity_ref=crop.entity_id,
                source_entity_type="DISEASE",
                target_entity_type="CROP",
                chunk_id="chunk-1",
                source_id="source-1",
                confidence_score=0.9,
                rationale="Disease affects tomato.",
            )
        ]
    )[0]
    store.upsert_evidence(
        EvidenceBundle(
            evidence=[
                EvidenceRecord(
                    evidence_id="evidence-1",
                    source_id="source-1",
                    document_id="doc-1",
                    chunk_id="chunk-1",
                    quote_text="Disease affects tomato and preventive action is required.",
                    confidence_score=1.0,
                    extraction_method="RULE",
                )
            ],
            links=[
                EvidenceLinkRecord(
                    evidence_id="evidence-1",
                    target_type="RELATION",
                    target_ref=relation.candidate_id,
                    confidence_score=1.0,
                )
            ],
        )
    )
    return store


def test_hybrid_retriever_combines_vector_graph_and_evidence():
    vector_store = InMemoryVectorStore()
    vector_store.add_chunks(
        [_chunk("chunk-1", "tomato disease prevention guide")],
        VectorWriteOptions(collection_name="default"),
    )
    retriever = HybridRetriever(vector_store=vector_store, graph_store=_graph_store())

    response = retriever.search(
        RetrievalRequest(
            domain="sol_bat",
            query="tomato disease",
            strategy=RetrievalStrategy.HYBRID,
            top_k=5,
            auth=AuthContext(roles=["ADMIN"]),
        )
    )

    assert response.status == "HIT"
    assert response.metrics["vector_result_count"] == 1
    assert response.metrics["graph_relation_count"] == 1
    assert response.metrics["evidence_count"] == 1
    assert any(item.result_type == "CHUNK" for item in response.results)
    assert any(item.result_type == "RELATION" for item in response.results)
    assert "Retrieval Summary" in response.context
    assert "Disease affects tomato" in response.context


def test_hybrid_retriever_vector_only_has_no_graph_metrics():
    vector_store = InMemoryVectorStore()
    vector_store.add_chunks(
        [_chunk("chunk-1", "tomato disease prevention guide")],
        VectorWriteOptions(collection_name="default"),
    )
    retriever = HybridRetriever(vector_store=vector_store, graph_store=_graph_store())

    response = retriever.search(
        RetrievalRequest(
            domain="sol_bat",
            query="tomato",
            strategy=RetrievalStrategy.VECTOR_ONLY,
        )
    )

    assert response.status == "HIT"
    assert response.metrics["vector_result_count"] == 1
    assert response.metrics["graph_relation_count"] == 0
    assert all(item.result_type == "CHUNK" for item in response.results)


def test_hybrid_score_normalizes_and_weights_parts():
    score = calculate_hybrid_score(
        vector_score=normalize_score(1.5),
        graph_score=0.5,
        evidence_score=0.5,
    )

    assert score.vector_score == 1.0
    assert round(score.final_score, 3) == 0.775
    assert score.weights["vector"] == 0.60

