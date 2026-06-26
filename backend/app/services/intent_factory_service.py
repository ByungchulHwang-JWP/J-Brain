import json
import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.intent_factory import IntentPayload, IntentUpdatePayload


SEARCH_DOC_CATEGORIES = {"SEARCH_DOC", "DOCUMENT", "FAQ"}


def normalize_example_text(raw_text: str) -> str:
    return re.sub(r"\s+", " ", raw_text.strip()).lower()


def _get_intent_name(intent: dict[str, Any]) -> str:
    return intent.get("intent_name") or intent.get("name") or intent["intent_id"]


def pack_intent_to_record(project_id: str, intent: dict[str, Any]) -> dict[str, Any]:
    return {
        "project_id": project_id,
        "intent_id": intent["intent_id"],
        "intent_name": _get_intent_name(intent),
        "description": intent.get("description"),
        "category": intent.get("category", "GUIDE"),
        "action_id": intent.get("action_id"),
        "status": "active",
        "priority": int(intent.get("priority", 100)),
    }


def build_default_source_scope(
    project_id: str,
    intent_id: str,
    category: str,
) -> dict[str, Any] | None:
    if category.upper() not in SEARCH_DOC_CATEGORIES:
        return None
    return {
        "project_id": project_id,
        "intent_id": intent_id,
        "source_category": project_id,
        "source_status": "completed",
        "document_types": [],
        "tags": [],
        "top_k": 5,
        "score_threshold": 0.65,
    }


