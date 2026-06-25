from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user_id, get_current_user_role

global_router = APIRouter()


@global_router.get("")
async def list_all_sources(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """모든 프로젝트(Workspace)의 지식 문서 목록 반환"""
    res = await db.execute(
        text("""
            SELECT id, file_name, file_size_bytes, status, created_at, description, category
            FROM graphrag.graphrag_sources
            WHERE status != 'placeholder'
            ORDER BY created_at DESC
        """)
    )
    rows = res.fetchall()
    return [{
        "id": str(r.id),
        "filename": r.file_name,
        "size": r.file_size_bytes,
        "status": r.status,
        "description": r.description,
        "category": r.category,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
    } for r in rows]


@global_router.get("/{source_id}")
async def get_source_detail(
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """단일 문서 상세 정보 조회"""
    res = await db.execute(
        text("""
            SELECT id, file_name, file_size_bytes, status, created_at, description, category,
                   (SELECT COUNT(*) FROM graphrag.graphrag_chunks c WHERE c.source_id = gs.id) AS chunk_count
            FROM graphrag.graphrag_sources gs
            WHERE id = :sid
        """),
        {"sid": source_id}
    )
    r = res.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    ext = r.file_name.rsplit(".", 1)[-1].upper() if "." in r.file_name else "UNKNOWN"
    size_bytes = r.file_size_bytes or 0
    if size_bytes > 0:
        mb = size_bytes / (1024 * 1024)
        size_str = f"{(size_bytes/1024):.1f} KB" if mb < 1 else f"{mb:.1f} MB"
    else:
        size_str = "-"

    return {
        "id": str(r.id),
        "filename": r.file_name,
        "file_type": ext,
        "size": size_str,
        "size_bytes": size_bytes,
        "status": r.status,
        "category": r.category,
        "description": r.description,
        "chunk_count": r.chunk_count,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "-",
    }


@global_router.get("/{source_id}/chunks")
async def get_source_chunks(
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """문서의 Text Chunk 목록 조회"""
    res = await db.execute(
        text("""
            SELECT id, content, created_at,
                   ROW_NUMBER() OVER (ORDER BY created_at ASC) AS chunk_no
            FROM graphrag.graphrag_chunks
            WHERE source_id = :sid
            ORDER BY created_at ASC
        """),
        {"sid": source_id}
    )
    rows = res.fetchall()
    return [{
        "id": str(r.id),
        "chunk_no": r.chunk_no,
        "content": r.content,
        "content_preview": r.content[:200] + "..." if len(r.content) > 200 else r.content,
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
    } for r in rows]


@global_router.get("/{source_id}/entities")
async def get_source_entities(
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """문서에서 추출된 Entity 목록 조회 (chunk_ids 기반 조회)"""
    # 먼저 해당 source의 chunk_id 목록 수집
    chunk_res = await db.execute(
        text("SELECT id FROM graphrag.graphrag_chunks WHERE source_id = :sid"),
        {"sid": source_id}
    )
    chunk_ids = [str(r.id) for r in chunk_res.fetchall()]

    if not chunk_ids:
        return []

    # source_chunk_ids 배열에 해당 chunk_id가 포함된 entity 조회
    entity_res = await db.execute(
        text("""
            SELECT id, name, entity_type, description, created_at
            FROM graphrag.graphrag_entities
            WHERE source_chunk_ids && CAST(:chunk_ids AS uuid[])
            ORDER BY entity_type, name
        """),
        {"chunk_ids": chunk_ids}
    )
    rows = entity_res.fetchall()
    return [{
        "id": str(r.id),
        "name": r.name,
        "entity_type": r.entity_type,
        "description": r.description or "",
        "created_at": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "-"
    } for r in rows]


@global_router.get("/{source_id}/jobs")
async def get_source_jobs(
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """문서의 IndexJob 이력 조회"""
    res = await db.execute(
        text("""
            SELECT id, status, processed_chunks, total_chunks, progress_pct,
                   error_message, started_at, completed_at
            FROM graphrag.index_jobs
            WHERE source_id = :sid
            ORDER BY started_at DESC
        """),
        {"sid": source_id}
    )
    rows = res.fetchall()

    result = []
    for r in rows:
        started = r.started_at
        completed = r.completed_at
        duration = "-"
        if started and completed:
            secs = int((completed - started).total_seconds())
            duration = f"{secs // 60}분 {secs % 60}초" if secs >= 60 else f"{secs}초"

        result.append({
            "id": str(r.id),
            "status": r.status,
            "processed_chunks": r.processed_chunks or 0,
            "total_chunks": r.total_chunks or 0,
            "progress_pct": r.progress_pct or 0.0,
            "error_message": r.error_message or "",
            "started_at": started.strftime("%Y-%m-%d %H:%M:%S") if started else "-",
            "completed_at": completed.strftime("%Y-%m-%d %H:%M:%S") if completed else "-",
            "duration": duration,
        })
    return result


class BatchDeleteRequest(BaseModel):
    ids: List[str]


@global_router.delete("/batch")
async def batch_delete_sources(
    req: BatchDeleteRequest,
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """복수 문서 일괄 삭제"""
    if not req.ids:
        raise HTTPException(status_code=400, detail="삭제할 항목을 선택해주세요.")

    await db.execute(
        text("DELETE FROM graphrag.graphrag_chunks WHERE source_id = ANY(CAST(:ids AS uuid[]))"),
        {"ids": req.ids}
    )
    res = await db.execute(
        text("DELETE FROM graphrag.graphrag_sources WHERE id = ANY(CAST(:ids AS uuid[])) RETURNING id"),
        {"ids": req.ids}
    )
    await db.commit()
    deleted = [str(r.id) for r in res.fetchall()]
    return {"message": f"{len(deleted)}건이 삭제되었습니다.", "deleted_ids": deleted}


@global_router.delete("/{source_id}")
async def delete_source_global(
    source_id: str,
    user_info: dict = Depends(get_current_user_role),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """단일 문서 삭제 (전역)"""
    await db.execute(
        text("DELETE FROM graphrag.graphrag_chunks WHERE source_id = :sid"),
        {"sid": source_id}
    )
    res = await db.execute(
        text("DELETE FROM graphrag.graphrag_sources WHERE id = :sid RETURNING id"),
        {"sid": source_id}
    )
    await db.commit()
    if not res.fetchone():
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return {"message": "문서가 삭제되었습니다.", "source_id": source_id}


@global_router.get("/{source_id}/graph")
async def get_source_graph(
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Graph 시각화를 위한 Nodes 및 Links 반환"""
    # 1. 청크 IDs
    chunk_res = await db.execute(
        text("SELECT id FROM graphrag.graphrag_chunks WHERE source_id = :sid"),
        {"sid": source_id}
    )
    chunk_ids = [str(r.id) for r in chunk_res.fetchall()]

    if not chunk_ids:
        return {"nodes": [], "links": []}

    # 2. 관련 엔티티 (Nodes)
    entity_res = await db.execute(
        text("""
            SELECT id, name, entity_type, description
            FROM graphrag.graphrag_entities
            WHERE source_chunk_ids && CAST(:chunk_ids AS uuid[])
        """),
        {"chunk_ids": chunk_ids}
    )
    entities = entity_res.fetchall()
    entity_ids = [str(e.id) for e in entities]
    
    nodes = []
    for e in entities:
        nodes.append({
            "id": str(e.id),
            "name": e.name,
            "type": e.entity_type,
            "description": e.description,
            "val": 1.5 # 노드 크기용 임의 값
        })

    # 3. 관련 릴레이션 (Links)
    links = []
    if entity_ids:
        rel_res = await db.execute(
            text("""
                SELECT id, source_entity_id, target_entity_id, relation_type, description
                FROM graphrag.graphrag_relations
                WHERE source_entity_id = ANY(CAST(:eids AS uuid[])) OR target_entity_id = ANY(CAST(:eids AS uuid[]))
            """),
            {"eids": entity_ids}
        )
        for r in rel_res.fetchall():
            links.append({
                "source": str(r.source_entity_id),
                "target": str(r.target_entity_id),
                "label": r.relation_type,
                "description": r.description
            })

    # 데이터가 없으면 예시(Mock) 데이터를 조금 섞어주어 화면 확인용으로 사용 (데모 목적)
    if not nodes:
        nodes = [
            {"id": "n1", "name": "탄소중립", "type": "CONCEPT", "val": 3, "description": "온실가스 실질 배출량을 0으로 만드는 것"},
            {"id": "n2", "name": "GHG Protocol", "type": "STANDARD", "val": 2, "description": "글로벌 표준 가이드라인"},
            {"id": "n3", "name": "Scope 1", "type": "METRIC", "val": 1.5, "description": "직접 배출"}
        ]
        links = [
            {"source": "n1", "target": "n2", "label": "STANDARDIZED_BY"},
            {"source": "n2", "target": "n3", "label": "DEFINES"}
        ]

    return {"nodes": nodes, "links": links}

