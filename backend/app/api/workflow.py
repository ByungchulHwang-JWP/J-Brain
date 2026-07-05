import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.intent_factory_schema import ensure_intent_factory_schema
from app.db.session import get_db
from app.schemas.workflow import WorkflowDraftPackPayload, WorkflowStageEventPayload
from app.services.intent_factory_service import build_pack_draft
from app.services.workflow_service import (
    WorkflowProjectNotFoundError,
    get_workflow_summary,
    list_workflow_projects,
    workflow_project_exists,
)


router = APIRouter()


@router.get("/projects")
async def api_list_workflow_projects(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    return await list_workflow_projects(db)


@router.get("/projects/{project_id}/summary")
async def api_get_workflow_summary(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    await ensure_intent_factory_schema(db)
    try:
        return await get_workflow_summary(db, project_id)
    except WorkflowProjectNotFoundError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다. 먼저 프로젝트를 생성해 주세요.")


@router.get("/projects/{project_id}/stages")
async def api_get_workflow_stages(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    await ensure_intent_factory_schema(db)
    try:
        summary = await get_workflow_summary(db, project_id)
    except WorkflowProjectNotFoundError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다. 먼저 프로젝트를 생성해 주세요.")
    return {"items": summary["stages"]}


@router.get("/projects/{project_id}/next-actions")
async def api_get_workflow_next_actions(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    await ensure_intent_factory_schema(db)
    try:
        summary = await get_workflow_summary(db, project_id)
    except WorkflowProjectNotFoundError:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다. 먼저 프로젝트를 생성해 주세요.")
    actions = []
    for stage in summary["stages"]:
        actions.extend(stage.get("next_actions", []))
    return {"items": actions}


@router.post("/projects/{project_id}/draft-packs")
async def api_create_workflow_draft_pack(
    project_id: str,
    payload: WorkflowDraftPackPayload,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    await ensure_intent_factory_schema(db)
    if not await workflow_project_exists(db, project_id):
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다. 먼저 프로젝트를 생성해 주세요.")
    draft = await build_pack_draft(db, project_id)
    return {
        "project_id": project_id,
        "pack_version": payload.pack_version or "draft",
        "reason": payload.reason,
        "draft": draft,
    }


@router.post("/projects/{project_id}/stage-events")
async def api_create_workflow_stage_event(
    project_id: str,
    payload: WorkflowStageEventPayload,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Any:
    await ensure_intent_factory_schema(db)
    if not await workflow_project_exists(db, project_id):
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다. 먼저 프로젝트를 생성해 주세요.")
    await db.execute(
        text(
            """
            INSERT INTO graphrag.pack_operation_audit_logs
                (project_id, operation, pack_id, pack_version, status, message, metadata)
            VALUES
                (:project_id, 'WORKFLOW_STAGE_EVENT', NULL, NULL, 'recorded', :message, CAST(:metadata AS jsonb))
            """
        ),
        {
            "project_id": project_id,
            "message": "Workflow stage %s %s" % (payload.stage, payload.event_type),
            "metadata": json.dumps(
                {
                    "actor": user_id,
                    "stage": payload.stage,
                    "event_type": payload.event_type,
                    "memo": payload.memo,
                    "metadata": payload.metadata,
                },
                ensure_ascii=False,
            ),
        },
    )
    await db.commit()
    return {
        "project_id": project_id,
        "stage": payload.stage,
        "event_type": payload.event_type,
        "memo": payload.memo,
        "metadata": payload.metadata,
        "recorded": True,
    }
