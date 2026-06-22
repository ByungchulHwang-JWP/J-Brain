# GraphRAG AI Agent 공통 프레임워크 릴리즈 태그 및 버전 정리

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 300.종료 |
| WBS | 10.4 릴리즈 태그 및 버전 정리 |
| 담당 | Configuration Manager / DevOps |
| 작성 목적 | 현재 버전, 릴리즈 범위, 포함 산출물, 포함 소스, 테스트 결과, GitHub 태그/릴리즈 권고안 정리 |
| 작성일 | 2026-06-21 |

## 2. 현재 버전 정보

| 항목 | 값 |
| --- | --- |
| 패키지명 | `graphrag-ai-agent-common-framework` |
| 현재 버전 | `0.1.0` |
| Python 요구 버전 | `>=3.10` |
| 현재 브랜치 | `main` |
| 마지막 커밋 | `83933e2` |
| 릴리즈 기준 상태 | 최종 산출물 및 종료 단계 문서 작성 중, 미커밋 변경 존재 |

현재 버전은 `pyproject.toml`의 `[project].version` 기준 `0.1.0`이다.

## 3. 릴리즈 구분

| 릴리즈 | 권고 버전 | 목적 | 상태 |
| --- | --- | --- | --- |
| 내부 산출물 릴리즈 | `v0.1.0-docs-complete` | 계획~종료 산출물 정리 완료 기준 | 권고 |
| 프레임워크 PoC 릴리즈 | `v0.1.0-poc` | RAG/GraphRAG/Agent/Admin MVP/파일럿 PoC 기준 | 권고 |
| 운영 후보 릴리즈 | `v0.2.0-rc1` | 실제 저장소/보안/E2E/성능 보완 후 | 후속 |
| 운영 릴리즈 | `v1.0.0` | 운영 저장소, 보안, CI/CD, E2E, 성능 기준 충족 후 | 후속 |

본 프로젝트 종료 시점의 권고 태그는 `v0.1.0-poc`이다. 산출물 완료 기준을 더 강조하려면 `v0.1.0-docs-complete` 태그를 함께 사용할 수 있다.

## 4. 릴리즈 범위

이번 릴리즈 범위는 GraphRAG AI Agent 공통 프레임워크의 1차 PoC 및 산출물 기준선이다.

| 범위 | 포함 여부 | 설명 |
| --- | --- | --- |
| 프로젝트 계획 산출물 | 포함 | 프로젝트계획서, WBS, 인력정의, 검토/확정 |
| 아키텍처/요구/분석/설계 산출물 | 포함 | 공통 프레임워크 구조와 요구/설계 기준선 |
| 구현 산출물 | 포함 | RAG Core, GraphRAG Core, Agent Workflow, Admin MVP 구현 결과 |
| Sol-Bat 파일럿 | 포함 | 도메인 스키마, 인덱싱, 검색, Agent 연계 PoC |
| 테스트 산출물 | 포함 | 테스트계획, 시나리오, 자동화 결과, 결함 조치 |
| 이행 산출물 | 포함 | 사용자/운영자 매뉴얼, 적용 가이드, 배포 체크리스트 |
| 종료 산출물 | 포함 | 최종 산출물 목록, 완료보고서, Lessons Learned, 릴리즈 정리 |
| 운영 저장소 실연계 | 제외 | PGVector/PostgreSQL 통합은 후속 릴리즈 |
| 관리자 브라우저 E2E | 제외 | Playwright E2E는 후속 릴리즈 |
| 실제 인증/권한 모듈 | 제외 | 실제 보안 모듈 연계는 후속 릴리즈 |
| 대량 데이터 성능 기준 | 제외 | 성능 테스트/기준 수립은 후속 릴리즈 |

## 5. 포함 산출물

### 5.1 문서 산출물

