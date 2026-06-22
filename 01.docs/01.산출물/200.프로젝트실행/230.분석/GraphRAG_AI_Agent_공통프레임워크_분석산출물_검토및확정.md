# GraphRAG AI Agent 공통 프레임워크 분석 산출물 검토 및 확정

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 개발 프로젝트의 `230.분석` 단계 산출물에 대한 검토 결과와 확정 여부를 정리한다. 분석 단계에서 작성된 산출물이 `240.설계` 단계로 진입하기에 충분한지 판단하고, 설계 단계에서 보완해야 할 사항과 진입 기준을 정의한다.

### 1.2 검토 기준

| 기준 | 설명 |
|---|---|
| 범위 충족성 | 기존 프로젝트와 GraphRAG 공통 프레임워크 적용 대상이 충분히 분석되었는가 |
| 산출물 정합성 | 요구정의, 아키텍처정의, 분석 산출물 간 용어와 구조가 일관되는가 |
| 설계 전환 가능성 | 상세설계, 물리 데이터 모델, API 명세, 화면정의서로 전환 가능한 수준인가 |
| 추적성 | 요구사항, 공통 기능, 데이터 모델, 인터페이스가 서로 연결되는가 |
| 리스크 식별 | 설계/구현 단계에서 관리해야 할 리스크와 보완사항이 도출되었는가 |

### 1.3 검토 대상 산출물

| No | 산출물 | 파일명 | 작성 역할 | 검토 결과 |
|---:|---|---|---|---|
| 1 | 기존 프로젝트 공통기능분석서 | `GraphRAG_AI_Agent_공통프레임워크_기존프로젝트공통기능분석서.md` | 아키텍터 | 조건부 확정 |
| 2 | RAG/Agent 구현현황분석서 | `GraphRAG_AI_Agent_공통프레임워크_RAG_Agent구현현황분석서.md` | GraphRAG Engineer | 조건부 확정 |
| 3 | 도메인 개념 및 용어정의서 | `GraphRAG_AI_Agent_공통프레임워크_도메인개념_용어정의서.md` | 기획자 | 확정 |
| 4 | 논리 데이터 모델 분석서 | `GraphRAG_AI_Agent_공통프레임워크_논리데이터모델분석서.md` | Data Architect | 조건부 확정 |
| 5 | 인터페이스 및 외부 연계 분석서 | `GraphRAG_AI_Agent_공통프레임워크_인터페이스_외부연계분석서.md` | 아키텍터 | 조건부 확정 |

## 2. 산출물별 검토 결과

### 2.1 기존 프로젝트 공통기능분석서

| 항목 | 검토 내용 |
|---|---|
| 주요 내용 | `vm-common-core`, `Sol-Bat`, `VectorMoon`, `accountBook`, `lotto`의 공통 기능 후보와 GraphRAG 공통 프레임워크 적용 대상 정리 |
| 우수 사항 | 기존 프로젝트별 공통 기능 후보가 FastAPI, DB, 인증, 알림, 스케줄러, 파일 업로드, 문서 파싱, Vector Store, Agent Workflow 관점으로 분류됨 |
| 설계 활용 | 공통 모듈 상세설계서의 모듈 분해 기준으로 활용 가능 |
| 보완 사항 | 각 공통 기능 후보별 현재 코드 위치, 재사용 난이도, 우선순위를 설계 단계에서 더 정량화 필요 |
| 판정 | 조건부 확정 |

### 2.2 RAG/Agent 구현현황분석서

| 항목 | 검토 내용 |
|---|---|
| 주요 내용 | `Sol-Bat`, `VectorMoon`, `accountBook`, `lotto`의 RAG, Vector Store, LangGraph Agent 구현 구조 분석 |
| 우수 사항 | PGVector, FAISS, LangGraph, RAG hint, Agent Node 구조가 프로젝트별로 비교됨 |
| 설계 활용 | `VectorStoreAdapter`, `DocumentPipeline`, `GraphRAGRetrieveNode`, `StructuredOutputParser` 상세설계의 근거로 활용 가능 |
| 보완 사항 | Agent Node별 입력/출력 schema와 공통 State 필드는 설계 단계에서 별도 정의 필요 |
| 판정 | 조건부 확정 |

### 2.3 도메인 개념 및 용어정의서

