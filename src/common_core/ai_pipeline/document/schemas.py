"""Document pipeline data contracts."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class SourceType(str, Enum):
    """Supported source types for the initial RAG pipeline."""

    TEXT = "TEXT"
    MARKDOWN = "MARKDOWN"
    JSON = "JSON"
    CSV = "CSV"
    FILE = "FILE"
    URL = "URL"
    API = "API"


class DocumentSource(BaseModel):
    """Registered source data passed to the document pipeline."""

    source_id: str
    domain: str
    source_type: SourceType
    name: str
    uri: str | None = None
    content: str | bytes | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    tenant_id: str | None = None
    user_id: str | None = None
    scope: str = "PRIVATE"
    version: int = 1


class DocumentInput(BaseModel):
    """One raw document unit before parsing and chunking."""

    document_id: str
    source_id: str
    domain: str
    source_type: SourceType
    name: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("content")
    @classmethod
    def content_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("document content must not be empty")
        return value


class ParsedDocument(BaseModel):
    """Normalized parsed document returned by a parser."""

    document_id: str
    source_id: str
    domain: str
    title: str
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class DocumentParseResult(BaseModel):
    """Parser result containing parsed documents and warnings."""

    documents: list[ParsedDocument] = Field(default_factory=list)
    warnings: list[dict[str, Any]] = Field(default_factory=list)
