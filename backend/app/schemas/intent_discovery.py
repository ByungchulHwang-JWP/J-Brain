from __future__ import annotations

from pydantic import BaseModel, Field


class DiscoveryCandidate(BaseModel):
    candidate_id: str
    run_id: str
    project_id: str
    candidate_type: str
    title: str
    payload: dict = Field(default_factory=dict)
    confidence_score: float = 0.7
    reason: str = ""
    status: str = "pending"
    created_at: str
    updated_at: str


class DiscoveryRun(BaseModel):
    run_id: str
    project_id: str
    status: str = "completed"
    summary: dict = Field(default_factory=dict)
    candidates: list[DiscoveryCandidate] = Field(default_factory=list)
    created_at: str
    updated_at: str


class DiscoveryRunRequest(BaseModel):
    scope: str = "all"


class CandidateStatusPayload(BaseModel):
    status: str
