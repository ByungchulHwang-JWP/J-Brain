from pydantic import BaseModel, Field


class SourceScopePayload(BaseModel):
    source_category: str | None = None
    source_status: str = "completed"
    document_types: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    top_k: int = 5
    score_threshold: float = 0.65


class IntentPayload(BaseModel):
    intent_id: str
    intent_name: str
    description: str | None = None
    category: str
    action_id: str | None = None
    status: str = "draft"
    priority: int = 100
    examples: list[str] = Field(default_factory=list)
    source_scope: SourceScopePayload | None = None


class IntentUpdatePayload(BaseModel):
    intent_name: str
    description: str | None = None
    category: str
    action_id: str | None = None
    status: str = "draft"
    priority: int = 100
    examples: list[str] = Field(default_factory=list)
    source_scope: SourceScopePayload | None = None


class ImportPackPayload(BaseModel):
    pack_id: str
    pack_version: str | None = None
    overwrite: bool = False
