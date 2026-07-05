import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, status, progress_pct, error_message FROM graphrag.index_jobs ORDER BY started_at DESC LIMIT 3"))
        jobs = res.fetchall()
        for j in jobs:
            print(f"ID: {j.id}, Status: {j.status}, Progress: {j.progress_pct}%, Error: {j.error_message}")

asyncio.run(check())
