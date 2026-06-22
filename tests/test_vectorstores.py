from common_core.ai_pipeline.graphrag.schemas import AuthContext, ChunkInput
from common_core.ai_pipeline.vectorstores import (
    ChunkQuery,
    InMemoryVectorStore,
    VectorSearchRequest,
    VectorStoreFactory,
    VectorWriteOptions,
)


def _chunk(chunk_id: str, source_id: str, text: str, domain: str = "sol_bat") -> ChunkInput:
    return ChunkInput(
        chunk_id=chunk_id,
        source_id=source_id,
        document_id=f"{source_id}:doc",
        domain=domain,
        content=text,
        chunk_index=int(chunk_id.rsplit("-", 1)[-1]),
        metadata={"tag": "guide"},
    )


def test_in_memory_vector_store_add_search_and_delete():
    store = InMemoryVectorStore()
    store.add_chunks(
        [
            _chunk("chunk-1", "source-1", "tomato disease prevention guide"),
            _chunk("chunk-2", "source-1", "pepper watering memo"),
            _chunk("chunk-3", "source-2", "account book memo", domain="account_book"),
        ],
        VectorWriteOptions(collection_name="test"),
    )

    results = store.search(
        VectorSearchRequest(
            domain="sol_bat",
            query="tomato disease",
            collection_name="test",
            top_k=2,
        )
    )

    assert [result.chunk_id for result in results] == ["chunk-1"]
    assert store.delete_by_source("source-1", AuthContext(roles=["ADMIN"])) == 2
    assert store.search(VectorSearchRequest(domain="sol_bat", query="tomato", collection_name="test")) == []


def test_in_memory_vector_store_get_chunks_with_filter():
    store = InMemoryVectorStore()
    store.add_chunks(
        [_chunk("chunk-1", "source-1", "tomato"), _chunk("chunk-2", "source-1", "pepper")],
        VectorWriteOptions(collection_name="test", metadata={"collection": "pilot"}),
    )

    chunks = store.get_chunks("source-1", ChunkQuery(filters={"collection": "pilot"}))

    assert [item.chunk.chunk_id for item in chunks] == ["chunk-1", "chunk-2"]


def test_vector_store_factory_registers_default_providers():
    factory = VectorStoreFactory()

    assert factory.list_providers() == ["faiss", "in_memory", "pgvector"]
    assert factory.get("in_memory").health_check().healthy is True
    assert factory.get("faiss").health_check().healthy is False
    assert factory.get("pgvector").health_check().healthy is False


def test_vector_store_factory_can_override_provider():
    factory = VectorStoreFactory(register_defaults=False)
    store = InMemoryVectorStore()

    factory.register("custom", store)

    assert factory.get("CUSTOM") is store
    factory.unregister("custom")
    assert factory.list_providers() == []

