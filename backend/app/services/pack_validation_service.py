from __future__ import annotations

import json
import hashlib
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.validation_runner import ValidationRunner
from app.schemas.intent_factory import (
    PackValidationQuestionPayload,
    PackValidationQuestionUpdatePayload,
    PackValidationRunPayload,
)
from app.services.intent_factory_service import build_pack_draft
from app.services.pack_export_service import PACK_EXPORT_ROOT, get_pack_export, write_pack_directory
from app.services.pack_store_service import PACK_STORE_ROOT, _write_audit_log


PACK_VALIDATION_DRAFT_ROOT = Path(__file__).resolve().parents[2] / "app_data" / "pack_validation_drafts"


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


async def list_validation_questions(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT question_id, question, expected_intent_id, expected_action_id,
                   min_confidence_score, pack_id, pack_version, status, created_at, updated_at
            FROM graphrag.pack_validation_questions
            WHERE project_id = :project_id
              AND status != 'archived'
            ORDER BY created_at DESC, question_id ASC
            """
        ),
        {"project_id": project_id},
    )
    return {"project_id": project_id, "items": [_question_row_to_dict(row._mapping) for row in result.fetchall()]}


async def get_validation_question(
    db: AsyncSession,
    project_id: str,
    question_id: str,
) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT question_id, question, expected_intent_id, expected_action_id,
                   min_confidence_score, pack_id, pack_version, status, created_at, updated_at
            FROM graphrag.pack_validation_questions
            WHERE project_id = :project_id
              AND question_id = :question_id
              AND status != 'archived'
            """
        ),
        {"project_id": project_id, "question_id": question_id},
    )
    row = result.fetchone()
    return _question_row_to_dict(row._mapping) if row else None


async def save_validation_question(
    db: AsyncSession,
    project_id: str,
    payload: PackValidationQuestionPayload | PackValidationQuestionUpdatePayload,
    question_id: str | None = None,
) -> dict[str, Any]:
    resolved_question_id = question_id or payload.question_id
    await db.execute(
        text(
            """
            INSERT INTO graphrag.pack_validation_questions
                (project_id, question_id, question, expected_intent_id, expected_action_id,
                 min_confidence_score, pack_id, pack_version, status, updated_at)
            VALUES
                (:project_id, :question_id, :question, :expected_intent_id, :expected_action_id,
                 :min_confidence_score, :pack_id, :pack_version, :status, NOW())
            ON CONFLICT (project_id, question_id) DO UPDATE SET
                question = EXCLUDED.question,
                expected_intent_id = EXCLUDED.expected_intent_id,
                expected_action_id = EXCLUDED.expected_action_id,
                min_confidence_score = EXCLUDED.min_confidence_score,
                pack_id = EXCLUDED.pack_id,
                pack_version = EXCLUDED.pack_version,
                status = EXCLUDED.status,
                updated_at = NOW()
            """
        ),
        {
            "project_id": project_id,
            "question_id": resolved_question_id,
            "question": payload.question,
            "expected_intent_id": payload.expected_intent_id,
            "expected_action_id": payload.expected_action_id,
            "min_confidence_score": payload.min_confidence_score,
            "pack_id": payload.pack_id,
            "pack_version": payload.pack_version,
            "status": payload.status,
        },
    )
    await db.commit()
    detail = await get_validation_question(db, project_id, resolved_question_id)
    return detail or {"question_id": resolved_question_id}


async def archive_validation_question(db: AsyncSession, project_id: str, question_id: str) -> dict[str, str]:
    await db.execute(
        text(
            """
            UPDATE graphrag.pack_validation_questions
            SET status = 'archived', updated_at = NOW()
            WHERE project_id = :project_id
              AND question_id = :question_id
            """
        ),
        {"project_id": project_id, "question_id": question_id},
    )
    await db.commit()
    return {"project_id": project_id, "question_id": question_id, "status": "archived"}


