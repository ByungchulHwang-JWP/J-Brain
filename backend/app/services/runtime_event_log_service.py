from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def _status_from_response(response: dict[str, Any]) -> str:
    card = response.get("card") or {}
    return str(card.get("status") or "ok")


def _is_fallback(response: dict[str, Any]) -> bool:
    card = response.get("card") or {}
    message = response.get("message") or {}
    return card.get("type") == "fallback_card" or message.get("message_type") == "fallback"


async def record_runtime_event(
    db: AsyncSession,
    *,
    project_id: str,
    question: str,
    response: dict[str, Any],
    response_time_ms: int,
) -> None:
    diagnostics = response.get("diagnostics") or {}
    card = response.get("card") or {}
    await db.execute(
        text("""
            INSERT INTO graphrag.runtime_event_logs (
                project_id, session_id, question, matched_intent_id, action_id, action_type,
                confidence, confidence_label, fallback_yn, response_status, response_time_ms,
                active_pack_id, active_pack_version
            ) VALUES (
                :project_id, :session_id, :question, :matched_intent_id, :action_id, :action_type,
                :confidence, :confidence_label, :fallback_yn, :response_status, :response_time_ms,
                :active_pack_id, :active_pack_version
            )
        """),
        {
            "project_id": project_id,
            "session_id": response.get("conversation_id"),
            "question": question,
            "matched_intent_id": diagnostics.get("top_intent_id"),
            "action_id": diagnostics.get("top_action_id") or card.get("action_id"),
            "action_type": card.get("type"),
            "confidence": diagnostics.get("top_score"),
            "confidence_label": diagnostics.get("top_confidence_label"),
            "fallback_yn": _is_fallback(response),
            "response_status": _status_from_response(response),
            "response_time_ms": response_time_ms,
            "active_pack_id": response.get("pack_id"),
            "active_pack_version": response.get("pack_version"),
        },
    )
