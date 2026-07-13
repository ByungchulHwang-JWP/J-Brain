from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
import json
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user_role
from app.schemas.operations import ImprovementRequestCreate, ImprovementRequestUpdate


router = APIRouter()

@router.get("/{project_id}/operations/realtime")
async def get_realtime_operations(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    """
    실시간 모니터링 데이터 (최근 1시간 통계 요약 및 최근 로그)
    """
    kpi_res = await db.execute(
        text("""
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN fallback_yn = true THEN 1 ELSE 0 END) as fallback_count,
                AVG(confidence) as avg_confidence,
                SUM(CASE WHEN response_status = 'error' THEN 1 ELSE 0 END) as error_count,
                AVG(response_time_ms) as avg_response_time,
                MAX(active_pack_version) as current_pack
            FROM graphrag.runtime_event_logs
            WHERE project_id = :pid
              AND created_at >= NOW() - INTERVAL '1 hour'
        """),
        {"pid": project_id}
    )
    kpi_row = kpi_res.fetchone()
    
    trend_res = await db.execute(
        text("""
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD HH24:00') as time_bucket,
                COUNT(*) as req_count,
                SUM(CASE WHEN response_status = 'error' THEN 1 ELSE 0 END) as err_count
            FROM graphrag.runtime_event_logs
            WHERE project_id = :pid
              AND created_at >= NOW() - INTERVAL '12 hour'
            GROUP BY time_bucket
            ORDER BY time_bucket ASC
        """),
        {"pid": project_id}
    )
    trend_rows = trend_res.fetchall()
    
    logs_res = await db.execute(
        text("""
            SELECT id, session_id, question, matched_intent_id, action_id, action_type,
                   confidence, confidence_label, fallback_yn, response_status, response_time_ms,
                   active_pack_id, active_pack_version, created_at
            FROM graphrag.runtime_event_logs
            WHERE project_id = :pid
            ORDER BY created_at DESC
            LIMIT 50
        """),
        {"pid": project_id}
    )
    logs_rows = logs_res.fetchall()
    
    total = kpi_row.total_requests if kpi_row and kpi_row.total_requests else 0
    fallback = kpi_row.fallback_count if kpi_row and kpi_row.fallback_count else 0
    
    return {
        "kpi": {
            "active_pack": kpi_row.current_pack if kpi_row and kpi_row.current_pack else "-",
            "requests_last_hour": total,
            "intent_match_rate": ((total - fallback) / total * 100) if total > 0 else 0,
            "fallback_rate": (fallback / total * 100) if total > 0 else 0,
            "avg_response_time": float(kpi_row.avg_response_time) if kpi_row and kpi_row.avg_response_time else 0,
            "error_count": kpi_row.error_count if kpi_row and kpi_row.error_count else 0,
        },
        "trend": [
            {
                "time": r.time_bucket,
                "requests": r.req_count,
                "errors": r.err_count
            } for r in trend_rows
        ],
        "recent_logs": [
            {
                "id": r.id,
                "session_id": r.session_id,
                "question": r.question,
                "matched_intent_id": r.matched_intent_id,
                "action_id": r.action_id,
                "action_type": r.action_type,
                "confidence": float(r.confidence) if r.confidence else None,
                "confidence_label": r.confidence_label,
                "fallback_yn": r.fallback_yn,
                "response_status": r.response_status,
                "response_time_ms": r.response_time_ms,
                "active_pack_version": r.active_pack_version,
                "created_at": r.created_at.isoformat()
            } for r in logs_rows
        ]
    }

@router.get("/{project_id}/operations/unanswered")
async def get_unanswered_operations(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    """
    미응답 분석 데이터 목록 조회
    """
    res = await db.execute(
        text("""
            SELECT id, session_id, question, matched_intent_id, action_id, action_type,
                   confidence, confidence_label, fallback_yn, response_status, response_time_ms,
                   active_pack_id, active_pack_version, created_at
            FROM graphrag.runtime_event_logs
            WHERE project_id = :pid
              AND (fallback_yn = true OR COALESCE(confidence, 0) < 0.7)
            ORDER BY created_at DESC
            LIMIT 100
        """),
        {"pid": project_id}
    )
    rows = res.fetchall()
    
    return {
        "unanswered_logs": [
            {
                "id": r.id,
                "session_id": r.session_id,
                "question": r.question,
                "matched_intent_id": r.matched_intent_id,
                "action_id": r.action_id,
                "action_type": r.action_type,
                "confidence": float(r.confidence) if r.confidence else None,
                "confidence_label": r.confidence_label,
                "fallback_yn": r.fallback_yn,
                "response_status": r.response_status,
                "created_at": r.created_at.isoformat(),
                "suggested_cause": "Intent 부재" if not r.matched_intent_id else (
                                   "Confidence 부족" if r.confidence and float(r.confidence) < 0.7 else 
                                   "Action 미연결" if not r.action_id else "기타")
            } for r in rows
        ]
    }


@router.get("/{project_id}/operations/improvement-requests")
async def get_improvement_requests(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    """
    개선 요청 목록 조회
    """
    res = await db.execute(
        text("""
            SELECT r.id, r.request_id, r.project_id, r.source_type, r.source_log_id, r.request_type, 
                   r.title, r.description, r.severity, r.status, r.assigned_to, r.linked_intent_id, 
                   r.linked_action_id, r.linked_faq_id, r.target_pack_version, r.created_at,
                   u.name as assignee_name
            FROM graphrag.operation_improvement_requests r
            LEFT JOIN graphrag.admin_users u ON r.assigned_to = u.id
            WHERE r.project_id = :pid
            ORDER BY r.created_at DESC
        """),
        {"pid": project_id}
    )
    rows = res.fetchall()
    
    return {
        "items": [
            {
                "id": r.id,
                "request_id": r.request_id,
                "project_id": r.project_id,
                "source_type": r.source_type,
                "source_log_id": r.source_log_id,
                "request_type": r.request_type,
                "title": r.title,
                "description": r.description,
                "severity": r.severity,
                "status": r.status,
                "assigned_to": r.assigned_to,
                "assignee_name": r.assignee_name,
                "linked_intent_id": r.linked_intent_id,
                "linked_action_id": r.linked_action_id,
                "linked_faq_id": r.linked_faq_id,
                "target_pack_version": r.target_pack_version,
                "created_at": r.created_at.isoformat()
            } for r in rows
        ]
    }

@router.post("/{project_id}/operations/improvement-requests")
async def create_improvement_request(
    project_id: str,
    req_in: ImprovementRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    req_id = req_in.request_id if req_in.request_id else f"REQ-{uuid.uuid4().hex[:8].upper()}"
    
    res = await db.execute(
        text("""
            INSERT INTO graphrag.operation_improvement_requests (
                request_id, project_id, source_type, source_log_id, request_type, title, description,
                severity, status, assigned_to, linked_intent_id, linked_action_id, linked_faq_id, target_pack_version
            ) VALUES (
                :request_id, :project_id, :source_type, :source_log_id, :request_type, :title, :description,
                :severity, :status, :assigned_to, :linked_intent_id, :linked_action_id, :linked_faq_id, :target_pack_version
            ) RETURNING id, request_id, created_at
        """),
        {
            "request_id": req_id,
            "project_id": project_id,
            "source_type": req_in.source_type,
            "source_log_id": req_in.source_log_id,
            "request_type": req_in.request_type,
            "title": req_in.title,
            "description": req_in.description,
            "severity": req_in.severity,
            "status": req_in.status,
            "assigned_to": req_in.assigned_to,
            "linked_intent_id": req_in.linked_intent_id,
            "linked_action_id": req_in.linked_action_id,
            "linked_faq_id": req_in.linked_faq_id,
            "target_pack_version": req_in.target_pack_version
        }
    )
    await db.commit()
    r = res.fetchone()
    return {"id": r.id, "request_id": r.request_id, "created_at": r.created_at.isoformat()}

@router.patch("/{project_id}/operations/improvement-requests/{request_id}")
async def update_improvement_request(
    project_id: str,
    request_id: str,
    req_in: ImprovementRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    # Build dynamic update
    updates = req_in.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    set_clauses = ", ".join([f"{k} = :{k}" for k in updates.keys()])
    updates["pid"] = project_id
    updates["rid"] = request_id
    
    res = await db.execute(
        text(f"""
            UPDATE graphrag.operation_improvement_requests
            SET {set_clauses}, updated_at = NOW()
            WHERE project_id = :pid AND request_id = :rid
            RETURNING id
        """),
        updates
    )
    await db.commit()
    if not res.fetchone():
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": "updated"}

@router.get("/{project_id}/operations/metrics")
async def get_operation_metrics(
    project_id: str,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    """
    기간별 운영 지표 (배치성 데이터) 조회
    """
    res = await db.execute(
        text("""
            SELECT metric_date, total_requests, intent_match_count, fallback_count,
                   avg_confidence, avg_response_time_ms
            FROM graphrag.operation_metrics
            WHERE project_id = :pid
              AND metric_date >= CURRENT_DATE - INTERVAL '1 day' * :days
            ORDER BY metric_date ASC
        """),
        {"pid": project_id, "days": days}
    )
    rows = res.fetchall()
    
    # 만약 배치 데이터가 없다면 임시로 빈 배열을 반환하지만,
    # 실제로는 0 값들로 채워진 최근 N일 데이터를 리턴하는 것이 프론트엔드 차트 렌더링에 좋음
    return {
        "metrics": [
            {
                "date": r.metric_date.isoformat(),
                "total_requests": r.total_requests,
                "intent_match_count": r.intent_match_count,
                "fallback_count": r.fallback_count,
                "avg_confidence": float(r.avg_confidence),
                "avg_response_time_ms": r.avg_response_time_ms
            } for r in rows
        ]
    }

@router.get("/{project_id}/operations/pack-improvements")
async def get_pack_improvements(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user_role)
) -> dict:
    """
    Pack별 반영된 개선 항목 및 변경 추적 로그 조회
    """
    res = await db.execute(
        text("""
            SELECT l.id, l.project_id, l.pack_version, l.request_id, 
                   COALESCE(l.validation_result->>'status', 'pending') AS validation_status, 
                   CASE WHEN l.deployed_yn THEN 'deployed' ELSE 'pending' END AS deployment_status, 
                   l.created_at,
                   r.title, r.request_type, r.severity
            FROM graphrag.pack_improvement_links l
            JOIN graphrag.operation_improvement_requests r
             ON l.request_id = r.request_id
             AND r.project_id = l.project_id
            WHERE l.project_id = :pid
            ORDER BY l.pack_version DESC, l.created_at DESC
        """),
        {"pid": project_id}
    )
    rows = res.fetchall()
    
    # Pack 버전을 기준으로 그룹화
    pack_groups = {}
    for r in rows:
        pv = r.pack_version
        if pv not in pack_groups:
            pack_groups[pv] = []
        
        pack_groups[pv].append({
            "id": r.id,
            "request_id": r.request_id,
            "title": r.title,
            "request_type": r.request_type,
            "severity": r.severity,
            "validation_status": r.validation_status,
            "deployment_status": r.deployment_status,
            "created_at": r.created_at.isoformat()
        })
        
    return {
        "pack_history": [
            {
                "pack_version": pv,
                "improvements": items
            } for pv, items in pack_groups.items()
        ]
    }
