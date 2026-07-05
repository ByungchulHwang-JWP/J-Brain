import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# Build DB URL
user = os.getenv("POSTGRES_USER", "vectorsvc")
password = os.getenv("POSTGRES_PASSWORD", "vectordata12#")
host = os.getenv("POSTGRES_HOST", "dev.jwinpartners.com")
port = os.getenv("POSTGRES_PORT", "5432")
db = os.getenv("POSTGRES_DB", "vectordb")

DATABASE_URL = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

engine = create_async_engine(DATABASE_URL, echo=True)

async def init_db():
    async with engine.begin() as conn:
        # Set schema
        await conn.execute(text('SET search_path TO graphrag;'))

        # Enable pgvector extension (might need superuser, ignore if fails)
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector;'))

        # Create admin_users table
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))

        # Create projects table
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))

        # Create project_users table (RBAC)
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS project_users (
                project_id VARCHAR(50) REFERENCES projects(id),
                user_id INTEGER REFERENCES admin_users(id),
                role VARCHAR(20) DEFAULT 'viewer',
                PRIMARY KEY (project_id, user_id)
            )
        '''))

        # Create sources table
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS sources (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(50) REFERENCES projects(id),
                filename VARCHAR(255) NOT NULL,
                filepath VARCHAR(500) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))

        # Create prompts table
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS prompts (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(50) REFERENCES projects(id),
                version INTEGER NOT NULL,
                system_prompt TEXT NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))

        # Create chunks table (for Vector search)
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS chunks (
                id SERIAL PRIMARY KEY,
                source_id INTEGER REFERENCES sources(id),
                content TEXT NOT NULL,
                embedding vector(1536),
                chunk_index INTEGER NOT NULL
            )
        '''))

        # Create entities table (for GraphRAG)
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS entities (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(50) REFERENCES projects(id),
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50),
                description TEXT,
                UNIQUE(project_id, name)
            )
        '''))

        # Create relations table (for GraphRAG)
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS relations (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(50) REFERENCES projects(id),
                source_entity_id INTEGER REFERENCES entities(id),
                target_entity_id INTEGER REFERENCES entities(id),
                relation_type VARCHAR(100),
                description TEXT
            )
        '''))

        # Create chat_sessions table
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id SERIAL PRIMARY KEY,
                project_id VARCHAR(50) REFERENCES projects(id),
                user_id INTEGER REFERENCES admin_users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))

        # Create chat_history table
        await conn.execute(text('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES chat_sessions(id),
                user_id INTEGER REFERENCES admin_users(id),
                query TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''))

    print("Database tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
