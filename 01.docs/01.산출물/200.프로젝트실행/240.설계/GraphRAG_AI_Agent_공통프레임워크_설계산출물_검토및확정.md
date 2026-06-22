# GraphRAG AI Agent 공통 프레임워크 설계 산출물 검토 및 확정

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 프로젝트의 `240.설계` 단계 산출물을 PM 관점에서 검토하고, 설계 단계 완료 여부와 후속 `250.구현` 단계 진입 기준을 확정하기 위한 문서이다.

검토 대상에는 공통 모듈, GraphRAG Core, 물리 데이터 모델, API 명세/OpenAPI, 관리자 사이트 화면정의서, Frontend 컴포넌트 설계서, 테스트 시나리오를 포함한다.

### 1.2 검토 일자

| 항목 | 내용 |
|---|---|
| 검토 단계 | `240.설계` |
| 검토 일자 | 2026-06-21 |
| 검토 주관 | PM |
| 검토 방식 | 산출물 정합성, 요구사항 반영성, 구현 가능성, 테스트 가능성 검토 |
| 확정 상태 | 조건부 확정 |

### 1.3 검토 기준

| 기준 | 설명 |
|---|---|
| 요구사항 반영성 | 220 요구사항과 230 분석 결과가 설계에 반영되었는지 확인 |
| 구조 정합성 | 공통 모듈, GraphRAG Core, 데이터 모델, API, 화면 설계 간 용어와 흐름이 일관적인지 확인 |
| 구현 가능성 | Backend/Frontend/Data/GraphRAG 구현 단위로 분해 가능한지 확인 |
| 테스트 가능성 | API, 화면, 권한, 오류, 경계값 테스트가 가능한 수준인지 확인 |
| 운영 가능성 | 관리자 사이트, 인덱싱 작업, 모니터링, 감사/보안 항목이 고려되었는지 확인 |
| 후속 단계 준비도 | 구현 단계에서 필요한 남은 의사결정이 관리 가능한 수준인지 확인 |

## 2. 검토 대상 산출물

| 순번 | 산출물 | 파일명 | 검토 결과 |
|---:|---|---|---|
| 1 | 공통 모듈 상세설계서 | `GraphRAG_AI_Agent_공통프레임워크_공통모듈상세설계서.md` | 적합 |
| 2 | GraphRAG Core 상세설계서 | `GraphRAG_AI_Agent_공통프레임워크_GraphRAG_Core상세설계서.md` | 적합 |
| 3 | 물리 데이터 모델 설계서 | `GraphRAG_AI_Agent_공통프레임워크_물리데이터모델설계서.md` | 적합 |
| 4 | 관리자 및 GraphRAG API 명세서 | `GraphRAG_AI_Agent_공통프레임워크_관리자_GraphRAG_API명세서.md` | 적합 |
| 5 | 관리자 및 GraphRAG API OpenAPI YAML | `GraphRAG_AI_Agent_공통프레임워크_관리자_GraphRAG_API_OpenAPI.yaml` | 조건부 적합 |
| 6 | 관리자 사이트 화면정의서 | `GraphRAG_AI_Agent_공통프레임워크_관리자사이트_화면정의서.md` | 적합 |
| 7 | 관리자 사이트 Frontend 컴포넌트 설계서 | `GraphRAG_AI_Agent_공통프레임워크_관리자사이트_Frontend컴포넌트설계서.md` | 적합 |
| 8 | 관리자 및 GraphRAG API/화면 통합 테스트 시나리오 | `GraphRAG_AI_Agent_공통프레임워크_관리자_GraphRAG_API_화면통합테스트시나리오.md` | 적합 |

## 3. 산출물별 검토 결과

### 3.1 공통 모듈 상세설계서

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| 공통 프레임워크 범위 | 적합 | 설정, 인증/권한, 공통 응답, 오류, 로깅, 감사, 작업 실행 기반이 정의됨 |
| 기존 프로젝트 공통화 반영 | 적합 | Sol-Bat, VectorMoon, accountBook, lotto 확장 가능성을 고려함 |
| 모듈 경계 | 적합 | SourceManager, IndexJobManager, AgentRuntime 등 구현 단위와 연결 가능 |
| 보안/운영 고려 | 적합 | 권한, 감사 로그, 공통 오류 정책이 포함됨 |
| 보완 필요 | 관리 필요 | 실제 구현 시 패키지 구조와 dependency injection 방식 확정 필요 |

