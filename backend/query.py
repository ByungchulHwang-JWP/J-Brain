import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text
from pathlib import Path
import json

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT store_path FROM graphrag.runtime_pack_store WHERE project_id='J-Brain' AND pack_version='0.1.0'"))
        row = res.fetchone()
        if row:
            store_path = Path(row[0])
            print("Store path:", store_path)
            faq_path = store_path / "faqs.json"
            if faq_path.exists():
                print("FAQs in pack:")
                print(faq_path.read_text())
            else:
                print("No faqs.json found!")

asyncio.run(main())
