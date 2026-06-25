from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List
from pydantic import BaseModel
import asyncio
import uuid
import logging

from app.db.session import get_db, AsyncSessionLocal
from app.api.deps import get_current_user_id

router = APIRouter()
logger = logging.getLogger(__name__)

class JobCreateRequest(BaseModel):
    source_ids: List[str]
    mode: str = "INCREMENTAL"
    options: dict = {}

async def dummy_indexing_task(job_id: str, source_id: str):
    """
    실제 파일 내용을 읽고 청킹/임베딩을 수행하여 DB에 저장하는 인덱싱 태스크
    단계: 청킹+임베딩 (30~60%) → GraphRAG Entity/Relation 추출 (60~90%) → 완료 (100%)
    """
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(
                text("UPDATE graphrag.index_jobs SET status = 'PROCESSING', progress_pct = 10 WHERE id = :jid"),
                {"jid": job_id}
            )
            await db.commit()

            # 소스 파일 정보 조회
            res = await db.execute(text("SELECT file_name, category FROM graphrag.graphrag_sources WHERE id = :sid"), {"sid": source_id})
            row = res.fetchone()
            if not row:
                raise Exception("Source not found")
            
            project_id = row.category or "default"
            
            import os
            # 데모 환경상 app_data 폴더의 파일을 읽거나, 기본 매뉴얼 텍스트 활용
            filepath = os.path.join("app_data", row.file_name)
            if not os.path.exists(filepath):
                filepath = os.path.join("app_data", "J-Brain_Manual.txt")

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            from langchain_text_splitters import RecursiveCharacterTextSplitter
            splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
            chunks = splitter.split_text(content)
            
            total_chunks = len(chunks)
            if total_chunks == 0:
                raise Exception("No text content found")

            await db.execute(
                text("UPDATE graphrag.index_jobs SET total_chunks = :tot, progress_pct = 30 WHERE id = :jid"),
                {"tot": total_chunks, "jid": job_id}
            )
            await db.commit()

            from langchain_openai import OpenAIEmbeddings
            from app.core.config import settings
            embedder = OpenAIEmbeddings(model="text-embedding-3-small", api_key=settings.OPENAI_API_KEY)
            
            # 기존 동일 source의 청크 데이터 삭제
            await db.execute(text("DELETE FROM graphrag.graphrag_chunks WHERE source_id = :sid"), {"sid": source_id})
            await db.commit()

            # ── STEP 1: 청킹 & 임베딩 저장 (30% → 60%) ──────────────────────────
            for i, chunk_text in enumerate(chunks):
                vec = await embedder.aembed_query(chunk_text)
                vec_str = f"[{','.join(map(str, vec))}]"
                
                await db.execute(
                    text("""
                        INSERT INTO graphrag.graphrag_chunks (source_id, content, embedding, chunk_index)
                        VALUES (:sid, :txt, CAST(:emb AS public.vector), :idx)
                    """),
                    {"sid": source_id, "txt": chunk_text, "emb": vec_str, "idx": i+1}
                )
                
                pct = 30 + int((i / total_chunks) * 30)  # 30% ~ 60%
                await db.execute(
                    text("UPDATE graphrag.index_jobs SET processed_chunks = :proc, progress_pct = :pct WHERE id = :jid"),
                    {"proc": i+1, "pct": pct, "jid": job_id}
                )
                await db.commit()
            
            logger.info(f"[JOB] 청킹/임베딩 완료: {total_chunks}개 청크 저장")

            # ── STEP 2: GraphRAG Entity/Relation 추출 (60% → 90%) ────────────────
            await db.execute(
                text("UPDATE graphrag.index_jobs SET progress_pct = 60 WHERE id = :jid"),
                {"jid": job_id}
            )
            await db.commit()

            from app.ai.graph_extractor import extract_and_store_graph
            await extract_and_store_graph(source_id, project_id, db)

            await db.execute(
                text("UPDATE graphrag.index_jobs SET progress_pct = 90 WHERE id = :jid"),
                {"jid": job_id}
            )
            await db.commit()

            # ── STEP 3: 완료 처리 (100%) ─────────────────────────────────────────
            await db.execute(
                text("UPDATE graphrag.index_jobs SET status = 'SUCCESS', progress_pct = 100, completed_at = CURRENT_TIMESTAMP WHERE id = :jid"),
                {"jid": job_id}
            )
            await db.commit()
            logger.info(f"[JOB] 인덱싱 전체 완료: job_id={job_id}")

        except Exception as e:
            await db.rollback()
            logger.error(f"[JOB] 인덱싱 실패: {e}")
            await db.execute(
                text("UPDATE graphrag.index_jobs SET status = 'FAILED', error_message = :err WHERE id = :jid"),
                {"err": str(e), "jid": job_id}
            )
            await db.commit()

