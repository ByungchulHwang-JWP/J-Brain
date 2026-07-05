import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, source_id, status, processed_chunks, total_chunks, error_message FROM graphrag.index_jobs ORDER BY started_at DESC LIMIT 5"))
        jobs = res.fetchall()
        for j in jobs:
            print(j)

asyncio.run(check())
