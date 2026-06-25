"""
ingestion.py - 문서 파싱 → 청킹 → OpenAI 임베딩 → pgvector 저장 파이프라인
"""
import os
import logging
import asyncio
from typing import List

from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger(__name__)


def _extract_text_from_file(file_path: str) -> str:
    """파일 확장자에 따라 텍스트 추출 (동기 함수 - 스레드에서 실행)"""
    ext = file_path.rsplit(".", 1)[-1].lower()
    full_text = ""

    if ext == "pdf":
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"

    elif ext == "docx":
        from docx import Document
        doc = Document(file_path)
        for para in doc.paragraphs:
            if para.text.strip():
                full_text += para.text + "\n"

    elif ext in ("txt", "md"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()

    else:
        raise ValueError(f"지원하지 않는 파일 형식입니다: .{ext}")

    return full_text.strip()


async def ingest_document(source_id: str, project_id: str, file_path: str):
    """
    업로드된 문서를 파싱하고, 청킹 후 OpenAI 임베딩을 생성하여 pgvector에 저장합니다.
    ※ 이 함수는 FastAPI BackgroundTasks로 실행되므로, 독립적인 DB 세션을 내부에서 생성합니다.
    """
    from app.db.session import AsyncSessionLocal

    logger.info(f"[INGEST] 시작: source_id={source_id}, workspace={project_id}, file={file_path}")

    async with AsyncSessionLocal() as db:
        try:
            # 1. 상태: processing 으로 업데이트
            await db.execute(
                text("UPDATE graphrag.graphrag_sources SET status = 'processing' WHERE id = :id"),
                {"id": source_id}
            )
            await db.commit()

            # 2. 파일 텍스트 추출 (동기 작업을 별도 스레드로 실행)
            full_text = await asyncio.get_event_loop().run_in_executor(
                None, _extract_text_from_file, file_path
            )

            if not full_text:
                raise ValueError("파일에서 텍스트를 추출하지 못했습니다.")

            logger.info(f"[INGEST] 텍스트 추출 완료: {len(full_text)}자")

            # 3. 텍스트 청킹
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
                separators=["\n\n", "\n", ".", " ", ""]
            )
            chunks: List[str] = splitter.split_text(full_text)
            logger.info(f"[INGEST] 청킹 완료: {len(chunks)}개 청크")

            # 4. OpenAI 임베딩 생성 (20개씩 배치 처리 - Rate Limit 방지)
            from langchain_openai import OpenAIEmbeddings
            embedder = OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=settings.OPENAI_API_KEY
            )

            BATCH_SIZE = 20
            all_vectors = []
            for batch_start in range(0, len(chunks), BATCH_SIZE):
                batch = chunks[batch_start: batch_start + BATCH_SIZE]
                vectors = await embedder.aembed_documents(batch)
                all_vectors.extend(vectors)
                logger.info(f"[INGEST] 임베딩 배치 완료: {batch_start + len(batch)}/{len(chunks)}")
                # Rate limit 방지용 짧은 대기
                if batch_start + BATCH_SIZE < len(chunks):
                    await asyncio.sleep(0.5)

            # 5. graphrag.graphrag_chunks 에 청크 + 임베딩 저장
            # pgvector는 ::vector 캐스팅으로 저장해야 합니다
            for i, (chunk_text, vector) in enumerate(zip(chunks, all_vectors)):
                vector_str = f"[{','.join(map(str, vector))}]"
                await db.execute(
                    text("""
                        INSERT INTO graphrag.graphrag_chunks
                            (source_id, content, embedding, chunk_index)
                        VALUES
                            (:s_id, :content, CAST(:emb AS public.vector), :idx)
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "s_id": source_id,
                        "content": chunk_text,
                        "emb": vector_str,
                        "idx": i + 1
                    }
                )

            await db.commit()
            logger.info(f"[INGEST] 청크 저장 완료: {len(chunks)}개")

            # 6. Graph 추출 (LLM 호출)
            try:
                from app.ai.graph_extractor import extract_and_store_graph
                await extract_and_store_graph(source_id, project_id, db)
            except Exception as e:
                logger.error(f"[INGEST] 그래프 추출 실패 (무시하고 계속 진행): {e}")

            # 7. 상태: success 업데이트
            await db.execute(
                text("UPDATE graphrag.graphrag_sources SET status = 'success' WHERE id = :id"),
                {"id": source_id}
            )
            await db.commit()
            logger.info(f"[INGEST] 완료: source_id={source_id}")

        except Exception as e:
            logger.error(f"[INGEST] 오류 발생: source_id={source_id}, error={e}")
            try:
                await db.execute(
                    text("UPDATE graphrag.graphrag_sources SET status = 'error' WHERE id = :id"),
                    {"id": source_id}
                )
                await db.commit()
            except Exception:
                pass
            raise
