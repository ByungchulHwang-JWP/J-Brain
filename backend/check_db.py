import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("POSTGRES_USER")
pw = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")
db = os.getenv("POSTGRES_DB")

engine = create_async_engine(f"postgresql+asyncpg://{user}:{pw}@{host}:{port}/{db}")

async def main():
    async with engine.begin() as conn:
        res_chunks = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='graphrag_chunks'"))
        print("graphrag_chunks schema:", [row for row in res_chunks.fetchall()])
        
        res_admin = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='admin_users'"))
        print("admin_users schema:", [row for row in res_admin.fetchall()])

asyncio.run(main())
