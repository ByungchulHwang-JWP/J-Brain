import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, status, error_message FROM graphrag.index_jobs ORDER BY started_at DESC LIMIT 1"))
        job = res.fetchone()
        print("Job ID:", job.id)
        print("Status:", job.status)
        print("Error Message:", job.error_message)

asyncio.run(check())
