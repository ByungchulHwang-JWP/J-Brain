import json
import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.intent_factory import (
    EntityPayload,
    EntityUpdatePayload,
    IntentEntityLinksPayload,
    IntentPayload,
    IntentUpdatePayload,
)


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


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _pack_entity_to_payload(entity: dict[str, Any], synonyms: list[dict[str, Any]]) -> EntityPayload:
    return EntityPayload(
        entity_type=entity["entity_type"],
        display_name=entity.get("display_name") or entity["entity_type"],
        value_type=entity.get("value_type", "string"),
        required_validation=bool(entity.get("required_validation", False)),
        normalization_rule=entity.get("normalization_rule"),
        description=entity.get("description"),
        status="active",
        synonyms=[
            {
                "canonical_value": item["canonical_value"],
                "synonyms": item.get("synonyms", []),
                "code": item.get("code"),
                "is_active": bool(item.get("is_active", True)),
            }
            for item in synonyms
            if item.get("entity_type") == entity["entity_type"]
        ],
    )


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
    entity_links = await list_intent_entity_links(db, project_id, intent_id)
    detail["entity_links"] = entity_links["items"]
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


async def list_entities(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT
                e.entity_type,
                e.display_name,
                e.value_type,
                e.required_validation,
                e.normalization_rule,
                e.description,
                e.status,
                COUNT(s.id) FILTER (WHERE s.is_active = true) AS synonym_count
            FROM graphrag.intent_entities e
            LEFT JOIN graphrag.entity_synonyms s
                ON s.project_id = e.project_id
               AND s.entity_type = e.entity_type
            WHERE e.project_id = :project_id
              AND e.status != 'archived'
            GROUP BY
                e.entity_type,
                e.display_name,
                e.value_type,
                e.required_validation,
                e.normalization_rule,
                e.description,
                e.status
            ORDER BY e.entity_type ASC
            """
        ),
        {"project_id": project_id},
    )
    return {"project_id": project_id, "items": [dict(row._mapping) for row in result.fetchall()]}


async def get_entity_detail(db: AsyncSession, project_id: str, entity_type: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT entity_type, display_name, value_type, required_validation, normalization_rule, description, status
            FROM graphrag.intent_entities
            WHERE project_id = :project_id
              AND entity_type = :entity_type
              AND status != 'archived'
            """
        ),
        {"project_id": project_id, "entity_type": entity_type},
    )
    row = result.fetchone()
    if not row:
        return None
    detail = dict(row._mapping)
    synonyms = await db.execute(
        text(
            """
            SELECT canonical_value, synonyms, code, is_active
            FROM graphrag.entity_synonyms
            WHERE project_id = :project_id
              AND entity_type = :entity_type
            ORDER BY canonical_value ASC
            """
        ),
        {"project_id": project_id, "entity_type": entity_type},
    )
    detail["synonyms"] = [
        {
            **dict(item._mapping),
            "synonyms": _json_array(item._mapping["synonyms"]),
        }
        for item in synonyms.fetchall()
    ]
    return detail


async def save_entity(
    db: AsyncSession,
    project_id: str,
    payload: EntityPayload | EntityUpdatePayload,
    entity_type: str | None = None,
) -> dict[str, Any]:
    resolved_entity_type = entity_type or payload.entity_type
    await db.execute(
        text(
            """
            INSERT INTO graphrag.intent_entities
                (project_id, entity_type, display_name, value_type, required_validation, normalization_rule, description, status, updated_at)
            VALUES
                (:project_id, :entity_type, :display_name, :value_type, :required_validation, :normalization_rule, :description, :status, NOW())
            ON CONFLICT (project_id, entity_type) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                value_type = EXCLUDED.value_type,
                required_validation = EXCLUDED.required_validation,
                normalization_rule = EXCLUDED.normalization_rule,
                description = EXCLUDED.description,
                status = EXCLUDED.status,
                updated_at = NOW()
            """
        ),
        {
            "project_id": project_id,
            "entity_type": resolved_entity_type,
            "display_name": payload.display_name,
            "value_type": payload.value_type,
            "required_validation": payload.required_validation,
            "normalization_rule": payload.normalization_rule,
            "description": payload.description,
            "status": payload.status,
        },
    )

    await db.execute(
        text(
            """
            UPDATE graphrag.entity_synonyms
            SET is_active = false, updated_at = NOW()
            WHERE project_id = :project_id
              AND entity_type = :entity_type
            """
        ),
        {"project_id": project_id, "entity_type": resolved_entity_type},
    )
    for synonym in payload.synonyms:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.entity_synonyms
                    (project_id, entity_type, canonical_value, synonyms, code, is_active, updated_at)
                VALUES
                    (:project_id, :entity_type, :canonical_value, CAST(:synonyms AS jsonb), :code, :is_active, NOW())
                ON CONFLICT (project_id, entity_type, canonical_value) DO UPDATE SET
                    synonyms = EXCLUDED.synonyms,
                    code = EXCLUDED.code,
                    is_active = EXCLUDED.is_active,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "entity_type": resolved_entity_type,
                "canonical_value": synonym.canonical_value,
                "synonyms": _json_dumps(synonym.synonyms),
                "code": synonym.code,
                "is_active": synonym.is_active,
            },
        )

    await db.commit()
    detail = await get_entity_detail(db, project_id, resolved_entity_type)
    return detail or {"entity_type": resolved_entity_type}


