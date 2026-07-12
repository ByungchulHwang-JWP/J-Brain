import asyncio
from sqlalchemy import text
from app.database import get_db, engine
from sqlalchemy.ext.asyncio import AsyncSession

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT status, pack_id, pack_version, created_at FROM graphrag.pack_validation_results ORDER BY created_at DESC LIMIT 5;"))
        rows = result.fetchall()
        print("Validation Results:")
        for row in rows:
            print(row)
            
        print("\nExports:")
        result2 = await conn.execute(text("SELECT export_id, status, pack_version FROM graphrag.intent_pack_exports ORDER BY created_at DESC LIMIT 5;"))
        for row in result2.fetchall():
            print(row)

if __name__ == "__main__":
    asyncio.run(main())