| 항목 | 검토 내용 |
|---|---|
| 주요 내용 | Source, Document, Chunk, Entity, Relation, Evidence, IndexJob, Retriever, Agent, Workflow 등 핵심 용어와 프로젝트별 매핑 정의 |
| 우수 사항 | 분석/설계/구현 전 단계에서 사용할 공통 언어가 정리되었고, 관리자 사이트 용어까지 포함됨 |
| 설계 활용 | ERD, API 명세, 화면정의서, 공통 모듈 상세설계의 표준 용어 기준으로 즉시 사용 가능 |
| 보완 사항 | 설계 단계에서 UI 표시 용어와 API 리소스명을 확정하면서 일부 명칭이 조정될 수 있음 |
| 판정 | 확정 |

### 2.4 논리 데이터 모델 분석서

| 항목 | 검토 내용 |
|---|---|
| 주요 내용 | Source, Document, Chunk, EmbeddingRef, Entity, Relation, Evidence, IndexJob, RetrievalRun, AgentRun 중심 논리 모델 정의 |
| 우수 사항 | GraphRAG 추적성을 위한 EvidenceLink, AgentOutputEvidence, RetrievalResult 구조가 포함됨 |
| 설계 활용 | 물리 ERD, 테이블정의서, Repository 설계의 직접 입력으로 활용 가능 |
| 보완 사항 | 물리 설계 단계에서 데이터 타입, FK, 인덱스, 파티션, soft delete 정책, 대용량 chunk 저장 정책 상세화 필요 |
| 판정 | 조건부 확정 |

### 2.5 인터페이스 및 외부 연계 분석서

| 항목 | 검토 내용 |
|---|---|
| 주요 내용 | SourceManager, IndexJobManager, DocumentPipeline, VectorStoreAdapter, GraphStoreAdapter, HybridRetriever, Agent Runtime, 외부 API 연계 분석 |
| 우수 사항 | 내부 인터페이스, 관리자 API 초안, OpenAI/Vector Store/외부 도메인 API/운영 연계가 구조적으로 정리됨 |
| 설계 활용 | API 명세서, 공통 모듈 상세설계서, 외부연계설계서의 직접 입력으로 활용 가능 |
| 보완 사항 | API request/response DTO, 오류 코드, 인증/인가 정책, provider별 capability matrix는 설계 단계에서 상세화 필요 |
| 판정 | 조건부 확정 |

## 3. 분석 단계 종합 검토

### 3.1 완료된 분석 범위

| 분석 항목 | 완료 여부 | 비고 |
|---|---|---|
| 기존 프로젝트 공통 기능 후보 분석 | 완료 | 5개 프로젝트 기준 분석 |
| RAG/Agent 구현 현황 분석 | 완료 | PGVector, FAISS, LangGraph 구조 포함 |
| 공통 도메인 용어 정의 | 완료 | 설계 단계 표준 용어로 사용 |
| GraphRAG 논리 데이터 모델 분석 | 완료 | Source~Evidence~AgentRun 추적 구조 포함 |
| 인터페이스 및 외부 연계 분석 | 완료 | 관리자 API, Adapter, 외부 API 연계 포함 |
| 1차 파일럿 후보 도출 | 완료 | `Sol-Bat` 우선 적용 권고 |
| MVP 우선순위 도출 | 완료 | Source/IndexJob/DocumentPipeline/VectorStore/GraphStore/HybridRetriever |

### 3.2 분석 단계 핵심 결론

| 결론 | 내용 |
|---|---|
| 1차 파일럿 | `Sol-Bat`을 1차 GraphRAG 공통 프레임워크 적용 대상으로 선정 |
| 공통화 우선순위 | SourceManager, IndexJobManager, DocumentPipeline, VectorStoreAdapter, GraphStoreAdapter, HybridRetriever 순서 권고 |
| 데이터 모델 핵심 | Source, Document, Chunk, Entity, Relation, Evidence, IndexJob, RetrievalRun, AgentRun 중심 |
| 관리자 사이트 핵심 | 자료 등록, 벡터화 실행, 작업 상태 모니터링, 청크/개체/관계/근거 미리보기, 검색 테스트 |
| 외부 연계 핵심 | OpenAI, PostgreSQL/pgvector, FAISS, 농업 API, 투자 API, Email/Telegram, Scheduler adapter 표준화 필요 |

## 4. 보완사항

