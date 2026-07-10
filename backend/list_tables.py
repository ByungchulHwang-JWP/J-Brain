import asyncio
from sqlalchemy import text
from app.db.session import engine

async def list_tables():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'graphrag'"))
        for row in res.fetchall():
            print(row[0])

asyncio.run(list_tables())
