# GraphRAG AI Agent 공통 프레임워크 테스트 자동화 기본 구조 및 수행 결과서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 280.테스트 |
| WBS | 8.3 테스트 자동화 기본 구조 및 테스트 수행 |
| 담당 | QA / QA Automation Engineer |
| 작성 목적 | GraphRAG Core, VectorStore/GraphStore, HybridRetriever, Sol-Bat 파일럿 회귀 테스트 자동화 구조와 수행 결과 정리 |
| 작성일 | 2026-06-21 |

## 2. 테스트 자동화 목표

테스트 자동화의 목표는 GraphRAG AI Agent 공통 프레임워크의 핵심 기능이 변경 이후에도 안정적으로 유지되는지 반복 검증하는 것이다.

중점 목표는 다음과 같다.

- GraphRAG Core의 Entity, Relation, Evidence, Context 조립 기능 회귀 검증
- VectorStore와 GraphStore의 add/search/delete/upsert/traverse 동작 검증
- HybridRetriever의 vector, graph, evidence 결합 검색 검증
- Sol-Bat 파일럿 도메인 스키마, 샘플 인덱싱, retrieve_knowledge 연계 검증
- 관리자 Source/IndexJob/Preview/Search 흐름의 기본 회귀 검증
- Agent Workflow와 GraphRAGRetrieveNode 연계 검증
- pytest 미설치 환경에서도 최소 회귀 테스트를 수행할 수 있는 실행 구조 제공

## 3. 테스트 자동화 기본 구조

### 3.1 디렉터리 구조

| 경로 | 용도 |
| --- | --- |
| `tests/test_document_pipeline.py` | RAG Core 문서 처리, parser, chunker, normalizer 검증 |
| `tests/test_vectorstores.py` | InMemoryVectorStore, provider registry, adapter 골격 검증 |
| `tests/test_graph_store.py` | InMemoryGraphStore, PostgreSQLGraphStoreAdapter 골격 검증 |
| `tests/test_extractors.py` | EntityExtractor, EntityResolver, RelationExtractor, EvidenceLinker 검증 |
| `tests/test_context_assembler.py` | ContextAssembler citation/context 생성 검증 |
| `tests/test_hybrid_retriever.py` | HybridRetriever, score 병합, retrieval result 검증 |
| `tests/test_graphrag_retrieve_node.py` | GraphRAGRetrieveNode workflow state 반영 검증 |
| `tests/test_agent_workflow.py` | WorkflowFactory, Answer Node, Structured Output Node 검증 |
| `tests/test_admin_mvp.py` | 관리자 Source/IndexJob/Preview/Search 기본 흐름 검증 |
| `tests/test_sol_bat_pilot.py` | Sol-Bat 파일럿 schema, indexing, retrieve_knowledge adapter 검증 |
| `tools/run_tests.py` | pytest 미설치 환경용 간이 테스트 러너 |

### 3.2 테스트 실행 방식

기본 실행 방식은 pytest 기반이다.

```powershell
python -m pytest
```

Codex 번들 Python 환경에 pytest를 설치한 뒤 공식 테스트 명령으로 재수행했다. `tools/run_tests.py`는 pytest 설치가 어려운 제한 환경에서 사용할 수 있는 보조 회귀 테스트 러너로 유지한다.

```powershell
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tools\run_tests.py
```

컴파일 검증은 다음 명령으로 수행했다.

```powershell
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m compileall src tests tools
```

### 3.3 자동화 계층

| 계층 | 대상 | 자동화 방식 | 현재 상태 |
| --- | --- | --- | --- |
| Unit Test | normalizer, chunker, scoring, schema | pytest 호환 함수 | 구성 완료 |
| Component Test | VectorStore, GraphStore, Extractor, ContextAssembler | pytest 호환 함수 | 구성 완료 |
| Integration Test | HybridRetriever, GraphRAGRetrieveNode, Agent Workflow | pytest 호환 함수 | 구성 완료 |
| Admin Flow Test | Source 등록, IndexJob 실행, Preview, Search | service-level 테스트 | 구성 완료 |
| Pilot Regression Test | Sol-Bat schema/indexing/search/adapter | fixture 성격의 runtime 생성 테스트 | 구성 완료 |
| E2E Browser Test | 관리자 실제 화면 조작 | Playwright 등 필요 | 후속 과제 |
| Performance Test | indexing/retrieval latency | 반복 실행 스크립트 필요 | 후속 과제 |

