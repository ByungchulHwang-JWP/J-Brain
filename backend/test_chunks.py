import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT count(*) FROM graphrag.graphrag_chunks WHERE source_id IN (SELECT id FROM graphrag.graphrag_sources WHERE category='J-Brain')"))
        cnt = res.scalar()
        print("J-Brain Chunks Count:", cnt)
        
        if cnt == 0:
            print("No chunks found. Let's check sources.")
            res2 = await db.execute(text("SELECT file_name, status FROM graphrag.graphrag_sources WHERE category='J-Brain'"))
            sources = res2.fetchall()
            print("Sources:", sources)
        else:
            print("There are chunks. Let's check embeddings.")
            res3 = await db.execute(text("SELECT count(*) FROM graphrag.graphrag_chunks WHERE embedding IS NOT NULL AND source_id IN (SELECT id FROM graphrag.graphrag_sources WHERE category='J-Brain')"))
            embed_cnt = res3.scalar()
            print("J-Brain Embeddings Count:", embed_cnt)

asyncio.run(check())
