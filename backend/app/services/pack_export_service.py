from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.services.intent_factory_service import build_pack_draft


PACK_EXPORT_ROOT = Path(__file__).resolve().parents[2] / "app_data" / "pack_exports"


def _json_dump(file_path: Path, payload: Any) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _required_files() -> list[str]:
    return [
        file_name
        for files in IntentPackLoader.REQUIRED_FILES.values()
        for file_name in files
    ]


def _pack_dir_name(pack_id: str, pack_version: str) -> str:
    return f"{pack_id}-v{pack_version}"


def _default_confidence_policy() -> dict[str, Any]:
    return {
        "labels": [
            {"label": "High", "min_score": 0.85},
            {"label": "Medium", "min_score": 0.65},
            {"label": "Low", "min_score": 0.45},
            {"label": "Very Low", "min_score": 0.0},
        ],
        "default_action": "fallback",
    }


def _build_pack_files(
    *,
    project_id: str,
    pack_id: str,
    pack_version: str,
    draft: dict[str, Any],
) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    required_files = _required_files()

    manifest = {
        "pack_id": pack_id,
        "pack_version": pack_version,
        "project_id": project_id,
        "source": "intent_factory_db",
        "created_at": now,
        "files": required_files,
    }
    profile = {
        "pack_id": pack_id,
        "pack_version": pack_version,
        "service_id": project_id,
        "service_name": project_id,
        "target_environment": "closed_network",
        "runtime_mode": "local_pack",
    }

    actions = draft.get("action", {})
    knowledge = draft.get("knowledge", {})

    return {
        "manifest/pack_manifest.json": manifest,
        "profile/service_profile.json": profile,
        "nlu/intents.json": draft.get("nlu", {}).get("intents", []),
        "nlu/intent_examples.json": draft.get("nlu", {}).get("intent_examples", []),
        "nlu/entities.json": draft.get("nlu", {}).get("entities", []),
        "nlu/entity_synonyms.json": draft.get("nlu", {}).get("entity_synonyms", []),
        "nlu/confidence_policy.json": _default_confidence_policy(),
        "action/action_registry.json": actions.get("action_registry", []),
        "action/action_parameters.json": actions.get("action_parameters", []),
        "action/api_mappings.json": actions.get("api_mappings", []),
        "action/sql_templates.json": actions.get("sql_templates", []),
        "action/screen_routes.json": actions.get("screen_routes", []),
        "knowledge/faqs.json": knowledge.get("faqs", []),
        "knowledge/approved_documents.json": [],
        "knowledge/metadata_policy.json": {
            "source_scopes": knowledge.get("source_scopes", []),
            "data_residency": "customer_internal_network",
            "external_transfer": "pack_metadata_only",
        },
        "templates/response_templates.json": {
            "default": "{answer}",
            "fallback": "질문을 처리할 수 없습니다. 관리자에게 문의해 주세요.",
        },
        "templates/card_templates.json": {
            "navigation_card": {},
            "document_card": {},
            "query_card": {},
            "guide_card": {},
            "fallback_card": {},
        },
        "templates/fallback_templates.json": {
            "low_confidence": "질문 의도를 명확히 판단하지 못했습니다.",
            "missing_entity": "필수 조건을 추가로 입력해 주세요.",
        },
        "validation/validation_questions.json": [],
        "validation/expected_results.json": [],
        "validation/acceptance_criteria.json": {
            "intent_top1_accuracy": 0.8,
            "intent_top3_accuracy": 0.9,
            "action_routing_success_rate": 0.95,
        },
    }


def write_pack_directory(
    *,
    project_id: str,
    pack_id: str,
    pack_version: str,
    draft: dict[str, Any],
    output_root: Path = PACK_EXPORT_ROOT,
) -> Path:
    pack_dir = output_root / _pack_dir_name(pack_id, pack_version)
    if pack_dir.exists():
        shutil.rmtree(pack_dir)
    pack_dir.mkdir(parents=True, exist_ok=True)

    for file_name, payload in _build_pack_files(
        project_id=project_id,
        pack_id=pack_id,
        pack_version=pack_version,
        draft=draft,
    ).items():
        _json_dump(pack_dir / file_name, payload)

    return pack_dir


def make_pack_zip(pack_dir: Path) -> Path:
    archive_base = pack_dir.with_suffix("")
    zip_path = Path(shutil.make_archive(str(archive_base), "zip", pack_dir.parent, pack_dir.name))
    return zip_path


def validate_exported_pack(pack_dir: Path, pack_id: str, pack_version: str) -> dict[str, Any]:
    loader = IntentPackLoader(pack_dir.parent)
    pack = loader.load_pack(pack_id, pack_version)
    return loader.validate_pack(pack)


async def create_pack_export(
    db: AsyncSession,
    project_id: str,
    pack_id: str | None = None,
    pack_version: str | None = None,
) -> dict[str, Any]:
    draft = await build_pack_draft(db, project_id)
    resolved_pack_id = pack_id or f"{project_id}-intent-pack"
    resolved_pack_version = pack_version or "0.1.0"

    pack_dir = write_pack_directory(
        project_id=project_id,
        pack_id=resolved_pack_id,
        pack_version=resolved_pack_version,
        draft=draft,
    )
    validation = validate_exported_pack(pack_dir, resolved_pack_id, resolved_pack_version)
    zip_path = make_pack_zip(pack_dir)
    status = "validated" if validation["valid"] else "invalid"
    export_id = f"EXP-{uuid4().hex[:12]}"
    manifest = json.loads((pack_dir / "manifest" / "pack_manifest.json").read_text(encoding="utf-8"))

    await db.execute(
        text(
            """
            INSERT INTO graphrag.intent_pack_exports
                (export_id, project_id, pack_id, pack_version, status, file_path, manifest, validation_result, counts)
            VALUES
                (:export_id, :project_id, :pack_id, :pack_version, :status, :file_path,
                 CAST(:manifest AS jsonb), CAST(:validation_result AS jsonb), CAST(:counts AS jsonb))
            """
        ),
        {
            "export_id": export_id,
            "project_id": project_id,
            "pack_id": resolved_pack_id,
            "pack_version": resolved_pack_version,
            "status": status,
            "file_path": str(zip_path),
            "manifest": json.dumps(manifest, ensure_ascii=False),
            "validation_result": json.dumps(validation, ensure_ascii=False),
            "counts": json.dumps(draft.get("counts", {}), ensure_ascii=False),
        },
    )
    await db.commit()

    return {
        "export_id": export_id,
        "project_id": project_id,
        "pack_id": resolved_pack_id,
        "pack_version": resolved_pack_version,
        "status": status,
        "zip_path": str(zip_path),
        "download_url": f"/api/v1/intent-factory/projects/{project_id}/pack-exports/{export_id}/download",
        "validation": validation,
        "counts": draft.get("counts", {}),
    }


async def list_pack_exports(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT export_id, project_id, pack_id, pack_version, status, file_path,
                   manifest, validation_result, counts, created_at
            FROM graphrag.intent_pack_exports
            WHERE project_id = :project_id
            ORDER BY created_at DESC
            """
        ),
        {"project_id": project_id},
    )
    return {"project_id": project_id, "items": [dict(row._mapping) for row in result.fetchall()]}


async def get_pack_export(db: AsyncSession, project_id: str, export_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT export_id, project_id, pack_id, pack_version, status, file_path,
                   manifest, validation_result, counts, created_at
            FROM graphrag.intent_pack_exports
            WHERE project_id = :project_id AND export_id = :export_id
            """
        ),
        {"project_id": project_id, "export_id": export_id},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None
