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


class SynonymPayload(BaseModel):
    canonical_value: str
    synonyms: list[str] = Field(default_factory=list)
    code: str | None = None
    is_active: bool = True


class EntityPayload(BaseModel):
    entity_type: str
    display_name: str
    value_type: str = "string"
    required_validation: bool = False
    normalization_rule: str | None = None
    description: str | None = None
    status: str = "active"
    synonyms: list[SynonymPayload] = Field(default_factory=list)


class EntityUpdatePayload(BaseModel):
    display_name: str
    value_type: str = "string"
    required_validation: bool = False
    normalization_rule: str | None = None
    description: str | None = None
    status: str = "active"
    synonyms: list[SynonymPayload] = Field(default_factory=list)


class IntentEntityLinkPayload(BaseModel):
    entity_type: str
    parameter_name: str | None = None
    required: bool = False
    default_policy: str | None = None
    validation_rule: str | None = None


class IntentEntityLinksPayload(BaseModel):
    links: list[IntentEntityLinkPayload] = Field(default_factory=list)
