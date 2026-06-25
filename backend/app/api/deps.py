from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.security import decode_access_token
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login/mock")

async def get_current_user_id(
    token: str = Depends(oauth2_scheme)
) -> str:
    """
    JWT 토큰을 검증하고 user_id를 반환합니다.
    """
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


async def get_current_user_role(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    실제 DB(graphrag.admin_users) 구조에 맞게 사용자 정보 조회
    - role_id: sys_roles 참조 ('ROLE_ADMIN', 'ROLE_EMPLOYEE')
    - approval_status: 승인 상태
    """
    try:
        uid = int(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="유효하지 않은 사용자 ID 형식입니다.")

    user_res = await db.execute(
        text("SELECT id, role_id, approval_status FROM graphrag.admin_users WHERE id = :user_id"),
        {"user_id": uid}
    )
    user_row = user_res.fetchone()
    if not user_row:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    if user_row.approval_status and user_row.approval_status not in ('approved',):
        raise HTTPException(status_code=403, detail="승인되지 않은 계정입니다.")

    return {
        "user_id": user_id,
        "role_id": user_row.role_id,
        "is_admin": user_row.role_id == "ROLE_ADMIN"
    }


async def verify_workspace_access(
    workspace_id: str,
    user_info: dict = Depends(get_current_user_role),
) -> dict:
    """
    Workspace 접근 권한 확인 - DB에 workspaces 테이블이 없으므로
    ROLE_ADMIN은 모든 workspace에 접근 가능한 것으로 처리합니다.
    """
    if not user_info.get("is_admin"):
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return {**user_info, "workspace_id": workspace_id}
