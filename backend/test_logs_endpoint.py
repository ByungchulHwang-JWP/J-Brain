import asyncio
from app.db.session import AsyncSessionLocal
from app.api.logs import get_logs

async def run():
    async with AsyncSessionLocal() as db:
        try:
            res = await get_logs(domain="전체", query="", user_id="admin@kt.com", db=db)
            print("Logs API OK, returned", len(res))
        except Exception as e:
            print("Logs API failed:", e)

asyncio.run(run())
