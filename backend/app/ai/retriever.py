from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def hybrid_retrieve(query: str, workspace_id: str, db: AsyncSession, top_k: int = 5) -> str:
    """
    하이브리드 검색: Vector Search (pgvector) + Graph Search (relations 테이블).
    실제 DB 스키마:
      - graphrag.graphrag_chunks: id(uuid), source_id(uuid), content, embedding(vector), created_at
      - graphrag.graphrag_sources: id(uuid), file_name, category, status
      - graphrag.graphrag_relations: source_entity_id, target_entity_id, relation_type, description
    """
    context_pieces = []

    # 1. Vector Search - embedding이 있는 경우 코사인 유사도 검색
    try:
        from langchain_openai import OpenAIEmbeddings
        from app.core.config import settings

        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=settings.OPENAI_API_KEY
        )
        query_vector = await embeddings.aembed_query(query)
        query_emb_str = f"[{','.join(map(str, query_vector))}]"

        vector_results = await db.execute(
            text("""
                SELECT c.content
                FROM graphrag.graphrag_chunks c
                JOIN graphrag.graphrag_sources s ON c.source_id = s.id
                WHERE s.category = :cat
                  AND c.embedding IS NOT NULL
                ORDER BY c.embedding <=> :q_emb
                LIMIT :limit
            """),
            {"cat": workspace_id, "q_emb": query_emb_str, "limit": top_k}
        )
        for row in vector_results.fetchall():
            context_pieces.append(f"[관련 문서]\n{row.content}")

    except Exception:
        # 임베딩 실패 시 텍스트 키워드 검색으로 폴백
        keyword_results = await db.execute(
            text("""
                SELECT c.content
                FROM graphrag.graphrag_chunks c
                JOIN graphrag.graphrag_sources s ON c.source_id = s.id
                WHERE s.category = :cat
                  AND c.content ILIKE :kw
                LIMIT :limit
            """),
            {"cat": workspace_id, "kw": f"%{query[:20]}%", "limit": top_k}
        )
        for row in keyword_results.fetchall():
            context_pieces.append(f"[관련 문서]\n{row.content}")

    # 2. Graph Search - 관련 엔티티/관계 검색
    try:
        graph_results = await db.execute(
            text("""
                SELECT e1.name AS source_name, r.relation_type, e2.name AS target_name, r.description
                FROM graphrag.graphrag_relations r
                JOIN graphrag.graphrag_entities e1 ON r.source_entity_id = e1.id
                JOIN graphrag.graphrag_entities e2 ON r.target_entity_id = e2.id
                WHERE (e1.name ILIKE :kw OR e2.name ILIKE :kw)
                LIMIT 3
            """),
            {"kw": f"%{query[:15]}%"}
        )
        for row in graph_results.fetchall():
            context_pieces.append(
                f"[지식 그래프] {row.source_name} --[{row.relation_type}]--> {row.target_name}: {row.description or ''}"
            )
    except Exception:
        pass

    return "\n\n".join(context_pieces) if context_pieces else ""
