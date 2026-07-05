from __future__ import annotations

import json
import shutil
import zipfile
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.services.pack_export_service import get_pack_export


PACK_STORE_ROOT = Path(__file__).resolve().parents[2] / "app_data" / "runtime_pack_store"


def _pack_dir_name(pack_id: str, pack_version: str) -> str:
    return f"{pack_id}-v{pack_version}"


def _safe_extract_zip(zip_path: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            target = (destination / member.filename).resolve()
            if not str(target).startswith(str(destination.resolve())):
                raise ValueError(f"Unsafe ZIP member path: {member.filename}")
        archive.extractall(destination)


def _find_pack_dir(extract_root: Path, pack_id: str, pack_version: str) -> Path:
    expected = extract_root / _pack_dir_name(pack_id, pack_version)
    if expected.exists():
        return expected

    manifest_candidates = list(extract_root.glob("*/manifest/pack_manifest.json"))
    for manifest_path in manifest_candidates:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        if manifest.get("pack_id") == pack_id and manifest.get("pack_version") == pack_version:
            return manifest_path.parents[1]

    raise FileNotFoundError(f"Pack directory not found in ZIP: {pack_id} v{pack_version}")


def import_zip_to_store(
    *,
    zip_path: Path,
    pack_id: str,
    pack_version: str,
    store_root: Path = PACK_STORE_ROOT,
) -> dict[str, Any]:
    if not zip_path.exists() or not zip_path.is_file():
        raise FileNotFoundError(f"Pack ZIP not found: {zip_path}")

    temp_root = store_root / "_tmp" / uuid4().hex
    final_dir = store_root / _pack_dir_name(pack_id, pack_version)
    if temp_root.exists():
        shutil.rmtree(temp_root)
    if final_dir.exists():
        shutil.rmtree(final_dir)

    try:
        _safe_extract_zip(zip_path, temp_root)
        unpacked_pack_dir = _find_pack_dir(temp_root, pack_id, pack_version)
        final_dir.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(unpacked_pack_dir), str(final_dir))
    finally:
        if temp_root.exists():
            shutil.rmtree(temp_root)

    loader = IntentPackLoader(final_dir.parent)
    pack = loader.load_pack(pack_id, pack_version)
    validation = loader.validate_pack(pack)
    manifest = pack.manifest

    return {
        "pack_id": pack_id,
        "pack_version": pack_version,
        "store_path": str(final_dir),
        "manifest": manifest,
        "validation": validation,
        "status": "validated" if validation["valid"] else "invalid",
    }


