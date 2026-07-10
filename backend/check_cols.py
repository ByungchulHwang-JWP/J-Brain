import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import engine

async def check_columns():
    async with engine.begin() as conn:
        res = await conn.execute(
            text("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'graphrag' AND table_name = 'admin_users'")
        )
        rows = res.fetchall()
        for r in rows:
            print(f"{r.column_name}: {r.data_type}")

if __name__ == "__main__":
    asyncio.run(check_columns())