| 단계 | 대표 산출물 |
| --- | --- |
| 100.프로젝트계획 | 프로젝트계획서, 단계별 인력정의서, WBS, WBS Gantt, 계획산출물 검토/확정 |
| 210.아키텍처정의 | 시스템아키텍처정의서, GraphRAG아키텍처정의서, 데이터저장소아키텍처정의서, 개발표준정의서 |
| 220.요구정의 | 액터목록/유스케이스목록, 요구사항정의서, 요구사항추적표 |
| 230.분석 | 기존프로젝트공통기능분석서, RAG/Agent구현현황분석서, 용어정의서, 논리데이터모델분석서, 인터페이스분석서 |
| 240.설계 | 공통모듈상세설계서, GraphRAG Core상세설계서, 물리데이터모델설계서, API명세서, OpenAPI, 화면정의서, 컴포넌트설계서 |
| 250.구현 | RAG Core, VectorStore, GraphStore, Extractor, HybridRetriever, AgentWorkflow, 관리자 MVP 구현 결과 |
| 270.파일럿 적용 | Sol-Bat 파일럿 적용 범위, 도메인 스키마, 검색 노드 적용, 데이터 인덱싱, 동작 확인, 검토/확정 |
| 280.테스트 | 테스트계획서, 테스트시나리오, 자동화 수행 결과, 결함관리, 테스트 결과 확정 |
| 290.이행 | 사용자매뉴얼, 운영자매뉴얼, 신규서비스 적용 가이드, 배포/운영 체크리스트, 이행 준비상태 검토서 |
| 300.종료 | 최종산출물목록, 프로젝트완료보고서, Lessons Learned, 릴리즈 태그 및 버전 정리 |

### 5.2 소스 산출물

| 경로 | 포함 내용 |
| --- | --- |
| `src/common_core/admin` | AdminService, DTO, FastAPI Router skeleton, 관리자 MVP HTML |
| `src/common_core/agents` | WorkflowFactory, BaseAgentState, Agent nodes |
| `src/common_core/ai_pipeline/document` | DocumentPipeline, ParserRegistry, Chunker, MetadataEnricher, TextNormalizer |
| `src/common_core/ai_pipeline/graphrag` | SchemaRegistry, Entity/Relation/Evidence, GraphStore, HybridRetriever, ContextAssembler |
| `src/common_core/ai_pipeline/vectorstores` | VectorStoreFactory, InMemoryVectorStore, FAISS/PGVector adapter skeleton |
| `src/common_core/pilots` | Sol-Bat 파일럿 runtime 및 데이터 인덱싱 helper |
| `src/common_core/ops` | 공통 오류 코드 |
| `tools/run_tests.py` | pytest 미설치 환경용 보조 테스트 러너 |

### 5.3 테스트 산출물

| 파일 | 검증 대상 |
| --- | --- |
| `tests/test_admin_mvp.py` | Admin Source/IndexJob/Preview/Search flow |
| `tests/test_agent_workflow.py` | Agent Workflow |
| `tests/test_context_assembler.py` | ContextAssembler |
| `tests/test_document_pipeline.py` | RAG Core |
| `tests/test_extractors.py` | Entity/Relation/Evidence flow |
| `tests/test_graph_store.py` | GraphStore |
| `tests/test_graphrag_retrieve_node.py` | GraphRAGRetrieveNode |
| `tests/test_graphrag_schemas.py` | Schema/ChunkInput |
| `tests/test_hybrid_retriever.py` | HybridRetriever |
| `tests/test_sol_bat_pilot.py` | Sol-Bat 파일럿 |
| `tests/test_vectorstores.py` | VectorStoreFactory/InMemoryVectorStore |

## 6. 테스트 결과

릴리즈 기준 테스트 결과는 다음과 같다.

| 항목 | 결과 |
| --- | --- |
| 테스트 프레임워크 | pytest 9.1.1 |
| 테스트 수 | 32 |
| 성공 | 32 |
| 실패 | 0 |
| 최종 결과 | PASS |
| compileall | PASS |

릴리즈 전 재확인 권장 명령은 다음과 같다.

```powershell
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m compileall src tests tools
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest
```

## 7. GitHub 태그 권고안

### 7.1 태그 생성 전제

태그 생성 전 다음 조건을 만족해야 한다.

| 조건 | 기준 |
| --- | --- |
| 작업 내용 커밋 | 280/290/300 산출물과 `tools/run_tests.py` 포함 |
| 테스트 통과 | `python -m pytest` 전체 PASS |
| WBS 최종 업데이트 | 사용자가 요청한 최종 업데이트 시점에 반영 |
| 원격 push | `main` 브랜치 최신화 |
| 릴리즈 노트 | 포함 범위, 테스트 결과, 후속 과제 명시 |

