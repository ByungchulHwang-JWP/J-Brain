from __future__ import annotations

from pathlib import Path
from typing import Any

from app.ai.unanswered_logger import UnansweredLogger, default_unanswered_log_path
from app.schemas.intent_factory import FaqCandidatePayload


def infer_improvement_type(record: dict[str, Any]) -> tuple[str, str, str]:
    confidence = str(record.get("confidence_label") or "").lower()
    intent_id = record.get("intent_id")
    action_id = record.get("action_id")

    if confidence == "very_low" or not intent_id:
        return (
            "INTENT_OR_EXAMPLE",
            "high",
            "Intent가 없거나 신뢰도가 매우 낮아 신규 Intent 또는 예문 보강 검토가 필요합니다.",
        )
    if not action_id:
        return (
            "ACTION_LINK",
            "medium",
            "Intent 후보는 있으나 연결된 Action이 없어 실행 연결 검토가 필요합니다.",
        )
    if confidence == "low":
        return (
            "EXAMPLE_COVERAGE",
            "medium",
            "Intent 후보는 있으나 신뢰도가 낮아 예문 또는 용어 사전 보강이 필요합니다.",
        )
    return (
        "FAQ_CANDIDATE",
        "low",
        "질문에 대한 표준 답변 또는 FAQ 근거 보강 후보입니다.",
    )


def enrich_unanswered_record(record: dict[str, Any]) -> dict[str, Any]:
    improvement_type, severity, reason = infer_improvement_type(record)
    return {
        **record,
        "improvement_type": improvement_type,
        "severity": severity,
        "reason": reason,
        "candidate_id": f"FAQC-{record.get('log_id')}",
    }


def list_project_unanswered_records(
    project_id: str,
    *,
    log_path: Path | str | None = None,
    limit: int = 100,
    include_converted: bool = True,
) -> list[dict[str, Any]]:
    logger = UnansweredLogger(log_path or default_unanswered_log_path())
    records = logger.list_recent(limit=limit)
    filtered = []
    for record in records:
        record_project_id = record.get("project_id")
        if record_project_id and record_project_id != project_id:
            continue
        if not include_converted and str(record.get("status")) != "open":
            continue
        filtered.append(enrich_unanswered_record(record))
    return filtered


def build_faq_candidate_payload_from_unanswered(
    record: dict[str, Any],
    *,
    suggested_answer: str | None = None,
    tags: list[str] | None = None,
) -> FaqCandidatePayload:
    base_tags = [
        "unanswered",
        str(record.get("confidence_label") or "unknown"),
        str(record.get("pack_id") or "unknown-pack"),
    ]
    merged_tags = list(dict.fromkeys([*base_tags, *(tags or [])]))
    return FaqCandidatePayload(
        candidate_id=f"FAQC-{record['log_id']}",
        question=record["question"],
        suggested_answer=suggested_answer,
        source_log_id=record["log_id"],
        tags=merged_tags,
        status="new",
    )
