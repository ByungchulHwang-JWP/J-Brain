import asyncio

from app.core.menu_seed import seed_intent_factory_menus
from app.db.session import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await seed_intent_factory_menus(db, "ROLE_ADMIN")
        print(result)


if __name__ == "__main__":
    asyncio.run(main())
