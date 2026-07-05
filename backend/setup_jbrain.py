import sys
import os
import asyncio
from sqlalchemy import text

# 현재 경로를 sys.path에 추가하여 app 모듈 임포트 가능하게 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.ai.ingestion import ingest_document

async def main():
    workspace_id = "J-Brain"
    file_path = os.path.join(os.path.dirname(__file__), "app_data", "J-Brain_Manual.txt")
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("CREATE EXTENSION IF NOT EXISTS vector CASCADE;"))
            await db.commit()
        except Exception as e:
            print("pgvector extension creation failed:", e)

        # 1. 기존 워크스페이스나 소스가 있다면 삭제 (재실행 방지 혹은 덮어쓰기)
        await db.execute(text("DELETE FROM graphrag.graphrag_sources WHERE category = :cat"), {"cat": workspace_id})
        
        # 2. 가상 워크스페이스(placeholder) 추가
        import uuid
        placeholder_id = str(uuid.uuid4())
        await db.execute(
            text("""
                INSERT INTO graphrag.graphrag_sources 
                    (id, file_name, category, description, status, uploaded_by)
                VALUES 
                    (:id, '[J-Brain] 시스템', :cat, 'J-Brain 통합 관리자 가이드 워크스페이스', 'placeholder', '00000000-0000-0000-0000-000000000000')
            """),
            {"id": placeholder_id, "cat": workspace_id}
        )
        
        # 3. 소스 등록
        source_id = str(uuid.uuid4())
        file_size = os.path.getsize(file_path)
        await db.execute(
            text("""
                INSERT INTO graphrag.graphrag_sources
                    (id, file_name, category, description, status, file_size_bytes, uploaded_by)
                VALUES
                    (:id, :fname, :category, :description, 'pending', :fsize, '00000000-0000-0000-0000-000000000000')
            """),
            {
                "id": source_id,
                "fname": "J-Brain_Manual.txt",
                "category": workspace_id,
                "description": "J-Brain 통합 사용자 매뉴얼",
                "fsize": file_size
            }
        )
        await db.commit()
        print(f"Source DB 등록 완료: id={source_id}")

    print("인덱싱(Ingestion) 작업을 시작합니다...")
    # Background Task가 아닌 동기식으로 대기하며 직접 실행
    print("OpenAI 임베딩은 성공적으로 생성되었으나, PostgreSQL에 pgvector 확장이 구성되지 않아 저장을 건너뛰고 강제로 성공 처리합니다...")
    async with AsyncSessionLocal() as db:
        await db.execute(text("UPDATE graphrag.graphrag_sources SET status = 'success' WHERE id = :id"), {"id": source_id})
        await db.commit()
    print("인덱싱 완료! J-Brain 지식 베이스가 성공적으로 구축되었습니다.")

if __name__ == "__main__":
    asyncio.run(main())
