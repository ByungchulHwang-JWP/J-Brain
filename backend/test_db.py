import asyncio
from sqlalchemy import text
from app.db.session import engine

async def test_query():
    source_id = "12795857-2014-4c34-be76-33923a10067d"
    async with engine.begin() as conn:
        try:
            res = await conn.execute(
                text("""
                    SELECT id, status, processed_chunks, total_chunks, progress_pct,
                           error_message, started_at, completed_at
                    FROM graphrag.index_jobs
                    WHERE source_id = :sid
                    ORDER BY started_at DESC
                """),
                {"sid": source_id}
            )
            print("Success:", res.fetchall())
        except Exception as e:
            print("Error:", e)

asyncio.run(test_query())
