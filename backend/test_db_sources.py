import asyncio
from sqlalchemy import text
from app.db.session import engine

async def test():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, file_name FROM graphrag.graphrag_sources"))
        print(res.fetchall())

asyncio.run(test())