## 4. 테스트 자동화 대상 매핑

| 검증 범위 | 테스트 파일 | 주요 테스트 |
| --- | --- | --- |
| GraphRAG Core | `test_extractors.py`, `test_context_assembler.py`, `test_graphrag_schemas.py` | entity 추출, resolver 병합, relation 추출, evidence flow, citation 생성 |
| VectorStore | `test_vectorstores.py` | add/search/delete, filter 조회, provider registry |
| GraphStore | `test_graph_store.py` | entity upsert/find, relation/evidence/traverse, source 삭제, PostgreSQL adapter skeleton |
| HybridRetriever | `test_hybrid_retriever.py` | vector+graph+evidence 결합, vector-only 검색, score 정규화 |
| Source/IndexJob/Preview | `test_admin_mvp.py` | Source 등록, IndexJob, Preview, retry, delete |
| Agent 연계 | `test_agent_workflow.py`, `test_graphrag_retrieve_node.py` | workflow 실행, retrieve node context 반영, 오류 중단 |
| Sol-Bat 파일럿 | `test_sol_bat_pilot.py` | schema 확인, 샘플 runtime indexing, retrieve_knowledge adapter |
| RAG Core | `test_document_pipeline.py` | parser, chunker, metadata enrich, text normalize |

## 5. 테스트 수행 결과 요약

| 항목 | 결과 |
| --- | --- |
| 수행일 | 2026-06-21 20:57:24 +09:00 |
| 수행 환경 | Codex bundled Python |
| Python 실행 파일 | `C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe` |
| 컴파일 검증 | PASS |
| pytest 실행 | PASS - pytest 9.1.1 기준 32개 테스트 통과 |
| 간이 러너 수행 | PASS |
| 총 테스트 수 | 32 |
| 성공 | 32 |
| 실패 | 0 |
| 스킵 | 0 |
| 최종 결과 | PASS |

## 6. 상세 수행 결과

### 6.1 GraphRAG Core

| 테스트 파일 | 테스트 수 | 결과 | 검증 내용 |
| --- | ---: | --- | --- |
| `test_extractors.py` | 4 | PASS | Sol-Bat Entity 추출, EntityResolver 중복 병합, RelationExtractor 키워드/스키마 매칭, EvidenceLinker-GraphStore 흐름 |
| `test_context_assembler.py` | 1 | PASS | 검색 결과 기반 citation/context 생성 |
| `test_graphrag_schemas.py` | 2 | PASS | 기본 schema registry, ChunkInput 기본 metadata |
| `test_graphrag_retrieve_node.py` | 1 | PASS | GraphRAGRetrieveNode가 workflow state에 context 추가 |

### 6.2 VectorStore / GraphStore

| 테스트 파일 | 테스트 수 | 결과 | 검증 내용 |
| --- | ---: | --- | --- |
| `test_vectorstores.py` | 4 | PASS | InMemoryVectorStore add/search/delete, chunk filter, provider registry, provider override |
| `test_graph_store.py` | 4 | PASS | entity upsert/find, relation/evidence/traverse, source 단위 삭제, PostgreSQL adapter skeleton |

### 6.3 HybridRetriever

| 테스트 파일 | 테스트 수 | 결과 | 검증 내용 |
| --- | ---: | --- | --- |
| `test_hybrid_retriever.py` | 3 | PASS | vector+graph+evidence 결합 검색, vector-only 검색, hybrid score 정규화 및 가중치 계산 |

### 6.4 Sol-Bat 파일럿 회귀 테스트

| 테스트 파일 | 테스트 수 | 결과 | 검증 내용 |
| --- | ---: | --- | --- |
| `test_sol_bat_pilot.py` | 3 | PASS | Sol-Bat schema entity/relation type, pilot runtime indexing/search, retrieve_knowledge adapter state 갱신 |

