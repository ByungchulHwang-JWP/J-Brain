from common_core.ai_pipeline.graphrag import SchemaRegistry
from common_core.ai_pipeline.graphrag.schemas import ChunkInput


def test_default_schema_contains_sol_bat():
    registry = SchemaRegistry.with_defaults()

    schema = registry.get("sol_bat")

    assert "sol_bat" in registry.list_domains()
    assert "CROP" in schema.entity_type_names()
    assert "AFFECTS" in schema.relation_type_names()


def test_chunk_input_defaults_metadata():
    chunk = ChunkInput(
        chunk_id="chunk-1",
        source_id="source-1",
        document_id="doc-1",
        domain="sol_bat",
        content="tomato disease memo",
        chunk_index=0,
    )

    assert chunk.metadata == {}

