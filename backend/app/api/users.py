from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List, Optional
from pydantic import BaseModel
from zoneinfo import ZoneInfo

from app.db.session import get_db
from app.api.deps import get_current_user_role

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    name: str
    role_id: str = "ROLE_ADMIN"
    department: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role_id: Optional[str] = None
    department: Optional[str] = None
    approval_status: Optional[str] = None


@router.get("")
async def list_users(
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """관리자용 전체 계정 목록 조회"""
    res = await db.execute(
        text("""
            SELECT id, email, name, role_id, department, approval_status,
                   created_at, last_login_at
            FROM graphrag.admin_users
            ORDER BY created_at DESC
        """)
    )
    rows = res.fetchall()
    def to_kst(dt):
        if not dt:
            return "-"
        if dt.tzinfo is None:
            from datetime import timezone
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d %H:%M")

    return [{
        "id": r.id,
        "email": r.email,
        "name": r.name or "",
        "role_id": r.role_id or "ROLE_ADMIN",
        "department": r.department or "",
        "approval_status": r.approval_status or "approved",
        "created_at": to_kst(r.created_at),
        "last_login_at": to_kst(r.last_login_at),
    } for r in rows]


@router.post("")
async def create_user(
    user_in: UserCreate,
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """신규 계정 생성"""
    # 이메일 중복 확인
    check = await db.execute(
        text("SELECT id FROM graphrag.admin_users WHERE email = :email"),
        {"email": user_in.email}
    )
    if check.fetchone():
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")

    res = await db.execute(
        text("""
            INSERT INTO graphrag.admin_users (email, name, role_id, department, approval_status)
            VALUES (:email, :name, :role_id, :department, 'approved')
            RETURNING id, email, name, role_id, department, approval_status, created_at
        """),
        {
            "email": user_in.email,
            "name": user_in.name,
            "role_id": user_in.role_id,
            "department": user_in.department or "",
        }
    )
    await db.commit()
    r = res.fetchone()
    return {
        "id": r.id,
        "email": r.email,
        "name": r.name,
        "role_id": r.role_id,
        "department": r.department or "",
        "approval_status": r.approval_status,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-",
        "last_login_at": "-",
    }


@router.patch("/{user_id}")
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """계정 정보 수정"""
    # 수정 필드만 동적으로 업데이트
    updates = {}
    if user_in.name is not None:
        updates["name"] = user_in.name
    if user_in.role_id is not None:
        updates["role_id"] = user_in.role_id
    if user_in.department is not None:
        updates["department"] = user_in.department
    if user_in.approval_status is not None:
        updates["approval_status"] = user_in.approval_status

    if not updates:
        raise HTTPException(status_code=400, detail="수정할 내용이 없습니다.")

    set_clauses = ", ".join([f"{k} = :{k}" for k in updates.keys()])
    updates["user_id"] = user_id

    res = await db.execute(
        text(f"UPDATE graphrag.admin_users SET {set_clauses} WHERE id = :user_id RETURNING id"),
        updates
    )
    await db.commit()
    if not res.fetchone():
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return {"message": "계정 정보가 수정되었습니다.", "user_id": user_id}


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """계정 삭제"""
    # 자기 자신 삭제 방지
    if str(user_id) == user_info["user_id"]:
        raise HTTPException(status_code=400, detail="자신의 계정은 삭제할 수 없습니다.")

    res = await db.execute(
        text("DELETE FROM graphrag.admin_users WHERE id = :uid RETURNING id"),
        {"uid": user_id}
    )
    await db.commit()
    if not res.fetchone():
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return {"message": "계정이 삭제되었습니다.", "user_id": user_id}