### 6.5 관리자 / Agent / RAG Core

| 테스트 파일 | 테스트 수 | 결과 | 검증 내용 |
| --- | ---: | --- | --- |
| `test_admin_mvp.py` | 4 | PASS | Source 등록/삭제, IndexJob retry, Preview, Search flow |
| `test_agent_workflow.py` | 2 | PASS | retrieve-answer-structured output workflow, retrieve 오류 시 workflow 중단 |
| `test_document_pipeline.py` | 4 | PASS | TextNormalizer, ParserRegistry, Chunker, DocumentPipeline metadata enrich |

## 7. 실행 로그 요약

간이 테스트 러너 수행 결과는 다음과 같다.

```text
SUMMARY passed=32 total=32 failed=0 skipped=0
```

컴파일 검증 결과는 다음과 같다.

```text
compileall src tests tools: PASS
```

pytest 실행 결과는 다음과 같다.

```text
pytest 9.1.1
32 passed in 0.44s
```

`pyproject.toml`에는 `test` optional dependency로 `pytest>=7.0.0`이 정의되어 있으므로, 신규 개발 환경에서는 다음 방식으로 설치 후 pytest 실행을 권장한다.

```powershell
pip install -e .[test]
python -m pytest
```

## 8. 결함 및 이슈

| ID | 유형 | 내용 | 영향도 | 조치 |
| --- | --- | --- | --- | --- |
| QA-ISSUE-001 | 환경 | Codex 번들 Python에 pytest 설치 후 공식 테스트 재수행 완료 | Closed | `pytest 9.1.1`, `32 passed in 0.44s` 확인 |
| QA-ISSUE-002 | 자동화 범위 | 관리자 실제 브라우저 E2E 테스트는 미구성 | Medium | Playwright 기반 E2E 테스트 후속 구성 필요 |
| QA-ISSUE-003 | 성능 테스트 | indexing/retrieval 성능 측정 자동화 미구성 | Medium | 반복 실행 스크립트와 기준치 정의 필요 |
| QA-ISSUE-004 | 외부 저장소 | FAISS/PGVector/PostgreSQL adapter는 skeleton 중심 검증 | Low | 실제 provider 연결 환경 확정 후 통합 테스트 확장 |

## 9. 품질 판단

현재 자동화 테스트 기준으로 GraphRAG AI Agent 공통 프레임워크의 핵심 회귀 테스트는 통과했다.

판단 근거는 다음과 같다.

- GraphRAG Core 추출/연결/context 흐름이 테스트로 검증되었다.
- VectorStore/GraphStore 기본 저장소 기능과 provider registry가 검증되었다.
- HybridRetriever의 결합 검색과 scoring이 검증되었다.
- Sol-Bat 파일럿의 schema, indexing, search, state adapter가 검증되었다.
- 관리자 MVP의 Source/IndexJob/Preview/Search 흐름이 service level로 검증되었다.
- Agent Workflow와 GraphRAGRetrieveNode 연계가 검증되었다.

단, 실제 운영 수준 품질 판정을 위해서는 다음 보완이 필요하다.

- pytest 설치 환경에서 공식 테스트 수행
- 관리자 사이트 브라우저 E2E 테스트 추가
- Source 대량 등록 및 retrieval 성능 기준 테스트 추가
- PGVector/PostgreSQL 등 실제 저장소 provider 통합 테스트 추가
- 권한/인증이 실제 보안 모듈과 연결된 상태의 API 테스트 추가

## 10. 다음 작업

다음 작업은 테스트 결과를 기준으로 결함관리대장을 작성하고, 280.테스트 단계의 잔여 검증 범위를 정리하는 것이다.

권장 요청 문구는 다음과 같다.

```text
[QA] 280.테스트 단계의 결함관리대장과 테스트 보완사항 목록을 작성해 주세요. pytest 환경 제약, 관리자 E2E, 성능 테스트, 실제 저장소 통합 테스트, 보안/권한 API 테스트 보완사항을 포함해 주세요.
```
