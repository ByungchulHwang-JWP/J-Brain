import asyncio
from sqlalchemy import text
from app.db.session import engine

async def test_insert_and_select():
    source_id = "12796997-9814-4c24-ba76-5362ad18867d"
    async with engine.begin() as conn:
        try:
            # Insert dummy job
            await conn.execute(
                text("""
                    INSERT INTO graphrag.index_jobs (id, source_id, status, started_at)
                    VALUES ('a16fb541-9e54-4bd5-b3e9-16ee61385099', :sid, 'PENDING', CURRENT_TIMESTAMP)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"sid": source_id}
            )
            
            res = await conn.execute(
                text("""
                    SELECT id, status, processed_chunks, total_chunks, progress_pct,
                           error_message, started_at, completed_at
                    FROM graphrag.index_jobs
                    WHERE source_id = :sid
                """),
                {"sid": source_id}
            )
            rows = res.fetchall()
            for r in rows:
                started = r.started_at
                completed = r.completed_at
                duration = "-"
                if started and completed:
                    secs = int((completed - started).total_seconds())
                    duration = f"{secs // 60}분 {secs % 60}초" if secs >= 60 else f"{secs}초"
                
                print({
                    "id": str(r.id),
                    "started_at": started.strftime("%Y-%m-%d %H:%M:%S") if started else "-",
                    "duration": duration
                })
        except Exception as e:
            print("Error:", e)

asyncio.run(test_insert_and_select())
