import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='admin_users'"))
        print(res.fetchall())

asyncio.run(check())
