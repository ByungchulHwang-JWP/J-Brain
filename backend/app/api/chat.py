from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel

from app.core.config import settings
from app.db.session import get_db
from app.api.deps import get_current_user_id

router = APIRouter()

class ChatRequest(BaseModel):
    query: str
    conversation_id: str = None

@router.post("/{workspace_id}/chat")
async def chat_with_bot(
    workspace_id: str,
    req: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    FO 위젯에서 호출하는 챗봇 응답 API (SSE 스트리밍).
    graphrag.system_prompts에서 활성 프롬프트를 조회하고,
    graphrag.graphrag_chunks에서 유사 문서를 검색하여 LLM에 전달합니다.
    """
    # 1. 활성 시스템 프롬프트 조회 (graphrag.system_prompts 실제 컬럼에 맞게)
    prompt_res = await db.execute(
        text("""
            SELECT prompt_content FROM graphrag.system_prompts
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        """)
    )
    prompt_row = prompt_res.fetchone()
    sys_prompt = prompt_row.prompt_content if prompt_row else (
        "당신은 사내 프로젝트 지식 챗봇입니다. "
        "주어진 문서 컨텍스트를 기반으로 정확하고 친절하게 답변하세요. "
        "컨텍스트에 없는 내용은 모른다고 솔직하게 답변하세요."
    )

    # 2. graphrag.graphrag_chunks에서 유사 문서 검색
    # (임베딩이 없을 경우 category 기반 텍스트 검색으로 폴백)
    context = ""
    try:
        from app.ai.retriever import hybrid_retrieve
        context = await hybrid_retrieve(req.query, workspace_id, db)
    except Exception as e:
        # 폴백: 단순 텍스트 검색
        ctx_res = await db.execute(
            text("""
                SELECT c.content
                FROM graphrag.graphrag_chunks c
                JOIN graphrag.graphrag_sources s ON c.source_id = s.id
                WHERE s.category = :cat
                LIMIT 5
            """),
            {"cat": workspace_id}
        )
        ctx_rows = ctx_res.fetchall()
        context = "\n\n".join([r.content for r in ctx_rows]) if ctx_rows else ""

    # 3. LLM 스트리밍 응답 (OpenAI gpt-4o-mini)
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.OPENAI_API_KEY,
            streaming=True
        )

        ctx_text = f"\n\n[참고 문서]\n{context}" if context else ""
        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=f"{ctx_text}\n\n[질문]\n{req.query}")
        ]

        async def response_generator():
            full_response = ""
            async for chunk in llm.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            # 4. 대화 이력 저장 (graphrag.chat_history)
            try:
                session_res = await db.execute(
                    text("INSERT INTO graphrag.chat_sessions (user_id) VALUES (:uid) RETURNING id"),
                    {"uid": user_id}
                )
                session_id = session_res.scalar()
                await db.execute(
                    text("""
                        INSERT INTO graphrag.chat_history (id, user_id, query, answer)
                        VALUES (:sid, :uid, :q, :a)
                    """),
                    {"sid": session_id, "uid": user_id, "q": req.query, "a": full_response}
                )
                await db.commit()
            except Exception:
                pass  # 히스토리 저장 실패는 무시

    except Exception as e:
        # OpenAI 에러 시 안내 메시지 스트리밍
        async def response_generator():
            yield f"오류가 발생했습니다: {str(e)}"

    return StreamingResponse(response_generator(), media_type="text/plain; charset=utf-8")