async def archive_entity(db: AsyncSession, project_id: str, entity_type: str) -> dict[str, str]:
    await db.execute(
        text(
            """
            UPDATE graphrag.intent_entities
            SET status = 'archived', updated_at = NOW()
            WHERE project_id = :project_id
              AND entity_type = :entity_type
            """
        ),
        {"project_id": project_id, "entity_type": entity_type},
    )
    await db.execute(
        text(
            """
            UPDATE graphrag.entity_synonyms
            SET is_active = false, updated_at = NOW()
            WHERE project_id = :project_id
              AND entity_type = :entity_type
            """
        ),
        {"project_id": project_id, "entity_type": entity_type},
    )
    await db.commit()
    return {"project_id": project_id, "entity_type": entity_type, "status": "archived"}


async def list_intent_entity_links(db: AsyncSession, project_id: str, intent_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT
                l.entity_type,
                e.display_name,
                l.parameter_name,
                l.required,
                l.default_policy,
                l.validation_rule
            FROM graphrag.intent_entity_links l
            LEFT JOIN graphrag.intent_entities e
                ON e.project_id = l.project_id
               AND e.entity_type = l.entity_type
            WHERE l.project_id = :project_id
              AND l.intent_id = :intent_id
            ORDER BY l.required DESC, l.entity_type ASC
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    return {"project_id": project_id, "intent_id": intent_id, "items": [dict(row._mapping) for row in result.fetchall()]}


async def save_intent_entity_links(
    db: AsyncSession,
    project_id: str,
    intent_id: str,
    payload: IntentEntityLinksPayload,
) -> dict[str, Any]:
    await db.execute(
        text("DELETE FROM graphrag.intent_entity_links WHERE project_id = :project_id AND intent_id = :intent_id"),
        {"project_id": project_id, "intent_id": intent_id},
    )
    for link in payload.links:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_entity_links
                    (project_id, intent_id, entity_type, parameter_name, required, default_policy, validation_rule, updated_at)
                VALUES
                    (:project_id, :intent_id, :entity_type, :parameter_name, :required, :default_policy, :validation_rule, NOW())
                ON CONFLICT (project_id, intent_id, entity_type) DO UPDATE SET
                    parameter_name = EXCLUDED.parameter_name,
                    required = EXCLUDED.required,
                    default_policy = EXCLUDED.default_policy,
                    validation_rule = EXCLUDED.validation_rule,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "intent_id": intent_id,
                "entity_type": link.entity_type,
                "parameter_name": link.parameter_name,
                "required": link.required,
                "default_policy": link.default_policy,
                "validation_rule": link.validation_rule,
            },
        )
    await db.commit()
    return await list_intent_entity_links(db, project_id, intent_id)


