import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check_columns():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='chat_sessions'"))
        cols = [row[0] for row in res.fetchall()]
        print("chat_sessions cols:", cols)

asyncio.run(check_columns())
