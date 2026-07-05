from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class WorkflowProject(BaseModel):
    id: str
    name: str
    description: str = ""
    status: str = "active"
    created_at: str = "-"
    active_pack_version: str = "-"
    draft_pack_version: str = "-"


class WorkflowCheck(BaseModel):
    key: str
    label: str
    status: str
    count: int = 0


class WorkflowNextAction(BaseModel):
    key: str
    label: str
    description: str = ""
    path: str
    priority: str = "normal"
    stage: int


class WorkflowStage(BaseModel):
    stage: int
    stage_key: str
    name: str
    status: str
    progress: int
    can_enter: bool = True
    locked_reason: Optional[str] = None
    checks: List[WorkflowCheck] = []
    next_actions: List[WorkflowNextAction] = []


class WorkflowSummary(BaseModel):
    project_id: str
    project_name: str
    active_pack_version: str = "-"
    draft_pack_version: str = "-"
    current_stage: int
    overall_progress: int
    blocked_count: int
    metrics: Dict[str, Any] = {}
    stages: List[WorkflowStage]
    next_action: Optional[WorkflowNextAction] = None


class WorkflowDraftPackPayload(BaseModel):
    reason: str = "workflow_dashboard"
    pack_version: Optional[str] = None


class WorkflowStageEventPayload(BaseModel):
    stage: int
    event_type: str
    memo: str = ""
    metadata: Dict[str, Any] = {}

