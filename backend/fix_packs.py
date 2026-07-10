import asyncio
from sqlalchemy import text
from app.db.session import engine

async def truncate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_pack_exports RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.active_runtime_packs RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.runtime_pack_store RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.pack_operation_audit_logs RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.pack_validation_questions RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.pack_validation_results RESTART IDENTITY CASCADE;"))
            print("Truncated Pack-related tables!")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(truncate())
