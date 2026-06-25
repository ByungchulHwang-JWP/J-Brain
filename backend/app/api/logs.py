from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

@router.get("")
async def get_logs(
    domain: str = "전체",
    query: str = "",
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """사용자 챗봇 로그 목록 조회 (실제 DB 연동)"""
    sql = """
        SELECT h.id, s.user_id, h.content as query_text, h.created_at, s.project_id
        FROM graphrag.chat_history h
        JOIN graphrag.chat_sessions s ON h.session_id = s.id
        WHERE h.role = 'user'
    """
    params = {}
    
    if domain != "전체":
        sql += " AND s.project_id = :domain"
        params["domain"] = domain
        
    if query:
        sql += " AND h.content ILIKE :query"
        params["query"] = f"%{query}%"

    sql += " ORDER BY h.created_at DESC LIMIT 100"

    res = await db.execute(text(sql), params)
    rows = res.fetchall()

    result = []
    for r in rows:
        result.append({
            "id": f"LOG-{r.id:04d}",
            "user": r.user_id or "Anonymous",
            "domain": r.project_id,
            "query": r.query_text or "-",
            "time": "-", # 응답 시간 저장 컬럼 없음
            "feedback": "-", # 피드백 기능 미구현
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
        })

    return result