async def list_validation_results(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT result_id, project_id, pack_id, pack_version, target_type, status, summary, results, created_at
            FROM graphrag.pack_validation_results
            WHERE project_id = :project_id
            ORDER BY created_at DESC
            """
        ),
        {"project_id": project_id},
    )
    return {"project_id": project_id, "items": [dict(row._mapping) for row in result.fetchall()]}


async def run_pack_validation(
    db: AsyncSession,
    project_id: str,
    payload: PackValidationRunPayload,
) -> dict[str, Any]:
    pack = await _load_pack_for_validation(db, project_id, payload)
    questions = await _load_questions_for_pack(db, project_id, payload.pack_id, payload.pack_version)
    seeded_question_count = 0
    if not questions and payload.target_type == "draft":
        seeded_question_count = await seed_validation_questions_from_draft(db, project_id, payload)
        questions = await _load_questions_for_pack(db, project_id, payload.pack_id, payload.pack_version)
    if not questions:
        raise ValueError(
            "활성 검증 질문이 없습니다. Intent와 Action 후보를 적용한 뒤 검증 질문을 등록하거나 "
            "DB Draft 대상으로 검증을 실행해 자동 생성해 주세요."
        )
    pack.validation["validation_questions"] = questions

    raw_result = await ValidationRunner(pack).run()
    results = [_apply_confidence_policy(item, questions) for item in raw_result["results"]]
    passed_count = sum(1 for item in results if item["passed"])
    total = len(results)
    status = "passed" if total > 0 and passed_count == total else "failed"
    result_id = f"VAL-{uuid4().hex[:12]}"
    summary = {
        **{key: value for key, value in raw_result.items() if key != "results"},
        "passed_count": passed_count,
        "failed_count": total - passed_count,
        "status": status,
        "auto_seeded_validation_questions": seeded_question_count,
    }

    await db.execute(
        text(
            """
            INSERT INTO graphrag.pack_validation_results
                (result_id, project_id, pack_id, pack_version, target_type, status, summary, results)
            VALUES
                (:result_id, :project_id, :pack_id, :pack_version, :target_type, :status,
                 CAST(:summary AS jsonb), CAST(:results AS jsonb))
            """
        ),
        {
            "result_id": result_id,
            "project_id": project_id,
            "pack_id": payload.pack_id,
            "pack_version": payload.pack_version,
            "target_type": payload.target_type,
            "status": status,
            "summary": _json_dumps(summary),
            "results": _json_dumps(results),
        },
    )
    if payload.target_type == "runtime_pack":
        await db.execute(
            text(
                """
                UPDATE graphrag.runtime_pack_store
                SET status = :next_status,
                    validation_result = CAST(:validation_result AS jsonb)
                WHERE project_id = :project_id
                  AND pack_id = :pack_id
                  AND pack_version = :pack_version
                """
            ),
            {
                "project_id": project_id,
                "pack_id": payload.pack_id,
                "pack_version": payload.pack_version,
                "next_status": "validated" if status == "passed" else "validation_failed",
                "validation_result": _json_dumps(summary),
            },
        )
    await _write_audit_log(
        db,
        project_id=project_id,
        operation="VALIDATE",
        pack_id=payload.pack_id,
        pack_version=payload.pack_version,
        status=status,
        message=f"Pack validation {status}: {passed_count}/{total}",
        metadata={"result_id": result_id, "target_type": payload.target_type},
    )
    await db.commit()

    return {
        "result_id": result_id,
        "project_id": project_id,
        "pack_id": payload.pack_id,
        "pack_version": payload.pack_version,
        "target_type": payload.target_type,
        "status": status,
        "summary": summary,
        "results": results,
    }


async def _load_questions_for_pack(
    db: AsyncSession,
    project_id: str,
    pack_id: str,
    pack_version: str,
) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            """
            SELECT question_id, question, expected_intent_id, expected_action_id,
                   min_confidence_score
            FROM graphrag.pack_validation_questions
            WHERE project_id = :project_id
              AND status = 'active'
              AND (pack_id IS NULL OR pack_id = :pack_id)
              AND (pack_version IS NULL OR pack_version = :pack_version)
            ORDER BY created_at ASC, question_id ASC
            """
        ),
        {"project_id": project_id, "pack_id": pack_id, "pack_version": pack_version},
    )
    return [
        {
            **_question_row_to_dict(row._mapping),
            "expected_entities": [],
        }
        for row in result.fetchall()
    ]


async def seed_validation_questions_from_draft(
    db: AsyncSession,
    project_id: str,
    payload: PackValidationRunPayload,
) -> int:
    draft = await build_pack_draft(db, project_id)
    generated_questions = build_auto_validation_questions_from_draft(
        project_id,
        draft,
        pack_id=payload.pack_id,
        pack_version=payload.pack_version,
    )
    if not generated_questions:
        return 0

    for question in generated_questions:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.pack_validation_questions
                    (project_id, question_id, question, expected_intent_id, expected_action_id,
                     min_confidence_score, pack_id, pack_version, status, updated_at)
                VALUES
                    (:project_id, :question_id, :question, :expected_intent_id, :expected_action_id,
                     :min_confidence_score, :pack_id, :pack_version, :status, NOW())
                ON CONFLICT (project_id, question_id) DO UPDATE SET
                    question = EXCLUDED.question,
                    expected_intent_id = EXCLUDED.expected_intent_id,
                    expected_action_id = EXCLUDED.expected_action_id,
                    min_confidence_score = EXCLUDED.min_confidence_score,
                    pack_id = EXCLUDED.pack_id,
                    pack_version = EXCLUDED.pack_version,
                    status = EXCLUDED.status,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "question_id": question["question_id"],
                "question": question["question"],
                "expected_intent_id": question["expected_intent_id"],
                "expected_action_id": question["expected_action_id"],
                "min_confidence_score": question["min_confidence_score"],
                "pack_id": question["pack_id"],
                "pack_version": question["pack_version"],
                "status": question["status"],
            },
        )
    await db.commit()
    return len(generated_questions)


def build_auto_validation_questions_from_draft(
    project_id: str,
    draft: dict[str, Any],
    *,
    pack_id: str | None,
    pack_version: str | None,
    min_confidence_score: float = 0.65,
) -> list[dict[str, Any]]:
    examples_by_intent: dict[str, list[str]] = {}
    for example in draft.get("nlu", {}).get("intent_examples", []):
        intent_id = example.get("intent_id")
        text_value = example.get("text") or example.get("example") or example.get("example_text")
        if intent_id and text_value:
            normalized = " ".join(str(text_value).split())
            if normalized and normalized not in examples_by_intent.setdefault(intent_id, []):
                examples_by_intent[intent_id].append(normalized)

    questions: list[dict[str, Any]] = []
    seen_question_keys: set[tuple[str, str]] = set()
    for intent in draft.get("nlu", {}).get("intents", []):
        if intent.get("status") == "archived":
            continue
        intent_id = intent.get("intent_id")
        action_id = intent.get("action_id")
        if not intent_id or not action_id:
            continue

        candidates = examples_by_intent.get(intent_id, [])[:2]
        fallback_question = _fallback_validation_question(intent)
        if fallback_question:
            candidates.append(fallback_question)

        for index, question_text in enumerate(_unique_texts(candidates)[:2], start=1):
            question_key = (intent_id, question_text)
            if question_key in seen_question_keys:
                continue
            seen_question_keys.add(question_key)
            digest = hashlib.sha1(
                f"{project_id}|{intent_id}|{action_id}|{index}|{question_text}".encode("utf-8")
            ).hexdigest()[:12].upper()
            questions.append(
                {
                    "question_id": f"VAL-AUTO-{digest}",
                    "question": question_text,
                    "expected_intent_id": intent_id,
                    "expected_action_id": action_id,
                    "min_confidence_score": min_confidence_score,
                    "pack_id": pack_id,
                    "pack_version": pack_version,
                    "status": "active",
                }
            )
    return questions


def _fallback_validation_question(intent: dict[str, Any]) -> str | None:
    name = intent.get("intent_name") or intent.get("name")
    description = intent.get("description")
    source = name or description or intent.get("intent_id")
    if not source:
        return None
    return f"{source} 알려줘"


def _unique_texts(values: list[str]) -> list[str]:
    unique_values: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = " ".join(str(value).split())
        if not normalized:
            continue
        dedupe_key = normalized.lower()
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        unique_values.append(normalized)
    return unique_values


async def _load_pack_for_validation(
    db: AsyncSession,
    project_id: str,
    payload: PackValidationRunPayload,
):
    if payload.target_type == "runtime_pack":
        result = await db.execute(
            text(
                """
                SELECT store_path
                FROM graphrag.runtime_pack_store
                WHERE project_id = :project_id
                  AND pack_id = :pack_id
                  AND pack_version = :pack_version
                """
            ),
            {"project_id": project_id, "pack_id": payload.pack_id, "pack_version": payload.pack_version},
        )
        row = result.fetchone()
        if not row:
            raise FileNotFoundError(f"Runtime Pack을 찾을 수 없습니다: {payload.pack_id} v{payload.pack_version}")
        store_path = Path(row.store_path)
        if store_path.is_dir():
            return IntentPackLoader(store_path.parent).load_pack(payload.pack_id, payload.pack_version)
        return IntentPackLoader(PACK_STORE_ROOT).load_pack(payload.pack_id, payload.pack_version)

    if payload.target_type == "export":
        export = await get_pack_export(db, project_id, payload.pack_id)
        if export:
            pack_id = export["pack_id"]
            pack_version = export["pack_version"]
            pack_dir = Path(export["file_path"]).with_suffix("")
            return IntentPackLoader(pack_dir.parent).load_pack(pack_id, pack_version)
        return IntentPackLoader(PACK_EXPORT_ROOT).load_pack(payload.pack_id, payload.pack_version)

    if payload.target_type == "draft":
        draft = await build_pack_draft(db, project_id)
        pack_dir = write_pack_directory(
            project_id=project_id,
            pack_id=payload.pack_id,
            pack_version=payload.pack_version,
            draft=draft,
            output_root=PACK_VALIDATION_DRAFT_ROOT,
        )
        return IntentPackLoader(pack_dir.parent).load_pack(payload.pack_id, payload.pack_version)

    return IntentPackLoader(PACK_STORE_ROOT).load_pack(payload.pack_id, payload.pack_version)


def _apply_confidence_policy(
    result: dict[str, Any],
    questions: list[dict[str, Any]],
) -> dict[str, Any]:
    question_by_id = {item["question_id"]: item for item in questions}
    min_score = float(question_by_id.get(result["question_id"], {}).get("min_confidence_score", 0.65))
    confidence_pass = float(result.get("score", 0.0)) >= min_score
    passed = bool(result.get("top1_pass") and confidence_pass)
    return {
        **result,
        "min_confidence_score": min_score,
        "confidence_pass": confidence_pass,
        "passed": passed,
    }


def _question_row_to_dict(row: Any) -> dict[str, Any]:
    item = dict(row)
    if "min_confidence_score" in item:
        item["min_confidence_score"] = float(item["min_confidence_score"])
    return item