### 7.2 권고 태그

| 태그 | 용도 |
| --- | --- |
| `v0.1.0-poc` | GraphRAG AI Agent 공통 프레임워크 PoC 기준선 |
| `v0.1.0-docs-complete` | 프로젝트 산출물 완료 기준선 |

### 7.3 태그 생성 명령 예시

최종 커밋 후 다음 명령을 사용한다.

```powershell
git tag -a v0.1.0-poc -m "GraphRAG AI Agent common framework PoC release"
git push origin v0.1.0-poc
```

산출물 완료 태그를 별도로 둘 경우 다음을 사용한다.

```powershell
git tag -a v0.1.0-docs-complete -m "GraphRAG AI Agent project deliverables complete"
git push origin v0.1.0-docs-complete
```

## 8. GitHub Release 권고안

### 8.1 Release 제목

```text
v0.1.0-poc - GraphRAG AI Agent Common Framework PoC
```

### 8.2 Release 설명 초안

```markdown
## Summary

GraphRAG AI Agent 공통 프레임워크의 1차 PoC 릴리즈입니다.

## Included

- RAG Core: DocumentPipeline, ParserRegistry, Chunker, MetadataEnricher, TextNormalizer
- GraphRAG Core: Entity/Relation/Evidence, GraphStore, HybridRetriever, ContextAssembler
- VectorStore: InMemoryVectorStore, FAISS/PGVector adapter skeleton
- Agent: WorkflowFactory, GraphRAGRetrieveNode, LLMAnswerNode, StructuredOutputNode
- Admin MVP: Source, IndexJob, Preview, GraphRAG Search Test
- Sol-Bat Pilot: domain schema, sample indexing, retrieval adapter
- Tests: pytest 32 passed
- Deliverables: planning, architecture, requirements, analysis, design, implementation, pilot, test, transition, closing documents

## Verification

- pytest 9.1.1
- 32 tests passed
- compileall passed

## Known Follow-ups

- PGVector/PostgreSQL actual integration test
- Admin browser E2E automation
- Real authentication/authorization API tests
- Performance test for large Source indexing/retrieval
- Agent execution screen for Admin UI
```

## 9. 릴리즈 후속 과제

| 과제 | 권고 버전 | 담당 |
| --- | --- | --- |
| PGVector/PostgreSQL 실제 통합 | `v0.2.0-rc1` | Data Engineer |
| 관리자 브라우저 E2E 자동화 | `v0.2.0-rc1` | QA Automation / Frontend |
| 인증/권한 API 연계 | `v0.2.0-rc1` | Backend / Security |
| 성능 테스트 및 기준 수립 | `v0.2.0-rc1` | QA / Backend |
| Agent 실행 관리자 화면 | `v0.3.0` | Frontend / AI Engineer |
| 신규 도메인 샘플 추가 | `v0.3.0` | Architect / Knowledge Engineer |

## 10. 릴리즈 승인 체크리스트

| 항목 | 기준 | 확인 |
| --- | --- | --- |
| 최종 산출물 목록 작성 | 완료 |  |
| 프로젝트 완료보고서 작성 | 완료 |  |
| Lessons Learned 작성 | 완료 |  |
| 릴리즈 태그 및 버전 정리 | 완료 |  |
| WBS 최종 업데이트 | 사용자 요청 후 수행 |  |
| pytest 전체 통과 | 32 passed |  |
| GitHub commit/push | 사용자 요청 후 수행 |  |
| GitHub tag 생성 | 최종 커밋 후 수행 |  |
| GitHub Release 작성 | 태그 생성 후 수행 |  |

## 11. 다음 작업

다음 작업은 WBS 기준 `10.5 최종 종료 검토` 또는 사용자 요청에 따른 WBS 최종 업데이트 및 GitHub 반영이다.

권장 요청 문구는 다음과 같다.

```text
[PM/Product Owner] 300.종료 단계의 최종 종료 검토 문서를 작성해 주세요. 최종 산출물, 프로젝트 완료보고서, Lessons Learned, 릴리즈 태그 및 버전 정리 문서를 검토 대상으로 포함하고 종료 승인 기준과 GitHub 업데이트 여부를 정리해 주세요.
```