### 4.1 240.설계 단계에서 보완할 사항

| 보완 ID | 보완사항 | 담당 역할 | 반영 산출물 |
|---|---|---|---|
| AN-CMP-001 | 공통 모듈별 책임, public interface, dependency 상세화 | 아키텍터 | 공통 모듈 상세설계서 |
| AN-DATA-001 | 논리 모델을 물리 ERD, 테이블, FK, 인덱스, JSON 컬럼 정책으로 구체화 | Data Architect | 물리 데이터 모델 설계서 |
| AN-API-001 | 관리자/Agent API별 request/response DTO와 오류 코드 상세화 | 아키텍터, Backend Engineer | API 명세서 |
| AN-UI-001 | 관리자 사이트 화면 흐름, 목록/상세/미리보기/상태 화면 정의 | 기획자, 디자이너 | 화면정의서 |
| AN-GR-001 | Entity/Relation 추출 schema, EvidenceLink 생성 규칙 상세화 | GraphRAG Engineer | GraphRAG 상세설계서 |
| AN-SEC-001 | 자료 scope, owner_id, tenant_id, ADMIN/OPERATOR/USER 권한 정책 상세화 | Security Engineer | 보안 설계서 |
| AN-OPS-001 | IndexJob retry, timeout, scheduler, 알림 이벤트 정책 상세화 | DevOps, SRE | 운영 설계서 |
| AN-QA-001 | 검색 품질, 답변 근거 추적, Agent 실행 테스트 기준 정의 | QA, AI/ML Engineer | 테스트 설계 기준 |

### 4.2 설계 단계 의사결정 필요사항

| 결정 ID | 의사결정 항목 | 선택지 | 권고 |
|---|---|---|---|
| DEC-001 | Graph Store 1차 구현 방식 | PostgreSQL Graph Tables, Neo4j, RDF Store | PostgreSQL Graph Tables |
| DEC-002 | Vector Store 1차 provider | PGVector only, PGVector+FAISS, Chroma 포함 | PGVector+FAISS |
| DEC-003 | 관리자 사이트 MVP 범위 | 자료 관리만, 자료+작업상태, 자료+작업+검색테스트 | 자료+작업+검색테스트 |
| DEC-004 | Agent Runtime 구현 범위 | 검색 노드만, Workflow Factory 포함, 전체 Runtime | 검색 노드+기본 Runtime |
| DEC-005 | 1차 파일럿 적용 범위 | Sol-Bat KB만, Sol-Bat Agent까지, 다중 프로젝트 동시 적용 | Sol-Bat KB+Agent 검색 노드 |
| DEC-006 | LLM Structured Output 방식 | JSON prompt, schema validation, provider native structured output | schema validation 우선 |

## 5. 240.설계 단계 진입 기준

### 5.1 진입 조건

| 기준 ID | 진입 기준 | 충족 여부 | 비고 |
|---|---|---|---|
| DG-001 | 분석 대상 기존 프로젝트와 공통화 후보가 식별되었는가 | 충족 | 5개 프로젝트 분석 완료 |
| DG-002 | RAG/Agent 구현 구조와 공통화 대상이 도출되었는가 | 충족 | Adapter, Pipeline, Retriever, Agent Node 도출 |
| DG-003 | 공통 용어와 도메인 매핑이 정의되었는가 | 충족 | 용어정의서 확정 |
| DG-004 | 논리 데이터 모델이 설계 전환 가능한 수준인가 | 충족 | 물리 설계 보완 필요 |
| DG-005 | 내부/외부 인터페이스와 외부 연계 대상이 정리되었는가 | 충족 | API DTO 상세화 필요 |
| DG-006 | 1차 MVP 범위와 파일럿 대상이 정리되었는가 | 충족 | Sol-Bat 파일럿 권고 |
| DG-007 | 설계 단계 보완사항과 의사결정 항목이 식별되었는가 | 충족 | 본 문서에 반영 |

### 5.2 진입 판정

| 항목 | 판정 |
|---|---|
| 분석 단계 완료 여부 | 완료 |
| 설계 단계 진입 가능 여부 | 가능 |
| 조건 | 보완사항을 240.설계 산출물에 반영하는 조건으로 진입 |
| PM 판정 | 조건부 승인 |

## 6. 240.설계 단계 권장 작업 순서