async def build_pack_draft(db: AsyncSession, project_id: str) -> dict[str, Any]:
    intents = (await list_intents(db, project_id))["items"]
    entities = (await list_entities(db, project_id))["items"]
    intent_records: list[dict[str, Any]] = []
    intent_examples: list[dict[str, Any]] = []
    action_registry: dict[str, dict[str, Any]] = {}
    action_parameters: list[dict[str, Any]] = []
    source_scopes: list[dict[str, Any]] = []

    for item in intents:
        detail = await get_intent_detail(db, project_id, item["intent_id"])
        if not detail:
            continue
        intent_records.append(
            {
                "intent_id": detail["intent_id"],
                "intent_name": detail["intent_name"],
                "description": detail.get("description"),
                "category": detail["category"],
                "action_id": detail.get("action_id"),
                "priority": detail.get("priority", 100),
                "status": detail.get("status", "active"),
            }
        )
        for example in detail.get("examples", []):
            intent_examples.append({"intent_id": detail["intent_id"], "example": example})
        if detail.get("action_id"):
            action_registry[detail["action_id"]] = {
                "action_id": detail["action_id"],
                "action_name": detail["action_id"],
                "action_type": detail["category"].upper(),
                "enabled": detail.get("status") == "active",
            }
        for link in detail.get("entity_links", []):
            action_parameters.append(
                {
                    "intent_id": detail["intent_id"],
                    "action_id": detail.get("action_id"),
                    "parameter_name": link.get("parameter_name"),
                    "entity_type": link["entity_type"],
                    "required": link.get("required", False),
                    "default_policy": link.get("default_policy"),
                    "validation_rule": link.get("validation_rule"),
                }
            )
        if detail.get("source_scope"):
            source_scopes.append({"intent_id": detail["intent_id"], **detail["source_scope"]})

    synonyms: list[dict[str, Any]] = []
    for entity in entities:
        detail = await get_entity_detail(db, project_id, entity["entity_type"])
        if not detail:
            continue
        for synonym in detail.get("synonyms", []):
            synonyms.append({"entity_type": entity["entity_type"], **synonym})

    return {
        "pack_id": f"{project_id}-db-draft",
        "pack_version": "0.1-draft",
        "project_id": project_id,
        "manifest": {
            "pack_id": f"{project_id}-db-draft",
            "pack_version": "0.1-draft",
            "source": "intent_factory_db",
        },
        "nlu": {
            "intents": intent_records,
            "intent_examples": intent_examples,
            "entities": entities,
            "entity_synonyms": synonyms,
        },
        "action": {
            "action_registry": list(action_registry.values()),
            "action_parameters": action_parameters,
        },
        "knowledge": {
            "source_scopes": source_scopes,
        },
        "counts": {
            "intents": len(intent_records),
            "intent_examples": len(intent_examples),
            "entities": len(entities),
            "entity_synonyms": len(synonyms),
            "actions": len(action_registry),
            "action_parameters": len(action_parameters),
            "source_scopes": len(source_scopes),
        },
    }


def _examples_by_intent(pack: Any) -> dict[str, list[str]]:
    examples_by_intent: dict[str, list[str]] = {}
    for example in pack.nlu["intent_examples"]:
        intent_id = example["intent_id"]
        example_text = example.get("example") or example.get("text") or example.get("example_text")
        if example_text:
            examples_by_intent.setdefault(intent_id, []).append(example_text)
    return examples_by_intent


def _parameters_by_action(pack: Any) -> dict[str, list[dict[str, Any]]]:
    parameters_by_action: dict[str, list[dict[str, Any]]] = {}
    for parameter in pack.action.get("action_parameters", []):
        action_id = parameter.get("action_id")
        if action_id:
            parameters_by_action.setdefault(action_id, []).append(parameter)
    return parameters_by_action


async def import_pack_to_db(
    db: AsyncSession,
    project_id: str,
    pack: Any,
    overwrite: bool = False,
) -> dict[str, Any]:
    imported = 0
    skipped = 0
    imported_entities = 0
    examples_by_intent = _examples_by_intent(pack)
    parameters_by_action = _parameters_by_action(pack)

    for entity in pack.nlu.get("entities", []):
        payload = _pack_entity_to_payload(entity, pack.nlu.get("entity_synonyms", []))
        await save_entity(db, project_id, payload)
        imported_entities += 1

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
        parameter_links = [
            {
                "entity_type": item["entity_type"],
                "parameter_name": item.get("parameter_name"),
                "required": bool(item.get("required", False)),
                "default_policy": item.get("default_policy"),
                "validation_rule": item.get("validation_rule"),
            }
            for item in parameters_by_action.get(record["action_id"], [])
            if item.get("entity_type")
        ]
        if parameter_links:
            await save_intent_entity_links(
                db,
                project_id,
                record["intent_id"],
                IntentEntityLinksPayload(links=parameter_links),
            )
        imported += 1

    return {
        "project_id": project_id,
        "pack_id": pack.manifest.get("pack_id") or pack.profile.get("pack_id"),
        "imported": imported,
        "imported_entities": imported_entities,
        "skipped": skipped,
    }
