import asyncio
from sqlalchemy import text
from app.db.session import engine

async def test_query():
    source_id = "12796997-9814-4c24-ba76-5362ad18867d"
    async with engine.begin() as conn:
        try:
            res = await conn.execute(
                text("""
                    SELECT id FROM graphrag.index_jobs
                    WHERE source_id = :sid
                """),
                {"sid": source_id}
            )
            print("Success:", res.fetchall())
        except Exception as e:
            print("Error:", e)

asyncio.run(test_query())
