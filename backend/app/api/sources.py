from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
import os
import uuid
import logging

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = "app_data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{project_id}/sources")
async def upload_source(
    project_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    지식 문서를 업로드하고 graphrag.graphrag_sources에 메타데이터를 저장합니다.
    업로드 완료 후 BackgroundTask로 OpenAI 임베딩 + pgvector 인덱싱 파이프라인을 자동 실행합니다.
    """
    # 파일 확장자 검증
    file_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if file_ext not in ["pdf", "txt", "docx", "md"]:
        raise HTTPException(
            status_code=400,
            detail="지원하지 않는 파일 형식입니다. (pdf, txt, docx, md)"
        )

    # 파일 저장 (UUID prefix로 이름 충돌 방지)
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="빈 파일은 업로드할 수 없습니다.")

    with open(file_path, "wb") as f:
        f.write(contents)

    file_size = len(contents)
    logger.info(f"[UPLOAD] 파일 저장 완료: {file_path} ({file_size} bytes)")

    # DB에 메타데이터 저장 (status: pending → 인덱싱 대기)
    res = await db.execute(
        text("""
            INSERT INTO graphrag.graphrag_sources
                (file_name, category, description, status, file_size_bytes, uploaded_by)
            VALUES
                (:fname, :category, :description, 'pending', :fsize, :u_id)
            RETURNING id
        """),
        {
            "fname": file.filename,
            "category": project_id,
            "description": f"업로드 파일: {file.filename}",
            "fsize": file_size,
            "u_id": user_id
        }
    )
    await db.commit()
    source_id = str(res.scalar())

    logger.info(f"[UPLOAD] DB 등록 완료: source_id={source_id}")

    # ─── 핵심: BackgroundTask로 인덱싱 파이프라인 자동 실행 ───────────────
    from app.ai.ingestion import ingest_document
    background_tasks.add_task(ingest_document, source_id, project_id, file_path)
    logger.info(f"[UPLOAD] 인덱싱 백그라운드 작업 등록: source_id={source_id}")

    return {
        "message": "파일 업로드 성공. 백그라운드에서 임베딩 인덱싱이 자동 시작됩니다.",
        "source_id": source_id,
        "filename": file.filename,
        "category": project_id,
        "status": "pending"
    }


@router.get("/{project_id}/sources")
async def list_sources(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    graphrag.graphrag_sources에서 category(=project_id)별 문서 목록 반환
    """
    res = await db.execute(
        text("""
            SELECT
                id,
                file_name,
                file_size_bytes,
                status,
                created_at,
                description,
                (
                    SELECT COUNT(*)
                    FROM graphrag.graphrag_chunks c
                    WHERE c.source_id = graphrag_sources.id
                ) AS chunk_count
            FROM graphrag.graphrag_sources
            WHERE category = :category
              AND status != 'placeholder'
            ORDER BY created_at DESC
        """),
        {"category": project_id}
    )
    rows = res.fetchall()
    return [{
        "id": str(r.id),
        "filename": r.file_name,
        "size": r.file_size_bytes,
        "status": r.status,
        "description": r.description,
        "chunk_count": r.chunk_count,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
    } for r in rows]


@router.delete("/{project_id}/sources/{source_id}")
async def delete_source(
    project_id: str,
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    문서 삭제: graphrag_chunks(임베딩) 및 graphrag_sources 레코드를 모두 제거합니다.
    """
    # 청크 먼저 삭제 (FK 제약)
    await db.execute(
        text("DELETE FROM graphrag.graphrag_chunks WHERE source_id = :sid"),
        {"sid": source_id}
    )
    result = await db.execute(
        text("DELETE FROM graphrag.graphrag_sources WHERE id = :sid AND category = :cat RETURNING id"),
        {"sid": source_id, "cat": project_id}
    )
    await db.commit()
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return {"message": "문서가 삭제되었습니다.", "source_id": source_id}
