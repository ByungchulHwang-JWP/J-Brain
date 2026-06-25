"""
프롬프트 관리 전용 라우터 - /api/v1/prompts
system_prompts 테이블에서 CRUD 처리
기존 prompts.py는 챗봇 워크스페이스용(active 조회/저장)이므로 별도 분리
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

DOMAINS = ["GLOBAL (전역)", "NETZERO", "DPPA"]


class PromptCreate(BaseModel):
    name: str
    domain: str = "GLOBAL (전역)"
    content: str = ""
    status: str = "활성"


class PromptUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None


@router.get("")
async def list_prompts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    system_prompts 목록 반환.
    테이블에 name/domain 컬럼이 없으므로 version + is_active 기반으로 매핑.
    (버전별 히스토리를 '목록' 형태로 표현)
    """
    res = await db.execute(
        text("""
            SELECT id, version, prompt_content, is_active, created_at, updated_at
            FROM graphrag.system_prompts
            ORDER BY version DESC
        """)
    )
    rows = res.fetchall()

    result = []
    for r in rows:
        # prompt_content 첫 줄 또는 일부를 name으로 사용
        lines = (r.prompt_content or "").strip().split("\n")
        name_preview = lines[0][:40] if lines else f"프롬프트 v{r.version}"

        result.append({
            "id": r.id,
            "name": name_preview,
            "domain": "GLOBAL (전역)",
            "content": r.prompt_content or "",
            "status": "활성" if r.is_active else "비활성",
            "updated_at": r.updated_at.strftime("%Y-%m-%d") if r.updated_at else "-",
        })

    # 데이터 없으면 기본 안내
    if not result:
        return [{
            "id": -1,
            "name": "기본 챗봇 페르소나",
            "domain": "GLOBAL (전역)",
            "content": "당신은 J-Brain AI 어시스턴트입니다.\n주어진 Context 문서를 바탕으로 사용자의 질문에 정확하고 친절하게 답변하십시오.",
            "status": "활성",
            "updated_at": "-",
        }]

    return result


@router.post("")
async def create_prompt(
    prompt_in: PromptCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """신규 프롬프트 등록"""
    # 최신 버전 조회
    ver_res = await db.execute(text("SELECT COALESCE(MAX(version), 0) FROM graphrag.system_prompts"))
    next_ver = ver_res.scalar() + 1

    # 활성 상태로 등록 시 기존 활성 비활성화
    if prompt_in.status == "활성":
        await db.execute(text("UPDATE graphrag.system_prompts SET is_active = false"))

    res = await db.execute(
        text("""
            INSERT INTO graphrag.system_prompts (prompt_content, version, is_active, created_by)
            VALUES (:content, :ver, :active, :uid)
            RETURNING id, version, created_at
        """),
        {
            "content": prompt_in.content,
            "ver": next_ver,
            "active": prompt_in.status == "활성",
            "uid": user_id,
        }
    )
    await db.commit()
    r = res.fetchone()
    return {
        "id": r.id,
        "name": prompt_in.name,
        "domain": prompt_in.domain,
        "content": prompt_in.content,
        "status": prompt_in.status,
        "updated_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else "-",
    }


@router.patch("/{prompt_id}")
async def update_prompt(
    prompt_id: int,
    prompt_in: PromptUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """프롬프트 내용 수정"""
    if prompt_id == -1:
        raise HTTPException(status_code=400, detail="기본 프롬프트는 수정할 수 없습니다. 신규 등록을 이용하세요.")

    updates = {}
    if prompt_in.content is not None:
        updates["prompt_content"] = prompt_in.content
    if prompt_in.status is not None:
        updates["is_active"] = prompt_in.status == "활성"

    if not updates:
        raise HTTPException(status_code=400, detail="수정할 내용이 없습니다.")

    # 활성 상태로 변경 시 기존 활성 비활성화
    if updates.get("is_active"):
        await db.execute(
            text("UPDATE graphrag.system_prompts SET is_active = false WHERE id != :pid"),
            {"pid": prompt_id}
        )

    updates["updated_at"] = "NOW()"
    set_clauses = ", ".join([
        f"{k} = NOW()" if v == "NOW()" else f"{k} = :{k}"
        for k, v in updates.items()
    ])
    params = {k: v for k, v in updates.items() if v != "NOW()"}
    params["pid"] = prompt_id

    res = await db.execute(
        text(f"UPDATE graphrag.system_prompts SET {set_clauses}, updated_at = NOW() WHERE id = :pid RETURNING id"),
        params
    )
    await db.commit()
    if not res.fetchone():
        raise HTTPException(status_code=404, detail="프롬프트를 찾을 수 없습니다.")
    return {"message": "프롬프트가 저장되었습니다.", "id": prompt_id}


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """프롬프트 삭제"""
    if prompt_id == -1:
        raise HTTPException(status_code=400, detail="기본 프롬프트는 삭제할 수 없습니다.")

    res = await db.execute(
        text("DELETE FROM graphrag.system_prompts WHERE id = :pid RETURNING id"),
        {"pid": prompt_id}
    )
    await db.commit()
    if not res.fetchone():
        raise HTTPException(status_code=404, detail="프롬프트를 찾을 수 없습니다.")
    return {"message": "프롬프트가 삭제되었습니다.", "id": prompt_id}
