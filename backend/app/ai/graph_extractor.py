import logging
import json
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger(__name__)

async def extract_and_store_graph(
    source_id: str,
    project_id: str,
    db: AsyncSession
):
    """
    지정된 source_id의 청크들을 읽어와서 LLM을 통해 Entity와 Relation을 추출하고 DB에 저장합니다.
    """
    logger.info(f"[GRAPH_EXTRACT] 시작: source_id={source_id}")

    # 1. 청크 목록 조회
    try:
        chunks_res = await db.execute(
            text("""
                SELECT id, content 
                FROM graphrag.graphrag_chunks 
                WHERE source_id = :sid
                ORDER BY chunk_index ASC
            """),
            {"sid": source_id}
        )
        chunks = chunks_res.fetchall()
    except Exception as e:
        logger.error(f"[GRAPH_EXTRACT] 청크 조회 실패: {e}")
        return

    if not chunks:
        logger.warning(f"[GRAPH_EXTRACT] 처리할 청크가 없습니다: source_id={source_id}")
        return

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        temperature=0.0
    )

    system_prompt = """
    당신은 지식 그래프(Knowledge Graph) 추출기입니다.
    주어진 텍스트에서 중요한 개체(Entity)와 그들 간의 관계(Relation)를 추출하세요.
    응답은 반드시 아래 JSON 형식만 반환해야 합니다. 다른 텍스트는 포함하지 마세요.
    
    개체 유형(type)은 다음 중 하나여야 합니다: CONCEPT, ORG, PERSON, LOCATION, EVENT, POLICY, OTHER.
    
    {
      "entities": [
        {"name": "개체명", "type": "개체유형", "description": "개체에 대한 간략한 설명"}
      ],
      "relations": [
        {"source": "시작개체명", "target": "대상개체명", "type": "관계유형", "description": "관계에 대한 간략한 설명"}
      ]
    }
    """

    BATCH_SIZE = 5
    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i:i+BATCH_SIZE]
        
        for chunk_row in batch_chunks:
            chunk_id = str(chunk_row.id)
            content = chunk_row.content

            try:
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"[텍스트]\n{content}")
                ]
                
                response = await llm.ainvoke(messages)
                response_text = response.content.strip()
                
                # 마크다운 코드 블록 제거
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                data = json.loads(response_text)
                
                entities = data.get("entities", [])
                relations = data.get("relations", [])
                
                # 엔티티 저장
                entity_id_map = {}
                for ent in entities:
                    name = ent.get("name")
                    ent_type = ent.get("type", "OTHER")
                    desc = ent.get("description", "")
                    
                    if not name:
                        continue
                        
                    sel_res = await db.execute(
                        text("SELECT id, source_chunk_ids FROM graphrag.graphrag_entities WHERE name = :name LIMIT 1"),
                        {"name": name}
                    )
                    row = sel_res.fetchone()
                    if row:
                        inserted_id = str(row.id)
                        chunk_ids = [str(cid) for cid in (row.source_chunk_ids or [])]
                        if chunk_id not in chunk_ids:
                            await db.execute(
                                text("UPDATE graphrag.graphrag_entities SET source_chunk_ids = array_append(source_chunk_ids, :cid) WHERE id = :id"),
                                {"cid": chunk_id, "id": inserted_id}
                            )
                    else:
                        inserted_id = str(uuid4())
                        await db.execute(
                            text("""
                                INSERT INTO graphrag.graphrag_entities (id, name, entity_type, description, source_chunk_ids)
                                VALUES (:id, :name, :type, :desc, CAST(ARRAY[:cid] AS uuid[]))
                            """),
                            {"id": inserted_id, "name": name, "type": ent_type, "desc": desc, "cid": chunk_id}
                        )
                    
                    entity_id_map[name] = inserted_id
                        
                # 릴레이션 저장
                for rel in relations:
                    src_name = rel.get("source")
                    tgt_name = rel.get("target")
                    rel_type = rel.get("type", "RELATED_TO")
                    rel_desc = rel.get("description", "")
                    
                    if not src_name or not tgt_name:
                        continue
                        
                    src_id = entity_id_map.get(src_name)
                    tgt_id = entity_id_map.get(tgt_name)
                    
                    if src_id and tgt_id:
                        sel_rel = await db.execute(
                            text("SELECT id, source_chunk_ids FROM graphrag.graphrag_relations WHERE source_entity_id = :sid AND target_entity_id = :tid LIMIT 1"),
                            {"sid": src_id, "tid": tgt_id}
                        )
                        rel_row = sel_rel.fetchone()
                        if rel_row:
                            rel_id = str(rel_row.id)
                            chunk_ids = [str(cid) for cid in (rel_row.source_chunk_ids or [])]
                            if chunk_id not in chunk_ids:
                                await db.execute(
                                    text("UPDATE graphrag.graphrag_relations SET source_chunk_ids = array_append(source_chunk_ids, :cid) WHERE id = :id"),
                                    {"cid": chunk_id, "id": rel_id}
                                )
                        else:
                            await db.execute(
                                text("""
                                    INSERT INTO graphrag.graphrag_relations 
                                    (id, source_entity_id, target_entity_id, relation_type, description, source_chunk_ids)
                                    VALUES (:id, :sid, :tid, :rtype, :desc, CAST(ARRAY[:cid] AS uuid[]))
                                """),
                                {"id": str(uuid4()), "sid": src_id, "tid": tgt_id, "rtype": rel_type, "desc": rel_desc, "cid": chunk_id}
                            )
                
                await db.commit()
                
            except Exception as e:
                logger.error(f"[GRAPH_EXTRACT] 청크 {chunk_id} 처리 실패: {e}")
                await db.rollback()
                
    logger.info(f"[GRAPH_EXTRACT] 완료: source_id={source_id}")
