from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS 미들웨어 설정 (화이트리스트 필요 시 수정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 시 화이트리스트 도메인 등록 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "KT Net Zero AI Platform Backend is running"}

from app.api import auth, workspaces, sources, sources_global, prompts, chat

# 라우터 포함
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(workspaces.router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["workspaces"])
app.include_router(sources.router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["sources"])
app.include_router(sources_global.global_router, prefix=f"{settings.API_V1_STR}/sources", tags=["sources_global"])
app.include_router(prompts.router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["prompts"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["chat"])
