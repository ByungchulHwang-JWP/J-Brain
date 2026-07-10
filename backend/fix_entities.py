import asyncio
from sqlalchemy import text
from app.db.session import engine

async def truncate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_entities RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_actions RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_faqs RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.entity_synonyms RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.faq_candidates RESTART IDENTITY CASCADE;"))
            print("Truncated Entities, Actions, and FAQs!")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(truncate())
