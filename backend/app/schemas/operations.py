from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class RuntimeEventLogBase(BaseModel):
    project_id: str
    session_id: Optional[str] = None
    question: str
    matched_intent_id: Optional[str] = None
    action_id: Optional[str] = None
    action_type: Optional[str] = None
    confidence: Optional[float] = None
    confidence_label: Optional[str] = None
    fallback_yn: bool = False
    response_status: Optional[str] = None
    response_time_ms: Optional[int] = None
    active_pack_id: Optional[str] = None
    active_pack_version: Optional[str] = None

class RuntimeEventLogCreate(RuntimeEventLogBase):
    pass

class RuntimeEventLogResponse(RuntimeEventLogBase):
    id: int
    created_at: datetime

class OperationMetricsResponse(BaseModel):
    id: int
    project_id: str
    metric_date: date
    total_requests: int
    intent_match_count: int
    fallback_count: int
    avg_confidence: float
    avg_response_time_ms: int
    action_type_counts: Dict[str, int]
    created_at: datetime
    updated_at: datetime

class ImprovementRequestBase(BaseModel):
    source_type: Optional[str] = None
    source_log_id: Optional[int] = None
    request_type: str
    title: str
    description: Optional[str] = None
    severity: str = "medium"
    status: str = "new"
    assigned_to: Optional[int] = None
    linked_intent_id: Optional[str] = None
    linked_action_id: Optional[str] = None
    linked_faq_id: Optional[str] = None
    target_pack_version: Optional[str] = None

class ImprovementRequestCreate(ImprovementRequestBase):
    request_id: str
    project_id: str

class ImprovementRequestUpdate(BaseModel):
    request_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    linked_intent_id: Optional[str] = None
    linked_action_id: Optional[str] = None
    linked_faq_id: Optional[str] = None
    target_pack_version: Optional[str] = None

class ImprovementRequestResponse(ImprovementRequestBase):
    id: int
    request_id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

class PackImprovementLinkBase(BaseModel):
    pack_id: str
    pack_version: str
    validation_result: Dict[str, Any] = Field(default_factory=dict)
    deployed_yn: bool = False

class PackImprovementLinkCreate(PackImprovementLinkBase):
    project_id: str
    request_id: str

class PackImprovementLinkResponse(PackImprovementLinkBase):
    id: int
    project_id: str
    request_id: str
    created_at: datetime

class ProjectOperationSettingsBase(BaseModel):
    low_confidence_threshold: float = 0.650
    alert_email: Optional[str] = None

class ProjectOperationSettingsUpdate(ProjectOperationSettingsBase):
    pass

class ProjectOperationSettingsResponse(ProjectOperationSettingsBase):
    id: int
    project_id: str
    created_at: datetime
    updated_at: datetime
