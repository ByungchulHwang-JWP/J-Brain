"""PGVector vector store adapter skeleton."""

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


class PGVectorStoreAdapter:
    """PGVector adapter placeholder.

    This adapter reserves the production provider boundary without requiring a
    live PostgreSQL/pgvector instance during early framework implementation.
    """

    provider = "pgvector"

    def __init__(
        self,
        connection_string: str | None = None,
        collection_name: str = "default",
    ) -> None:
        self.connection_string = connection_string
        self.collection_name = collection_name

    def add_chunks(
        self,
        chunks: list[ChunkInput],
        options: VectorWriteOptions,
    ) -> VectorWriteResult:
        raise NotImplementedError("PGVector add_chunks implementation is not configured yet.")

    def search(self, request: VectorSearchRequest) -> list[VectorSearchResult]:
        raise NotImplementedError("PGVector search implementation is not configured yet.")

    def delete_by_source(self, source_id: str, auth: AuthContext) -> int:
        raise NotImplementedError("PGVector delete_by_source implementation is not configured yet.")

    def get_chunks(self, source_id: str, query: ChunkQuery) -> list[ChunkResponse]:
        raise NotImplementedError("PGVector get_chunks implementation is not configured yet.")

    def health_check(self) -> ProviderHealth:
        return ProviderHealth(
            provider=self.provider,
            healthy=False,
            message="PGVector adapter skeleton is registered but not implemented.",
            details={"collection_name": self.collection_name, "has_connection": bool(self.connection_string)},
        )

