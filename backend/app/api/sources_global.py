from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
import os

from app.db.session import get_db
from app.api.deps import get_current_user_id

global_router = APIRouter()

@global_router.get("/")
async def list_all_sources(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    모든 프로젝트(Workspace)의 지식 문서 목록 반환
    """
    res = await db.execute(
        text("""
            SELECT id, file_name, file_size_bytes, status, created_at, description, category
            FROM graphrag.graphrag_sources
            WHERE status != 'placeholder'
            ORDER BY created_at DESC
        """)
    )
    rows = res.fetchall()
    return [{
        "id": str(r.id),
        "filename": r.file_name,
        "size": r.file_size_bytes,
        "status": r.status,
        "description": r.description,
        "category": r.category,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
    } for r in rows]
