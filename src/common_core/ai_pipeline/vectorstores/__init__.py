"""Vector store contracts and factories."""

from common_core.ai_pipeline.vectorstores.base import (
    ChunkQuery,
    ChunkResponse,
    ProviderHealth,
    VectorSearchRequest,
    VectorSearchResult,
    VectorStoreAdapter,
    VectorWriteOptions,
    VectorWriteResult,
)
from common_core.ai_pipeline.vectorstores.faiss_adapter import FAISSVectorStoreAdapter
from common_core.ai_pipeline.vectorstores.factory import VectorStoreFactory
from common_core.ai_pipeline.vectorstores.in_memory import InMemoryVectorStore
from common_core.ai_pipeline.vectorstores.pgvector_adapter import PGVectorStoreAdapter

__all__ = [
    "ChunkQuery",
    "ChunkResponse",
    "ProviderHealth",
    "FAISSVectorStoreAdapter",
    "InMemoryVectorStore",
    "PGVectorStoreAdapter",
    "VectorSearchRequest",
    "VectorSearchResult",
    "VectorStoreAdapter",
    "VectorStoreFactory",
    "VectorWriteOptions",
    "VectorWriteResult",
]
