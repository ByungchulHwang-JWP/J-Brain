from common_core.ai_pipeline.graphrag import RetrievalRequest, RetrievalStrategy, SchemaRegistry
from common_core.pilots.sol_bat import (
    build_sol_bat_retrieval_query,
    create_sol_bat_pilot_runtime,
    retrieve_knowledge_with_graphrag,
)


def test_sol_bat_pilot_schema_contains_expected_types():
    schema = SchemaRegistry.with_defaults().get("sol_bat")

    entity_types = schema.entity_type_names()
    relation_types = schema.relation_type_names()

    assert "CROP" in entity_types
    assert "PEST_DISEASE" in entity_types
    assert "MANAGEMENT_ACTION" in entity_types
    assert "HAS_RISK_OF" in relation_types
    assert "APPLIES_AT" in relation_types


def test_sol_bat_pilot_runtime_indexes_samples_and_searches():
    runtime = create_sol_bat_pilot_runtime()

    response = runtime.retriever.search(
        request=RetrievalRequest(
            domain="sol_bat",
            query="토마토 다습 잿빛곰팡이병 예방 방제",
            strategy=RetrievalStrategy.HYBRID,
            top_k=5,
        )
    )

    assert runtime.metrics["source_count"] == 2
    assert runtime.metrics["chunk_count"] >= 2
    assert runtime.metrics["entity_count"] >= 4
    assert runtime.metrics["relation_count"] >= 1
    assert response.status == "HIT"
    assert response.metrics["result_count"] >= 1


def test_sol_bat_retrieve_knowledge_adapter_updates_state():
    runtime = create_sol_bat_pilot_runtime()
    state = {
        "region": "전라남도 고흥군",
        "target_crops": ["토마토"],
        "growth_stage": "개화기",
        "weather_context": {"humidity": "다습", "rainfall": "강우 후"},
        "soil_context": {"ph": "6.2"},
        "detected_risks": [{"name": "잿빛곰팡이병"}],
    }

    query = build_sol_bat_retrieval_query(state)
    updated = retrieve_knowledge_with_graphrag(state, runtime.retriever)

    assert "토마토" in query
    assert updated["graphrag_context"]["status"] == "HIT"
    assert updated["knowledge_context"]
    assert "ontology_relations" in updated
