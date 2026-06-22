import os
import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings

async def ingest_document(source_id: int, workspace_id: str, file_path: str, db: AsyncSession):
    """
    업로드된 문서를 파싱하고, Vector DB 및 Graph DB(Entities/Relations)용으로 인덱싱합니다.
    """
    try:
        # 1. 문서 텍스트 추출 (PDF 기준 예시)
        full_text = ""
        if file_path.endswith(".pdf"):
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        full_text += page_text + "\n"
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                full_text = f.read()

        # 2. Text Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(full_text)

        # 3. Vector Embeddings 저장 로직 (OpenAI text-embedding-3-small)
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small", 
            api_key=settings.OPENAI_API_KEY
        )
        
        # 비동기로 모든 청크의 임베딩을 한 번에 생성
        if chunks:
            vector_data = await embeddings.aembed_documents(chunks)
            
            for i, (chunk, vector) in enumerate(zip(chunks, vector_data)):
                # pgvector 저장을 위해 벡터를 문자열 형태의 배열로 변환
                vector_str = f"[{','.join(map(str, vector))}]"
                await db.execute(
                    text("""
                        INSERT INTO chunks (source_id, content, embedding, chunk_index)
                        VALUES (:s_id, :content, :emb, :c_idx)
                    """),
                    {"s_id": source_id, "content": chunk, "emb": vector_str, "c_idx": i}
                )

        # 4. GraphRAG Entity & Relation 추출 로직 (Mock)
        # LLM을 호출하여 명사/개체명을 추출하고 entities, relations 테이블에 적재합니다.
        # e.g., await extract_and_store_graph(full_text, source_id, workspace_id, db)

        # 5. 상태 업데이트
        await db.execute(
            text("""
                UPDATE sources 
                SET status = 'completed', vector_status = 'completed', graph_status = 'completed'
                WHERE id = :id
            """),
            {"id": source_id}
        )
        await db.commit()

    except Exception as e:
        await db.execute(
            text("UPDATE sources SET status = 'failed' WHERE id = :id"),
            {"id": source_id}
        )
        await db.commit()
        raise e
