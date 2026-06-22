# GraphRAG AI Agent 공통 프레임워크 기존 프로젝트 공통기능분석서

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 개발 프로젝트의 분석 단계 산출물로, 기존 프로젝트(`vm-common-core`, `Sol-Bat`, `VectorMoon`, `accountBook`, `lotto`)의 공통 기능 후보와 GraphRAG 공통 프레임워크 적용 대상을 식별한다. 후속 도메인정의서, 상세설계서, API 명세서, 구현 계획의 기준 자료로 사용한다.

### 1.2 분석 범위

| 구분 | 분석 대상 |
|---|---|
| 공통 프레임워크 | `vm-common-core` |
| 서비스 프로젝트 | `Sol-Bat`, `VectorMoon`, `accountBook`, `lotto` |
| 분석 관점 | 인증, DB, 알림, 스케줄러, 파일 업로드, 문서 파싱, Vector Store, RAG, Agent Workflow, 관리자 기능, 운영/테스트 |
| 후속 적용 관점 | GraphRAG Core, RAG Core, Agent Core, Admin Portal Core, Source Management, Index Job Management |

### 1.3 관련 산출물

| 산출물 | 경로 |
|---|---|
| WBS | `01.docs/01.산출물/100.프로젝트계획/GraphRAG_AI_Agent_공통프레임워크_WBS.md` |
| 시스템아키텍처정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_시스템아키텍처정의서.md` |
| GraphRAG 아키텍처 정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_GraphRAG아키텍처정의서.md` |
| 데이터/저장소 아키텍처 정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_데이터저장소아키텍처정의서.md` |
| 개발표준정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_개발표준정의서.md` |
| 요구사항정의서 | `01.docs/01.산출물/200.프로젝트실행/220.요구정의/GraphRAG_AI_Agent_공통프레임워크_요구사항정의서.md` |
| 요구사항추적표 | `01.docs/01.산출물/200.프로젝트실행/220.요구정의/GraphRAG_AI_Agent_공통프레임워크_요구사항추적표.md` |

## 2. 분석 대상 프로젝트 요약

### 2.1 프로젝트별 성격

| 프로젝트 | 성격 | AI/데이터 특징 | 공통화 관점 |
|---|---|---|---|
| `vm-common-core` | 공통 모듈 저장소 | auth, db, notifier, scheduler, ai_pipeline 일부 제공 | GraphRAG 공통 프레임워크의 기반 |
| `Sol-Bat` | 농업 AI Agent | 농장/작물/날씨/토양/병해충/농사 지식 RAG | Sol-Bat 파일럿 및 GraphRAG 도메인 후보 |
| `VectorMoon` | 투자/자동매매 AI Agent | 주가/뉴스/문서 RAG, LangGraph Agent, 스케줄러 | Agent/RAG/운영 기능 공통화 근거 |
| `accountBook` | 가계부 AI Agent | 카드 내역 파싱, 분류, FAISS 기반 RAG 힌트 | 파일 파싱, 분류, 로컬 Vector Store 공통화 근거 |
| `lotto` | 로또 추천 AI Agent | 통계 분석, LLM 인사이트, Telegram/Email 알림 | common_core 적용 사례 및 Agent State 확장 근거 |

### 2.2 주요 파일 근거

| 프로젝트 | 주요 파일 | 확인 내용 |
|---|---|---|
| `vm-common-core` | `auth/`, `db/`, `notifier/`, `scheduler/`, `ai_pipeline/` | 공통 인증, DB, 알림, 스케줄러, 문서 로더, VectorStoreFactory 존재 |
| `Sol-Bat` | `src/rag/rag_manager.py`, `src/rag/ingest.py`, `src/graph.py`, `app/api.py` | pgvector RAG, 문서 인덱싱, LangGraph, 파일 업로드/API 구현 |
| `VectorMoon` | `src/vector_store.py`, `src/graph.py`, `app/api.py`, `app/scheduler.py` | pgvector 문서 처리, Agent Workflow, 스케줄러, 리포트/알림 구현 |
| `accountBook` | `ai_pipeline/vector_store.py`, `ai_pipeline/classifier.py`, `main.py` | FAISS Vector Store, RAG 힌트 기반 분류, 업로드/파싱/분류 API 구현 |
| `lotto` | `agents/lotto_graph.py`, `backend.py`, `services/notification_service.py` | common_core 사용, LangGraph Agent, AsyncIOScheduler, 알림 구현 |

