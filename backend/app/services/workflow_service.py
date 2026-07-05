from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intent_discovery_service import default_candidate_store


class WorkflowProjectNotFoundError(Exception):
    def __init__(self, project_id: str):
        super().__init__("Workflow project not found: %s" % project_id)
        self.project_id = project_id


WORKFLOW_STAGE_DEFINITIONS = [
    {"stage": 1, "stage_key": "foundation", "name": "기반 설정"},
    {"stage": 2, "stage_key": "knowledge", "name": "지식 준비"},
    {"stage": 3, "stage_key": "intent_design", "name": "의도 설계"},
    {"stage": 4, "stage_key": "question_coverage", "name": "질문 커버리지"},
    {"stage": 5, "stage_key": "term_dictionary", "name": "용어 사전"},
    {"stage": 6, "stage_key": "answer_evidence", "name": "답변 근거"},
    {"stage": 7, "stage_key": "action_connection", "name": "실행 연결"},
    {"stage": 8, "stage_key": "pack_validation", "name": "Pack 품질검증"},
    {"stage": 9, "stage_key": "runtime_simulation", "name": "Runtime 시뮬레이션"},
    {"stage": 10, "stage_key": "pack_build", "name": "Pack Build"},
    {"stage": 11, "stage_key": "deploy_activate", "name": "배포/활성화"},
    {"stage": 12, "stage_key": "ops_improvement", "name": "운영 분석/개선"},
]


def _count_status(count: int) -> str:
    return "done" if count > 0 else "pending"


def _stage_status(required_done: bool, previous_done: bool, optional_warning: bool = False) -> str:
    if required_done:
        return "done"
    if not previous_done:
        return "locked"
    return "warning" if optional_warning else "in_progress"


def _next_action(stage: int, key: str, label: str, path: str, description: str = "", priority: str = "normal") -> Dict[str, Any]:
    return {
        "stage": stage,
        "key": key,
        "label": label,
        "description": description,
        "path": path,
        "priority": priority,
    }


