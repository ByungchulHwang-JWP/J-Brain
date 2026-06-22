from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

class PromptUpdate(BaseModel):
    prompt_content: str

@router.get("/{workspace_id}/prompts/active")
async def get_active_prompt(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    활성화된 시스템 프롬프트 조회.
    graphrag.system_prompts 테이블 컬럼: prompt_content, version, is_active
    """
    res = await db.execute(
        text("""
            SELECT id, version, prompt_content, created_at
            FROM graphrag.system_prompts
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        """)
    )
    row = res.fetchone()
    if not row:
        return {
            "prompt_content": "당신은 사내 프로젝트 지식 챗봇입니다. 주어진 문서를 기반으로 친절하게 답변하세요.",
            "version": 0
        }
    return {
        "id": str(row.id),
        "version": row.version,
        "prompt_content": row.prompt_content,
        "created_at": row.created_at.strftime("%Y-%m-%d %H:%M") if row.created_at else "-"
    }


@router.post("/{workspace_id}/prompts")
async def save_prompt(
    workspace_id: str,
    prompt_in: PromptUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    새로운 시스템 프롬프트를 등록하고 활성화합니다.
    graphrag.system_prompts: prompt_content, version, is_active, created_by
    """
    # 1. 현재 최신 버전 조회
    res = await db.execute(text("SELECT MAX(version) FROM graphrag.system_prompts"))
    max_ver = res.scalar()
    next_ver = (max_ver or 0) + 1

    # 2. 기존 프롬프트 전체 비활성화
    await db.execute(text("UPDATE graphrag.system_prompts SET is_active = false"))

    # 3. 새 프롬프트 삽입
    await db.execute(
        text("""
            INSERT INTO graphrag.system_prompts (prompt_content, version, is_active, created_by)
            VALUES (:content, :ver, true, :uid)
        """),
        {
            "content": prompt_in.prompt_content,
            "ver": next_ver,
            "uid": user_id
        }
    )
    await db.commit()
    return {"message": "프롬프트가 업데이트되었습니다.", "version": next_ver}
