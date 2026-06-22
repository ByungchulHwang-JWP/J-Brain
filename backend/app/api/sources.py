from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any
import os
import uuid

from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

UPLOAD_DIR = "app_data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{workspace_id}/sources")
async def upload_source(
    workspace_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    지식 문서를 업로드하고 graphrag.graphrag_sources에 메타데이터를 저장합니다.
    workspace_id는 category로 활용됩니다.
    """
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if file_ext not in ["pdf", "txt", "docx"]:
        raise HTTPException(status_code=400, detail="지원하지 않는 파일 형식입니다. (pdf, txt, docx)")

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    file_size = len(contents)

    # graphrag.graphrag_sources 컬럼에 맞게 INSERT
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
            "category": workspace_id,
            "description": f"업로드된 파일: {file.filename}",
            "fsize": file_size,
            "u_id": user_id
        }
    )
    await db.commit()
    source_id = res.scalar()

    # TODO: BackgroundTasks를 통해 AI 인덱싱 파이프라인(Ingestion) 트리거
    # background_tasks.add_task(ingest_document, source_id, workspace_id, file_path, db)

    return {
        "message": "파일 업로드 성공",
        "source_id": str(source_id),
        "filename": file.filename,
        "category": workspace_id
    }


@router.get("/{workspace_id}/sources")
async def list_sources(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    graphrag.graphrag_sources에서 category(=workspace_id)별 문서 목록 반환
    """
    res = await db.execute(
        text("""
            SELECT id, file_name, file_size_bytes, status, created_at, description
            FROM graphrag.graphrag_sources
            WHERE category = :category
              AND status != 'placeholder'
            ORDER BY created_at DESC
        """),
        {"category": workspace_id}
    )
    rows = res.fetchall()
    return [{
        "id": str(r.id),
        "filename": r.file_name,
        "size": r.file_size_bytes,
        "status": r.status,
        "description": r.description,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
    } for r in rows]
