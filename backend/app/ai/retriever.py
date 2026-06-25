"""
retriever.py - pgvector 코사인 유사도 검색 + 그래프 검색 + 키워드 폴백
"""
import logging
import re
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

KOREAN_SUFFIXES = (
    "인가요", "나요", "까요", "입니다", "합니다", "에서", "으로", "에게",
    "까지", "부터", "보다", "처럼", "은", "는", "이", "가", "을", "를",
    "의", "와", "과", "로", "에", "도", "만"
)


def _keyword_patterns(query: str, limit: int = 8) -> Dict[str, str]:
    """
    질문 문장 전체가 아니라 핵심 토큰 단위로 키워드 폴백 검색을 수행한다.
    예: "이 프로젝트의 핵심 목표는 무엇인가요?" -> 프로젝트, 핵심, 목표
    """
    patterns = {}
    seen = set()
    for raw_token in re.findall(r"[0-9A-Za-z가-힣]+", query):
        token = raw_token.strip()
        if len(token) < 2:
            continue

        candidates = [token]
        for suffix in KOREAN_SUFFIXES:
            if len(token) > len(suffix) + 1 and token.endswith(suffix):
                candidates.append(token[:-len(suffix)])
                break

        for candidate in candidates:
            if len(candidate) < 2 or candidate in seen:
                continue
            seen.add(candidate)
            patterns[f"kw{len(patterns)}"] = f"%{candidate}%"
            if len(patterns) >= limit:
                return patterns

    if not patterns and query.strip():
        patterns["kw0"] = f"%{query.strip()[:30]}%"

    return patterns


async def hybrid_retrieve(
    query: str,
    project_id: str,
    db: AsyncSession,
    top_k: int = 5
) -> Dict[str, Any]:
    """
    하이브리드 검색: Vector(pgvector) + Graph(entities/relations) + Keyword 폴백
    
    Returns:
        {
          "context": str,           # LLM 프롬프트에 삽입할 통합 컨텍스트
          "sources": List[dict],    # 출처 정보 목록 (Evidence 탭용)
          "graph": List[dict],      # 지식 그래프 관계 목록
        }
    """
    context_pieces = []
    sources = []
    graph_facts = []
    vector_used = False

    # ── 1단계: Vector Search (pgvector 코사인 유사도) ──────────────────────
    try:
        from langchain_openai import OpenAIEmbeddings
        from app.core.config import settings

        embedder = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=settings.OPENAI_API_KEY
        )
        query_vector = await embedder.aembed_query(query)
        vector_str = f"[{','.join(map(str, query_vector))}]"

        vector_rows = await db.execute(
            text("""
                SELECT
                    c.content,
                    c.chunk_index,
                    s.file_name,
                    s.category,
                    1 - (c.embedding <=> CAST(:q_emb AS public.vector)) AS score
                FROM graphrag.graphrag_chunks c
                JOIN graphrag.graphrag_sources s ON c.source_id = s.id
                WHERE s.category = :cat
                  AND c.embedding IS NOT NULL
                  AND s.status IN ('success', 'active')
                ORDER BY c.embedding <=> CAST(:q_emb AS public.vector)
                LIMIT :limit
            """),
            {
                "cat": project_id,
                "q_emb": vector_str,
                "limit": top_k,
            }
        )
        rows = vector_rows.fetchall()

        for row in rows:
            score = round(float(row.score), 4)
            context_pieces.append(f"[관련 문서]\n{row.content}")
            sources.append({
                "file_name": row.file_name,
                "chunk_index": row.chunk_index,
                "score": score,
                "type": "vector"
            })

        vector_used = len(rows) > 0
        logger.info(f"[RETRIEVE] Vector 검색: {len(rows)}개 결과 (workspace={project_id})")

    except Exception as e:
        logger.warning(f"[RETRIEVE] Vector 검색 실패, 키워드 검색으로 폴백: {e}")
        await db.rollback()

    # ── 2단계: Keyword Fallback (Vector 결과 없을 때) ────────────────────────
    if not vector_used:
        try:
            keyword_params = _keyword_patterns(query)
            keyword_clause = " OR ".join(f"c.content ILIKE :{key}" for key in keyword_params)

            keyword_rows = await db.execute(
                text(f"""
                    SELECT
                        c.content,
                        c.chunk_index,
                        s.file_name,
                        s.category
                    FROM graphrag.graphrag_chunks c
                    JOIN graphrag.graphrag_sources s ON c.source_id = s.id
                    WHERE s.category = :cat
                      AND s.status IN ('success', 'active')
                      AND ({keyword_clause})
                    LIMIT :limit
                """),
                {
                    "cat": project_id,
                    "limit": top_k,
                    **keyword_params,
                }
            )
            for row in keyword_rows.fetchall():
                context_pieces.append(f"[관련 문서]\n{row.content}")
                sources.append({
                    "file_name": row.file_name,
                    "chunk_index": row.chunk_index,
                    "score": None,
                    "type": "keyword"
                })
            logger.info(f"[RETRIEVE] Keyword 폴백: {len(sources)}개 결과")
        except Exception as e:
            logger.error(f"[RETRIEVE] Keyword 검색도 실패: {e}")

    # ── 3단계: Graph Search (entities + relations) ────────────────────────────
    try:
        graph_rows = await db.execute(
            text("""
                SELECT
                    e1.name AS source_name,
                    r.relation_type,
                    e2.name AS target_name,
                    r.description
                FROM graphrag.graphrag_relations r
                JOIN graphrag.graphrag_entities e1 ON r.source_entity_id = e1.id
                JOIN graphrag.graphrag_entities e2 ON r.target_entity_id = e2.id
                WHERE (e1.name ILIKE :kw OR e2.name ILIKE :kw)
                LIMIT 5
            """),
            {"kw": f"%{query[:20]}%"}
        )
        for row in graph_rows.fetchall():
            fact = f"[지식 그래프] {row.source_name} --[{row.relation_type}]--> {row.target_name}"
            if row.description:
                fact += f": {row.description}"
            context_pieces.append(fact)
            graph_facts.append({
                "source": row.source_name,
                "relation": row.relation_type,
                "target": row.target_name,
                "description": row.description or ""
            })
        logger.info(f"[RETRIEVE] Graph 검색: {len(graph_facts)}개 결과")
    except Exception as e:
        # 그래프 테이블이 없을 수 있으므로 조용히 통과
        logger.debug(f"[RETRIEVE] Graph 검색 건너뜀: {e}")
        await db.rollback()

    return {
        "context": "\n\n".join(context_pieces) if context_pieces else "",
        "sources": sources,
        "graph": graph_facts
    }
