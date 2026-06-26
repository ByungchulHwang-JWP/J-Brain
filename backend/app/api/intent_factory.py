from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.core.intent_factory_schema import ensure_intent_factory_schema
from app.db.session import get_db
from app.schemas.intent_factory import (
    EntityPayload,
    EntityUpdatePayload,
    ImportPackPayload,
    IntentEntityLinksPayload,
    IntentPayload,
    IntentUpdatePayload,
)
from app.services.intent_factory_service import (
    archive_intent,
    archive_entity,
    build_pack_draft,
    get_entity_detail,
    get_intent_detail,
    import_pack_to_db,
    list_entities,
    list_intent_entity_links,
    list_intents,
    save_entity,
    save_intent,
    save_intent_entity_links,
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


@router.get("/projects/{project_id}/entities")
async def api_list_entities(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_entities(db, project_id)


@router.get("/projects/{project_id}/entities/{entity_type}")
async def api_get_entity(
    project_id: str,
    entity_type: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    detail = await get_entity_detail(db, project_id, entity_type)
    if not detail:
        raise HTTPException(status_code=404, detail="Entity를 찾을 수 없습니다.")
    return detail


@router.post("/projects/{project_id}/entities")
async def api_create_entity(
    project_id: str,
    payload: EntityPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_entity(db, project_id, payload)


@router.put("/projects/{project_id}/entities/{entity_type}")
async def api_update_entity(
    project_id: str,
    entity_type: str,
    payload: EntityUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_entity(db, project_id, payload, entity_type)


@router.delete("/projects/{project_id}/entities/{entity_type}")
async def api_archive_entity(
    project_id: str,
    entity_type: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_entity(db, project_id, entity_type)


@router.get("/projects/{project_id}/intents/{intent_id}/entities")
async def api_list_intent_entities(
    project_id: str,
    intent_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_intent_entity_links(db, project_id, intent_id)


@router.put("/projects/{project_id}/intents/{intent_id}/entities")
async def api_update_intent_entities(
    project_id: str,
    intent_id: str,
    payload: IntentEntityLinksPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_intent_entity_links(db, project_id, intent_id, payload)


@router.get("/projects/{project_id}/pack-draft")
async def api_get_pack_draft(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await build_pack_draft(db, project_id)
