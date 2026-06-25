from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
import datetime

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

@router.get("")
async def get_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """사용 통계 정보 조회 (실 DB 데이터 반영)"""
    
    # 1. 주간 검색 트렌드 (chat_history 기준 최근 7일간 일별 집계)
    today = datetime.datetime.now(datetime.timezone.utc).date()
    start_date = today - datetime.timedelta(days=6)
    
    trend_dict = {(start_date + datetime.timedelta(days=i)).strftime("%Y-%m-%d"): 0 for i in range(7)}
    
    sql_trend = """
        SELECT DATE(h.created_at) as log_date, COUNT(*) as cnt
        FROM graphrag.chat_history h
        WHERE h.created_at >= :start_date AND h.role = 'user'
        GROUP BY DATE(h.created_at)
        ORDER BY log_date ASC
    """
    try:
        trend_res = await db.execute(text(sql_trend), {"start_date": start_date})
        for row in trend_res.fetchall():
            date_str = row.log_date.strftime("%Y-%m-%d") if hasattr(row.log_date, 'strftime') else str(row.log_date)
            if date_str in trend_dict:
                trend_dict[date_str] = row.cnt
    except Exception:
        pass
            
    weekly_trend = list(trend_dict.values())

    # 2. 프로젝트(도메인)별 요청 수 집계
    sql_domain = """
        SELECT s.project_id as project_name, COUNT(h.id) as cnt
        FROM graphrag.chat_sessions s
        LEFT JOIN graphrag.chat_history h ON h.session_id = s.id AND h.role = 'user'
        GROUP BY s.project_id
        ORDER BY cnt DESC
    """
    domain_colors = ["#3069B3", "#E57C2B", "#2BA874", "#9B59B6", "#E74C3C", "#1ABC9C"]
    domain_share = []
    total_req = 0
    
    try:
        domain_res = await db.execute(text(sql_domain))
        domain_rows = domain_res.fetchall()
        total_req = sum(row.cnt for row in domain_rows) if domain_rows else 0
        
        if total_req > 0:
            for i, row in enumerate(domain_rows):
                pct = round(row.cnt / total_req * 100, 1)
                domain_share.append({
                    "name": row.project_name,
                    "value": pct,
                    "color": domain_colors[i % len(domain_colors)]
                })
        else:
            domain_share = [{"name": "데이터 없음", "value": 100, "color": "#888888"}]
    except Exception:
        domain_share = [{"name": "데이터 없음", "value": 100, "color": "#888888"}]

    # 3. API 상세 통계 (프로젝트별)
    sql_detail = """
        SELECT 
            s.project_id as project_name,
            COUNT(h.id) as total_req
        FROM graphrag.chat_sessions s
        LEFT JOIN graphrag.chat_history h ON h.session_id = s.id AND h.role = 'user'
        GROUP BY s.project_id
        ORDER BY total_req DESC
    """
    details = []
    try:
        detail_res = await db.execute(text(sql_detail))
        for row in detail_res.fetchall():
            details.append({
                "domain": row.project_name,
                "total_req": f"{row.total_req:,}건",
                "avg_time": "-",
                "token_in": 0,
                "token_out": 0,
                "cost": "$0.0"
            })
    except Exception:
        pass
    
    if not details:
        details = [{
            "domain": "데이터 없음",
            "total_req": "0건",
            "avg_time": "-",
            "token_in": 0,
            "token_out": 0,
            "cost": "$0.0"
        }]

    return {
        "weekly_trend": weekly_trend,
        "domain_share": domain_share,
        "details": details
    }
