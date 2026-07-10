import asyncio
import os
import shutil
from sqlalchemy import text
from app.db.session import engine

async def cleanse_db():
    print("==================================================")
    print("🚨 J-Brain 데모 환경 초기화(클렌징) 스크립트 🚨")
    print("==================================================")
    print("데이터베이스의 projects 종속 데이터를 삭제합니다...")

    async with engine.begin() as conn:
        # projects 테이블과 외래키로 연결된 모든 데이터(의도, 지식, 런타임팩, 로그 등)를 초기화
        # RESTART IDENTITY를 통해 자동 증가 시퀀스 번호들도 모두 1로 초기화합니다.
        try:
            await conn.execute(text("TRUNCATE TABLE graphrag.projects RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.graphrag_sources RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_definitions RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_entities RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_actions RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_faqs RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.entity_synonyms RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.faq_candidates RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.intent_pack_exports RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.active_runtime_packs RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.runtime_pack_store RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.pack_operation_audit_logs RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.pack_validation_questions RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.pack_validation_results RESTART IDENTITY CASCADE;"))
            await conn.execute(text("TRUNCATE TABLE graphrag.chat_sessions RESTART IDENTITY CASCADE;"))
            print("✅ DB 클렌징 성공! (프로젝트, 인텐트, 팩, 지식, 대화 로그 등 연쇄 삭제 완료)")
        except Exception as e:
            print(f"❌ DB 클렌징 실패: {str(e)}")

async def cleanse_files():
    print("\n파일 시스템(업로드/빌드 파일)을 정리합니다...")
    
    uploads_dir = "app_data/uploads"
    pack_exports_dir = "app_data/pack_exports"
    runtime_pack_dir = "app_data/runtime_pack_store"
    discovery_candidates_dir = "app_data/discovery_candidates"
    
    # uploads 폴더는 파일만 지우고 디렉토리는 유지
    if os.path.exists(uploads_dir):
        for filename in os.listdir(uploads_dir):
            file_path = os.path.join(uploads_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}. Reason: {e}")
        print(f"✅ {uploads_dir} 폴더 정리 완료")
        
    # pack_exports 폴더 정리
    if os.path.exists(pack_exports_dir):
        for filename in os.listdir(pack_exports_dir):
            file_path = os.path.join(pack_exports_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                pass
        print(f"✅ {pack_exports_dir} 폴더 정리 완료")
        
    # runtime_pack_store 폴더 정리
    if os.path.exists(runtime_pack_dir):
        for filename in os.listdir(runtime_pack_dir):
            file_path = os.path.join(runtime_pack_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                pass
        print(f"✅ {runtime_pack_dir} 폴더 정리 완료")

    # discovery_candidates 폴더 정리
    if os.path.exists(discovery_candidates_dir):
        for filename in os.listdir(discovery_candidates_dir):
            file_path = os.path.join(discovery_candidates_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                pass
        print(f"✅ {discovery_candidates_dir} 폴더 정리 완료")

async def main():
    await cleanse_db()
    await cleanse_files()
    print("\n==================================================")
    print("🎉 초기화가 완료되었습니다. 깨끗한 상태에서 데모 시연이 가능합니다!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