## 3. 기존 공통 프레임워크 현황

### 3.1 `vm-common-core` 현재 제공 기능

| 영역 | 현재 모듈 | 현재 수준 | GraphRAG 프로젝트 관점 |
|---|---|---|---|
| 인증 | `auth/jwt_handler.py`, `auth/guards.py`, `auth/models.py` | JWT, Role, 사용자 모델 기반 | 관리자 사이트 권한 제어의 기반으로 사용 가능 |
| DB | `db/database.py`, `db/base_model.py`, `db/settings.py`, `db/audit.py` | SQLAlchemy 엔진/세션, TimestampMixin, 설정, 감사 로그 | GraphRAG/Agent 테이블의 공통 DB 기반 |
| 알림 | `notifier/email.py`, `notifier/telegram.py` | Email/Telegram 발송 | Index Job 실패, 운영 알림에 활용 가능 |
| 스케줄러 | `scheduler/base_scheduler.py` | APScheduler wrapper | 주기적 인덱싱, 데이터 동기화, 품질 평가 배치에 활용 가능 |
| 문서 로더 | `ai_pipeline/loaders/document_loader.py` | PDF, DOCX, CSV, Excel, Markdown, Text 로딩 | SourceManager/IndexingPipeline의 로더 기반 |
| Vector Store | `ai_pipeline/vectorstores/factory.py` | FAISS, Chroma, pgvector factory | 저장소 추상화의 출발점 |
| Agent State | `ai_pipeline/langgraph/base_state.py` | LangGraph 공통 State | GraphRAG Agent State 확장 기반 |

### 3.2 현재 한계

| 한계 | 설명 | 개선 방향 |
|---|---|---|
| GraphRAG 모듈 부재 | Entity, Relation, Evidence, Graph Store, Hybrid Retriever가 아직 없음 | `ai_pipeline/graphrag` 패키지 추가 |
| Source 관리 부재 | 벡터화 대상 자료 등록/상태/삭제/재처리 기준이 없음 | `SourceManager`, `IndexJobManager` 추가 |
| Vector Store 공통 인터페이스 부족 | provider factory는 있으나 add/search/delete/list/preview 공통 계약이 약함 | `BaseVectorStore`와 구현체 표준화 |
| 관리자 사이트 공통 API 부재 | 자료 등록, 인덱싱 실행, 상태 조회 API가 서비스별로 흩어짐 | `admin` 또는 `ai_pipeline/admin` 모듈 추가 |
| 운영 지표/품질 평가 부재 | 검색 품질, 인덱싱 성공률, Agent 실행 이력 지표가 부족 | `metrics`, `evaluation` 모듈 추가 |

## 4. 프로젝트별 공통 기능 분석

### 4.1 `Sol-Bat`

| 영역 | 확인 내용 | 공통화 후보 |
|---|---|---|
| Agent Workflow | `src/graph.py`에서 LangGraph `StateGraph` 기반 순차 workflow 사용 | Agent Workflow Factory, GraphRAG Agent Node |
| RAG | `RAGManager`가 pgvector 기반 검색, 문서 추가, 파일명별 chunk 조회, 삭제 제공 | RAGManager 공통화, Source별 chunk preview |
| 자료 인덱싱 | `src/rag/ingest.py`에서 PDF/TXT 로드, chunking, vector 저장 처리 | IndexingPipeline, DocumentLoader, Chunker |
| 권한 필터 | `scope=PUBLIC`, `user_id` 조건으로 검색 필터 적용 | domain/scope/tenant/user 공통 권한 필터 |
| 파일 업로드 | `app/api.py`에서 UploadFile, 임시 파일, 파싱, 벡터화 처리 | Admin Source Upload API |
| 외부 API | 날씨, 토양, 병해충, 농사 정보 서비스 연동 | External Data Adapter 패턴 |
| 도메인 | 농장, 작물, 날씨, 병해충, 작업, 정책 | Sol-Bat GraphRAG 파일럿 도메인 |

