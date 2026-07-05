from __future__ import annotations

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


class PackExportPayload(BaseModel):
    pack_id: str | None = None
    pack_version: str | None = None


class PackActivatePayload(BaseModel):
    pack_id: str
    pack_version: str
    activated_by: str | None = None


class PackApprovalPayload(BaseModel):
    approved_by: str | None = None
    reason: str | None = None


class PackValidationQuestionPayload(BaseModel):
    question_id: str
    question: str
    expected_intent_id: str
    expected_action_id: str
    min_confidence_score: float = 0.65
    pack_id: str | None = None
    pack_version: str | None = None
    status: str = "active"


class PackValidationQuestionUpdatePayload(BaseModel):
    question: str
    expected_intent_id: str
    expected_action_id: str
    min_confidence_score: float = 0.65
    pack_id: str | None = None
    pack_version: str | None = None
    status: str = "active"


class PackValidationRunPayload(BaseModel):
    pack_id: str
    pack_version: str
    target_type: str = "runtime_pack"


class ActionPayload(BaseModel):
    action_id: str
    action_name: str
    action_type: str
    description: str | None = None
    execution_mode: str = "local"
    route_value: str | None = None
    menu_name: str | None = None
    api_method: str | None = None
    api_endpoint: str | None = None
    sql_template: str | None = None
    allowed_roles: list[str] = Field(default_factory=list)
    status: str = "active"


class ActionUpdatePayload(BaseModel):
    action_name: str
    action_type: str
    description: str | None = None
    execution_mode: str = "local"
    route_value: str | None = None
    menu_name: str | None = None
    api_method: str | None = None
    api_endpoint: str | None = None
    sql_template: str | None = None
    allowed_roles: list[str] = Field(default_factory=list)
    status: str = "active"


class FaqPayload(BaseModel):
    faq_id: str
    question: str
    answer: str
    category: str | None = None
    tags: list[str] = Field(default_factory=list)
    source_id: str | None = None
    action_id: str = "SEARCH_DOC"
    approved_for_pack: bool = True
    status: str = "active"


class FaqUpdatePayload(BaseModel):
    question: str
    answer: str
    category: str | None = None
    tags: list[str] = Field(default_factory=list)
    source_id: str | None = None
    action_id: str = "SEARCH_DOC"
    approved_for_pack: bool = True
    status: str = "active"


class FaqCandidatePayload(BaseModel):
    candidate_id: str
    question: str
    suggested_answer: str | None = None
    source_log_id: str | None = None
    tags: list[str] = Field(default_factory=list)
    status: str = "new"


class FaqCandidateUpdatePayload(BaseModel):
    question: str
    suggested_answer: str | None = None
    source_log_id: str | None = None
    tags: list[str] = Field(default_factory=list)
    status: str = "new"


class UnansweredToFaqCandidatePayload(BaseModel):
    suggested_answer: str | None = None
    tags: list[str] = Field(default_factory=list)


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