| 순서 | 요청 역할 | 작업 | 산출물 |
|---:|---|---|---|
| 1 | 아키텍터 | 공통 모듈 상세설계 | 공통 모듈 상세설계서 |
| 2 | GraphRAG Engineer | GraphRAG Core 상세설계 | GraphRAG 상세설계서 |
| 3 | Data Architect | 물리 데이터 모델 설계 | 물리 ERD, 테이블정의서 |
| 4 | 기획자/디자이너 | 관리자 사이트 화면정의 | 화면정의서 |
| 5 | 아키텍터/Backend Engineer | API 명세 | API 명세서 |
| 6 | QA | 테스트 설계 기준 | 테스트 설계 기준서 |
| 7 | PM | 설계 산출물 검토 및 확정 | 설계 산출물 검토확정서 |

### 6.1 다음 요청 권고

```text
[아키텍터] 240.설계 단계의 공통 모듈 상세설계서를 작성해 주세요. SourceManager, IndexJobManager, DocumentPipeline, VectorStoreAdapter, GraphStoreAdapter, HybridRetriever, Agent Runtime을 포함하고, 230.분석 단계 산출물의 보완사항을 반영해 주세요.
```

## 7. 산출물 확정 목록

| 산출물 | 확정 상태 | 설계 단계 활용 |
|---|---|---|
| 기존 프로젝트 공통기능분석서 | 조건부 확정 | 공통 모듈 분해, MVP 범위 정의 |
| RAG/Agent 구현현황분석서 | 조건부 확정 | RAG/Agent Core 상세설계 |
| 도메인 개념 및 용어정의서 | 확정 | 전 산출물 표준 용어 |
| 논리 데이터 모델 분석서 | 조건부 확정 | 물리 ERD, 테이블정의서 |
| 인터페이스 및 외부 연계 분석서 | 조건부 확정 | API 명세, 외부연계설계 |

## 8. 리스크 및 관리 방안

| 리스크 ID | 리스크 | 설계 단계 관리 방안 |
|---|---|---|
| AN-RSK-001 | 공통화 범위 과대 | MVP 범위를 Source/IndexJob/RAG/GraphRAG 검색 중심으로 제한 |
| AN-RSK-002 | GraphRAG 신규 구현 복잡도 | 1차는 PostgreSQL Graph Tables와 Sol-Bat 파일럿으로 검증 |
| AN-RSK-003 | 외부 API 연계 실패/제한 | Adapter, retry, fallback, timeout 정책 설계 |
| AN-RSK-004 | Vector Store provider별 기능 차이 | provider capability matrix와 최소 공통 계약 정의 |
| AN-RSK-005 | 개인정보/권한 문제 | scope, owner_id, tenant_id 기반 필터와 관리자 권한 정책 설계 |
| AN-RSK-006 | LLM JSON 출력 불안정 | schema validation, retry, fallback parser 설계 |

## 9. PM 종합 의견

`230.분석` 단계 산출물은 GraphRAG AI Agent 공통 프레임워크 설계를 시작하기에 필요한 핵심 분석 범위를 충족하였다. 기존 프로젝트의 공통 기능, RAG/Agent 구현 구조, 공통 용어, 논리 데이터 모델, 내부/외부 인터페이스가 연결되어 있어 `240.설계` 단계 진입이 가능하다.

다만 일부 산출물은 상세설계 단계에서 구체화가 필요한 조건부 확정 상태이다. 특히 API DTO, 물리 데이터 모델, 권한 정책, provider별 adapter capability, Agent Node 입출력 schema는 설계 단계에서 반드시 보완해야 한다.

## 10. 승인 및 변경 이력

### 10.1 승인 기록

| 구분 | 역할 | 승인 여부 | 일자 | 비고 |
|---|---|---|---|---|
| 작성 | PM | 작성 완료 | 2026-06-21 | 초안 |
| 검토 | 아키텍터 | 검토 필요 | - | 설계 전환 범위 검토 |
| 검토 | GraphRAG Engineer | 검토 필요 | - | GraphRAG 보완사항 검토 |
| 검토 | Data Architect | 검토 필요 | - | 데이터 모델 보완사항 검토 |
| 승인 | Product Owner | 승인 필요 | - | 사용자 확인 필요 |

### 10.2 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-21 | 분석 산출물 검토 및 확정 문서 최초 작성 | PM |
