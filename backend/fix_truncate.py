import asyncio
from sqlalchemy import text
from app.db.session import engine

async def truncate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("TRUNCATE TABLE graphrag.graphrag_sources RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_definitions RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.projects RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.chat_sessions RESTART IDENTITY CASCADE;"))
            print("Truncated!")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(truncate())
