import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        await session.execute(
            text("""
            INSERT INTO graphrag.intent_examples (project_id, intent_id, example_text, normalized_text, is_active)
            VALUES ('J-Brain', 'INT-JBRAIN-027927', '프로젝트 목록 조회해줘', '프로젝트 목록 조회해줘', true)
            """)
        )
        await session.execute(
            text("""
            INSERT INTO graphrag.intent_examples (project_id, intent_id, example_text, normalized_text, is_active)
            VALUES ('J-Brain', 'INT-JBRAIN-027927', '등록된 프로젝트 목록 조회', '등록된 프로젝트 목록 조회', true)
            """)
        )
        await session.execute(
            text("""
            INSERT INTO graphrag.intent_examples (project_id, intent_id, example_text, normalized_text, is_active)
            VALUES ('J-Brain', 'INT-JBRAIN-027927', '프로젝트 조회해 줘', '프로젝트 조회해 줘', true)
            """)
        )
        await session.execute(
            text("""
            INSERT INTO graphrag.intent_examples (project_id, intent_id, example_text, normalized_text, is_active)
            VALUES ('J-Brain', 'INT-JBRAIN-027927', '프로젝트 목록 조회', '프로젝트 목록 조회', true)
            """)
        )
        await session.commit()
        print("Examples added successfully!")

asyncio.run(main())
