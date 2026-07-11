"""
권한 매핑 관리 - /api/v1/permissions
sys_menus, sys_roles, sys_role_menus 테이블 조회/수정
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user_role
from app.core.menu_seed import infer_menu_scope

router = APIRouter()


class MenuPermission(BaseModel):
    role_id: str
    menu_id: int
    can_read: bool
    can_write: bool


class BatchPermissionUpdate(BaseModel):
    permissions: List[MenuPermission]


@router.get("")
async def get_permissions(
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    전체 메뉴 목록 + 각 Role별 권한(can_read, can_write) 매핑 반환
    """
    # 롤 목록
    roles_res = await db.execute(
        text("SELECT id, name FROM graphrag.sys_roles ORDER BY id")
    )
    roles = [{"id": r.id, "name": r.name} for r in roles_res.fetchall()]

    # 메뉴 + 권한 매핑 전체 조회
    menus_res = await db.execute(
        text("""
            SELECT
                m.id, m.menu_name, m.parent_id, m.url, m.sort_order,
                rm.role_id, rm.can_read, rm.can_write
            FROM graphrag.sys_menus m
            LEFT JOIN graphrag.sys_role_menus rm ON m.id = rm.menu_id
            ORDER BY m.parent_id NULLS FIRST, m.sort_order, rm.role_id
        """)
    )
    rows = menus_res.fetchall()

    # 메뉴별로 그룹화
    menu_map = {}
    for r in rows:
        mid = r.id
        if mid not in menu_map:
            menu_map[mid] = {
                "id": mid,
                "name": r.menu_name,
                "parent_id": r.parent_id,
                "url": r.url or "",
                "scope": infer_menu_scope(r.url, mid),
                "permissions": {}
            }
        if r.role_id:
            menu_map[mid]["permissions"][r.role_id] = {
                "can_read": r.can_read or False,
                "can_write": r.can_write or False,
            }

    # 권한 없는 롤은 False로 채우기
    for menu in menu_map.values():
        for role in roles:
            if role["id"] not in menu["permissions"]:
                menu["permissions"][role["id"]] = {"can_read": False, "can_write": False}

    # parent_id가 있는 메뉴만 (실제 페이지 메뉴)
    menus = [m for m in menu_map.values() if m["parent_id"] is not None]
    parent_menus = [m for m in menu_map.values() if m["parent_id"] is None]

    return {
        "roles": roles,
        "parent_menus": parent_menus,
        "menus": sorted(menus, key=lambda x: x["id"]),
    }


@router.patch("")
async def update_permissions(
    req: BatchPermissionUpdate,
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    권한 매핑 일괄 업데이트 (UPSERT)
    """
    for p in req.permissions:
        await db.execute(
            text("""
                INSERT INTO graphrag.sys_role_menus (role_id, menu_id, can_read, can_write)
                VALUES (:role_id, :menu_id, :can_read, :can_write)
                ON CONFLICT (role_id, menu_id)
                DO UPDATE SET can_read = EXCLUDED.can_read, can_write = EXCLUDED.can_write
            """),
            {
                "role_id": p.role_id,
                "menu_id": p.menu_id,
                "can_read": p.can_read,
                "can_write": p.can_write,
            }
        )
    await db.commit()
    return {"message": f"{len(req.permissions)}개의 권한 매핑이 저장되었습니다."}
