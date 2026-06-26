from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.core.intent_factory_schema import ensure_intent_factory_schema
from app.db.session import get_db
from app.schemas.intent_factory import ImportPackPayload, IntentPayload, IntentUpdatePayload
from app.services.intent_factory_service import (
    archive_intent,
    get_intent_detail,
    import_pack_to_db,
    list_intents,
    save_intent,
)


router = APIRouter()


def _default_pack_root() -> Path:
    return (
        Path(__file__).resolve().parents[3]
        / "01.docs"
        / "01.산출물_JBrain"
        / "200.프로젝트실행"
        / "250.구현"
        / "intent-packs"
    )


@router.get("/projects/{project_id}/intents")
async def api_list_intents(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_intents(db, project_id)


@router.get("/projects/{project_id}/intents/{intent_id}")
async def api_get_intent(
    project_id: str,
    intent_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    detail = await get_intent_detail(db, project_id, intent_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Intent를 찾을 수 없습니다.")
    return detail


@router.post("/projects/{project_id}/intents")
async def api_create_intent(
    project_id: str,
    payload: IntentPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_intent(db, project_id, payload)


@router.put("/projects/{project_id}/intents/{intent_id}")
async def api_update_intent(
    project_id: str,
    intent_id: str,
    payload: IntentUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_intent(db, project_id, payload, intent_id)


@router.delete("/projects/{project_id}/intents/{intent_id}")
async def api_archive_intent(
    project_id: str,
    intent_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_intent(db, project_id, intent_id)


@router.post("/projects/{project_id}/import-pack")
async def api_import_pack(
    project_id: str,
    payload: ImportPackPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    loader = IntentPackLoader(_default_pack_root())
    pack = loader.load_pack(payload.pack_id, payload.pack_version)
    return await import_pack_to_db(db, project_id, pack, payload.overwrite)
