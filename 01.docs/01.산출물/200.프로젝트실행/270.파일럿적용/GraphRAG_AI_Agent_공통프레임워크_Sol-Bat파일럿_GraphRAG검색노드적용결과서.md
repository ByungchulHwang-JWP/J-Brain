# GraphRAG AI Agent 공통 프레임워크 Sol-Bat 파일럿 GraphRAG 검색 노드 적용 결과서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 270.파일럿 적용 |
| WBS | 7.3 GraphRAG 검색 노드 적용 |
| 담당 | GraphRAG Engineer / Backend Engineer |
| 대상 프로젝트 | Sol-Bat |
| 작성 목적 | Sol-Bat 파일럿을 위한 GraphRAG 검색 노드 적용 PoC 구성 결과와 `retrieve_knowledge` 연계 방안을 정리 |
| 작성일 | 2026-06-21 |

## 2. 적용 개요

이번 작업은 Sol-Bat 원본 코드를 직접 변경하지 않고, GraphRAG 공통 프레임워크 저장소 내부에 Sol-Bat 파일럿용 PoC adapter를 구성하는 방식으로 진행하였다.

적용 범위는 다음과 같다.

| 구분 | 적용 내용 |
| --- | --- |
| SchemaRegistry | Sol-Bat 파일럿 도메인 스키마 `1.1.0-pilot` 반영 |
| RelationExtractor | Sol-Bat Relation Type 기준 keyword rule 보완 |
| Source 인덱싱 샘플 | 토마토/고추 농업 지식 텍스트 샘플 2건 구성 |
| HybridRetriever 검색 | InMemoryVectorStore + InMemoryGraphStore 기반 HYBRID 검색 검증 |
| Agent 연계 | Sol-Bat `FarmingState` 유사 dict를 GraphRAG query로 변환하고 검색 결과를 state에 반영 |
| 테스트 | `test_sol_bat_pilot.py`, `test_extractors.py` 직접 검증 |

## 3. 변경 파일

| 파일 | 변경/추가 내용 |
| --- | --- |
| `src/common_core/ai_pipeline/graphrag/schema_registry.py` | `sol_bat_pilot_schema()` 추가, 기본 Sol-Bat 스키마 정상화 |
| `src/common_core/ai_pipeline/graphrag/relation_extractor.py` | `HAS_RISK_OF`, `PREVENTS`, `TREATS`, `AFFECTS`, `APPLIES_AT` keyword rule 반영 |
| `src/common_core/ai_pipeline/vectorstores/in_memory.py` | 한글 검색을 위한 `isalnum()` 기반 토큰화 보완 |
| `src/common_core/pilots/__init__.py` | 파일럿 helper package 추가 |
| `src/common_core/pilots/sol_bat.py` | Sol-Bat 샘플 Source 인덱싱, HybridRetriever runtime, state adapter 구현 |
| `tests/test_extractors.py` | Sol-Bat 신규 Entity/Relation Type 기준 테스트 보완 |
| `tests/test_sol_bat_pilot.py` | Sol-Bat 파일럿 스키마, 샘플 인덱싱, GraphRAG state 연계 테스트 추가 |

## 4. SchemaRegistry 보완 결과

Sol-Bat 기본 스키마를 도메인 스키마 정의서 기준으로 정리하였다.

| Entity Type | 설명 |
| --- | --- |
| `CROP` | 작물 |
| `PEST_DISEASE` | 병해충 |
| `SYMPTOM` | 증상 |
| `ENVIRONMENT_CONDITION` | 환경조건 |
| `MANAGEMENT_ACTION` | 관리작업 |
| `AGRI_MATERIAL` | 농자재 |
| `REGION` | 지역 |
| `GROWTH_STAGE` | 생육단계 |

| Relation Type | 설명 |
| --- | --- |
| `HAS_RISK_OF` | 발생위험 |
| `PREVENTS` | 예방 |
| `TREATS` | 처방 |
| `AFFECTS` | 영향 |
| `APPLIES_AT` | 적용시기 |

## 5. Source 인덱싱 샘플

PoC 소스: `src/common_core/pilots/sol_bat.py`

| Source ID | 이름 | 내용 |
| --- | --- | --- |
| `solbat-pilot-tomato` | `tomato-disease-guide` | 토마토 개화기, 다습 환경, 잿빛곰팡이병, 환기, 예방 방제 |
| `solbat-pilot-pepper` | `pepper-anthracnose-guide` | 강우 후 고추 탄저병, 살균제 살포, 병든 과실 제거 |

샘플 인덱싱 흐름:

