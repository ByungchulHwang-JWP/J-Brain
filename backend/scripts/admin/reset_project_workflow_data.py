import asyncio
import json
import shutil
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import text

from app.db.session import AsyncSessionLocal


PROJECT_DATA_TABLES = [
    "pack_operation_audit_logs",
    "active_runtime_packs",
    "pack_validation_results",
    "pack_validation_questions",
    "runtime_pack_store",
    "intent_pack_exports",
    "faq_candidates",
    "intent_faqs",
    "intent_entity_links",
    "entity_synonyms",
    "intent_entities",
    "intent_source_scopes",
    "intent_action_links",
    "intent_actions",
    "intent_examples",
    "intent_definitions",
]

SOURCE_DEPENDENT_TABLES = [
    "index_jobs",
    "graphrag_chunks",
]

GLOBAL_PROJECT_TABLES = [
    "chat_history",
    "chat_sessions",
    "graphrag_relations",
    "graphrag_entities",
    "graphrag_sources",
    "projects",
]

OPTIONAL_PROJECT_COLUMN_TABLES = [
    "system_prompts",
    "prompts",
    "sources",
    "chunks",
    "entities",
    "relations",
]

GENERATED_DIRS = [
    "pack_exports",
    "runtime_pack_store",
    "pack_validation_drafts",
    "uploads",
]


async def table_exists(db, table_name: str) -> bool:
    result = await db.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'graphrag'
                  AND table_name = :table_name
            )
            """
        ),
        {"table_name": table_name},
    )
    return bool(result.scalar())


async def column_exists(db, table_name: str, column_name: str) -> bool:
    result = await db.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'graphrag'
                  AND table_name = :table_name
                  AND column_name = :column_name
            )
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    )
    return bool(result.scalar())


async def count_table(db, table_name: str) -> int:
    if not await table_exists(db, table_name):
        return 0
    result = await db.execute(text(f"SELECT COUNT(*) FROM graphrag.{table_name}"))
    return int(result.scalar() or 0)


async def delete_table(db, table_name: str) -> int:
    if not await table_exists(db, table_name):
        return 0
    result = await db.execute(text(f"DELETE FROM graphrag.{table_name}"))
    return int(result.rowcount or 0)


async def reset_database() -> dict:
    before = {}
    after = {}
    deleted = {}

    async with AsyncSessionLocal() as db:
        all_tables = PROJECT_DATA_TABLES + SOURCE_DEPENDENT_TABLES + GLOBAL_PROJECT_TABLES + OPTIONAL_PROJECT_COLUMN_TABLES
        for table_name in all_tables:
            before[table_name] = await count_table(db, table_name)

        # Chat history must be removed before sessions.
        if await table_exists(db, "chat_history"):
            deleted["chat_history"] = await delete_table(db, "chat_history")
        if await table_exists(db, "chat_sessions"):
            deleted["chat_sessions"] = await delete_table(db, "chat_sessions")

        # Intent Factory, Pack, Runtime, Validation, Approval, Improvement data.
        for table_name in PROJECT_DATA_TABLES:
            deleted[table_name] = await delete_table(db, table_name)

        # Source-dependent records before source/project records.
        for table_name in SOURCE_DEPENDENT_TABLES:
            deleted[table_name] = await delete_table(db, table_name)

        # GraphRAG extracted graph is global in the current schema.
        if await table_exists(db, "graphrag_relations"):
            deleted["graphrag_relations"] = await delete_table(db, "graphrag_relations")
        if await table_exists(db, "graphrag_entities"):
            deleted["graphrag_entities"] = await delete_table(db, "graphrag_entities")

        # Source category is currently used as the project list source.
        if await table_exists(db, "graphrag_sources"):
            deleted["graphrag_sources"] = await delete_table(db, "graphrag_sources")

        # Legacy project table, if populated.
        if await table_exists(db, "projects"):
            deleted["projects"] = await delete_table(db, "projects")

        # Optional legacy project tables are cleared only when present.
        for table_name in OPTIONAL_PROJECT_COLUMN_TABLES:
            if table_name in deleted:
                continue
            if not await table_exists(db, table_name):
                deleted[table_name] = 0
                continue
            if table_name == "chunks" and await column_exists(db, table_name, "source_id"):
                deleted[table_name] = await delete_table(db, table_name)
            elif await column_exists(db, table_name, "project_id"):
                deleted[table_name] = await delete_table(db, table_name)
            else:
                deleted[table_name] = 0

        await db.commit()

        for table_name in all_tables:
            after[table_name] = await count_table(db, table_name)

    return {"before": before, "deleted": deleted, "after": after}


def reset_generated_files() -> dict:
    app_data = BACKEND_ROOT / "app_data"
    result = {}
    for dirname in GENERATED_DIRS:
        path = app_data / dirname
        if not path.exists():
            result[dirname] = "not_found"
            continue
        removed = 0
        for child in path.iterdir():
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
            removed += 1
        path.mkdir(parents=True, exist_ok=True)
        result[dirname] = f"removed {removed} entries"
    return result


async def main() -> None:
    db_result = await reset_database()
    file_result = reset_generated_files()
    print(json.dumps({"database": db_result, "files": file_result}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
