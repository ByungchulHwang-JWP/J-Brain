from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

# DB에 workspaces 테이블이 없으므로, graphrag_sources의 category를 
# workspace(프로젝트)로 활용하는 방식으로 대응합니다.
# 프론트엔드에서 Workspace로 표시할 데이터를 category 기반으로 집계하여 반환합니다.

class WorkspaceCreate(BaseModel):
    name: str
    description: str = ""

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: str

@router.get("/", response_model=List[WorkspaceResponse])
async def list_workspaces(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    graphrag.graphrag_sources의 category를 기반으로 Workspace(프로젝트) 목록 반환.
    고유한 category 값을 하나의 Workspace로 표현합니다.
    """
    res = await db.execute(
        text("""
            SELECT DISTINCT 
                category AS id,
                category AS name,
                MIN(created_at) AS created_at,
                COUNT(*) AS doc_count
            FROM graphrag.graphrag_sources
            GROUP BY category
            ORDER BY MIN(created_at) DESC
        """)
    )
    rows = res.fetchall()

    workspaces = []
    for r in rows:
        workspaces.append({
            "id": r.id or "default",
            "name": r.name or "기본 프로젝트",
            "description": f"문서 {r.doc_count}건",
            "status": "active",
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else "-"
        })

    # 데이터가 없으면 기본 안내 항목 반환
    if not workspaces:
        workspaces = [{
            "id": "NETZERO",
            "name": "탄소중립플랫폼",
            "description": "지식 문서를 업로드하면 프로젝트가 생성됩니다.",
            "status": "active",
            "created_at": datetime.now().strftime("%Y-%m-%d")
        }]

    return workspaces


@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    ws_in: WorkspaceCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    실제 DB에 workspaces 테이블이 없으므로 category 기반 가상 workspace 생성.
    실제로는 더미 레코드를 graphrag_sources에 삽입하여 category를 등록합니다.
    """
    # 이미 해당 category 존재 여부 확인
    check = await db.execute(
        text("SELECT id FROM graphrag.graphrag_sources WHERE category = :cat LIMIT 1"),
        {"cat": ws_in.name}
    )
    if check.fetchone():
        raise HTTPException(status_code=400, detail=f"'{ws_in.name}' 프로젝트가 이미 존재합니다.")

    # 해당 category로 placeholder source 생성
    result = await db.execute(
        text("""
            INSERT INTO graphrag.graphrag_sources 
                (file_name, category, description, status, uploaded_by)
            VALUES 
                (:file_name, :category, :description, 'placeholder', :user_id)
            RETURNING id, created_at
        """),
        {
            "file_name": f"[{ws_in.name}] 프로젝트 생성",
            "category": ws_in.name,
            "description": ws_in.description,
            "user_id": user_id
        }
    )
    await db.commit()
    row = result.fetchone()

    return {
        "id": ws_in.name,
        "name": ws_in.name,
        "description": ws_in.description,
        "status": "active",
        "created_at": row.created_at.strftime("%Y-%m-%d") if row and row.created_at else datetime.now().strftime("%Y-%m-%d")
    }
