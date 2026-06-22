"""Vector store adapter contracts."""

from typing import Any, Protocol

from pydantic import BaseModel, Field

from common_core.ai_pipeline.graphrag.schemas import AuthContext, ChunkInput


class VectorWriteOptions(BaseModel):
    """Options for vector writes."""

    collection_name: str = "default"
    metadata: dict[str, Any] = Field(default_factory=dict)


class VectorWriteResult(BaseModel):
    """Result of writing chunks to a vector store."""

    provider: str
    written_count: int
    skipped_count: int = 0
    metadata: dict[str, Any] = Field(default_factory=dict)


class VectorSearchRequest(BaseModel):
    """Vector search request."""

    domain: str
    query: str
    filters: dict[str, Any] = Field(default_factory=dict)
    top_k: int = 5
    collection_name: str = "default"
    auth: AuthContext | None = None


class VectorSearchResult(BaseModel):
    """Vector search result."""

    chunk_id: str
    source_id: str
    text: str
    score: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChunkQuery(BaseModel):
    """Chunk list query."""

    limit: int = 50
    offset: int = 0
    filters: dict[str, Any] = Field(default_factory=dict)


class ChunkResponse(BaseModel):
    """Chunk response for preview."""

    chunk: ChunkInput
    score: float | None = None


class ProviderHealth(BaseModel):
    """Provider health check result."""

    provider: str
    healthy: bool
    message: str = "ok"
    details: dict[str, Any] = Field(default_factory=dict)


class VectorStoreAdapter(Protocol):
    """Provider-neutral vector store adapter."""

    provider: str

    def add_chunks(
        self,
        chunks: list[ChunkInput],
        options: VectorWriteOptions,
    ) -> VectorWriteResult:
        """Add chunks to a vector store."""

    def search(self, request: VectorSearchRequest) -> list[VectorSearchResult]:
        """Search for similar chunks."""

    def delete_by_source(self, source_id: str, auth: AuthContext) -> int:
        """Delete vectors by source."""

    def get_chunks(self, source_id: str, query: ChunkQuery) -> list[ChunkResponse]:
        """Return chunks for preview."""

    def health_check(self) -> ProviderHealth:
        """Return provider health."""
