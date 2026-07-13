from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# 비동기 엔진 생성 - connect_args로 search_path를 graphrag로 고정
engine = create_async_engine(
    settings.async_database_url,
    pool_pre_ping=True,
    echo=False,
    connect_args={"server_settings": {"search_path": "graphrag, public"}}
)

# 비동기 세션 팩토리 생성
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

Base = declarative_base()

# FastAPI 의존성 주입용 제너레이터 함수
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