### 4.2 `VectorMoon`

| 영역 | 확인 내용 | 공통화 후보 |
|---|---|---|
| Agent Workflow | `src/graph.py`에서 가격, 뉴스, 문서 검색, 기술분석, 요약, 분석 노드 연결 | Agent Node Registry, Workflow Template |
| RAG/Vector | `src/vector_store.py`에서 문서 로더, chunking, pgvector 저장/검색/목록/삭제/preview 제공 | VectorStoreAdapter, DocumentPipeline, PreviewService |
| 관리자 기능 | `app/admin_router.py`, `frontend/src/pages/AdminDashboard.jsx` 존재 | Admin Portal 참고 구현 |
| 스케줄러 | `app/scheduler.py`에서 리포트, 매매, 리스크 모니터링 작업 운영 | JobManager, Scheduler 표준 |
| 알림 | Email/Telegram 알림이 여러 서비스에서 사용 | Notification Adapter, 운영 알림 표준 |
| 정규화 유틸 | 한글 NFC 정규화, 검색 정규화, NaN 정리 유틸 존재 | TextNormalizer, JsonSafeEncoder |
| 도메인 | 종목, 뉴스, 지표, 전략, 리스크, 포트폴리오 | VectorMoon GraphRAG 도메인 확장 후보 |

### 4.3 `accountBook`

| 영역 | 확인 내용 | 공통화 후보 |
|---|---|---|
| 파일 업로드/파싱 | 카드 명세서 Excel 업로드, 카드사별 parser, 임시 파일 처리 | Source Upload, Parser Registry |
| AI 분류 | OpenAI 기반 거래 분류, RAG hint 주입 | PromptTemplate, Classification Agent 패턴 |
| Vector Store | FAISS 기반 merchant/category embedding, metadata 저장, 검색, 삭제, 재빌드 | FAISS Adapter, Local Vector Store |
| 설정 관리 | 초기 설정값 자동 생성, 카테고리/고정비/이메일 설정 | Settings Manager, Domain Config |
| 리포트/알림 | 월간 리포트 HTML/PDF, 이메일 발송 | Report Generator, Email Notifier |
| 도메인 | 가맹점, 카테고리, 거래, 사용자 패턴, 고정비 | accountBook GraphRAG 도메인 확장 후보 |

### 4.4 `lotto`

| 영역 | 확인 내용 | 공통화 후보 |
|---|---|---|
| common_core 사용 | DB, TimestampMixin, 알림, Agent State 일부를 common_core에서 사용 | 공통 프레임워크 적용 사례 |
| Agent Workflow | `LottoAgentState`가 `BaseAgentState` 상속, LangGraph workflow 사용 | BaseAgentState 확장 표준 |
| 스케줄러 | `AsyncIOScheduler`로 동기화/리포트 작업 등록 | Async Scheduler Adapter |
| 알림 | Email/Telegram 결과 리포트 발송 | NotificationService 공통화 |
| 데이터 동기화 | 외부 API 동기화 후 추천 이력 매칭 | External Sync Job 패턴 |
| 도메인 | 번호, 회차, 패턴, 전략, 추천 결과 | lotto GraphRAG 후속 도메인 후보 |

## 5. 공통 기능 후보 목록

### 5.1 공통 기능 후보 요약

