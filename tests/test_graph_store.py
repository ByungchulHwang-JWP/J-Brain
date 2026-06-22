from common_core.ai_pipeline.graphrag import (
    AuthContext,
    EntityQuery,
    EvidenceQuery,
    GraphTraversalRequest,
    InMemoryGraphStore,
    PostgreSQLGraphStoreAdapter,
    RelationQuery,
)
from common_core.ai_pipeline.graphrag.schemas import (
    EvidenceBundle,
    EvidenceLinkRecord,
    EvidenceRecord,
    RelationCandidate,
    ResolvedEntity,
)


def _entity(entity_type: str, name: str, source_id: str = "source-1") -> ResolvedEntity:
    return ResolvedEntity(
        domain="sol_bat",
        entity_type=entity_type,
        name=name,
        normalized_name=name.lower(),
        mention_texts=[name],
        evidence_chunk_ids=[source_id],
    )


def _relation(source: ResolvedEntity, target: ResolvedEntity, source_id: str = "source-1"):
    return RelationCandidate(
        domain="sol_bat",
        relation_type="AFFECTS",
        source_entity_ref=source.entity_id or "",
        target_entity_ref=target.entity_id or "",
        source_entity_type=source.entity_type,
        target_entity_type=target.entity_type,
        chunk_id="chunk-1",
        source_id=source_id,
        confidence_score=0.9,
        rationale=f"{source.name} affects {target.name}",
    )


def test_in_memory_graph_store_upserts_and_finds_entities():
    store = InMemoryGraphStore()
    auth = AuthContext(roles=["ADMIN"])
    crop = _entity("CROP", "Tomato")

    first = store.upsert_entities([crop])[0]
    second = store.upsert_entities([crop.model_copy(update={"aliases": ["tomato"]})])[0]
    results = store.find_entities(EntityQuery(domain="sol_bat", text="tomato"), auth)

    assert first.entity_id == second.entity_id
    assert second.aliases == ["tomato"]
    assert results[0].name == "Tomato"


def test_in_memory_graph_store_relations_evidence_and_traverse():
    store = InMemoryGraphStore()
    auth = AuthContext(roles=["ADMIN"])
    disease, crop = store.upsert_entities([
        _entity("DISEASE", "Blight"),
        _entity("CROP", "Tomato"),
    ])
    relation = store.upsert_relations([_relation(disease, crop)])[0]
    bundle = store.upsert_evidence(
        EvidenceBundle(
            evidence=[
                EvidenceRecord(
                    source_id="source-1",
                    document_id="doc-1",
                    chunk_id="chunk-1",
                    quote_text="Blight affects tomato.",
                    confidence_score=1.0,
                    extraction_method="RULE",
                )
            ],
            links=[
                EvidenceLinkRecord(
                    target_type="RELATION",
                    target_ref=relation.candidate_id,
                    confidence_score=1.0,
                )
            ],
        )
    )

    relations = store.find_relations(
        RelationQuery(domain="sol_bat", source_entity_ids=[disease.entity_id]),
        auth,
    )
    evidence = store.get_evidence(
        EvidenceQuery(domain="sol_bat", target_type="RELATION", target_ids=[relation.candidate_id]),
        auth,
    )
    traversal = store.traverse(
        GraphTraversalRequest(domain="sol_bat", seed_entity_ids=[disease.entity_id], max_depth=1),
        auth,
    )

    assert relations == [relation]
    assert evidence == bundle.evidence
    assert {entity.entity_id for entity in traversal.entities} == {disease.entity_id, crop.entity_id}
    assert traversal.relations == [relation]
    assert traversal.evidence == bundle.evidence


def test_in_memory_graph_store_delete_by_source_removes_graph_data():
    store = InMemoryGraphStore()
    auth = AuthContext(roles=["ADMIN"])
    disease, crop = store.upsert_entities([
        _entity("DISEASE", "Blight"),
        _entity("CROP", "Tomato"),
    ])
    relation = store.upsert_relations([_relation(disease, crop)])[0]
    store.upsert_evidence(
        EvidenceBundle(
            evidence=[
                EvidenceRecord(
                    source_id="source-1",
                    document_id="doc-1",
                    chunk_id="chunk-1",
                    quote_text="Blight affects tomato.",
                    confidence_score=1.0,
                    extraction_method="RULE",
                )
            ],
            links=[
                EvidenceLinkRecord(
                    target_type="RELATION",
                    target_ref=relation.candidate_id,
                    confidence_score=1.0,
                )
            ],
        )
    )

    result = store.delete_by_source("source-1", auth)

    assert result.deleted_relations == 1
    assert result.deleted_evidence == 1
    assert store.find_relations(RelationQuery(domain="sol_bat"), auth) == []
    assert store.get_evidence(EvidenceQuery(domain="sol_bat"), auth) == []


def test_postgresql_graph_store_adapter_is_provider_skeleton():
    adapter = PostgreSQLGraphStoreAdapter()

    assert adapter.provider == "postgresql"
    try:
        adapter.find_entities(EntityQuery(domain="sol_bat"), AuthContext())
    except NotImplementedError as exc:
        assert "PostgreSQL entity search" in str(exc)
    else:
        raise AssertionError("PostgreSQL adapter skeleton should raise NotImplementedError")