async def _write_audit_log(
    db: AsyncSession,
    *,
    project_id: str,
    operation: str,
    status: str,
    pack_id: str | None = None,
    pack_version: str | None = None,
    message: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await db.execute(
        text(
            """
            INSERT INTO graphrag.pack_operation_audit_logs
                (project_id, operation, pack_id, pack_version, status, message, metadata)
            VALUES
                (:project_id, :operation, :pack_id, :pack_version, :status, :message, CAST(:metadata AS jsonb))
            """
        ),
        {
            "project_id": project_id,
            "operation": operation,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "status": status,
            "message": message,
            "metadata": json.dumps(metadata or {}, ensure_ascii=False),
        },
    )


async def import_exported_pack(
    db: AsyncSession,
    project_id: str,
    export_id: str,
) -> dict[str, Any]:
    export = await get_pack_export(db, project_id, export_id)
    if not export:
        raise FileNotFoundError(f"Pack Export not found: {export_id}")

    imported = import_zip_to_store(
        zip_path=Path(export["file_path"]),
        pack_id=export["pack_id"],
        pack_version=export["pack_version"],
    )
    import_id = f"IMP-{uuid4().hex[:12]}"

    await db.execute(
        text(
            """
            INSERT INTO graphrag.runtime_pack_store
                (import_id, project_id, pack_id, pack_version, status, source_export_id,
                 zip_path, store_path, manifest, validation_result)
            VALUES
                (:import_id, :project_id, :pack_id, :pack_version, :status, :source_export_id,
                 :zip_path, :store_path, CAST(:manifest AS jsonb), CAST(:validation_result AS jsonb))
            ON CONFLICT (project_id, pack_id, pack_version) DO UPDATE SET
                import_id = EXCLUDED.import_id,
                status = EXCLUDED.status,
                source_export_id = EXCLUDED.source_export_id,
                zip_path = EXCLUDED.zip_path,
                store_path = EXCLUDED.store_path,
                manifest = EXCLUDED.manifest,
                validation_result = EXCLUDED.validation_result,
                imported_at = NOW()
            """
        ),
        {
            "import_id": import_id,
            "project_id": project_id,
            "pack_id": imported["pack_id"],
            "pack_version": imported["pack_version"],
            "status": imported["status"],
            "source_export_id": export_id,
            "zip_path": export["file_path"],
            "store_path": imported["store_path"],
            "manifest": json.dumps(imported["manifest"], ensure_ascii=False),
            "validation_result": json.dumps(imported["validation"], ensure_ascii=False),
        },
    )
    await _write_audit_log(
        db,
        project_id=project_id,
        operation="IMPORT",
        pack_id=imported["pack_id"],
        pack_version=imported["pack_version"],
        status=imported["status"],
        message=f"Pack imported from export {export_id}",
        metadata={"export_id": export_id, "import_id": import_id},
    )
    await db.commit()

    return {
        "import_id": import_id,
        "project_id": project_id,
        "source_export_id": export_id,
        **imported,
    }


async def list_runtime_packs(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT import_id, project_id, pack_id, pack_version, status, source_export_id,
                   zip_path, store_path, manifest, validation_result,
                   approved_by, approved_at, rejected_reason, imported_at
            FROM graphrag.runtime_pack_store
            WHERE project_id = :project_id
            ORDER BY imported_at DESC
            """
        ),
        {"project_id": project_id},
    )
    return {"project_id": project_id, "items": [dict(row._mapping) for row in result.fetchall()]}


async def approve_runtime_pack(
    db: AsyncSession,
    project_id: str,
    pack_id: str,
    pack_version: str,
    approved_by: str | None = None,
) -> dict[str, Any]:
    pack = await _get_runtime_pack_row(db, project_id, pack_id, pack_version)
    if not pack:
        raise FileNotFoundError(f"Runtime Pack not found: {pack_id} v{pack_version}")
    if pack["status"] not in {"validated", "approved", "active"}:
        raise ValueError(f"검증 완료 Pack만 승인할 수 있습니다: {pack_id} v{pack_version}")

    await db.execute(
        text(
            """
            UPDATE graphrag.runtime_pack_store
            SET status = 'approved',
                approved_by = :approved_by,
                approved_at = NOW(),
                rejected_reason = NULL
            WHERE project_id = :project_id
              AND pack_id = :pack_id
              AND pack_version = :pack_version
            """
        ),
        {
            "project_id": project_id,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "approved_by": approved_by,
        },
    )
    await _write_audit_log(
        db,
        project_id=project_id,
        operation="APPROVE",
        pack_id=pack_id,
        pack_version=pack_version,
        status="approved",
        message="Pack approved",
        metadata={"approved_by": approved_by},
    )
    await db.commit()
    return await _get_runtime_pack_row(db, project_id, pack_id, pack_version) or {}


async def reject_runtime_pack(
    db: AsyncSession,
    project_id: str,
    pack_id: str,
    pack_version: str,
    reason: str | None = None,
    rejected_by: str | None = None,
) -> dict[str, Any]:
    pack = await _get_runtime_pack_row(db, project_id, pack_id, pack_version)
    if not pack:
        raise FileNotFoundError(f"Runtime Pack not found: {pack_id} v{pack_version}")
    if pack["status"] == "active":
        raise ValueError("Active Pack은 반려할 수 없습니다. 먼저 다른 Pack으로 전환하거나 Rollback해 주세요.")

    await db.execute(
        text(
            """
            UPDATE graphrag.runtime_pack_store
            SET status = 'rejected',
                rejected_reason = :reason
            WHERE project_id = :project_id
              AND pack_id = :pack_id
              AND pack_version = :pack_version
            """
        ),
        {"project_id": project_id, "pack_id": pack_id, "pack_version": pack_version, "reason": reason},
    )
    await _write_audit_log(
        db,
        project_id=project_id,
        operation="REJECT",
        pack_id=pack_id,
        pack_version=pack_version,
        status="rejected",
        message=reason or "Pack rejected",
        metadata={"rejected_by": rejected_by},
    )
    await db.commit()
    return await _get_runtime_pack_row(db, project_id, pack_id, pack_version) or {}


async def _get_runtime_pack_row(
    db: AsyncSession,
    project_id: str,
    pack_id: str,
    pack_version: str,
) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT import_id, project_id, pack_id, pack_version, status, source_export_id,
                   zip_path, store_path, manifest, validation_result,
                   approved_by, approved_at, rejected_reason, imported_at
            FROM graphrag.runtime_pack_store
            WHERE project_id = :project_id
              AND pack_id = :pack_id
              AND pack_version = :pack_version
            """
        ),
        {"project_id": project_id, "pack_id": pack_id, "pack_version": pack_version},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def get_active_pack(db: AsyncSession, project_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT project_id, pack_id, pack_version, previous_pack_id, previous_pack_version,
                   activated_at, activated_by
            FROM graphrag.active_runtime_packs
            WHERE project_id = :project_id
            """
        ),
        {"project_id": project_id},
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def activate_runtime_pack(
    db: AsyncSession,
    project_id: str,
    pack_id: str,
    pack_version: str,
    activated_by: str | None = None,
) -> dict[str, Any]:
    pack_result = await db.execute(
        text(
            """
            SELECT pack_id, pack_version, status
            FROM graphrag.runtime_pack_store
            WHERE project_id = :project_id
              AND pack_id = :pack_id
              AND pack_version = :pack_version
            """
        ),
        {"project_id": project_id, "pack_id": pack_id, "pack_version": pack_version},
    )
    pack_row = pack_result.fetchone()
    if not pack_row:
        raise FileNotFoundError(f"Imported Pack not found: {pack_id} v{pack_version}")
    if pack_row.status != "approved":
        raise ValueError(f"승인된 Pack만 Active 전환할 수 있습니다: {pack_id} v{pack_version}")

    current = await get_active_pack(db, project_id)
    previous_pack_id = current.get("pack_id") if current else None
    previous_pack_version = current.get("pack_version") if current else None

    await db.execute(
        text(
            """
            INSERT INTO graphrag.active_runtime_packs
                (project_id, pack_id, pack_version, previous_pack_id, previous_pack_version, activated_by)
            VALUES
                (:project_id, :pack_id, :pack_version, :previous_pack_id, :previous_pack_version, :activated_by)
            ON CONFLICT (project_id) DO UPDATE SET
                pack_id = EXCLUDED.pack_id,
                pack_version = EXCLUDED.pack_version,
                previous_pack_id = EXCLUDED.previous_pack_id,
                previous_pack_version = EXCLUDED.previous_pack_version,
                activated_by = EXCLUDED.activated_by,
                activated_at = NOW()
            """
        ),
        {
            "project_id": project_id,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "previous_pack_id": previous_pack_id,
            "previous_pack_version": previous_pack_version,
            "activated_by": activated_by,
        },
    )
    if previous_pack_id and previous_pack_version:
        await db.execute(
            text(
                """
                UPDATE graphrag.runtime_pack_store
                SET status = 'approved'
                WHERE project_id = :project_id
                  AND pack_id = :previous_pack_id
                  AND pack_version = :previous_pack_version
                """
            ),
            {
                "project_id": project_id,
                "previous_pack_id": previous_pack_id,
                "previous_pack_version": previous_pack_version,
            },
        )
    await db.execute(
        text(
            """
            UPDATE graphrag.runtime_pack_store
            SET status = 'active'
            WHERE project_id = :project_id
              AND pack_id = :pack_id
              AND pack_version = :pack_version
            """
        ),
        {"project_id": project_id, "pack_id": pack_id, "pack_version": pack_version},
    )
    await _write_audit_log(
        db,
        project_id=project_id,
        operation="ACTIVATE",
        pack_id=pack_id,
        pack_version=pack_version,
        status="activated",
        metadata={"previous_pack_id": previous_pack_id, "previous_pack_version": previous_pack_version},
    )
    await db.commit()
    return await get_active_pack(db, project_id) or {}


async def rollback_runtime_pack(
    db: AsyncSession,
    project_id: str,
    activated_by: str | None = None,
) -> dict[str, Any]:
    current = await get_active_pack(db, project_id)
    if not current or not current.get("previous_pack_id") or not current.get("previous_pack_version"):
        raise ValueError("Rollback할 이전 Pack 정보가 없습니다.")

    current_pack_id = current["pack_id"]
    current_pack_version = current["pack_version"]
    rollback_pack_id = current["previous_pack_id"]
    rollback_pack_version = current["previous_pack_version"]

    await db.execute(
        text(
            """
            UPDATE graphrag.active_runtime_packs
            SET pack_id = :rollback_pack_id,
                pack_version = :rollback_pack_version,
                previous_pack_id = :current_pack_id,
                previous_pack_version = :current_pack_version,
                activated_by = :activated_by,
                activated_at = NOW()
            WHERE project_id = :project_id
            """
        ),
        {
            "project_id": project_id,
            "rollback_pack_id": rollback_pack_id,
            "rollback_pack_version": rollback_pack_version,
            "current_pack_id": current_pack_id,
            "current_pack_version": current_pack_version,
            "activated_by": activated_by,
        },
    )
    await db.execute(
        text(
            """
            UPDATE graphrag.runtime_pack_store
            SET status = CASE
                WHEN pack_id = :rollback_pack_id AND pack_version = :rollback_pack_version THEN 'active'
                WHEN pack_id = :current_pack_id AND pack_version = :current_pack_version THEN 'approved'
                ELSE status
            END
            WHERE project_id = :project_id
              AND (
                (pack_id = :rollback_pack_id AND pack_version = :rollback_pack_version)
                OR (pack_id = :current_pack_id AND pack_version = :current_pack_version)
              )
            """
        ),
        {
            "project_id": project_id,
            "rollback_pack_id": rollback_pack_id,
            "rollback_pack_version": rollback_pack_version,
            "current_pack_id": current_pack_id,
            "current_pack_version": current_pack_version,
        },
    )
    await _write_audit_log(
        db,
        project_id=project_id,
        operation="ROLLBACK",
        pack_id=rollback_pack_id,
        pack_version=rollback_pack_version,
        status="activated",
        metadata={"from_pack_id": current_pack_id, "from_pack_version": current_pack_version},
    )
    await db.commit()
    return await get_active_pack(db, project_id) or {}


async def list_pack_audit_logs(db: AsyncSession, project_id: str, limit: int = 30) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT project_id, operation, pack_id, pack_version, status, message, metadata, created_at
            FROM graphrag.pack_operation_audit_logs
            WHERE project_id = :project_id
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        {"project_id": project_id, "limit": limit},
    )
    return {"project_id": project_id, "items": [dict(row._mapping) for row in result.fetchall()]}
