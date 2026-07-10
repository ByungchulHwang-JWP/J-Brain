from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Any, List
from datetime import timedelta

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.api.deps import get_current_user_role

router = APIRouter()

class LoginMock(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login/mock", response_model=Token)
async def login_mock(
    login_data: LoginMock,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # 환경변수에서 개발 환경인지 확인 (프론트에서 막아두지만 백엔드에서도 추가 검증 가능)
    if not settings.DEBUG:
        pass # 운영에서도 mock 열어둔다면 이 부분 주석 해제. 현 기획상 프론트에서 분기

    if not login_data.email:
        raise HTTPException(status_code=400, detail="이메일을 입력해 주세요.")

    result = await db.execute(
        text("SELECT id, approval_status FROM graphrag.admin_users WHERE email = :email"),
        {"email": login_data.email}
    )
    user = result.fetchone()

    if not user:
        # mock은 무조건 승인 처리
        result = await db.execute(
            text("""
                INSERT INTO graphrag.admin_users (email, name, role_id, approval_status)
                VALUES (:email, :name, 'ROLE_ADMIN', 'approved')
                RETURNING id
            """),
            {
                "email": login_data.email,
                "name": login_data.email.split('@')[0]
            }
        )
        await db.commit()
        user_id = result.scalar()
    else:
        if user.approval_status and user.approval_status not in ('approved',):
            raise HTTPException(status_code=400, detail="계정 승인 대기 중입니다.")
        user_id = user.id
        
        await db.execute(
            text("UPDATE graphrag.admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :uid"),
            {"uid": user_id}
        )
        await db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            user_id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


class GoogleToken(BaseModel):
    token: str

@router.post("/login/google", response_model=Token)
async def login_google(
    google_data: GoogleToken,
    db: AsyncSession = Depends(get_db)
) -> Any:
    from google.oauth2 import id_token
    from google.auth.transport import requests
    import os

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="서버에 구글 클라이언트 ID가 설정되지 않았습니다.")

    try:
        # Verify the Google ID Token
        idinfo = id_token.verify_oauth2_token(
            google_data.token, requests.Request(), client_id
        )

        email = idinfo.get("email")
        name = idinfo.get("name", email.split('@')[0])

        if not email or not email.endswith("@jwinpartners.com"):
            raise HTTPException(status_code=403, detail="허용되지 않은 도메인입니다. @jwinpartners.com 계정으로 로그인해 주세요.")

        # Check DB
        result = await db.execute(
            text("SELECT id, approval_status FROM graphrag.admin_users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()

        if not user:
            # 기본 상태
            status = 'pending'
            role_id = 'ROLE_EMPLOYEE' # 기본 권한
            
            # 최초 관리자 계정은 자동 승인 및 ADMIN 롤 부여
            if email == "byungchul.hwang@jwinpartners.com":
                status = 'approved'
                role_id = 'ROLE_ADMIN'

            result = await db.execute(
                text("""
                    INSERT INTO graphrag.admin_users (email, name, role_id, approval_status)
                    VALUES (:email, :name, :role_id, :status)
                    RETURNING id
                """),
                {
                    "email": email,
                    "name": name,
                    "role_id": role_id,
                    "status": status
                }
            )
            await db.commit()
            user_id = result.scalar()
            
            if status == 'pending':
                raise HTTPException(status_code=403, detail="최초 로그인입니다. 관리자 승인 대기 중입니다.")
            
            await db.execute(
                text("UPDATE graphrag.admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :uid"),
                {"uid": user_id}
            )
            await db.commit()
        else:
            if user.approval_status != 'approved':
                raise HTTPException(status_code=403, detail="계정 승인 대기 중입니다. 관리자에게 문의하세요.")
            user_id = user.id
            
            await db.execute(
                text("UPDATE graphrag.admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :uid"),
                {"uid": user_id}
            )
            await db.commit()

        # Issuing our own JWT
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return {
            "access_token": create_access_token(
                user_id, expires_delta=access_token_expires
            ),
            "token_type": "bearer",
        }

    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail="유효하지 않은 구글 토큰입니다.")



@router.get("/menus")
async def get_my_menus(
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    현재 사용자의 role_id 기반으로 허가된 메뉴 트리 반환
    """
    role_id = user_info["role_id"]
    
    res = await db.execute(
        text("""
            SELECT m.id, m.parent_id, m.menu_name, m.url, m.sort_order, m.icon_code, rm.can_read, rm.can_write
            FROM graphrag.sys_menus m
            JOIN graphrag.sys_role_menus rm ON m.id = rm.menu_id
            WHERE rm.role_id = :role_id AND m.is_active = true
            ORDER BY m.parent_id NULLS FIRST, m.sort_order ASC
        """),
        {"role_id": role_id}
    )
    rows = res.fetchall()

    # 트리 형태로 구성
    menu_map = {}
    for r in rows:
        if not r.can_read: continue
        menu_map[r.id] = {
            "id": r.id,
            "title": r.menu_name,
            "url": r.url,
            "icon": r.icon_code,
            "parent_id": r.parent_id,
            "children": []
        }
    
    tree = []
    for m_id, m_data in menu_map.items():
        p_id = m_data["parent_id"]
        if p_id and p_id in menu_map:
            menu_map[p_id]["children"].append(m_data)
        else:
            tree.append(m_data)

    return tree
