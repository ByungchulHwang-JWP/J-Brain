from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator

from app.ai.action_router import ActionRouter
from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPack, IntentPackLoader, IntentPackValidationError
from app.ai.project_pack_resolver import ProjectPackResolver
from app.ai.unanswered_logger import UnansweredLogger, default_unanswered_log_path
from app.api.deps import get_current_user_id
from app.api.intent_packs import get_pack_loader
from app.db.session import AsyncSessionLocal, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.pack_store_service import get_active_pack
from app.services.pack_store_service import PACK_STORE_ROOT
from app.services.runtime_event_log_service import record_runtime_event


router = APIRouter()


class BestEffortUnansweredLogger:
    def __init__(self, logger: UnansweredLogger, project_id: str | None = None):
        self.logger = logger
        self.project_id = project_id

    def append(self, **kwargs: Any) -> dict[str, Any] | None:
        try:
            kwargs.setdefault("project_id", self.project_id)
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


async def build_runtime_response(
    project_id: str,
    question: str,
    pack: IntentPack,
    db: AsyncSession | None = None,
    top_k: int = 3,
    log_fallback: bool = True,
    conversation_id: str | None = None,
) -> dict[str, Any]:
    started_at = time.perf_counter()
    matches = IntentMatcher(pack).match(question, top_k=top_k)
    logger = (
        BestEffortUnansweredLogger(UnansweredLogger(default_unanswered_log_path()), project_id)
        if log_fallback
        else None
    )
    card = await ActionRouter(pack, unanswered_logger=logger, db=db).route(question, matches)
    top_match = matches[0] if matches else {}
    message_type = "fallback" if card.get("type") == "fallback_card" else "action_card"
    source_summary = card.get("source_summary") or {}
    pack_id = pack.manifest.get("pack_id") or pack.profile.get("pack_id")
    pack_version = pack.manifest.get("pack_version") or pack.profile.get("pack_version")

    response = {
        "project_id": project_id,
        "conversation_id": conversation_id,
        "pack_id": pack_id,
        "pack_version": pack_version,
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
            "faq_evidence_count": source_summary.get("faq_count", 0),
            "document_evidence_count": source_summary.get("document_count", 0),
        },
        "qa_summary": {
            "pack": {
                "pack_id": pack_id,
                "pack_version": pack_version,
                "runtime_mode": "intent_action",
            },
            "intent": {
                "intent_id": top_match.get("intent_id"),
                "intent_name": top_match.get("intent_name"),
                "category": top_match.get("category"),
                "score": top_match.get("score", 0.0),
                "confidence_label": top_match.get("confidence_label", "very_low"),
                "matched_entities": top_match.get("matched_entities", []),
            },
            "action": {
                "action_id": top_match.get("action_id") or card.get("action_id"),
                "card_type": card.get("type"),
                "status": card.get("status") or ("fallback" if card.get("type") == "fallback_card" else "ready"),
                "route": card.get("route"),
                "confirmation_required": card.get("confirmation_required", False),
            },
            "evidence": {
                "faq_count": source_summary.get("faq_count", 0),
                "document_count": source_summary.get("document_count", 0),
                "source_count": len(card.get("sources") or []),
            },
            "top_matches": matches[:top_k],
        },
    }

    log_id = card.get("log_id")
    if log_id:
        response["log_id"] = log_id

    if db is not None:
        response_time_ms = max(0, int((time.perf_counter() - started_at) * 1000))
        await record_runtime_event(
            db,
            project_id=project_id,
            question=question,
            response=response,
            response_time_ms=response_time_ms,
        )

    return response


async def _resolve_pack_config(project_id: str, req: ChatRuntimeRequest) -> dict[str, Any]:
    active_record = None
    if not req.pack_id and not req.pack_version:
        try:
            async with AsyncSessionLocal() as db:
                active_record = await get_active_pack(db, project_id)
        except Exception:
            active_record = None

    return ProjectPackResolver().resolve_from_active_record(
        project_id,
        active_record,
        requested_pack_id=req.pack_id,
        requested_pack_version=req.pack_version,
    )


@router.post("/{project_id}/chat/runtime")
async def chat_runtime(
    project_id: str,
    req: ChatRuntimeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    del user_id

    pack_config = await _resolve_pack_config(project_id, req)
    loader = get_pack_loader()

    try:
        pack = loader.load_pack(
            pack_config["pack_id"],
            pack_config["pack_version"],
        )
    except IntentPackValidationError as exc:
        try:
            pack = IntentPackLoader(PACK_STORE_ROOT).load_pack(
                pack_config["pack_id"],
                pack_config["pack_version"],
            )
        except IntentPackValidationError:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    response = await build_runtime_response(
        project_id,
        req.query,
        pack,
        db=db,
        top_k=req.top_k,
        log_fallback=True,
        conversation_id=req.conversation_id,
    )
    await db.commit()
    return response