1. `DocumentPipeline.process()`로 Source를 Document/Chunk로 변환
2. `InMemoryVectorStore.add_chunks()`로 Chunk 저장
3. `EntityExtractor.extract()`로 Entity 후보 추출
4. `EntityResolver.resolve()`로 Entity 정규화
5. `RelationExtractor.extract()`로 Relation 후보 추출
6. `EvidenceLinker.link()`로 Chunk 기반 Evidence 연결
7. `HybridRetriever`에 VectorStore/GraphStore 연결

## 6. HybridRetriever 검색 결과

검증 질의:

```text
토마토 다습 잿빛곰팡이병 예방 방제
```

검증 결과:

| 항목 | 결과 |
| --- | --- |
| Source 수 | 2건 |
| Chunk 수 | 2건 이상 |
| Entity 수 | 4건 이상 |
| Relation 수 | 1건 이상 |
| Retrieval status | HIT |
| Retrieval strategy | HYBRID |

## 7. `retrieve_knowledge` 연계 방안

Sol-Bat 현행 연계 대상:

| Sol-Bat 파일 | 현행 기능 | GraphRAG 연계 방향 |
| --- | --- | --- |
| `Sol-Bat/src/nodes.py` | `retrieve_knowledge(state)`에서 기존 `rag_manager.search()` 호출 | GraphRAG 검색 adapter를 호출하여 `knowledge_context`, `graphrag_context`, `ontology_relations` 반영 |
| `Sol-Bat/src/rag/rag_manager.py` | PGVector 기반 검색 | 1차 파일럿에서는 fallback으로 유지 |
| `Sol-Bat/app/api.py` | `/kb/upload`, `/kb/documents`, `/kb/documents/{doc_id}/chunks` | Source/IndexJob/Preview API와 매핑 |

PoC adapter 함수:

| 함수 | 역할 |
| --- | --- |
| `build_sol_bat_retrieval_query(state)` | Sol-Bat FarmingState에서 지역, 작물, 생육단계, 위험요소, 날씨/토양 값을 조합해 검색 질의 생성 |
| `retrieve_knowledge_with_graphrag(state, retriever)` | GraphRAG HYBRID 검색을 실행하고 state에 `knowledge_context`, `graphrag_context`, `ontology_relations` 추가 |
| `create_sol_bat_pilot_runtime()` | 샘플 Source를 인덱싱하고 HybridRetriever를 반환 |

Sol-Bat `retrieve_knowledge` 적용 예시:

```python
from common_core.pilots.sol_bat import retrieve_knowledge_with_graphrag

def retrieve_knowledge(state):
    try:
        return retrieve_knowledge_with_graphrag(state, graphrag_retriever)
    except Exception:
        context = rag_manager.search(query, k=3)
        state["knowledge_context"] = context
        return state
```

## 8. 검증 결과

| 검증 | 명령/방식 | 결과 |
| --- | --- | --- |
| 컴파일 | `python -m compileall src tests` | 통과 |
| Sol-Bat PoC 테스트 | `tests.test_sol_bat_pilot` 함수 직접 호출 | 통과 |
| Extractor 테스트 | `tests.test_extractors` 함수 직접 호출 | 통과 |
| pytest | `pytest` 미설치 | 실행 불가 |

주의:

PowerShell 파이프 방식의 inline Python에서는 한글 문자열이 `???`로 전달되는 현상이 있어, 한글 검증은 UTF-8로 저장된 테스트 파일을 import하여 직접 호출하는 방식으로 수행하였다.

## 9. 제약 및 보완 사항

| 항목 | 제약 | 후속 보완 |
| --- | --- | --- |
| 저장소 | InMemory 기반 PoC | Sol-Bat PGVector/Supabase 연동 adapter 검증 필요 |
| Source | 샘플 텍스트 2건 | P1 TXT/PDF 파일럿 데이터 인덱싱으로 확장 |
| Relation | keyword rule 기반 | LLM 추출 또는 도메인 rule 고도화 필요 |
| Agent 연계 | state adapter PoC | Sol-Bat `src/nodes.py` 실제 연결은 다음 구현 작업에서 수행 |
| 오류 처리 | 기본 fallback 방향만 정의 | 운영 오류 코드/로깅/추적 보완 필요 |

## 10. 다음 작업

다음 작업은 WBS 기준 `7.4 파일럿 데이터 인덱싱`이다.

권장 요청 문구:

```text
[Data Engineer/GraphRAG Engineer] 270.파일럿 적용 단계의 Sol-Bat 파일럿 데이터 인덱싱 결과서를 작성하고 샘플 데이터를 인덱싱해 주세요. P1 데이터 3건, Source 등록, IndexJob 실행, Chunk/Entity/Relation/Evidence Preview, Hybrid 검색 결과를 포함해 주세요.
```
