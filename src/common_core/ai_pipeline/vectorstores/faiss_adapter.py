"""FAISS vector store adapter skeleton."""

from common_core.ai_pipeline.graphrag.schemas import AuthContext, ChunkInput
from common_core.ai_pipeline.vectorstores.base import (
    ChunkQuery,
    ChunkResponse,
    ProviderHealth,
    VectorSearchRequest,
    VectorSearchResult,
    VectorWriteOptions,
    VectorWriteResult,
)


class FAISSVectorStoreAdapter:
    """FAISS adapter placeholder.

    The class keeps the provider contract stable while delaying the optional
    FAISS dependency and persistence details to the dedicated implementation
    task.
    """

    provider = "faiss"

    def __init__(self, persist_directory: str | None = None) -> None:
        self.persist_directory = persist_directory

    def add_chunks(
        self,
        chunks: list[ChunkInput],
        options: VectorWriteOptions,
    ) -> VectorWriteResult:
        raise NotImplementedError("FAISS add_chunks implementation is not configured yet.")

    def search(self, request: VectorSearchRequest) -> list[VectorSearchResult]:
        raise NotImplementedError("FAISS search implementation is not configured yet.")

    def delete_by_source(self, source_id: str, auth: AuthContext) -> int:
        raise NotImplementedError("FAISS delete_by_source implementation is not configured yet.")

    def get_chunks(self, source_id: str, query: ChunkQuery) -> list[ChunkResponse]:
        raise NotImplementedError("FAISS get_chunks implementation is not configured yet.")

    def health_check(self) -> ProviderHealth:
        return ProviderHealth(
            provider=self.provider,
            healthy=False,
            message="FAISS adapter skeleton is registered but not implemented.",
            details={"persist_directory": self.persist_directory},
        )