### 3.2 GraphRAG Core 상세설계서

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| Core 구성요소 | 적합 | EntityExtractor, RelationExtractor, EvidenceLinker, GraphStoreAdapter, HybridRetriever, ContextAssembler, GraphRAGRetrieveNode 흐름이 정의됨 |
| 입출력 schema | 적합 | 주요 컴포넌트별 입력/출력 구조가 구현 가능한 수준으로 정리됨 |
| Agent 연계 | 적합 | LangGraph 또는 Agent workflow 내 GraphRAGRetrieveNode 적용 구조가 반영됨 |
| 검색 전략 | 적합 | vector, graph, hybrid, rerank 전략이 분리됨 |
| 보완 필요 | 관리 필요 | 실제 Graph Store 선택, reranker provider, LLM extraction prompt version 관리 방식은 구현 전 확정 필요 |

### 3.3 물리 데이터 모델 설계서

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| 주요 테이블 범위 | 적합 | Source, Document, Chunk, EmbeddingRef, Entity, EntityMention, Relation, Evidence, EvidenceLink, RetrievalRun, RetrievalResult, AgentRun이 포함됨 |
| 추적성 | 적합 | Agent 답변에서 Source/Document/Chunk/Evidence까지 역추적 가능한 구조 |
| 인덱스/제약 | 적합 | domain/status, source, chunk, metadata 검색 인덱스가 반영됨 |
| 삭제/재인덱싱 정책 | 적합 | soft delete, vector 삭제, evidence 정리 정책이 포함됨 |
| 보완 필요 | 관리 필요 | Alembic migration 초안 작성, PostgreSQL/PGVector 기준 DDL 검증 필요 |

### 3.4 관리자 및 GraphRAG API 명세서

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| Source API | 적합 | 등록, 목록, 상세, 수정, 삭제, Preview API가 정의됨 |
| IndexJob API | 적합 | 생성, 실행, 상태조회, 목록, 재시도, 취소 API가 정의됨 |
| GraphRAG 검색 테스트 API | 적합 | 검색 테스트 실행과 결과 조회가 포함됨 |
| Agent 실행 API | 적합 | 실행 요청과 실행 결과 조회가 포함됨 |
| 오류 코드 | 적합 | Source, Job, Retrieval, Agent, Auth 오류 코드가 분리됨 |
| 보완 필요 | 관리 필요 | idempotency key, 파일 업로드 방식 multipart 여부, 비동기 callback/SSE 적용 여부 확정 필요 |

### 3.5 관리자 및 GraphRAG API OpenAPI YAML

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| OpenAPI 기본 구조 | 적합 | `openapi`, `info`, `servers`, `paths`, `components`, `securitySchemes` 포함 |
| API path 범위 | 적합 | Source, IndexJob, RetrievalTest, AgentRun 12개 path 포함 |
| Schema 참조 | 적합 | 기본 구조 검증에서 `$ref` 누락 없음 |
| 자동화 가능성 | 조건부 적합 | OpenAPI generator, mock server, contract test 기반으로 확장 가능 |
| 보완 필요 | 필수 | PyYAML/Spectral/openapi-generator 등 정식 OpenAPI validation 도구로 CI 검증 필요 |

### 3.6 관리자 사이트 화면정의서

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| 화면 범위 | 적합 | Source 목록/등록/상세/Preview, IndexJob 실행/모니터링, GraphRAG 검색 테스트 포함 |
| 화면 흐름 | 적합 | Source 등록 -> IndexJob 실행 -> Preview -> 검색 테스트 흐름이 정의됨 |
| 권한/오류 표시 | 적합 | ADMIN/OPERATOR/VIEWER 권한과 ErrorPanel 정책이 반영됨 |
| 운영성 | 적합 | 삭제, 재시도, 취소, 로그, 빈 상태가 고려됨 |
| 보완 필요 | 관리 필요 | 디자인 시스템, UI library, 그래프 preview 범위 확정 필요 |

### 3.7 Frontend 컴포넌트 설계서

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| 컴포넌트 분해 | 적합 | Source, IndexJob, Retrieval 영역별 Page/Container/Component 구조가 정의됨 |
| 상태 관리 | 적합 | server state, URL state, form state, UI state, session state 구분 |
| API 연동 | 적합 | API client, query key, mutation invalidation 기준이 정의됨 |
| polling 정책 | 적합 | IndexJob 상태별 polling/중지 조건이 포함됨 |
| 보완 필요 | 관리 필요 | 실제 React SPA/Next.js 선택, design token 확정, mock API 구성 필요 |

### 3.8 통합 테스트 시나리오

| 검토 항목 | 결과 | 검토 의견 |
|---|---|---|
| 기능 테스트 | 적합 | Source, IndexJob, Retrieval, Agent 정상/오류 시나리오 포함 |
| 권한 테스트 | 적합 | ADMIN/OPERATOR/VIEWER/USER 권한 케이스 포함 |
| 경계값 테스트 | 적합 | 필수값, enum, top_k, graph_depth, min_score 등 포함 |
| 화면 E2E | 적합 | Source 등록부터 검색 테스트까지 흐름 포함 |
| 보완 필요 | 관리 필요 | 상세 테스트 케이스, fixture, mock server, Playwright E2E 자동화 필요 |

