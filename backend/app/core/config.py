import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KT Net Zero AI Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    
    # DB Settings (Using asyncpg for async SQLAlchemy)
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "vectorsvc")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "vectordata12#")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "dev.jwinpartners.com")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "vectordb")
    
    # Auth Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-jwt-mocking")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # OpenAI (For LangGraph / Embeddings)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    @property
    def async_database_url(self) -> str:
        # search_path=graphrag 으로 설정하여 graphrag 스키마를 기본으로 사용
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            f"?prepared_statement_cache_size=0"
        )
        
    @property
    def sync_database_url(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