def _json_array(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


def _scope_to_db(scope: dict[str, Any] | None) -> dict[str, Any] | None:
    if scope is None:
        return None
    return {
        **scope,
        "document_types": json.dumps(scope.get("document_types", []), ensure_ascii=False),
        "tags": json.dumps(scope.get("tags", []), ensure_ascii=False),
    }


async def list_intents(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT
                d.intent_id,
                d.intent_name,
                d.category,
                d.action_id,
                d.status,
                d.priority,
                COUNT(e.id) AS example_count,
                CASE WHEN s.id IS NULL THEN false ELSE true END AS has_source_scope
            FROM graphrag.intent_definitions d
            LEFT JOIN graphrag.intent_examples e
                ON e.project_id = d.project_id
               AND e.intent_id = d.intent_id
               AND e.is_active = true
            LEFT JOIN graphrag.intent_source_scopes s
                ON s.project_id = d.project_id
               AND s.intent_id = d.intent_id
            WHERE d.project_id = :project_id
              AND d.status != 'archived'
            GROUP BY d.intent_id, d.intent_name, d.category, d.action_id, d.status, d.priority, s.id
            ORDER BY d.priority ASC, d.intent_id ASC
            """
        ),
        {"project_id": project_id},
    )
    return {"project_id": project_id, "items": [dict(row._mapping) for row in result.fetchall()]}


async def get_intent_detail(db: AsyncSession, project_id: str, intent_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT intent_id, intent_name, description, category, action_id, status, priority
            FROM graphrag.intent_definitions
            WHERE project_id = :project_id
              AND intent_id = :intent_id
              AND status != 'archived'
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    row = result.fetchone()
    if not row:
        return None

    detail = dict(row._mapping)
    examples = await db.execute(
        text(
            """
            SELECT example_text
            FROM graphrag.intent_examples
            WHERE project_id = :project_id
              AND intent_id = :intent_id
              AND is_active = true
            ORDER BY id ASC
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    detail["examples"] = [item.example_text for item in examples.fetchall()]

    scope = await db.execute(
        text(
            """
            SELECT source_category, source_status, document_types, tags, top_k, score_threshold
            FROM graphrag.intent_source_scopes
            WHERE project_id = :project_id
              AND intent_id = :intent_id
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    scope_row = scope.fetchone()
    if scope_row:
        source_scope = dict(scope_row._mapping)
        source_scope["document_types"] = _json_array(source_scope.get("document_types"))
        source_scope["tags"] = _json_array(source_scope.get("tags"))
        source_scope["score_threshold"] = float(source_scope["score_threshold"])
        detail["source_scope"] = source_scope
    else:
        detail["source_scope"] = None
    return detail


async def save_intent(
    db: AsyncSession,
    project_id: str,
    payload: IntentPayload | IntentUpdatePayload,
    intent_id: str | None = None,
) -> dict[str, Any]:
    resolved_intent_id = intent_id or payload.intent_id
    await db.execute(
        text(
            """
            INSERT INTO graphrag.intent_definitions
                (project_id, intent_id, intent_name, description, category, action_id, status, priority, updated_at)
            VALUES
                (:project_id, :intent_id, :intent_name, :description, :category, :action_id, :status, :priority, NOW())
            ON CONFLICT (project_id, intent_id) DO UPDATE SET
                intent_name = EXCLUDED.intent_name,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                action_id = EXCLUDED.action_id,
                status = EXCLUDED.status,
                priority = EXCLUDED.priority,
                updated_at = NOW()
            """
        ),
        {
            "project_id": project_id,
            "intent_id": resolved_intent_id,
            "intent_name": payload.intent_name,
            "description": payload.description,
            "category": payload.category,
            "action_id": payload.action_id,
            "status": payload.status,
            "priority": payload.priority,
        },
    )

    await db.execute(
        text(
            """
            UPDATE graphrag.intent_examples
            SET is_active = false, updated_at = NOW()
            WHERE project_id = :project_id AND intent_id = :intent_id
            """
        ),
        {"project_id": project_id, "intent_id": resolved_intent_id},
    )
    for example in payload.examples:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_examples
                    (project_id, intent_id, example_text, normalized_text, is_active, updated_at)
                VALUES
                    (:project_id, :intent_id, :example_text, :normalized_text, true, NOW())
                ON CONFLICT (project_id, intent_id, example_text) DO UPDATE SET
                    normalized_text = EXCLUDED.normalized_text,
                    is_active = true,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "intent_id": resolved_intent_id,
                "example_text": example,
                "normalized_text": normalize_example_text(example),
            },
        )

    if payload.action_id:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_action_links
                    (project_id, intent_id, action_id, action_type, is_primary, updated_at)
                VALUES
                    (:project_id, :intent_id, :action_id, :action_type, true, NOW())
                ON CONFLICT (project_id, intent_id, action_id) DO UPDATE SET
                    action_type = EXCLUDED.action_type,
                    is_primary = true,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "intent_id": resolved_intent_id,
                "action_id": payload.action_id,
                "action_type": payload.category,
            },
        )

    if payload.source_scope:
        scope = _scope_to_db(
            {
                "project_id": project_id,
                "intent_id": resolved_intent_id,
                **payload.source_scope.model_dump(),
            }
        )
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_source_scopes
                    (project_id, intent_id, source_category, source_status, document_types, tags, top_k, score_threshold, updated_at)
                VALUES
                    (:project_id, :intent_id, :source_category, :source_status, CAST(:document_types AS jsonb), CAST(:tags AS jsonb), :top_k, :score_threshold, NOW())
                ON CONFLICT (project_id, intent_id) DO UPDATE SET
                    source_category = EXCLUDED.source_category,
                    source_status = EXCLUDED.source_status,
                    document_types = EXCLUDED.document_types,
                    tags = EXCLUDED.tags,
                    top_k = EXCLUDED.top_k,
                    score_threshold = EXCLUDED.score_threshold,
                    updated_at = NOW()
                """
            ),
            scope,
        )
    else:
        await db.execute(
            text("DELETE FROM graphrag.intent_source_scopes WHERE project_id = :project_id AND intent_id = :intent_id"),
            {"project_id": project_id, "intent_id": resolved_intent_id},
        )

    await db.commit()
    detail = await get_intent_detail(db, project_id, resolved_intent_id)
    return detail or {"intent_id": resolved_intent_id}


async def archive_intent(db: AsyncSession, project_id: str, intent_id: str) -> dict[str, str]:
    await db.execute(
        text(
            """
            UPDATE graphrag.intent_definitions
            SET status = 'archived', updated_at = NOW()
            WHERE project_id = :project_id AND intent_id = :intent_id
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    await db.commit()
    return {"project_id": project_id, "intent_id": intent_id, "status": "archived"}


def _examples_by_intent(pack: Any) -> dict[str, list[str]]:
    examples_by_intent: dict[str, list[str]] = {}
    for example in pack.nlu["intent_examples"]:
        intent_id = example["intent_id"]
        example_text = example.get("example") or example.get("text") or example.get("example_text")
        if example_text:
            examples_by_intent.setdefault(intent_id, []).append(example_text)
    return examples_by_intent


async def import_pack_to_db(
    db: AsyncSession,
    project_id: str,
    pack: Any,
    overwrite: bool = False,
) -> dict[str, Any]:
    imported = 0
    skipped = 0
    examples_by_intent = _examples_by_intent(pack)

    for intent in pack.nlu["intents"]:
        intent_id = intent["intent_id"]
        existing = await get_intent_detail(db, project_id, intent_id)
        if existing and not overwrite:
            skipped += 1
            continue

        record = pack_intent_to_record(project_id, intent)
        source_scope = build_default_source_scope(project_id, record["intent_id"], record["category"])
        payload = IntentPayload(
            intent_id=record["intent_id"],
            intent_name=record["intent_name"],
            description=record["description"],
            category=record["category"],
            action_id=record["action_id"],
            status=record["status"],
            priority=record["priority"],
            examples=examples_by_intent.get(record["intent_id"], []),
            source_scope=source_scope,
        )
        await save_intent(db, project_id, payload)
        imported += 1

    return {
        "project_id": project_id,
        "pack_id": pack.manifest.get("pack_id") or pack.profile.get("pack_id"),
        "imported": imported,
        "skipped": skipped,
    }