## 4. 설계 정합성 검토

### 4.1 요구사항 반영성

| 요구 영역 | 반영 산출물 | 결과 |
|---|---|---|
| 관리자 사이트 | 화면정의서, Frontend 컴포넌트 설계서, API 명세서 | 반영 |
| 자료 등록/관리 | API 명세서, 화면정의서, 물리 데이터 모델 | 반영 |
| 자료 인덱싱 | 공통 모듈, GraphRAG Core, IndexJob API, 테스트 시나리오 | 반영 |
| GraphRAG 검색 | GraphRAG Core, Retrieval API, 검색 테스트 화면 | 반영 |
| Agent 실행 | GraphRAG Core, Agent API, AgentRun 데이터 모델 | 반영 |
| 보안/권한 | 공통 모듈, API 명세서, 화면정의서, 테스트 시나리오 | 반영 |
| 운영/감사 | 공통 모듈, 물리 데이터 모델, 테스트 시나리오 | 반영 |

### 4.2 산출물 간 연결성

| 연결 구간 | 검토 결과 |
|---|---|
| 요구사항 -> 공통 모듈 | 요구된 공통 프레임워크 기능이 모듈 단위로 분해됨 |
| 공통 모듈 -> GraphRAG Core | SourceManager, IndexJobManager, GraphRAGRetrieveNode 흐름이 연계됨 |
| GraphRAG Core -> 데이터 모델 | Entity/Relation/Evidence/RetrievalRun 구조가 물리 모델에 반영됨 |
| 데이터 모델 -> API | Source, Preview, Retrieval, AgentRun 응답에 필요한 데이터가 제공 가능 |
| API -> 화면 | 화면정의서의 주요 액션이 API endpoint와 매핑됨 |
| 화면 -> Frontend 컴포넌트 | 화면별 컴포넌트, 상태, API hook 구조가 정의됨 |
| 설계 -> QA | 정상/오류/권한/경계값 테스트 시나리오가 정의됨 |

## 5. 주요 보완사항

### 5.1 필수 보완사항

| ID | 보완사항 | 담당 | 완료 기준 | 우선순위 |
|---|---|---|---|---|
| `DSG-ACT-001` | OpenAPI YAML 정식 validation 도구 적용 | Backend Engineer | Spectral 또는 openapi-generator 검증 통과 | High |
| `DSG-ACT-002` | PostgreSQL/PGVector 기준 migration 초안 작성 | Data Architect | Alembic 또는 SQL DDL 초안 작성 | High |
| `DSG-ACT-003` | 파일 업로드 방식 확정 | 아키텍터/Backend Engineer | multipart, storage URI, 보안 스캔 정책 확정 | High |
| `DSG-ACT-004` | Frontend 기술 스택 확정 | 아키텍터/Frontend Engineer | React SPA 또는 Next.js, UI library 결정 | High |
| `DSG-ACT-005` | 테스트 fixture 및 mock API 전략 수립 | QA/Backend/Frontend | Source 파일, 실패 job, retrieval mock 데이터 준비 | High |

### 5.2 관리 보완사항

| ID | 보완사항 | 담당 | 완료 기준 | 우선순위 |
|---|---|---|---|---|
| `DSG-ACT-006` | Graph Store adapter 1차 구현 대상 확정 | GraphRAG Engineer | PG recursive CTE, Neo4j, NetworkX 등 1차 대상 결정 | Medium |
| `DSG-ACT-007` | reranker provider 적용 여부 확정 | GraphRAG Engineer | 1차 릴리스 포함 여부 결정 | Medium |
| `DSG-ACT-008` | IndexJob 실시간 모니터링 방식 확정 | Backend Engineer | polling 우선/SSE/WebSocket 전환 기준 확정 | Medium |
| `DSG-ACT-009` | 관리자 사이트 디자인 시스템 확정 | 디자이너/Frontend Engineer | 색상, 버튼, 테이블, modal 기준 확정 | Medium |
| `DSG-ACT-010` | 민감정보 masking 정책 구체화 | 보안/PM | quote_text, input_text, final_output masking 기준 확정 | Medium |

## 6. 리스크 및 대응 방안

