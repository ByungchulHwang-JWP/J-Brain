from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator

from app.ai.action_router import ActionRouter
from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPack, IntentPackValidationError
from app.ai.project_pack_resolver import ProjectPackResolver
from app.ai.unanswered_logger import UnansweredLogger, default_unanswered_log_path
from app.api.deps import get_current_user_id
from app.api.intent_packs import get_pack_loader


router = APIRouter()


class BestEffortUnansweredLogger:
    def __init__(self, logger: UnansweredLogger):
        self.logger = logger

    def append(self, **kwargs: Any) -> dict[str, Any] | None:
        try:
            return self.logger.append(**kwargs)
        except Exception:
            return None


class ChatRuntimeRequest(BaseModel):
    query: str = Field(..., min_length=1)
    conversation_id: str | None = None
    pack_id: str | None = None
    pack_version: str | None = None
    top_k: int = Field(default=3, ge=1, le=10)

    @field_validator("query")
    @classmethod
    def query_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("query must not be blank")
        return value

    @model_validator(mode="after")
    def pack_override_must_be_complete(self) -> "ChatRuntimeRequest":
        if bool(self.pack_id) != bool(self.pack_version):
            raise ValueError("pack_id and pack_version must be supplied together")
        return self


def build_runtime_response(
    project_id: str,
    question: str,
    pack: IntentPack,
    top_k: int = 3,
    log_fallback: bool = True,
) -> dict[str, Any]:
    matches = IntentMatcher(pack).match(question, top_k=top_k)
    logger = (
        BestEffortUnansweredLogger(UnansweredLogger(default_unanswered_log_path()))
        if log_fallback
        else None
    )
    card = ActionRouter(pack, unanswered_logger=logger).route(question, matches)
    top_match = matches[0] if matches else {}
    message_type = "fallback" if card.get("type") == "fallback_card" else "action_card"

    response = {
        "project_id": project_id,
        "pack_id": pack.manifest.get("pack_id") or pack.profile.get("pack_id"),
        "pack_version": pack.manifest.get("pack_version")
        or pack.profile.get("pack_version"),
        "runtime_mode": "intent_action",
        "question": question,
        "message": {
            "role": "ai",
            "message_type": message_type,
            "content": card.get("message", ""),
        },
        "card": card,
        "matches": matches,
        "diagnostics": {
            "top_intent_id": top_match.get("intent_id"),
            "top_action_id": top_match.get("action_id"),
            "top_confidence_label": top_match.get("confidence_label", "very_low"),
            "top_score": top_match.get("score", 0.0),
            "matched_entities": top_match.get("matched_entities", []),
        },
    }

    log_id = card.get("log_id")
    if log_id:
        response["log_id"] = log_id

    return response


@router.post("/{project_id}/chat/runtime")
async def chat_runtime(
    project_id: str,
    req: ChatRuntimeRequest,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    del user_id

    pack_config = ProjectPackResolver().resolve(
        project_id,
        requested_pack_id=req.pack_id,
        requested_pack_version=req.pack_version,
    )
    loader = get_pack_loader()

    try:
        pack = loader.load_pack(
            pack_config["pack_id"],
            pack_config["pack_version"],
        )
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return build_runtime_response(
        project_id,
        req.query,
        pack,
        top_k=req.top_k,
        log_fallback=True,
    )
