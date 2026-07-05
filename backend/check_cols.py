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

engine = create_async_engine(DATABASE_URL)

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='graphrag_chunks'"))
        for r in res:
            print(r)

asyncio.run(check())
