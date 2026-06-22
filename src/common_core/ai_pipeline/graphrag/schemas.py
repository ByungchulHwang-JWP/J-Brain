"""Shared GraphRAG data contracts.

The models are intentionally provider-neutral. Persistence, vector stores, LLM
providers, and web APIs can depend on these contracts without depending on each
other.
"""

from __future__ import annotations

from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class SourceScope(str, Enum):
    """Source visibility scope."""

    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    TENANT = "TENANT"


class RetrievalStrategy(str, Enum):
    """Supported retrieval strategies."""

    VECTOR_ONLY = "VECTOR_ONLY"
    GRAPH_ONLY = "GRAPH_ONLY"
    HYBRID = "HYBRID"
    HYBRID_RERANK = "HYBRID_RERANK"


class RetrievalStatus(str, Enum):
    """Retrieval execution status."""

    HIT = "HIT"
    PARTIAL_HIT = "PARTIAL_HIT"
    MISS = "MISS"
    FAILED = "FAILED"


class AuthContext(BaseModel):
    """Requester and authorization context used by admin, retrieval, and agent flows."""

    tenant_id: str | None = None
    user_id: str | None = None
    roles: list[str] = Field(default_factory=list)
    scope: SourceScope = SourceScope.PRIVATE
    domain_roles: dict[str, list[str]] = Field(default_factory=dict)


class EntityTypeDef(BaseModel):
    """Entity type definition in a domain schema."""

    type: str
    description: str
    required_attributes: list[str] = Field(default_factory=list)
    optional_attributes: list[str] = Field(default_factory=list)
    aliases: list[str] = Field(default_factory=list)

    @field_validator("type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        return value.strip().upper()


class RelationTypeDef(BaseModel):
    """Relation type definition in a domain schema."""

    type: str
    description: str
    source_types: list[str]
    target_types: list[str]
    required_attributes: list[str] = Field(default_factory=list)

    @field_validator("type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("source_types", "target_types")
    @classmethod
    def normalize_types(cls, values: list[str]) -> list[str]:
        return [value.strip().upper() for value in values]


class DomainSchema(BaseModel):
    """Entity and relation schema for one service domain."""

    domain: str
    version: str = "1.0.0"
    entity_types: list[EntityTypeDef]
    relation_types: list[RelationTypeDef]
    validation_rules: dict[str, Any] = Field(default_factory=dict)

    def entity_type_names(self) -> set[str]:
        """Return registered entity type names."""

        return {item.type for item in self.entity_types}

    def relation_type_names(self) -> set[str]:
        """Return registered relation type names."""

        return {item.type for item in self.relation_types}


class ChunkInput(BaseModel):
    """Document chunk passed to indexing, extraction, and retrieval preview flows."""

    chunk_id: str
    source_id: str
    document_id: str
    domain: str
    content: str
    chunk_index: int
    source_version_id: str | None = None
    page_no: int | None = None
    section_title: str | None = None
    start_offset: int | None = None
    end_offset: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class EntityCandidate(BaseModel):
    """Entity candidate extracted from a chunk."""

    candidate_id: str = Field(default_factory=lambda: str(uuid4()))
    domain: str
    entity_type: str
    name: str
    normalized_name: str
    mention_text: str
    chunk_id: str
    source_id: str
    aliases: list[str] = Field(default_factory=list)
    start_offset: int | None = None
    end_offset: int | None = None
    confidence_score: float = 1.0
    extraction_method: str = "RULE"
    attributes: dict[str, Any] = Field(default_factory=dict)


class ResolvedEntity(BaseModel):
    """Canonical entity resolved from candidates."""

    entity_id: str | None = None
    domain: str
    entity_type: str
    name: str
    normalized_name: str
    aliases: list[str] = Field(default_factory=list)
    mention_texts: list[str] = Field(default_factory=list)
    confidence_score: float = 1.0
    merge_reason: str | None = None
    attributes: dict[str, Any] = Field(default_factory=dict)
    evidence_chunk_ids: list[str] = Field(default_factory=list)


class RelationCandidate(BaseModel):
    """Relation candidate extracted between two entities."""

    candidate_id: str = Field(default_factory=lambda: str(uuid4()))
    domain: str
    relation_type: str
    source_entity_ref: str
    target_entity_ref: str
    source_entity_type: str
    target_entity_type: str
    chunk_id: str
    source_id: str
    confidence_score: float = 1.0
    extraction_method: str = "RULE"
    attributes: dict[str, Any] = Field(default_factory=dict)
    rationale: str | None = None


class EvidenceRecord(BaseModel):
    """Evidence snippet used to justify entities, relations, and answers."""

    evidence_id: str | None = None
    source_id: str
    document_id: str | None = None
    chunk_id: str | None = None
    evidence_type: str = "CHUNK"
    quote_text: str
    confidence_score: float = 1.0
    extraction_method: str = "RULE"
    metadata: dict[str, Any] = Field(default_factory=dict)


class EvidenceLinkRecord(BaseModel):
    """Link between an evidence record and an entity or relation target."""

    evidence_link_id: str | None = None
    evidence_id: str | None = None
    target_type: str
    target_id: str | None = None
    target_ref: str
    support_type: str = "SUPPORTS"
    confidence_score: float = 1.0


class EvidenceBundle(BaseModel):
    """Evidence and links produced from one chunk."""

    evidence: list[EvidenceRecord] = Field(default_factory=list)
    links: list[EvidenceLinkRecord] = Field(default_factory=list)
    warnings: list[dict[str, Any]] = Field(default_factory=list)


class RetrievalItem(BaseModel):
    """Ranked retrieval result item."""

    rank: int
    result_type: str
    text: str
    score: float
    chunk_id: str | None = None
    entity_id: str | None = None
    relation_id: str | None = None
    evidence_ids: list[str] = Field(default_factory=list)
    vector_score: float | None = None
    graph_score: float | None = None
    evidence_score: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class RetrievalRequest(BaseModel):
    """Request for vector, graph, or hybrid retrieval."""

    domain: str
    query: str
    filters: dict[str, Any] = Field(default_factory=dict)
    top_k: int = 5
    strategy: RetrievalStrategy = RetrievalStrategy.HYBRID
    include_evidence: bool = True
    max_graph_depth: int = 2
    auth: AuthContext | None = None


class RetrievalResponse(BaseModel):
    """Response from a retrieval execution."""

    retrieval_run_id: str = Field(default_factory=lambda: str(uuid4()))
    domain: str
    query: str
    status: RetrievalStatus
    results: list[RetrievalItem] = Field(default_factory=list)
    context: str = ""
    evidence: list[EvidenceRecord] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)


class ContextAssembleRequest(BaseModel):
    """Input for assembling LLM/Agent context."""

    query: str
    domain: str
    items: list[RetrievalItem]
    evidence: list[EvidenceRecord] = Field(default_factory=list)
    max_tokens: int = 3500
    citation_style: str = "INLINE"
    include_graph_summary: bool = True


class ContextAssembleResult(BaseModel):
    """Assembled context and citation metadata."""

    context: str
    citations: list[dict[str, Any]] = Field(default_factory=list)
    evidence: list[EvidenceRecord] = Field(default_factory=list)
    token_estimate: int
    truncated: bool = False
    warnings: list[dict[str, Any]] = Field(default_factory=list)
