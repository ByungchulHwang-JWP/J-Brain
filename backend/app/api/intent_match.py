from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator

from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPackValidationError
from app.api.chat_runtime import _resolve_pack_config
from app.api.deps import get_current_user_id
from app.api.intent_packs import get_pack_loader
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession


router = APIRouter()


class IntentMatchRequest(BaseModel):
    question: str = Field(..., min_length=1)
    pack_id: str | None = "netzero-intent-pack"
    pack_version: str | None = "0.1.0"
    top_k: int = Field(default=3, ge=1, le=10)

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("question must not be blank")
        return value

    @model_validator(mode="after")
    def pack_override_must_be_complete(self) -> "IntentMatchRequest":
        if bool(self.pack_id) != bool(self.pack_version):
            raise ValueError("pack_id and pack_version must be supplied together")
        return self


def _load_pack(pack_id: str, pack_version: str):
    loader = get_pack_loader()
    try:
        return loader.load_pack(pack_id, pack_version)
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("")
async def match_intent(req: IntentMatchRequest) -> dict[str, Any]:
    pack_id = req.pack_id or "netzero-intent-pack"
    pack_version = req.pack_version or "0.1.0"
    pack = _load_pack(pack_id, pack_version)

    matcher = IntentMatcher(pack)
    matches = matcher.match(req.question, top_k=req.top_k)
    return {
        "pack_id": pack_id,
        "pack_version": pack_version,
        "question": req.question,
        "top_k": req.top_k,
        "matches": matches,
    }


@router.post("/projects/{project_id}")
async def match_intent_for_project(
    project_id: str,
    req: IntentMatchRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    del user_id, db

    pack_config = await _resolve_pack_config(project_id, req)
    pack = _load_pack(pack_config["pack_id"], pack_config["pack_version"])
    matches = IntentMatcher(pack).match(req.question, top_k=req.top_k)
    return {
        "project_id": project_id,
        "pack_id": pack_config["pack_id"],
        "pack_version": pack_config["pack_version"],
        "question": req.question,
        "top_k": req.top_k,
        "matches": matches,
    }