| 후보 ID | 공통 기능 | 대상 프로젝트 | 현재 반복 수준 | 공통화 우선순위 |
|---|---|---|---|---|
| CF-001 | FastAPI 앱 초기화/CORS/라우터 등록 | Sol-Bat, VectorMoon, accountBook, lotto | 높음 | Medium |
| CF-002 | DB 세션/모델/테이블 초기화 | vm-common-core, accountBook, lotto, VectorMoon, Sol-Bat | 높음 | High |
| CF-003 | 인증/Role Guard | vm-common-core, VectorMoon, accountBook | 중간 | High |
| CF-004 | Email/Telegram 알림 | vm-common-core, VectorMoon, accountBook, lotto | 높음 | Medium |
| CF-005 | APScheduler 기반 작업 등록 | vm-common-core, VectorMoon, lotto, accountBook | 높음 | Medium |
| CF-006 | 파일 업로드/임시 저장/검증 | Sol-Bat, VectorMoon, accountBook | 높음 | High |
| CF-007 | 문서 로더/Parser Registry | vm-common-core, Sol-Bat, VectorMoon, accountBook | 높음 | High |
| CF-008 | Chunking 정책 | vm-common-core, Sol-Bat, VectorMoon | 높음 | High |
| CF-009 | Embedding Provider | vm-common-core, Sol-Bat, VectorMoon, accountBook | 높음 | High |
| CF-010 | Vector Store Adapter | vm-common-core, Sol-Bat, VectorMoon, accountBook | 높음 | High |
| CF-011 | Source 목록/상세/삭제/preview | Sol-Bat, VectorMoon, accountBook | 중간 | High |
| CF-012 | Index Job 상태/재시도 | Sol-Bat, accountBook, VectorMoon | 중간 | High |
| CF-013 | LangGraph Agent Workflow | Sol-Bat, VectorMoon, lotto | 높음 | High |
| CF-014 | Prompt/LLM 호출/JSON 응답 파싱 | VectorMoon, accountBook, lotto, Sol-Bat | 높음 | Medium |
| CF-015 | 운영 로그/오류 코드/지표 | VectorMoon, lotto, Sol-Bat, accountBook | 중간 | Medium |
| CF-016 | 도메인 설정/스키마 관리 | VectorMoon, accountBook, Sol-Bat | 중간 | High |

### 5.2 GraphRAG 특화 공통 기능 후보

| 후보 ID | GraphRAG 기능 | 기존 근거 | 공통 프레임워크 적용 |
|---|---|---|---|
| GR-CF-001 | SourceManager | VectorMoon 문서 목록/삭제, Sol-Bat 파일명별 chunk 조회, accountBook source_id 삭제 | `graphrag_sources` 기준 자료 등록/상태 관리 |
| GR-CF-002 | IndexJobManager | Sol-Bat indexing, accountBook upload_log, lotto scheduler job | `graphrag_index_jobs` 작업 생성/상태/재시도 |
| GR-CF-003 | DocumentPipeline | vm-common-core loader, Sol-Bat ingest, VectorMoon process_document | load, parse, chunk, metadata 생성 표준화 |
| GR-CF-004 | VectorStoreAdapter | PGVector, FAISS 구현 혼재 | add/search/delete/list/preview 공통 인터페이스 |
| GR-CF-005 | GraphStore | 현재 직접 구현 없음 | Entity/Relation/Evidence 저장 및 탐색 신규 구현 |
| GR-CF-006 | Entity/Relation Extractor | lotto/VectorMoon/accountBook의 LLM JSON 응답 처리 경험 | LLM + Rule 기반 추출기 신규 구현 |
| GR-CF-007 | HybridRetriever | 기존 RAG는 vector 중심 | vector search + graph traversal + reranking 신규 구현 |
| GR-CF-008 | ContextAssembler | Sol-Bat/VectorMoon의 출처 포함 context 문자열 | chunk/entity/relation/evidence 통합 context |
| GR-CF-009 | Admin PreviewService | VectorMoon preview, Sol-Bat chunk 조회 | chunk/entity/relation/evidence 미리보기 |
| GR-CF-010 | DomainSchemaManager | Sol-Bat/VectorMoon/accountBook/lotto 도메인 차이 | domain별 Entity/Relation Schema 등록 및 검증 |

## 6. GraphRAG 공통 프레임워크 적용 대상

### 6.1 1차 적용 대상

| 적용 대상 | 설명 | 관련 요구사항 | 적용 프로젝트 |
|---|---|---|---|
| Admin Portal 자료 관리 | 자료 등록, 메타데이터 입력, 상태 조회, 삭제/비활성화 | FR-ADM-SRC, FR-ADM-TEST | 공통, Sol-Bat 파일럿 |
| SourceManager | source 등록, 중복 확인, 상태 변경, metadata 관리 | FR-ADM-SRC-003~010 | 공통 |
| IndexJobManager | index job 생성, 실행, 상태 갱신, 실패 재시도 | FR-IDX-001, FR-IDX-010, FR-IDX-011 | 공통 |
| DocumentPipeline | load, parse, chunk, embedding, vector save | FR-IDX-002~006 | Sol-Bat, VectorMoon, accountBook |
| VectorStoreAdapter | pgvector, FAISS, Chroma provider 표준화 | FR-DEV-002, NFR-MNT-001 | 공통 |
| GraphRAG Core | entity/relation/evidence 추출 및 저장 | FR-IDX-007~009, AIR-006 | Sol-Bat 파일럿 |
| HybridRetriever | vector + graph 통합 검색 | FR-SRCH-003~005 | Sol-Bat 파일럿 |
| Agent Node | LangGraph에서 GraphRAG 검색 노드 사용 | FR-AGT-001~005 | Sol-Bat, VectorMoon, lotto |

