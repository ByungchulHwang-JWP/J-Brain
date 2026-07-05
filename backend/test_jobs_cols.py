import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='index_jobs'"))
        cols = [row[0] for row in res.fetchall()]
        print("index_jobs cols:", cols)

asyncio.run(check())
