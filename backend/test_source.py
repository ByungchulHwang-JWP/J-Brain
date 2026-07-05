import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, file_name, category FROM graphrag.graphrag_sources WHERE id = '2ebc3712-cd8e-450a-b952-25cc7f346d0e'"))
        source = res.fetchone()
        print("Source:", source)
        
        res2 = await db.execute(text("SELECT count(*) FROM graphrag.graphrag_chunks WHERE source_id = '2ebc3712-cd8e-450a-b952-25cc7f346d0e'"))
        cnt = res2.scalar()
        print("Chunks in DB for this source:", cnt)

asyncio.run(check())