### 6.2 프로젝트별 적용 방향

| 프로젝트 | 적용 방향 | 1차 범위 | 후속 범위 |
|---|---|---|---|
| `Sol-Bat` | GraphRAG 파일럿 기준 프로젝트 | 농업 문서, 작물/병해충/작업/정책 Entity/Relation | 외부 API 데이터를 지식 그래프로 연결 |
| `VectorMoon` | 투자 문서/전략 RAG 고도화 | 기존 pgvector 문서 처리 공통화 | 종목/뉴스/전략/리스크 관계 그래프 |
| `accountBook` | 로컬 FAISS 기반 RAG Adapter 검증 | merchant/category vector store adapter화 | 거래/가맹점/카테고리/패턴 그래프 |
| `lotto` | common_core 적용 패턴 검증 | Agent State/알림/DB 공통화 지속 | 번호/회차/패턴/전략 그래프 |
| `vm-common-core` | 공통 프레임워크 구현 대상 | GraphRAG/RAG/Admin Core 추가 | 서비스별 Adapter/Plugin 구조 |

## 7. 공통 모듈 목표 구조 제안

```text
common_core/
  ai_pipeline/
    loaders/
      document_loader.py
      parser_registry.py
    vectorstores/
      base.py
      factory.py
      pgvector_store.py
      faiss_store.py
      chroma_store.py
    rag/
      document_pipeline.py
      rag_manager.py
      retriever.py
      metadata.py
    graphrag/
      schema.py
      domain_schema.py
      source_manager.py
      index_job_manager.py
      graph_store.py
      entity_extractor.py
      relation_extractor.py
      entity_resolver.py
      evidence_linker.py
      hybrid_retriever.py
      context_assembler.py
      agent_node.py
      metrics.py
    admin/
      source_router.py
      index_job_router.py
      search_test_router.py
  langgraph/
    base_state.py
    workflow_factory.py
  ops/
    metrics.py
    error_codes.py
```

## 8. 우선순위 분석

### 8.1 MVP 우선순위

| 우선순위 | 작업 | 선정 사유 |
|---:|---|---|
| 1 | VectorStoreAdapter 공통화 | Sol-Bat, VectorMoon, accountBook에서 가장 명확한 중복 |
| 2 | SourceManager/IndexJobManager 정의 | 관리자 사이트와 벡터화 자료 관리의 핵심 |
| 3 | DocumentPipeline 공통화 | 로드, 파싱, chunking, metadata 부여 반복 제거 |
| 4 | GraphStore/Evidence 모델 정의 | GraphRAG 전환의 핵심 신규 기능 |
| 5 | HybridRetriever 구현 | GraphRAG 검색 가치 검증 |
| 6 | GraphRAG Agent Node 구현 | 기존 LangGraph 프로젝트에 공통 검색 노드 삽입 |
| 7 | Admin API 초안 구현 | 관리자 사이트 MVP와 연결 |

### 8.2 후속 고도화

| 항목 | 설명 |
|---|---|
| Entity Resolver | 도메인별 동의어, alias, 중복 Entity 병합 |
| 수동 보정 UI | 관리자 사이트에서 Entity/Relation 수정 |
| 품질 평가 Runner | Recall@K, Precision@K, Entity Match Rate 측정 |
| 외부 API Source Adapter | 날씨/토양/뉴스/주가/로또 API를 source로 등록 |
| 운영 Dashboard | 인덱싱 성공률, 실패 사유, LLM 비용, 검색 지연 시각화 |