| 리스크 ID | 리스크 | 영향 | 대응 방안 | 담당 |
|---|---|---|---|---|
| `RSK-240-001` | GraphRAG extraction 품질 변동 | Entity/Relation 품질 저하 | prompt version 관리, 샘플 fixture 기반 회귀 테스트 | GraphRAG Engineer |
| `RSK-240-002` | Vector/Graph Store 선택 지연 | 구현 일정 지연 | 1차는 PGVector + PostgreSQL graph traversal 기준으로 착수 | 아키텍터 |
| `RSK-240-003` | OpenAPI와 구현 불일치 | Frontend/API 연동 오류 | contract test 및 OpenAPI generator 적용 | Backend Engineer |
| `RSK-240-004` | 관리자 화면 범위 확대 | Frontend 일정 증가 | 1차 범위를 Source/IndexJob/Retrieval Test로 제한 | PM |
| `RSK-240-005` | 대용량 Source 처리 성능 | 인덱싱 지연/장애 | batch, queue, retry, progress tracking 구현 | Backend Engineer |
| `RSK-240-006` | 권한 누락 | 데이터 노출 위험 | Source 권한 상속, API 권한 테스트 필수화 | 보안/QA |

## 7. 확정 결과

### 7.1 확정 판단

| 항목 | 판단 |
|---|---|
| 설계 산출물 완성도 | 충족 |
| 요구사항 반영성 | 충족 |
| 구현 단계 착수 가능성 | 충족 |
| 테스트 설계 가능성 | 충족 |
| 남은 보완사항 | 구현 착수 전/착수 초기에 병행 관리 가능 |
| 최종 판단 | `240.설계` 단계 조건부 확정 |

### 7.2 조건부 확정 조건

다음 항목은 `250.구현` 단계 착수 전 또는 초기 Sprint 내에 확정해야 한다.

| 조건 | 내용 |
|---|---|
| 1 | OpenAPI YAML 정식 validation 수행 |
| 2 | 데이터베이스 migration 초안 작성 |
| 3 | 파일 업로드/저장소 정책 확정 |
| 4 | Frontend framework 및 UI library 확정 |
| 5 | 테스트 fixture/mock API 구성 방안 확정 |

## 8. 250.구현 단계 진입 기준

| 기준 | 상태 | 비고 |
|---|---|---|
| 240 설계 핵심 산출물 작성 | 충족 | 8개 산출물 작성 완료 |
| API 계약 정의 | 충족 | API 명세서 및 OpenAPI YAML 작성 완료 |
| 데이터 모델 정의 | 충족 | 물리 데이터 모델 설계 완료 |
| 관리자 화면 정의 | 충족 | 화면정의서 및 Frontend 컴포넌트 설계 완료 |
| 테스트 시나리오 정의 | 충족 | 통합 테스트 시나리오 작성 완료 |
| 구현 보완사항 식별 | 충족 | 필수/관리 보완사항 분류 완료 |
| WBS 반영 | 미완료 | PM 후속 작업으로 WBS 업데이트 필요 |
| GitHub 업데이트 | 미완료 | 사용자 요청 시 commit/push 진행 |

## 9. 250.구현 단계 권장 작업

| 순번 | 담당 | 작업 | 산출물/결과 |
|---:|---|---|---|
| 1 | PM | WBS 업데이트 및 240 설계 완료 표시 | WBS.md, WBS Gantt |
| 2 | Backend Engineer | 프로젝트 skeleton 및 공통 API 모듈 구현 | Backend 기본 구조 |
| 3 | Data Architect | DB migration 초안 작성 | Alembic/SQL migration |
| 4 | Backend Engineer | Source API 구현 | Source 관리 API |
| 5 | Backend Engineer | IndexJob API 및 worker 구조 구현 | 인덱싱 작업 실행 기반 |
| 6 | GraphRAG Engineer | Entity/Relation/Evidence extraction core 구현 | GraphRAG Core |
| 7 | Frontend Engineer | 관리자 사이트 prototype 구현 | Source/IndexJob/Retrieval 화면 |
| 8 | QA | 상세 테스트 케이스 및 fixture 작성 | 테스트 케이스 명세 |

## 10. 승인 요청

### 10.1 승인 대상

| 승인 대상 | 승인 요청 내용 |
|---|---|
| PM | `240.설계` 단계 조건부 확정 승인 |
| 아키텍터 | 공통 모듈/GraphRAG Core/API/데이터 모델 구현 착수 승인 |
| 기획자/디자이너 | 관리자 사이트 화면 범위 및 1차 구현 범위 승인 |
| QA | 통합 테스트 시나리오 기준 승인 |

### 10.2 승인 의견

| 역할 | 승인 여부 | 의견 |
|---|---|---|
| PM | 승인 대기 |  |
| 아키텍터 | 승인 대기 |  |
| GraphRAG Engineer | 승인 대기 |  |
| Data Architect | 승인 대기 |  |
| Frontend Engineer | 승인 대기 |  |
| QA | 승인 대기 |  |

## 11. 다음 요청 문구

```text
[PM] 현재까지 작업한 240.설계 단계 산출물을 WBS에 반영하고 완료 표시해 주세요. 이후 GitHub 업데이트를 진행해 주세요.
```

## 12. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|---|---|---|---|
| 0.1 | 2026-06-21 | PM | 최초 작성 |
