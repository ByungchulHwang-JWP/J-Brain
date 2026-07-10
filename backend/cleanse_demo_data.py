import asyncio
import shutil
from pathlib import Path

from sqlalchemy import text

from app.db.session import engine


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
APP_DATA_DIRS = [
    BACKEND_DIR / "app_data",
    PROJECT_DIR / "app_data",
]
FILE_DIR_NAMES = [
    "uploads",
    "pack_exports",
    "runtime_pack_store",
    "pack_validation_drafts",
    "discovery_candidates",
]
FILE_NAMES = [
    "unanswered_questions.jsonl",
]

DEMO_TABLES = [
    "chat_history",
    "chat_sessions",
    "index_jobs",
    "graphrag_relations",
    "graphrag_entities",
    "graphrag_chunks",
    "graphrag_sources",
    "intent_entity_links",
    "intent_action_links",
    "intent_source_scopes",
    "intent_examples",
    "intent_definitions",
    "entity_synonyms",
    "intent_entities",
    "intent_actions",
    "intent_faqs",
    "faq_candidates",
    "intent_pack_exports",
    "active_runtime_packs",
    "runtime_pack_store",
    "pack_operation_audit_logs",
    "pack_validation_questions",
    "pack_validation_results",
    "projects",
]


async def cleanse_db():
    print("==================================================")
    print("🚨 J-Brain 데모 환경 초기화(클렌징) 스크립트 🚨")
    print("==================================================")
    print("데이터베이스의 데모 프로젝트/지식/팩/검증 데이터를 삭제합니다...")

    async with engine.begin() as conn:
        existing_tables = await conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'graphrag'
                  AND table_name = ANY(:table_names)
                """
            ),
            {"table_names": DEMO_TABLES},
        )
        existing_table_names = {row.table_name for row in existing_tables.fetchall()}
        truncate_tables = [table_name for table_name in DEMO_TABLES if table_name in existing_table_names]

        if not truncate_tables:
            print("⚠️  초기화 대상 테이블이 없습니다.")
            return

        quoted_tables = ", ".join(f"graphrag.{table_name}" for table_name in truncate_tables)
        await conn.execute(text(f"TRUNCATE TABLE {quoted_tables} RESTART IDENTITY CASCADE;"))
        skipped_tables = [table_name for table_name in DEMO_TABLES if table_name not in existing_table_names]
        print(f"✅ DB 클렌징 성공! 대상 테이블 {len(truncate_tables)}개 초기화 완료")
        if skipped_tables:
            print(f"ℹ️  존재하지 않아 건너뛴 테이블: {', '.join(skipped_tables)}")


def cleanse_directory(directory: Path):
    if not directory.exists():
        return False
    for path in directory.iterdir():
        try:
            if path.is_file() or path.is_symlink():
                path.unlink()
            elif path.is_dir():
                shutil.rmtree(path)
        except Exception as e:
            print(f"⚠️  삭제 실패: {path} / {e}")
    return True

async def cleanse_files():
    print("\n파일 시스템(업로드/빌드 파일)을 정리합니다...")

    cleaned = 0
    for app_data_dir in APP_DATA_DIRS:
        for dirname in FILE_DIR_NAMES:
            target_dir = app_data_dir / dirname
            if cleanse_directory(target_dir):
                cleaned += 1
                print(f"✅ {target_dir} 폴더 정리 완료")
        for filename in FILE_NAMES:
            target_file = app_data_dir / filename
            if target_file.exists():
                target_file.unlink()
                cleaned += 1
                print(f"✅ {target_file} 파일 삭제 완료")
    if cleaned == 0:
        print("ℹ️  정리할 app_data 파일이 없습니다.")

async def main():
    await cleanse_db()
    await cleanse_files()
    print("\n==================================================")
    print("🎉 초기화가 완료되었습니다. 깨끗한 상태에서 데모 시연이 가능합니다!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