## 9. 리스크 및 대응

| 리스크 ID | 리스크 | 영향 | 대응 |
|---|---|---|---|
| AR-AN-001 | 서비스별 Vector Store 구현 차이 | 공통 인터페이스 설계 난이도 증가 | provider별 Adapter 계약을 먼저 정의 |
| AR-AN-002 | GraphRAG 신규 구현 범위 과대 | 일정 지연 | 1차는 PostgreSQL Graph Tables 기반 경량 구현 |
| AR-AN-003 | 파일/자료 메타데이터 기준 불일치 | 검색 권한/출처 추적 오류 | `domain`, `scope`, `tenant_id`, `user_id`, `source_id` 필수화 |
| AR-AN-004 | LLM 추출 결과 품질 불안정 | 잘못된 Entity/Relation 저장 | confidence, schema validation, evidence 연결 필수화 |
| AR-AN-005 | 관리자 사이트 범위 확대 | 구현 일정 압박 | MVP는 자료 등록/상태/검색 테스트 중심으로 제한 |
| AR-AN-006 | 기존 프로젝트 직접 수정 부담 | 회귀 위험 | 공통 모듈 도입 후 Sol-Bat 파일럿으로 단계적 적용 |

## 10. 분석 결론

### 10.1 결론 요약

기존 4개 서비스 프로젝트에는 이미 공통 프레임워크로 분리할 수 있는 반복 패턴이 충분히 존재한다. 특히 문서/자료 로딩, chunking, embedding 생성, Vector Store 저장/검색/삭제, LangGraph Agent Workflow, Email/Telegram 알림, 스케줄러, DB 세션 관리가 반복 구현되어 있다.

`vm-common-core`는 인증, DB, 알림, 스케줄러, 문서 로더, VectorStoreFactory의 기초가 존재하므로 GraphRAG 공통 프레임워크의 기반으로 적합하다. 다만 GraphRAG를 위한 Source 관리, Index Job 관리, Entity/Relation/Evidence 모델, Graph Store, Hybrid Retrieval, 관리자 API는 신규 확장이 필요하다.

### 10.2 공통 프레임워크 적용 권고

| 구분 | 권고 |
|---|---|
| 1차 파일럿 | `Sol-Bat` 대상으로 GraphRAG 공통 프레임워크 적용 |
| 1차 구현 범위 | SourceManager, IndexJobManager, DocumentPipeline, VectorStoreAdapter, GraphStore, HybridRetriever |
| 관리자 사이트 범위 | 자료 등록, 벡터화 실행, 작업 상태 모니터링, 검색 테스트 |
| 저장소 전략 | PostgreSQL + pgvector + Graph Tables 우선, FAISS/Chroma는 Adapter로 유지 |
| 확장 전략 | VectorMoon, accountBook, lotto는 후속 Adapter 검증 대상으로 활용 |

## 11. 후속 작업

| 우선순위 | WBS ID | 후속 작업 | 산출물 |
|---:|---|---|---|
| 1 | 4.2 | RAG/Agent 구현 현황 분석 | RAG/Agent 분석 결과 |
| 2 | 4.3 | 도메인 개념 및 용어 분석 | 도메인정의서, 용어정의서 |
| 3 | 4.4 | 논리 데이터 모델 분석 | 논리 ERD |
| 4 | 4.5 | 인터페이스 및 라이선스 분석 | 시스템 인터페이스 목록, SW 라이선스 검토 초안 |

## 12. 승인 및 변경 이력

### 12.1 승인 기록

| 구분 | 역할 | 승인 여부 | 일자 | 비고 |
|---|---|---|---|---|
| 작성 | 아키텍터 | 작성 완료 | 2026-06-21 | 초안 |
| 검토 | PM | 승인 필요 | - | 사용자 확인 필요 |
| 검토 | GraphRAG Engineer | 승인 필요 | - | GraphRAG 적용 대상 검토 |
| 검토 | 개발자 | 승인 필요 | - | 기존 프로젝트 적용성 검토 |
| 승인 | Product Owner | 승인 필요 | - | 사용자 확인 필요 |

### 12.2 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-21 | 기존 프로젝트 공통기능분석서 최초 작성 | 아키텍터 |
