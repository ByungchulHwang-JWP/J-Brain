import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import engine

async def check_login_time():
    async with engine.begin() as conn:
        res = await conn.execute(
            text("SELECT email, last_login_at FROM graphrag.admin_users WHERE email = 'byungchul.hwang@jwinpartners.com'")
        )
        row = res.fetchone()
        if row:
            print(f"Email: {row.email}, last_login_at: {row.last_login_at}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check_login_time())
