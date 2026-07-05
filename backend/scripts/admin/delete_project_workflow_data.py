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


PROJECT_TABLES = [
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
    "system_prompts",
    "prompts",
    "chat_history",
    "chat_sessions",
    "index_jobs",
    "graphrag_relations",
    "graphrag_entities",
    "sources",
    "chunks",
    "entities",
    "relations",
]

PROJECT_ROOT_TABLES = [
    "graphrag_sources",
    "projects",
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


async def count_project_rows(db, table_name: str, project_id: str) -> int:
    if not await table_exists(db, table_name):
        return 0
    if await column_exists(db, table_name, "project_id"):
        result = await db.execute(
            text(f"SELECT COUNT(*) FROM graphrag.{table_name} WHERE project_id = :project_id"),
            {"project_id": project_id},
        )
        return int(result.scalar() or 0)
    if await column_exists(db, table_name, "category"):
        result = await db.execute(
            text(f"SELECT COUNT(*) FROM graphrag.{table_name} WHERE category = :project_id"),
            {"project_id": project_id},
        )
        return int(result.scalar() or 0)
    if table_name == "projects" and await column_exists(db, table_name, "id"):
        result = await db.execute(
            text(f"SELECT COUNT(*) FROM graphrag.{table_name} WHERE id::text = :project_id"),
            {"project_id": project_id},
        )
        return int(result.scalar() or 0)
    return 0


async def delete_project_rows(db, table_name: str, project_id: str) -> int:
    if not await table_exists(db, table_name):
        return 0
    if await column_exists(db, table_name, "project_id"):
        result = await db.execute(
            text(f"DELETE FROM graphrag.{table_name} WHERE project_id = :project_id"),
            {"project_id": project_id},
        )
        return int(result.rowcount or 0)
    if await column_exists(db, table_name, "category"):
        result = await db.execute(
            text(f"DELETE FROM graphrag.{table_name} WHERE category = :project_id"),
            {"project_id": project_id},
        )
        return int(result.rowcount or 0)
    if table_name == "projects" and await column_exists(db, table_name, "id"):
        result = await db.execute(
            text(f"DELETE FROM graphrag.{table_name} WHERE id::text = :project_id"),
            {"project_id": project_id},
        )
        return int(result.rowcount or 0)
    return 0


async def delete_source_dependent_rows(db, project_id: str) -> dict:
    deleted = {}
    source_ids_result = await db.execute(
        text("SELECT id::text FROM graphrag.graphrag_sources WHERE category = :project_id"),
        {"project_id": project_id},
    )
    source_ids = [row[0] for row in source_ids_result.fetchall()]
    if not source_ids:
        return {"graphrag_chunks": 0, "index_jobs_by_source": 0}

    if await table_exists(db, "graphrag_chunks") and await column_exists(db, "graphrag_chunks", "source_id"):
        result = await db.execute(
            text(
                """
                DELETE FROM graphrag.graphrag_chunks
                WHERE source_id::text = ANY(:source_ids)
                """
            ),
            {"source_ids": source_ids},
        )
        deleted["graphrag_chunks"] = int(result.rowcount or 0)

    if await table_exists(db, "index_jobs") and await column_exists(db, "index_jobs", "source_id"):
        result = await db.execute(
            text(
                """
                DELETE FROM graphrag.index_jobs
                WHERE source_id::text = ANY(:source_ids)
                """
            ),
            {"source_ids": source_ids},
        )
        deleted["index_jobs_by_source"] = int(result.rowcount or 0)

    return deleted


async def delete_database_project(project_id: str) -> dict:
    before = {}
    deleted = {}
    after = {}

    async with AsyncSessionLocal() as db:
        for table_name in PROJECT_TABLES + PROJECT_ROOT_TABLES:
            before[table_name] = await count_project_rows(db, table_name, project_id)

        deleted.update(await delete_source_dependent_rows(db, project_id))

        for table_name in PROJECT_TABLES:
            deleted[table_name] = await delete_project_rows(db, table_name, project_id)

        for table_name in PROJECT_ROOT_TABLES:
            deleted[table_name] = await delete_project_rows(db, table_name, project_id)

        await db.commit()

        for table_name in PROJECT_TABLES + PROJECT_ROOT_TABLES:
            after[table_name] = await count_project_rows(db, table_name, project_id)

    return {"before": before, "deleted": deleted, "after": after}


def delete_generated_project_files(project_id: str) -> dict:
    app_data = BACKEND_ROOT / "app_data"
    result = {}

    for dirname in GENERATED_DIRS:
        path = app_data / dirname
        if not path.exists():
            result[dirname] = "not_found"
            continue

        removed = 0
        for child in path.iterdir():
            name = child.name.lower()
            if project_id.lower() not in name:
                continue
            if child.is_dir():
                shutil.rmtree(child)
            else:
                child.unlink()
            removed += 1
        result[dirname] = f"removed {removed} entries"

    return result


async def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/admin/delete_project_workflow_data.py <PROJECT_ID>")

    project_id = sys.argv[1].strip()
    if not project_id:
        raise SystemExit("PROJECT_ID is required.")

    db_result = await delete_database_project(project_id)
    file_result = delete_generated_project_files(project_id)
    print(json.dumps({"project_id": project_id, "database": db_result, "files": file_result}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
