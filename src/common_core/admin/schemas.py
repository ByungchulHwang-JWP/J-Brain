"""Admin MVP DTOs."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from common_core.ai_pipeline.document import SourceType


class AdminApiResponse(BaseModel):
    """Common admin API response envelope."""

    success: bool
    data: Any = None
    message: str = "ok"
    error: dict[str, Any] | None = None


class SourceStatus(str, Enum):
    """Source lifecycle status."""

    REGISTERED = "REGISTERED"
    INDEXING = "INDEXING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"
    DELETED = "DELETED"


class IndexJobStatus(str, Enum):
    """Index job lifecycle status."""

    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class IndexJobStepStatus(str, Enum):
    """Index job step lifecycle status."""

    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class SourceCreateRequest(BaseModel):
    """Request to register source content."""

    domain: str
    source_type: SourceType = SourceType.TEXT
    name: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    scope: str = "GLOBAL"
    tags: list[str] = Field(default_factory=list)
    tenant_id: str | None = None
    user_id: str | None = None
    auto_run_index: bool = False


class SourceResponse(BaseModel):
    """Registered source response."""

    source_id: str
    domain: str
    source_type: SourceType
    name: str
    status: SourceStatus
    scope: str = "GLOBAL"
    tags: list[str] = Field(default_factory=list)
    version: int = 1
    metadata: dict[str, Any] = Field(default_factory=dict)
    chunk_count: int = 0
    entity_count: int = 0
    relation_count: int = 0
    evidence_count: int = 0
    last_job_id: str | None = None


class IndexJobRequest(BaseModel):
    """Index job request."""

    source_id: str
    job_type: str = "INDEX"
    options: dict[str, Any] = Field(default_factory=dict)


class IndexJobStepResponse(BaseModel):
    """Index job step response."""

    step: str
    status: IndexJobStepStatus
    sequence: int
    message: str = ""
    metrics: dict[str, Any] = Field(default_factory=dict)
    error: dict[str, Any] | None = None


class IndexJobResponse(BaseModel):
    """Index job response."""

    job_id: str
    source_id: str
    status: IndexJobStatus
    step: str = "PENDING"
    message: str = ""
    metrics: dict[str, Any] = Field(default_factory=dict)
    steps: list[IndexJobStepResponse] = Field(default_factory=list)
    error: dict[str, Any] | None = None


class GraphRAGSearchTestRequest(BaseModel):
    """Admin GraphRAG search test request."""

    domain: str
    query: str
    top_k: int = 5
    strategy: str = "HYBRID"
    filters: dict[str, Any] = Field(default_factory=dict)
    vector_weight: float = 0.6
    graph_weight: float = 0.4
    include_evidence: bool = True


class SourcePreviewResponse(BaseModel):
    """Preview data for indexed source content."""

    source_id: str
    chunks: list[Any] = Field(default_factory=list)
    entities: list[Any] = Field(default_factory=list)
    relations: list[Any] = Field(default_factory=list)
    evidence: list[Any] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
