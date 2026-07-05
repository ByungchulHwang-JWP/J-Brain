from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.unanswered_logger import UnansweredLogger, default_unanswered_log_path
from app.core.intent_factory_schema import ensure_intent_factory_schema
from app.db.session import get_db
from app.schemas.intent_factory import (
    ActionPayload,
    ActionUpdatePayload,
    EntityPayload,
    EntityUpdatePayload,
    FaqCandidatePayload,
    FaqCandidateUpdatePayload,
    FaqPayload,
    FaqUpdatePayload,
    ImportPackPayload,
    IntentEntityLinksPayload,
    IntentPayload,
    IntentUpdatePayload,
    PackActivatePayload,
    PackApprovalPayload,
    PackExportPayload,
    PackValidationQuestionPayload,
    PackValidationQuestionUpdatePayload,
    PackValidationRunPayload,
    UnansweredToFaqCandidatePayload,
)
from app.services.intent_factory_service import (
    archive_action,
    archive_faq_candidate,
    archive_faq,
    archive_intent,
    archive_entity,
    build_pack_draft,
    get_action_detail,
    get_entity_detail,
    get_faq_detail,
    get_intent_detail,
    import_pack_to_db,
    list_actions,
    list_entities,
    list_faq_candidates,
    list_faqs,
    list_intent_entity_links,
    list_intents,
    save_faq_candidate,
    save_entity,
    save_action,
    save_faq,
    save_intent,
    save_intent_entity_links,
)
from app.services.pack_export_service import (
    create_pack_export,
    get_pack_export,
    list_pack_exports,
)
from app.services.pack_store_service import (
    activate_runtime_pack,
    approve_runtime_pack,
    get_active_pack,
    import_exported_pack,
    list_pack_audit_logs,
    list_runtime_packs,
    reject_runtime_pack,
    rollback_runtime_pack,
)
from app.services.pack_validation_service import (
    archive_validation_question,
    get_validation_question,
    list_validation_questions,
    list_validation_results,
    run_pack_validation,
    save_validation_question,
)
from app.services.unanswered_analysis_service import (
    build_faq_candidate_payload_from_unanswered,
    list_project_unanswered_records,
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


@router.get("/projects/{project_id}/actions")
async def api_list_actions(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_actions(db, project_id)


@router.get("/projects/{project_id}/actions/{action_id}")
async def api_get_action(
    project_id: str,
    action_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    detail = await get_action_detail(db, project_id, action_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Action을 찾을 수 없습니다.")
    return detail


@router.post("/projects/{project_id}/actions")
async def api_create_action(
    project_id: str,
    payload: ActionPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_action(db, project_id, payload)


@router.put("/projects/{project_id}/actions/{action_id}")
async def api_update_action(
    project_id: str,
    action_id: str,
    payload: ActionUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_action(db, project_id, payload, action_id)


@router.delete("/projects/{project_id}/actions/{action_id}")
async def api_archive_action(
    project_id: str,
    action_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_action(db, project_id, action_id)


@router.get("/projects/{project_id}/faqs")
async def api_list_faqs(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_faqs(db, project_id)


@router.get("/projects/{project_id}/faqs/{faq_id}")
async def api_get_faq(
    project_id: str,
    faq_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    detail = await get_faq_detail(db, project_id, faq_id)
    if not detail:
        raise HTTPException(status_code=404, detail="FAQ를 찾을 수 없습니다.")
    return detail


@router.post("/projects/{project_id}/faqs")
async def api_create_faq(
    project_id: str,
    payload: FaqPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_faq(db, project_id, payload)


@router.put("/projects/{project_id}/faqs/{faq_id}")
async def api_update_faq(
    project_id: str,
    faq_id: str,
    payload: FaqUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_faq(db, project_id, payload, faq_id)


@router.delete("/projects/{project_id}/faqs/{faq_id}")
async def api_archive_faq(
    project_id: str,
    faq_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_faq(db, project_id, faq_id)


@router.get("/projects/{project_id}/faq-candidates")
async def api_list_faq_candidates(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_faq_candidates(db, project_id)


@router.post("/projects/{project_id}/faq-candidates")
async def api_create_faq_candidate(
    project_id: str,
    payload: FaqCandidatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_faq_candidate(db, project_id, payload)


@router.put("/projects/{project_id}/faq-candidates/{candidate_id}")
async def api_update_faq_candidate(
    project_id: str,
    candidate_id: str,
    payload: FaqCandidateUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_faq_candidate(db, project_id, payload, candidate_id)


@router.delete("/projects/{project_id}/faq-candidates/{candidate_id}")
async def api_archive_faq_candidate(
    project_id: str,
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_faq_candidate(db, project_id, candidate_id)


@router.get("/projects/{project_id}/unanswered-logs")
async def api_list_unanswered_logs(
    project_id: str,
    limit: int = 100,
) -> dict[str, Any]:
    items = list_project_unanswered_records(project_id, limit=limit)
    return {
        "project_id": project_id,
        "items": items,
        "counts": {
            "total": len(items),
            "open": sum(1 for item in items if item.get("status") == "open"),
            "converted": sum(1 for item in items if item.get("status") != "open"),
        },
    }


@router.post("/projects/{project_id}/unanswered-logs/{log_id}/faq-candidate")
async def api_convert_unanswered_to_faq_candidate(
    project_id: str,
    log_id: str,
    payload: UnansweredToFaqCandidatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    records = list_project_unanswered_records(project_id, limit=500)
    record = next((item for item in records if item.get("log_id") == log_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="미응답 로그를 찾을 수 없습니다.")

    candidate_payload = build_faq_candidate_payload_from_unanswered(
        record,
        suggested_answer=payload.suggested_answer,
        tags=payload.tags,
    )
    candidate = await save_faq_candidate(db, project_id, candidate_payload)
    updated_log = UnansweredLogger(default_unanswered_log_path()).update_status(
        log_id,
        "converted_to_faq_candidate",
        {"converted_candidate_id": candidate["candidate_id"]},
    )
    return {
        "project_id": project_id,
        "log": updated_log,
        "candidate": candidate,
    }


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


@router.get("/projects/{project_id}/validation-questions")
async def api_list_validation_questions(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_validation_questions(db, project_id)


@router.get("/projects/{project_id}/validation-questions/{question_id}")
async def api_get_validation_question(
    project_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    detail = await get_validation_question(db, project_id, question_id)
    if not detail:
        raise HTTPException(status_code=404, detail="검증 질문을 찾을 수 없습니다.")
    return detail


@router.post("/projects/{project_id}/validation-questions")
async def api_create_validation_question(
    project_id: str,
    payload: PackValidationQuestionPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_validation_question(db, project_id, payload)


@router.put("/projects/{project_id}/validation-questions/{question_id}")
async def api_update_validation_question(
    project_id: str,
    question_id: str,
    payload: PackValidationQuestionUpdatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_validation_question(db, project_id, payload, question_id)


@router.delete("/projects/{project_id}/validation-questions/{question_id}")
async def api_archive_validation_question(
    project_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_validation_question(db, project_id, question_id)


@router.post("/projects/{project_id}/pack-validation-runs")
async def api_run_pack_validation(
    project_id: str,
    payload: PackValidationRunPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    try:
        return await run_pack_validation(db, project_id, payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/projects/{project_id}/pack-validation-results")
async def api_list_pack_validation_results(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_validation_results(db, project_id)


@router.get("/projects/{project_id}/pack-exports")
async def api_list_pack_exports(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_pack_exports(db, project_id)


@router.post("/projects/{project_id}/pack-exports")
async def api_create_pack_export(
    project_id: str,
    payload: PackExportPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await create_pack_export(
        db,
        project_id,
        pack_id=payload.pack_id,
        pack_version=payload.pack_version,
    )


@router.get("/projects/{project_id}/pack-exports/{export_id}/download")
async def api_download_pack_export(
    project_id: str,
    export_id: str,
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    await ensure_intent_factory_schema(db)
    record = await get_pack_export(db, project_id, export_id)
    if not record:
        raise HTTPException(status_code=404, detail="Pack Export 이력을 찾을 수 없습니다.")

    zip_path = Path(record["file_path"])
    if not zip_path.exists() or not zip_path.is_file():
        raise HTTPException(status_code=404, detail="Pack ZIP 파일을 찾을 수 없습니다.")

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=zip_path.name,
    )


@router.post("/projects/{project_id}/pack-exports/{export_id}/import")
async def api_import_exported_pack(
    project_id: str,
    export_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    try:
        return await import_exported_pack(db, project_id, export_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/projects/{project_id}/runtime-packs")
async def api_list_runtime_packs(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_runtime_packs(db, project_id)


@router.get("/projects/{project_id}/active-pack")
async def api_get_active_pack(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    active = await get_active_pack(db, project_id)
    return active or {"project_id": project_id, "pack_id": None, "pack_version": None}


@router.post("/projects/{project_id}/active-pack")
async def api_activate_runtime_pack(
    project_id: str,
    payload: PackActivatePayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    try:
        return await activate_runtime_pack(
            db,
            project_id,
            payload.pack_id,
            payload.pack_version,
            activated_by=payload.activated_by,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/runtime-packs/{pack_id}/{pack_version}/approve")
async def api_approve_runtime_pack(
    project_id: str,
    pack_id: str,
    pack_version: str,
    payload: PackApprovalPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    try:
        return await approve_runtime_pack(
            db,
            project_id,
            pack_id,
            pack_version,
            approved_by=payload.approved_by,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/runtime-packs/{pack_id}/{pack_version}/reject")
async def api_reject_runtime_pack(
    project_id: str,
    pack_id: str,
    pack_version: str,
    payload: PackApprovalPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    try:
        return await reject_runtime_pack(
            db,
            project_id,
            pack_id,
            pack_version,
            reason=payload.reason,
            rejected_by=payload.approved_by,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/projects/{project_id}/active-pack/rollback")
async def api_rollback_runtime_pack(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    try:
        return await rollback_runtime_pack(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/projects/{project_id}/pack-audit-logs")
async def api_list_pack_audit_logs(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_pack_audit_logs(db, project_id)
