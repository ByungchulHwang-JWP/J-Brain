from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID, uuid4

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

PROJECT_LIST_SQL = """
WITH project_master AS (
    SELECT
        id::text AS id,
        name,
        description,
        COALESCE(status, 'active') AS status,
        created_at,
        0::int AS doc_count
    FROM graphrag.projects
    WHERE COALESCE(status, '') NOT IN ('deleted', 'archived')
),
source_projects AS (
    SELECT
        category AS id,
        category AS name,
        COALESCE(MAX(description) FILTER (WHERE status = 'placeholder'), MAX(description), '') AS description,
        'active' AS status,
        MIN(created_at) AS created_at,
        COUNT(*) FILTER (WHERE COALESCE(status, '') != 'placeholder')::int AS doc_count
    FROM graphrag.graphrag_sources
    WHERE category IS NOT NULL
    GROUP BY category
)
SELECT DISTINCT ON (id)
    id,
    name,
    description,
    status,
    created_at,
    doc_count
FROM (
    SELECT *, 1 AS source_priority FROM project_master
    UNION ALL
    SELECT *, 2 AS source_priority FROM source_projects
) merged
ORDER BY id, source_priority ASC, created_at DESC
"""

class ProjectCreate(BaseModel):
    name: str
    description: str = ""

class ProjectUpdate(BaseModel):
    description: str = ""
    status: str = "active"

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: str


def normalize_uuid_or_system(value: Any) -> str:
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError):
        return "00000000-0000-0000-0000-000000000000"

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    프로젝트 master를 우선 사용하고, 기존 category 기반 데모/레거시 데이터는 fallback으로 반환합니다.
    """
    res = await db.execute(text(PROJECT_LIST_SQL))
    rows = res.fetchall()

    projects = []
    for r in rows:
        projects.append({
            "id": r.id or "default",
            "name": r.name or "기본 프로젝트",
            "description": r.description or f"문서 {r.doc_count}건",
            "status": r.status or "active",
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else "-"
        })

    return projects


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    proj_in: ProjectUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    placeholder source의 description 업데이트로 프로젝트 정보 수정 처리
    """
    check = await db.execute(
        text("SELECT id FROM graphrag.graphrag_sources WHERE category = :cat LIMIT 1"),
        {"cat": project_id}
    )
    if not check.fetchone():
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")

    await db.execute(
        text("""
            UPDATE graphrag.graphrag_sources
            SET description = :desc, updated_at = NOW()
            WHERE category = :cat AND status = 'placeholder'
        """),
        {"desc": proj_in.description, "cat": project_id}
    )
    await db.commit()
    return {"message": "프로젝트 정보가 수정되었습니다.", "id": project_id}


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    프로젝트(카테고리)에 속한 모든 문서 및 청크 삭제
    """
    # 해당 카테고리의 소스 ID 목록 조회
    src_res = await db.execute(
        text("SELECT id FROM graphrag.graphrag_sources WHERE category = :cat"),
        {"cat": project_id}
    )
    src_ids = [str(r.id) for r in src_res.fetchall()]

    if src_ids:
        # 청크 삭제 (FK)
        await db.execute(
            text("DELETE FROM graphrag.graphrag_chunks WHERE source_id = ANY(CAST(:ids AS uuid[]))"),
            {"ids": src_ids}
        )
        # 소스 삭제
        await db.execute(
            text("DELETE FROM graphrag.graphrag_sources WHERE category = :cat"),
            {"cat": project_id}
        )
        await db.commit()

    return {"message": f"프로젝트 [{project_id}]가 삭제되었습니다."}


@router.post("", response_model=ProjectResponse)
async def create_project(
    proj_in: ProjectCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    실제 DB에 projects 테이블이 없으므로 category 기반 가상 project 생성.
    실제로는 더미 레코드를 graphrag_sources에 삽입하여 category를 등록합니다.
    """
    # 이미 해당 category 존재 여부 확인
    check = await db.execute(
        text("SELECT id FROM graphrag.graphrag_sources WHERE category = :cat LIMIT 1"),
        {"cat": proj_in.name}
    )
    if check.fetchone():
        raise HTTPException(status_code=400, detail=f"'{proj_in.name}' 프로젝트가 이미 존재합니다.")

    # 해당 category로 placeholder source 생성
    result = await db.execute(
        text("""
            INSERT INTO graphrag.graphrag_sources 
                (id, file_name, category, description, status, uploaded_by)
            VALUES 
                (:id, :file_name, :category, :description, 'placeholder', :user_id)
            RETURNING id, created_at
        """),
        {
            "id": str(uuid4()),
            "file_name": f"[{proj_in.name}] 프로젝트 생성",
            "category": proj_in.name,
            "description": proj_in.description,
            "user_id": normalize_uuid_or_system(user_id)
        }
    )
    await db.commit()
    row = result.fetchone()

    return {
        "id": proj_in.name,
        "name": proj_in.name,
        "description": proj_in.description,
        "status": "active",
        "created_at": row.created_at.strftime("%Y-%m-%d") if row and row.created_at else datetime.now().strftime("%Y-%m-%d")
    }


@router.get("/{project_id}/pack-status")
async def get_project_pack_status(
    project_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    현재 프로젝트의 Intent/Entity 등 설계 데이터가 
    마지막으로 Export된 패키지 생성일보다 최신인지(변경사항이 있는지) 확인합니다.
    """
    sql = """
    SELECT
      GREATEST(
        COALESCE((SELECT MAX(updated_at) FROM graphrag.intent_definitions WHERE project_id = :project_id), '1970-01-01'::timestamp),
        COALESCE((SELECT MAX(updated_at) FROM graphrag.intent_examples WHERE project_id = :project_id), '1970-01-01'::timestamp),
        COALESCE((SELECT MAX(updated_at) FROM graphrag.intent_entities WHERE project_id = :project_id), '1970-01-01'::timestamp),
        COALESCE((SELECT MAX(updated_at) FROM graphrag.entity_synonyms WHERE project_id = :project_id), '1970-01-01'::timestamp),
        COALESCE((SELECT MAX(updated_at) FROM graphrag.intent_faqs WHERE project_id = :project_id), '1970-01-01'::timestamp)
      ) > COALESCE(
        (SELECT MAX(created_at) FROM graphrag.intent_pack_exports WHERE project_id = :project_id AND status = 'completed'),
        '1970-01-01'::timestamp
      ) AS has_unexported_changes;
    """
    result = await db.execute(text(sql), {"project_id": project_id})
    row = result.fetchone()
    has_changes = row.has_unexported_changes if row else False
    
    # 만약 GREATEST 쪽이 1970-01-01이라면 변경사항 없음(데이터가 아예 없음)
    if not has_changes:
        return {"has_unexported_changes": False}
        
    return {"has_unexported_changes": has_changes}
