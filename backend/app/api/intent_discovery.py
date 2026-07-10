from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id
from app.core.intent_factory_schema import ensure_intent_factory_schema
from app.db.session import get_db
from app.schemas.intent_discovery import CandidateStatusPayload, DiscoveryRunRequest
from app.services.intent_discovery_service import (
    AutoDiscoveryService,
    build_approved_candidate_apply_plan,
    build_validation_question_payloads_from_apply_plan,
    default_candidate_store,
    model_to_dict,
)
from app.services.intent_factory_service import save_action, save_entity, save_faq, save_intent
from app.services.pack_validation_service import save_validation_question


router = APIRouter()


async def _load_project_sources(db: AsyncSession, project_id: str) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            """
            SELECT
                s.id,
                s.file_name AS filename,
                s.description,
                s.status,
                COALESCE(c.chunk_count, 0) AS chunk_count,
                COALESCE(c.content, '') AS content
            FROM graphrag.graphrag_sources s
            LEFT JOIN (
                SELECT
                    source_id,
                    COUNT(*) AS chunk_count,
                    LEFT(STRING_AGG(content, ' ' ORDER BY chunk_index), 20000) AS content
                FROM graphrag.graphrag_chunks
                GROUP BY source_id
            ) c ON c.source_id = s.id
            WHERE s.category = :project_id
              AND COALESCE(s.status, '') != 'placeholder'
            ORDER BY s.created_at DESC
            LIMIT 20
            """
        ),
        {"project_id": project_id},
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def _load_project_faqs(db: AsyncSession, project_id: str) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            """
            SELECT faq_id, question, answer, category, tags, source_id, action_id, status
            FROM graphrag.intent_faqs
            WHERE project_id = :project_id
              AND status != 'archived'
            ORDER BY updated_at DESC
            LIMIT 20
            """
        ),
        {"project_id": project_id},
    )
    return [dict(row._mapping) for row in result.fetchall()]


@router.post("/projects/{project_id}/runs")
async def api_create_discovery_run(
    project_id: str,
    payload: DiscoveryRunRequest | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    payload = payload or DiscoveryRunRequest()
    if payload.scope not in {"all", "new"}:
        raise HTTPException(status_code=400, detail="지원하지 않는 Auto Discovery 범위입니다.")

    sources = await _load_project_sources(db, project_id)
    faqs = await _load_project_faqs(db, project_id)
    if not sources and not faqs:
        raise HTTPException(status_code=400, detail="Auto Discovery를 실행할 Source 또는 FAQ가 없습니다.")

    store = default_candidate_store()
    if payload.scope == "new":
        analyzed_source_ids = store.analyzed_source_ids(project_id)
        sources = [source for source in sources if str(source.get("id") or "") not in analyzed_source_ids]
        faqs = []
        if not sources:
            raise HTTPException(status_code=400, detail="신규 분석 대상 Source가 없습니다.")

    run = await AutoDiscoveryService().generate(project_id, sources, faqs)
    saved = store.save_incremental_run(run) if payload.scope == "new" else store.save_run(run)
    return model_to_dict(saved)


@router.get("/projects/{project_id}/runs")
async def api_list_discovery_runs(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    runs = default_candidate_store().list_runs(project_id)
    return {"project_id": project_id, "items": [model_to_dict(run) for run in runs]}


@router.get("/projects/{project_id}/candidates")
async def api_list_discovery_candidates(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    store = default_candidate_store()
    candidates = store.list_candidates(project_id)
    return {
        "project_id": project_id,
        "summary": store.summary(project_id),
        "items": [model_to_dict(candidate) for candidate in candidates],
    }


@router.patch("/projects/{project_id}/candidates/{candidate_id}")
async def api_update_discovery_candidate_status(
    project_id: str,
    candidate_id: str,
    payload: CandidateStatusPayload,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    try:
        candidate = default_candidate_store().update_candidate_status(project_id, candidate_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except KeyError:
        raise HTTPException(status_code=404, detail="후보를 찾을 수 없습니다.")
    return model_to_dict(candidate)


@router.post("/projects/{project_id}/apply-approved")
async def api_apply_approved_discovery_candidates(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    store = default_candidate_store()
    candidates = store.list_candidates(project_id)
    plan = build_approved_candidate_apply_plan(project_id, candidates)
    if plan["approved"] == 0:
        raise HTTPException(status_code=400, detail="적용할 승인 후보가 없습니다.")

    applied_candidate_ids = [candidate.candidate_id for candidate in candidates if candidate.status == "approved"]
    for action in plan["actions"]:
        await save_action(db, project_id, action)
    for entity in plan["entities"]:
        await save_entity(db, project_id, entity)
    for faq in plan["faqs"]:
        await save_faq(db, project_id, faq)
    for intent in plan["intents"]:
        await save_intent(db, project_id, intent)
    validation_questions = build_validation_question_payloads_from_apply_plan(project_id, plan)
    for question in validation_questions:
        await save_validation_question(db, project_id, question)

    await db.commit()

    for candidate_id in applied_candidate_ids:
        store.update_candidate_status(project_id, candidate_id, "applied")

    return {
        "project_id": project_id,
        "applied": {
            "actions": len(plan["actions"]),
            "intents": len(plan["intents"]),
            "entities": len(plan["entities"]),
            "faqs": len(plan["faqs"]),
            "source_scopes": len(plan["source_scopes"]),
            "validation_questions": len(validation_questions),
        },
        "candidate_count": len(applied_candidate_ids),
        "summary": store.summary(project_id),
    }


@router.get("/projects/{project_id}/summary")
async def api_get_discovery_summary(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    return {"project_id": project_id, "summary": default_candidate_store().summary(project_id)}
