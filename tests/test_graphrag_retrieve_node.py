import asyncio

from common_core.agents.nodes import GraphRAGRetrieveNode
from common_core.ai_pipeline.graphrag.hybrid_retriever import HybridRetriever
from common_core.ai_pipeline.vectorstores.base import (
    ChunkQuery,
    ChunkResponse,
    ProviderHealth,
    VectorSearchRequest,
    VectorSearchResult,
    VectorWriteOptions,
    VectorWriteResult,
)


class FakeVectorStore:
    provider = "fake"

    def add_chunks(self, chunks, options: VectorWriteOptions) -> VectorWriteResult:
        return VectorWriteResult(provider=self.provider, written_count=len(chunks))

    def search(self, request: VectorSearchRequest) -> list[VectorSearchResult]:
        return [
            VectorSearchResult(
                chunk_id="chunk-1",
                source_id="source-1",
                text=f"answer for {request.query}",
                score=0.9,
            )
        ]

    def delete_by_source(self, source_id: str, auth) -> int:
        return 0

    def get_chunks(self, source_id: str, query: ChunkQuery) -> list[ChunkResponse]:
        return []

    def health_check(self) -> ProviderHealth:
        return ProviderHealth(provider=self.provider, healthy=True)


def test_graphrag_retrieve_node_adds_context():
    node = GraphRAGRetrieveNode(
        retriever=HybridRetriever(vector_store=FakeVectorStore()),
        default_domain="sol_bat",
    )

    state = asyncio.run(node({"query": "tomato", "roles": ["ADMIN"]}))

    assert state["retrieval"]["status"] == "HIT"
    assert "answer for tomato" in state["context"]
    assert state["error"] is None

