"""GraphRAG core contracts and default lightweight implementations."""

from common_core.ai_pipeline.graphrag.context_assembler import ContextAssembler
from common_core.ai_pipeline.graphrag.entity_extractor import EntityExtractor
from common_core.ai_pipeline.graphrag.entity_resolver import EntityResolver
from common_core.ai_pipeline.graphrag.evidence_linker import EvidenceLinker
from common_core.ai_pipeline.graphrag.graph_store import (
    EntityQuery,
    EvidenceQuery,
    GraphDeleteResult,
    GraphStoreAdapter,
    GraphTraversalRequest,
    GraphTraversalResult,
    InMemoryGraphStore,
    RelationQuery,
)
from common_core.ai_pipeline.graphrag.hybrid_retriever import HybridRetriever
from common_core.ai_pipeline.graphrag.postgres_graph_store import PostgreSQLGraphStoreAdapter
from common_core.ai_pipeline.graphrag.relation_extractor import RelationExtractor
from common_core.ai_pipeline.graphrag.schema_registry import SchemaRegistry
from common_core.ai_pipeline.graphrag.schemas import (
    AuthContext,
    ChunkInput,
    ContextAssembleRequest,
    ContextAssembleResult,
    DomainSchema,
    EntityCandidate,
    EvidenceBundle,
    EvidenceLinkRecord,
    EvidenceRecord,
    RelationCandidate,
    ResolvedEntity,
    RetrievalItem,
    RetrievalRequest,
    RetrievalResponse,
    RetrievalStrategy,
)

__all__ = [
    "AuthContext",
    "ChunkInput",
    "ContextAssembler",
    "ContextAssembleRequest",
    "ContextAssembleResult",
    "DomainSchema",
    "EntityCandidate",
    "EntityExtractor",
    "EntityResolver",
    "EvidenceBundle",
    "EvidenceLinkRecord",
    "EvidenceLinker",
    "EvidenceRecord",
    "EntityQuery",
    "EvidenceQuery",
    "GraphDeleteResult",
    "GraphStoreAdapter",
    "GraphTraversalRequest",
    "GraphTraversalResult",
    "HybridRetriever",
    "InMemoryGraphStore",
    "PostgreSQLGraphStoreAdapter",
    "RelationCandidate",
    "RelationQuery",
    "RelationExtractor",
    "ResolvedEntity",
    "RetrievalItem",
    "RetrievalRequest",
    "RetrievalResponse",
    "RetrievalStrategy",
    "SchemaRegistry",
]
