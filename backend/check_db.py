import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.async_database_url)
    async with engine.connect() as conn:
        for table in ['intent_definitions', 'intent_examples', 'intent_actions', 'intent_entities', 'entity_synonyms', 'intent_faqs', 'intent_pack_exports', 'projects']:
            res = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_schema='graphrag' AND table_name='{table}'"))
            cols = [r[0] for r in res.fetchall()]
            if cols:
                print(f"{table}: {cols}")
            else:
                print(f"{table}: NOT FOUND")

asyncio.run(main())
