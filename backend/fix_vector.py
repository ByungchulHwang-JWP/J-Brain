import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("POSTGRES_USER", "vectorsvc")
password = os.getenv("POSTGRES_PASSWORD", "vectordata12#")
host = os.getenv("POSTGRES_HOST", "dev.jwinpartners.com")
port = os.getenv("POSTGRES_PORT", "5432")
db = os.getenv("POSTGRES_DB", "vectordb")

DATABASE_URL = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

engine = create_async_engine(DATABASE_URL, echo=True)

async def fix_vector():
    async with engine.begin() as conn:
        try:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector SCHEMA graphrag;'))
            print("Successfully created vector extension in graphrag schema")
        except Exception as e:
            print(f"Error creating vector extension in graphrag schema: {e}")
            
        try:
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;'))
            print("Successfully created vector extension in public schema")
        except Exception as e:
            print(f"Error creating vector extension in public schema: {e}")

if __name__ == "__main__":
    asyncio.run(fix_vector())