def calculate_workflow_stages(metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
    source_count = int(metrics.get("source_count") or 0)
    completed_source_count = int(metrics.get("completed_source_count") or 0)
    intent_count = int(metrics.get("intent_count") or 0)
    example_count = int(metrics.get("intent_example_count") or 0)
    entity_count = int(metrics.get("entity_count") or 0)
    synonym_count = int(metrics.get("synonym_count") or 0)
    faq_count = int(metrics.get("faq_count") or 0)
    action_count = int(metrics.get("action_count") or 0)
    action_link_count = int(metrics.get("action_link_count") or 0)
    validation_question_count = int(metrics.get("validation_question_count") or 0)
    validation_pass_count = int(metrics.get("validation_pass_count") or 0)
    export_count = int(metrics.get("export_count") or 0)
    runtime_pack_count = int(metrics.get("runtime_pack_count") or 0)
    active_pack_count = int(metrics.get("active_pack_count") or 0)
    faq_candidate_count = int(metrics.get("faq_candidate_count") or 0)
    audit_count = int(metrics.get("audit_count") or 0)
    approved_discovery_intent_count = int(metrics.get("approved_discovery_intent_count") or 0)
    approved_discovery_entity_count = int(metrics.get("approved_discovery_entity_count") or 0)
    approved_discovery_faq_count = int(metrics.get("approved_discovery_faq_count") or 0)
    approved_discovery_action_count = int(metrics.get("approved_discovery_action_count") or 0)
    pending_discovery_count = int(metrics.get("pending_discovery_count") or 0)
    unanalyzed_source_count = int(metrics.get("unanalyzed_source_count") or 0)
    has_discovery_drift = pending_discovery_count > 0 or unanalyzed_source_count > 0

    project_ready = bool(metrics.get("project_id"))
    knowledge_ready = source_count > 0 and completed_source_count > 0
    intent_ready = not has_discovery_drift and (intent_count > 0 or approved_discovery_intent_count > 0)
    coverage_ready = not has_discovery_drift and ((example_count >= intent_count and intent_count > 0) or approved_discovery_intent_count > 0)
    terms_ready = not has_discovery_drift and (entity_count > 0 or synonym_count > 0 or approved_discovery_entity_count > 0)
    evidence_ready = not has_discovery_drift and (faq_count > 0 or completed_source_count > 0 or approved_discovery_faq_count > 0)
    action_ready = not has_discovery_drift and ((action_count > 0 and action_link_count > 0) or approved_discovery_action_count > 0)
    validation_ready = not has_discovery_drift and validation_question_count > 0 and validation_pass_count > 0
    runtime_ready = not has_discovery_drift and runtime_pack_count > 0
    build_ready = not has_discovery_drift and export_count > 0
    deploy_ready = not has_discovery_drift and active_pack_count > 0
    ops_ready = audit_count > 0 or faq_candidate_count > 0

    definitions = WORKFLOW_STAGE_DEFINITIONS
    readiness = [
        project_ready,
        knowledge_ready,
        intent_ready,
        coverage_ready,
        terms_ready,
        evidence_ready,
        action_ready,
        validation_ready,
        runtime_ready,
        build_ready,
        deploy_ready,
        ops_ready,
    ]

    paths = {
        1: "/admin/projects",
        2: "/admin/knowledge/sources",
        3: "/admin/intent-factory/intents",
        4: "/admin/intent-factory/intents",
        5: "/admin/intent-factory/entities",
        6: "/admin/intent-factory/faqs",
        7: "/admin/intent-factory/actions",
        8: "/admin/packs/validation",
        9: "/admin/runtime/qa",
        10: "/admin/packs/builder",
        11: "/admin/packs/deployment",
        12: "/admin/operations/unanswered",
    }

    labels = {
        1: "프로젝트 정보 확인",
        2: "Source 등록 및 검색 테스트",
        3: "Intent 등록",
        4: "예상 질문 보강",
        5: "Entity/Synonym 등록",
        6: "FAQ/답변 근거 정리",
        7: "Action 연결",
        8: "검증 질문 실행",
        9: "Runtime QA 실행",
        10: "Pack Export 생성",
        11: "Pack 활성화",
        12: "미응답 개선 후보 확인",
    }

    stages = []
    previous_ready = True
    for index, definition in enumerate(definitions):
        stage_no = definition["stage"]
        ready = readiness[index]
        status = _stage_status(ready, previous_ready, optional_warning=previous_ready)
        can_enter = previous_ready or ready
        progress = 100 if ready else 55 if status in ("in_progress", "warning") else 0

        checks = _build_stage_checks(stage_no, metrics)
        actions = []
        if not ready:
            actions.append(
                _next_action(
                    stage_no,
                    "%s_start" % definition["stage_key"],
                    labels[stage_no],
                    paths[stage_no],
                    "%s 단계의 필수 정보를 보강합니다." % definition["name"],
                    "high" if can_enter else "normal",
                )
            )

        stages.append(
            {
                **definition,
                "status": status,
                "progress": progress,
                "can_enter": can_enter,
                "locked_reason": None if can_enter else "이전 단계 완료 후 진입할 수 있습니다.",
                "checks": checks,
                "next_actions": actions,
            }
        )
        previous_ready = previous_ready and ready

    return stages


def _build_stage_checks(stage: int, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
    checks_by_stage = {
        1: [("project_id", "프로젝트 선택", 1 if metrics.get("project_id") else 0)],
        2: [
            ("source_count", "등록 Source", int(metrics.get("source_count") or 0)),
            ("completed_source_count", "벡터화 완료 Source", int(metrics.get("completed_source_count") or 0)),
        ],
        3: [
            ("intent_count", "등록 Intent", int(metrics.get("intent_count") or 0)),
            ("approved_discovery_intent_count", "승인 Intent 후보", int(metrics.get("approved_discovery_intent_count") or 0)),
            ("pending_discovery_count", "검토 대기 자동 후보", int(metrics.get("pending_discovery_count") or 0)),
        ],
        4: [
            ("intent_example_count", "예상 질문", int(metrics.get("intent_example_count") or 0)),
            ("approved_discovery_intent_count", "승인 질문 후보", int(metrics.get("approved_discovery_intent_count") or 0)),
        ],
        5: [
            ("entity_count", "Entity", int(metrics.get("entity_count") or 0)),
            ("synonym_count", "Synonym", int(metrics.get("synonym_count") or 0)),
            ("approved_discovery_entity_count", "승인 Entity 후보", int(metrics.get("approved_discovery_entity_count") or 0)),
        ],
        6: [
            ("faq_count", "FAQ/답변 근거", int(metrics.get("faq_count") or 0)),
            ("approved_discovery_faq_count", "승인 FAQ 후보", int(metrics.get("approved_discovery_faq_count") or 0)),
        ],
        7: [
            ("action_count", "Action", int(metrics.get("action_count") or 0)),
            ("action_link_count", "Intent-Action 연결", int(metrics.get("action_link_count") or 0)),
            ("approved_discovery_action_count", "승인 Action 후보", int(metrics.get("approved_discovery_action_count") or 0)),
        ],
        8: [
            ("validation_question_count", "검증 질문", int(metrics.get("validation_question_count") or 0)),
            ("validation_pass_count", "검증 통과 결과", int(metrics.get("validation_pass_count") or 0)),
        ],
        9: [("runtime_pack_count", "Runtime Pack", int(metrics.get("runtime_pack_count") or 0))],
        10: [("export_count", "Pack Export", int(metrics.get("export_count") or 0))],
        11: [("active_pack_count", "Active Pack", int(metrics.get("active_pack_count") or 0))],
        12: [
            ("faq_candidate_count", "미응답 FAQ 후보", int(metrics.get("faq_candidate_count") or 0)),
            ("audit_count", "운영 이력", int(metrics.get("audit_count") or 0)),
        ],
    }
    return [
        {"key": key, "label": label, "count": count, "status": _count_status(count)}
        for key, label, count in checks_by_stage.get(stage, [])
    ]


def build_workflow_summary(project_id: str, project_name: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
    merged = {"project_id": project_id, **metrics}
    stages = calculate_workflow_stages(merged)
    done_count = len([stage for stage in stages if stage["status"] == "done"])
    current = next((stage for stage in stages if stage["status"] != "done"), stages[-1])
    blocked_count = len([stage for stage in stages if stage["status"] == "locked"])
    next_action = None
    for stage in stages:
        if stage["next_actions"]:
            next_action = stage["next_actions"][0]
            break

    return {
        "project_id": project_id,
        "project_name": project_name,
        "active_pack_version": metrics.get("active_pack_version") or "-",
        "draft_pack_version": metrics.get("draft_pack_version") or "-",
        "current_stage": current["stage"],
        "overall_progress": int(round((done_count / len(stages)) * 100)),
        "blocked_count": blocked_count,
        "metrics": merged,
        "stages": stages,
        "next_action": next_action,
    }


async def list_workflow_projects(db: AsyncSession) -> List[Dict[str, Any]]:
    rows = await db.execute(
        text(
            """
            SELECT
                category AS id,
                category AS name,
                COALESCE(MAX(description), '') AS description,
                MIN(created_at) AS created_at,
                COUNT(*) FILTER (WHERE COALESCE(status, '') != 'placeholder') AS source_count
            FROM graphrag.graphrag_sources
            GROUP BY category
            ORDER BY MIN(created_at) DESC
            """
        )
    )
    projects = []
    for row in rows.fetchall():
        created_at = row.created_at.strftime("%Y-%m-%d") if row.created_at else "-"
        projects.append(
            {
                "id": row.id or "default",
                "name": row.name or "기본 프로젝트",
                "description": row.description or "문서 %s건" % row.source_count,
                "status": "active",
                "created_at": created_at,
                "active_pack_version": "-",
                "draft_pack_version": "-",
            }
        )
    return projects


async def workflow_project_exists(db: AsyncSession, project_id: str) -> bool:
    result = await db.execute(
        text("SELECT COUNT(*) FROM graphrag.graphrag_sources WHERE category = :project_id"),
        {"project_id": project_id},
    )
    return int(result.scalar() or 0) > 0


async def collect_workflow_metrics(db: AsyncSession, project_id: str) -> Dict[str, Any]:
    async def scalar(sql: str, params: Optional[Dict[str, Any]] = None) -> int:
        result = await db.execute(text(sql), params or {"project_id": project_id})
        value = result.scalar()
        return int(value or 0)

    metrics = {
        "source_count": await scalar(
            """
            SELECT COUNT(*)
            FROM graphrag.graphrag_sources
            WHERE category = :project_id
              AND COALESCE(status, '') != 'placeholder'
            """
        ),
        "completed_source_count": await scalar(
            """
            SELECT COUNT(*)
            FROM graphrag.graphrag_sources
            WHERE category = :project_id
              AND COALESCE(status, '') IN ('completed', 'active', 'SUCCESS', 'success')
            """
        ),
        "intent_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_definitions WHERE project_id = :project_id AND status != 'archived'"),
        "intent_example_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_examples WHERE project_id = :project_id AND is_active = TRUE"),
        "entity_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_entities WHERE project_id = :project_id AND status != 'archived'"),
        "synonym_count": await scalar("SELECT COUNT(*) FROM graphrag.entity_synonyms WHERE project_id = :project_id AND is_active = TRUE"),
        "faq_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_faqs WHERE project_id = :project_id AND status != 'archived'"),
        "action_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_actions WHERE project_id = :project_id AND status != 'archived'"),
        "action_link_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_action_links WHERE project_id = :project_id"),
        "validation_question_count": await scalar("SELECT COUNT(*) FROM graphrag.pack_validation_questions WHERE project_id = :project_id AND status != 'archived'"),
        "validation_pass_count": await scalar(
            "SELECT COUNT(*) FROM graphrag.pack_validation_results WHERE project_id = :project_id AND status IN ('pass', 'passed')"
        ),
        "export_count": await scalar("SELECT COUNT(*) FROM graphrag.intent_pack_exports WHERE project_id = :project_id"),
        "runtime_pack_count": await scalar("SELECT COUNT(*) FROM graphrag.runtime_pack_store WHERE project_id = :project_id"),
        "active_pack_count": await scalar("SELECT COUNT(*) FROM graphrag.active_runtime_packs WHERE project_id = :project_id"),
        "faq_candidate_count": await scalar("SELECT COUNT(*) FROM graphrag.faq_candidates WHERE project_id = :project_id AND status != 'archived'"),
        "audit_count": await scalar("SELECT COUNT(*) FROM graphrag.pack_operation_audit_logs WHERE project_id = :project_id"),
    }

    active = await db.execute(
        text("SELECT pack_version FROM graphrag.active_runtime_packs WHERE project_id = :project_id LIMIT 1"),
        {"project_id": project_id},
    )
    active_row = active.fetchone()
    latest_export = await db.execute(
        text(
            """
            SELECT pack_version
            FROM graphrag.intent_pack_exports
            WHERE project_id = :project_id
            ORDER BY created_at DESC
            LIMIT 1
            """
        ),
        {"project_id": project_id},
    )
    export_row = latest_export.fetchone()
    metrics["active_pack_version"] = active_row.pack_version if active_row else "-"
    metrics["draft_pack_version"] = export_row.pack_version if export_row else "-"
    try:
        store = default_candidate_store()
        discovery_candidates = store.list_candidates(project_id)
        approved_statuses = {"approved", "applied"}
        metrics["approved_discovery_intent_count"] = len(
            [item for item in discovery_candidates if item.status in approved_statuses and item.candidate_type == "INTENT"]
        )
        metrics["approved_discovery_entity_count"] = len(
            [item for item in discovery_candidates if item.status in approved_statuses and item.candidate_type == "ENTITY"]
        )
        metrics["approved_discovery_faq_count"] = len(
            [item for item in discovery_candidates if item.status in approved_statuses and item.candidate_type == "FAQ"]
        )
        metrics["approved_discovery_action_count"] = len(
            [item for item in discovery_candidates if item.status in approved_statuses and item.candidate_type == "ACTION"]
        )
        metrics["pending_discovery_count"] = len([item for item in discovery_candidates if item.status == "pending"])
        source_rows = await db.execute(
            text(
                """
                SELECT id
                FROM graphrag.graphrag_sources
                WHERE category = :project_id
                  AND COALESCE(status, '') != 'placeholder'
                """
            ),
            {"project_id": project_id},
        )
        source_ids = {str(row.id) for row in source_rows.fetchall() if row.id}
        analyzed_source_ids = store.analyzed_source_ids(project_id)
        metrics["analyzed_source_count"] = len(source_ids.intersection(analyzed_source_ids))
        metrics["unanalyzed_source_count"] = len(source_ids.difference(analyzed_source_ids))
    except Exception:
        metrics["approved_discovery_intent_count"] = 0
        metrics["approved_discovery_entity_count"] = 0
        metrics["approved_discovery_faq_count"] = 0
        metrics["approved_discovery_action_count"] = 0
        metrics["pending_discovery_count"] = 0
        metrics["analyzed_source_count"] = 0
        metrics["unanalyzed_source_count"] = 0
    return metrics


async def get_workflow_summary(db: AsyncSession, project_id: str) -> Dict[str, Any]:
    if not await workflow_project_exists(db, project_id):
        raise WorkflowProjectNotFoundError(project_id)

    metrics = await collect_workflow_metrics(db, project_id)
    return build_workflow_summary(project_id, project_id, metrics)
