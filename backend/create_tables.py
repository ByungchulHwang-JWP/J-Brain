import asyncio
from app.db.session import AsyncSessionLocal
from app.core.intent_factory_schema import ensure_intent_factory_schema

async def main():
    async with AsyncSessionLocal() as db:
        await ensure_intent_factory_schema(db)
        print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(main())
