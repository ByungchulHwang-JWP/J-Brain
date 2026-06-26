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

from app.api import auth, projects, sources, sources_global, prompts, chat, jobs, dashboard, users, logs, stats, permissions, prompt_admin, intent_packs, intent_match, action_route, validation_runner, chat_runtime, intent_factory

# 라우터 포함
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(sources.router, prefix=f"{settings.API_V1_STR}/projects", tags=["sources"])
app.include_router(sources_global.global_router, prefix=f"{settings.API_V1_STR}/sources", tags=["sources_global"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_STR}/projects", tags=["jobs"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/projects", tags=["dashboard"])
app.include_router(prompts.router, prefix=f"{settings.API_V1_STR}/projects", tags=["prompts"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/projects", tags=["chat"])
app.include_router(chat_runtime.router, prefix=f"{settings.API_V1_STR}/projects", tags=["chat_runtime"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(logs.router, prefix=f"{settings.API_V1_STR}/logs", tags=["logs"])
app.include_router(stats.router, prefix=f"{settings.API_V1_STR}/stats", tags=["stats"])
app.include_router(permissions.router, prefix=f"{settings.API_V1_STR}/permissions", tags=["permissions"])
app.include_router(prompt_admin.router, prefix=f"{settings.API_V1_STR}/prompts", tags=["prompt_admin"])
app.include_router(intent_packs.router, prefix=f"{settings.API_V1_STR}/intent-packs", tags=["intent_packs"])
app.include_router(intent_match.router, prefix=f"{settings.API_V1_STR}/intent-match", tags=["intent_match"])
app.include_router(action_route.router, prefix=f"{settings.API_V1_STR}/action-route", tags=["action_route"])
app.include_router(validation_runner.router, prefix=f"{settings.API_V1_STR}/validation-runner", tags=["validation_runner"])
app.include_router(intent_factory.router, prefix=f"{settings.API_V1_STR}/intent-factory", tags=["intent_factory"])
