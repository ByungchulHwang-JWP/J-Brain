from common_core.ai_pipeline.graphrag import (
    ChunkInput,
    EntityExtractor,
    EntityResolver,
    EvidenceLinker,
    EvidenceQuery,
    InMemoryGraphStore,
    RelationExtractor,
    SchemaRegistry,
)
from common_core.ai_pipeline.graphrag.schemas import AuthContext


def _chunk(content: str) -> ChunkInput:
    return ChunkInput(
        chunk_id="chunk-1",
        source_id="source-1",
        document_id="doc-1",
        domain="sol_bat",
        content=content,
        chunk_index=0,
    )


def test_sol_bat_entity_extractor_detects_domain_aliases():
    schema = SchemaRegistry.with_defaults().get("sol_bat")
    chunk = _chunk("Tomato greenhouse disease risk increases in humid weather.")

    candidates = EntityExtractor().extract(
        chunk,
        schema,
        options=None,
    )

    pairs = {(candidate.entity_type, candidate.mention_text.lower()) for candidate in candidates}
    assert ("CROP", "tomato") in pairs
    assert ("PEST_DISEASE", "disease") in pairs
    assert ("ENVIRONMENT_CONDITION", "weather") in pairs


def test_entity_resolver_merges_duplicate_candidates():
    schema = SchemaRegistry.with_defaults().get("sol_bat")
    candidates = EntityExtractor().extract(
        _chunk("Tomato disease guide. Tomato ventilation is recommended."),
        schema,
    )

    resolved = EntityResolver().resolve(candidates, schema)
    tomato_entities = [
        entity for entity in resolved if entity.entity_type == "CROP" and entity.normalized_name == "tomato"
    ]

    assert len(tomato_entities) == 1
    assert tomato_entities[0].mention_texts == ["Tomato"]
    assert tomato_entities[0].evidence_chunk_ids == ["chunk-1"]


def test_relation_extractor_uses_schema_and_keywords():
    schema = SchemaRegistry.with_defaults().get("sol_bat")
    chunk = _chunk("Humid weather can cause tomato disease and action can prevent disease.")
    candidates = EntityExtractor().extract(
        chunk,
        schema,
        options=None,
    )
    resolved = EntityResolver().resolve(candidates, schema)

    relations = RelationExtractor().extract(chunk, resolved, schema)

    relation_pairs = {
        (relation.relation_type, relation.source_entity_type, relation.target_entity_type)
        for relation in relations
    }
    assert ("HAS_RISK_OF", "CROP", "PEST_DISEASE") in relation_pairs
    assert ("AFFECTS", "ENVIRONMENT_CONDITION", "CROP") in relation_pairs
    assert ("PREVENTS", "MANAGEMENT_ACTION", "PEST_DISEASE") in relation_pairs
    assert all(relation.confidence_score >= 0.60 for relation in relations)


def test_extraction_to_graph_store_evidence_flow():
    schema = SchemaRegistry.with_defaults().get("sol_bat")
    chunk = _chunk("Humid weather can cause tomato disease and action can prevent disease.")
    candidates = EntityExtractor().extract(chunk, schema)
    resolved = EntityResolver().resolve(candidates, schema)
    store = InMemoryGraphStore()
    upserted_entities = store.upsert_entities(resolved)
    entity_by_name = {entity.normalized_name: entity for entity in upserted_entities}
    resolved_with_ids = [
        entity.model_copy(update={"entity_id": entity_by_name[entity.normalized_name].entity_id})
        for entity in resolved
    ]
    relations = store.upsert_relations(RelationExtractor().extract(chunk, resolved_with_ids, schema))
    bundle = store.upsert_evidence(EvidenceLinker().link(chunk, resolved_with_ids, relations))

    assert bundle.evidence[0].quote_text
    assert any(link.target_type == "ENTITY" for link in bundle.links)
    assert any(link.target_type == "RELATION" for link in bundle.links)
    assert store.get_evidence(EvidenceQuery(domain="sol_bat"), AuthContext(roles=["ADMIN"]))
