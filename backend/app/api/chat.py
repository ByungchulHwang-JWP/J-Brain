import json
import logging
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None


@router.post("/{project_id}/chat")
async def chat_with_bot(
    project_id: str,
    req: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    챗봇 응답 API (SSE 스트리밍).
    1. hybrid_retrieve()로 관련 문서 및 그래프 검색
    2. 시스템 프롬프트 + 컨텍스트 + 질문을 LLM에 전달
    3. 스트리밍 답변 후 출처 정보(JSON)를 별도 블록으로 전송
    """
    # 1. 활성 시스템 프롬프트 조회 (현재 프로젝트용 우선, 없으면 글로벌/최근)
    prompt_res = await db.execute(
        text("""
            SELECT prompt_content FROM graphrag.system_prompts
            WHERE is_active = true 
              AND (project_id = :pid OR project_id IS NULL OR project_id = 'GLOBAL (전역)')
            ORDER BY 
                CASE WHEN project_id = :pid THEN 1 ELSE 2 END ASC,
                created_at DESC
            LIMIT 1
        """),
        {"pid": project_id}
    )
    prompt_row = prompt_res.fetchone()
    sys_prompt = prompt_row.prompt_content if prompt_row else (
        f"당신은 {project_id} 지식 관리 챗봇입니다. "
        "주어진 참고 문서를 기반으로 정확하고 친절하게 답변하세요. "
        "참고 문서에 없는 내용은 '주어진 문서에 해당 내용이 없습니다'라고 솔직하게 답변하세요."
    )

    # 2. 하이브리드 검색 (Vector + Graph + Keyword Fallback)
    retrieve_result = {"context": "", "sources": [], "graph": []}
    try:
        from app.ai.retriever import hybrid_retrieve
        retrieve_result = await hybrid_retrieve(req.query, project_id, db)
        logger.info(
            f"[CHAT] 검색 완료: {len(retrieve_result['sources'])}개 소스, "
            f"{len(retrieve_result['graph'])}개 그래프 팩트"
        )
    except Exception as e:
        logger.error(f"[CHAT] hybrid_retrieve 실패: {e}")

    context = retrieve_result.get("context", "")
    sources = retrieve_result.get("sources", [])
    graph_facts = retrieve_result.get("graph", [])

    # 3. LLM 스트리밍 응답
    async def response_generator():
        full_response = ""
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage

            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=settings.OPENAI_API_KEY,
                streaming=True,
                temperature=0.1
            )

            ctx_section = f"\n\n[참고 문서]\n{context}" if context else "\n\n[참고 문서 없음]"
            messages = [
                SystemMessage(content=sys_prompt),
                HumanMessage(content=f"{ctx_section}\n\n[질문]\n{req.query}")
            ]

            # 스트리밍 청크 전송
            async for chunk in llm.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

        except Exception as e:
            err_msg = f"\n오류가 발생했습니다: {str(e)}"
            full_response = err_msg
            yield err_msg

        # 4. 응답 완료 후 출처 정보를 별도 마커로 전송 (프론트엔드에서 파싱)
        if sources or graph_facts:
            source_data = {
                "type": "SOURCES",
                "vector_sources": sources,
                "graph_facts": graph_facts
            }
            yield f"\n\n__SOURCES__{json.dumps(source_data, ensure_ascii=False)}__SOURCES_END__"

        # 5. 대화 이력 저장
        try:
            session_id = req.conversation_id
            if not session_id:
                session_res = await db.execute(
                    text("INSERT INTO graphrag.chat_sessions (project_id, user_id) VALUES (:pid, :uid) RETURNING id"),
                    {"pid": project_id, "uid": user_id}
                )
                session_id = session_res.scalar()
                
            await db.execute(
                text("""
                    INSERT INTO graphrag.chat_history (session_id, role, content)
                    VALUES (:sid, 'user', :q), (:sid, 'assistant', :a)
                """),
                {"sid": int(session_id), "q": req.query, "a": full_response}
            )
            await db.commit()
        except Exception as e:
            logger.debug(f"[CHAT] 히스토리 저장 실패 (무시): {e}")

    return StreamingResponse(
        response_generator(),
        media_type="text/plain; charset=utf-8"
    )

@router.get("/{project_id}/chat/history")
async def get_chat_history(
    project_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    특정 프로젝트에서의 이전 대화 목록을 가져옵니다.
    """
    try:
        res = await db.execute(
            text("""
                SELECT h.id, h.session_id, h.role, h.content, h.created_at
                FROM graphrag.chat_history h
                JOIN graphrag.chat_sessions s ON h.session_id = s.id
                WHERE s.project_id = :pid AND s.user_id = :uid
                ORDER BY h.created_at ASC
            """),
            {"pid": project_id, "uid": user_id}
        )
        rows = res.fetchall()
        return [
            {
                "id": row.id,
                "session_id": row.session_id,
                "role": row.role,
                "content": row.content,
                "created_at": row.created_at
            }
            for row in rows
        ]
    except Exception as e:
        logger.error(f"[CHAT] 이력 조회 실패: {e}")
        return []

@router.get("/{project_id}/recommended-questions")
async def get_recommended_questions(
    project_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    추천 질문 목록을 반환합니다. (MVP 1차 하드코딩)
    """
    if project_id == "J-Brain":
        return [
            "이 프로젝트의 핵심 목표는 무엇인가요?",
            "J-Brain의 핵심 기술은 무엇인가요?",
            "GraphRAG 엔진은 어떤 역할을 하나요?",
            "J-Brain에서 프로젝트는 무엇을 의미하나요?"
        ]

    return [
        "이 프로젝트의 핵심 목표는 무엇인가요?",
        "등록된 문서의 주요 내용을 요약해 주세요.",
        "문서에서 설명하는 주요 기능은 무엇인가요?",
        "이 프로젝트와 관련된 핵심 용어를 정리해 주세요."
    ]