@router.get("/{project_id}/jobs")
async def list_jobs(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    해당 도메인(project_id)의 인덱싱 작업 이력을 조회합니다.
    """
    res = await db.execute(
        text("""
            SELECT 
                j.id,
                j.status,
                j.progress_pct,
                j.started_at,
                j.completed_at,
                s.file_name
            FROM graphrag.index_jobs j
            JOIN graphrag.graphrag_sources s ON j.source_id = s.id
            WHERE s.category = :cat
            ORDER BY j.started_at DESC
        """),
        {"cat": project_id}
    )
    rows = res.fetchall()
    jobs = []
    for r in rows:
        jobs.append({
            "id": str(r.id),
            "type": "FULL_INDEX",
            "status": r.status.lower(),
            "target_count": 1,
            "progress": int(r.progress_pct) if r.progress_pct else 0,
            "started_at": r.started_at.strftime("%Y-%m-%d %H:%M:%S") if r.started_at else "-",
            "domain": project_id
        })
    return jobs

@router.post("/{project_id}/jobs")
async def create_job(
    project_id: str,
    req: JobCreateRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    선택된 소스 파일들을 기반으로 백그라운드 인덱싱 작업을 트리거합니다.
    """
    source_ids = req.source_ids

    # SRC-ALL 처리: 해당 프로젝트의 전체 소스 조회
    if "SRC-ALL" in source_ids:
        src_res = await db.execute(
            text("SELECT id FROM graphrag.graphrag_sources WHERE category = :cat AND status != 'placeholder'"),
            {"cat": project_id}
        )
        all_ids = [str(r.id) for r in src_res.fetchall()]
        if not all_ids:
            raise HTTPException(status_code=400, detail="인덱싱할 문서가 없습니다. 먼저 문서를 등록해주세요.")
        source_ids = all_ids

    if not source_ids:
        raise HTTPException(status_code=400, detail="인덱싱할 문서를 선택해주세요.")

    first_job_id = None
    for sid in source_ids:
        new_job_id = str(uuid.uuid4())
        if not first_job_id:
            first_job_id = new_job_id

        await db.execute(
            text("""
                INSERT INTO graphrag.index_jobs (id, source_id, status, started_at)
                VALUES (:jid, :sid, 'PENDING', CURRENT_TIMESTAMP)
            """),
            {"jid": new_job_id, "sid": sid}
        )
        background_tasks.add_task(dummy_indexing_task, new_job_id, sid)

    await db.commit()

    return {
        "message": "인덱싱 작업이 백그라운드에서 시작되었습니다.",
        "job_id": first_job_id or "JOB-UNKNOWN",
        "status": "started"
    }

@router.get("/{project_id}/jobs/{job_id}")
async def get_job_detail(
    project_id: str,
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """특정 작업의 상세 진행 상태를 반환합니다."""
    res = await db.execute(
        text("""
            SELECT j.id, j.status, j.processed_chunks, j.total_chunks, 
                   j.progress_pct, j.error_message, j.started_at, j.completed_at,
                   s.file_name
            FROM graphrag.index_jobs j
            JOIN graphrag.graphrag_sources s ON j.source_id = s.id
            WHERE j.id = :jid AND s.category = :cat
        """),
        {"jid": job_id, "cat": project_id}
    )
    r = res.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    # 실제 파이프라인 진행률에 맞춘 스텝 표시
    # 10%: PROCESSING 시작, 30%: 청킹 시작, 60%: Entity 추출 시작, 90%: 완료 처리 시작, 100%: SUCCESS
    status = r.status.lower()
    pct = int(r.progress_pct) if r.progress_pct else 0

    def step_status(done_threshold, start_threshold=None):
        if pct >= done_threshold or status == "success":
            return "completed"
        if start_threshold and pct >= start_threshold and status == "processing":
            return "processing"
        if status == "failed" and pct >= (start_threshold or done_threshold):
            return "failed"
        return "pending"

    steps = [
        {"name": "파일 로드 및 텍스트 추출",   "status": step_status(30, 10)},
        {"name": "텍스트 청킹 (Chunking)",       "status": step_status(60, 30)},
        {"name": "GraphRAG Entity 추출",          "status": step_status(90, 60)},
        {"name": "GraphRAG Relation 연결",        "status": step_status(90, 60)},
        {"name": "벡터 임베딩 및 인덱스 생성",   "status": step_status(100, 90)},
    ]

    return {
        "id": str(r.id),
        "source_name": r.file_name,
        "status": status,
        "progress": int(r.progress_pct) if r.progress_pct else 0,
        "started_at": r.started_at.strftime("%Y-%m-%d %H:%M:%S") if r.started_at else "-",
        "completed_at": r.completed_at.strftime("%Y-%m-%d %H:%M:%S") if r.completed_at else "-",
        "error_message": r.error_message,
        "steps": steps
    }

