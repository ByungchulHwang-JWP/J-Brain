# GraphRAG AI Agent 공통 프레임워크 RAG/Agent 구현 현황 분석서

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 개발 프로젝트의 `230.분석` 단계 산출물로, 기존 서비스 프로젝트(`Sol-Bat`, `VectorMoon`, `accountBook`, `lotto`)에 구현된 RAG, Vector Store, LangGraph Agent 구조를 분석하고 공통 프레임워크로 분리할 대상을 정의한다.

### 1.2 분석 범위

| 구분 | 분석 대상 |
|---|---|
| 서비스 프로젝트 | `Sol-Bat`, `VectorMoon`, `accountBook`, `lotto` |
| 공통 프레임워크 참조 | `vm-common-core` |
| 분석 영역 | RAG 처리, Vector Store, 문서/자료 인덱싱, LangGraph Agent, LLM 호출, 프롬프트/JSON 파싱, 관리자 자료 관리, 운영/스케줄러 연계 |
| 산출 목적 | GraphRAG 공통 프레임워크 설계와 구현 대상 도출 |

### 1.3 주요 소스 근거

| 프로젝트 | 주요 파일 | 확인 내용 |
|---|---|---|
| `Sol-Bat` | `src/rag/rag_manager.py`, `src/rag/ingest.py`, `src/graph.py`, `src/nodes.py`, `app/api.py` | PGVector 기반 RAG, 문서 업로드/청크/검색/삭제, LangGraph 농업 Agent |
| `VectorMoon` | `src/vector_store.py`, `src/graph.py`, `src/nodes.py`, `src/state.py`, `app/api.py` | PGVector 문서 RAG, 문서 목록/삭제/미리보기, 주식 분석 Agent, NotebookLM fallback |
| `accountBook` | `ai_pipeline/vector_store.py`, `ai_pipeline/classifier.py`, `main.py` | FAISS 기반 유사 가맹점 검색, RAG hint 기반 거래 분류 |
| `lotto` | `agents/lotto_graph.py`, `backend.py` | LangGraph 추천 Agent, `BaseAgentState` 상속, 스케줄러/알림 연계 |
| `vm-common-core` | `ai_pipeline/vectorstores/factory.py`, `ai_pipeline/langgraph/base_state.py` | Vector Store Factory, 공통 Agent State 기반 |

## 2. 전체 구현 현황 요약

### 2.1 프로젝트별 AI 구현 성격

| 프로젝트 | RAG 구현 | Vector Store | LangGraph Agent | 관리자/운영 기능 | 공통화 적합도 |
|---|---|---|---|---|---|
| `Sol-Bat` | 농업 지식 검색, 사용자/공용 지식 필터 | PGVector | 농장 상황 수집, 위험 평가, 지식 검색, 조언 생성 | 지식 문서 업로드, 삭제, 청크 조회 | 매우 높음 |
| `VectorMoon` | 전략/종목 문서 검색, 분석 컨텍스트 보강 | PGVector | 가격/뉴스/문서/기술분석/최종의견 | 문서 업로드, 목록, 삭제, preview, 검색 테스트 | 매우 높음 |
| `accountBook` | 거래 분류용 유사 가맹점 hint | FAISS | 명시적 LangGraph 없음 | 파일 업로드, 파싱, 분류, 리포트 | 높음 |
| `lotto` | 명시적 RAG 없음 | 없음 | 통계 분석, 번호 생성, LLM insight | 동기화/리포트 스케줄러, 알림 | 중간 |

### 2.2 구현 패턴 관찰

| 공통 패턴 | 확인 프로젝트 | 설명 |
|---|---|---|
| 문서 또는 원천자료 등록 | `Sol-Bat`, `VectorMoon`, `accountBook` | 업로드된 파일을 파싱하고 AI 처리 대상으로 등록 |
| Chunking/Embedding/저장 | `Sol-Bat`, `VectorMoon`, `accountBook` | 자료를 작은 단위로 분리하거나 항목별 embedding 생성 |
| Vector 검색 결과를 Agent 입력으로 사용 | `Sol-Bat`, `VectorMoon`, `accountBook` | 검색 결과를 지식 컨텍스트, 문서 요약, 분류 hint로 주입 |
| LangGraph 기반 단계형 Agent | `Sol-Bat`, `VectorMoon`, `lotto` | State 기반 노드 체인으로 Agent 실행 흐름 구성 |
| LLM JSON 응답 파싱 | `Sol-Bat`, `accountBook`, `lotto` | Agent 결과 또는 분류 결과를 JSON 형태로 요구하고 파싱 |
| 운영 스케줄러/알림 | `VectorMoon`, `accountBook`, `lotto`, `vm-common-core` | 정기 작업, 리포트, Telegram/Email 알림 구현 |

## 3. `Sol-Bat` 구현 현황

### 3.1 RAG 구조

| 항목 | 구현 내용 |
|---|---|
| 핵심 클래스 | `RAGManager` |
| Embedding | `OpenAIEmbeddings(model="text-embedding-3-small")` |
| 저장소 | `PGVector`, collection: `solbat_knowledge` |
| 검색 방식 | `similarity_search(query, k, filter)` |
| 권한/범위 | `scope=PUBLIC` 또는 `user_id` 기준 필터 |
| 문서 추가 | `add_documents(documents, user_id, scope, filename)` |
| 문서 삭제 | `delete_by_filename(filename)`에서 pgvector 테이블 직접 삭제 |
| 청크 조회 | `get_chunks_by_filename(filename, user_id)` |

### 3.2 인덱싱 구조

| 단계 | 구현 내용 |
|---|---|
| 파일 탐색 | `src/rag/ingest.py`에서 디렉터리 내 PDF/TXT 탐색 |
| 문서 로딩 | `PyPDFLoader`, `TextLoader` |
| 청크 분할 | `RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)` |
| 저장 | `rag_manager.add_documents(chunks)` |
| 관리자 업로드 | `app/api.py`의 `/kb/upload` 계열 API에서 업로드 파일 처리 후 저장 |

### 3.3 Agent 구조

| 노드 | 역할 | GraphRAG 공통화 관점 |
|---|---|---|
| `fetch_context` | 기상, 토양, 병해충, 작물 상태 수집 | External Context Adapter |
| `evaluate_rules` | 규칙 기반 위험 평가 | Rule Engine Node |
| `retrieve_knowledge` | RAG 검색으로 정책/농법/위험 대응 지식 검색 | GraphRAG Retrieval Node |
| `farm_agent` | LLM 기반 최종 조언 및 작업 추천 생성 | Agent Answer Node |

### 3.4 공통화 대상

| 대상 | 공통화 방향 |
|---|---|
| `RAGManager` | `BaseRAGManager` 또는 `RetrievalService`로 분리 |
| `scope/user_id` 필터 | tenant, domain, user, scope 기반 공통 metadata filter |
| `ingest_docs` | `DocumentPipeline.load -> split -> enrich_metadata -> index` 표준화 |
| `/kb/upload`, 삭제, 청크 조회 | 관리자 Source API 표준으로 이관 |
| `retrieve_knowledge` | LangGraph에서 재사용 가능한 `GraphRAGRetrieveNode`로 분리 |

## 4. `VectorMoon` 구현 현황

### 4.1 RAG/Vector Store 구조

| 항목 | 구현 내용 |
|---|---|
| 핵심 모듈 | `src/vector_store.py` |
| Embedding | `OpenAIEmbeddings(model="text-embedding-3-small")` |
| 저장소 | `PGVector`, collection: `stock_docs` |
| 지원 파일 | PDF, DOCX, CSV, Markdown, Text |
| 문서 처리 | `process_document`, `process_document_with_preview` |
| 검색 | `query_documents(ticker, query, k=4)` |
| 필터 | `{ticker: 요청 종목} OR {ticker: GLOBAL}` |
| 문서 관리 | `list_documents`, `delete_document`, `get_document_chunks` |

### 4.2 관리자 기능 연결

| 기능 | 구현 위치 | 공통화 의미 |
|---|---|---|
| 문서 목록 | `list_documents()` 및 `/api/documents` 계열 | Source 목록 조회 |
| 문서 업로드 | `/api/upload_doc` | Source 등록 및 Index Job 생성 |
| 처리 미리보기 | `process_document_with_preview()` | Chunk Preview |
| 문서 삭제 | `delete_document(source)` | Source 삭제 및 Vector 삭제 |
| 검색 테스트 | `query_documents()` API 연계 | Retrieval Test Console |

### 4.3 Agent 구조

| 노드 | 역할 | GraphRAG 공통화 관점 |
|---|---|---|
| `fetch_price` | 가격 데이터 수집 | External Data Node |
| `fetch_news` | 뉴스/공시 수집 | External Data Node |
| `retrieve_documents` | 전략/종목 문서 RAG 검색 | GraphRAG Retrieval Node |
| `analyze_technical` | 기술 지표/전략 벡터 분석 | Domain Analysis Node |
| `summarize_price` | 가격 요약 | LLM Summary Node |
| `summarize_news` | 뉴스 요약 | LLM Summary Node |
| `summarize_documents` | RAG 문서 요약 | Context Summary Node |
| `analyze_stock` | 최종 투자 의견 생성 | Agent Answer Node |

### 4.4 특이 구현

| 항목 | 내용 | 공통 프레임워크 반영 |
|---|---|---|
| NotebookLM fallback | pgvector 검색 결과가 없을 때 외부 지식 도구로 fallback | Retriever fallback chain |
| GLOBAL/CORE 문서 | 종목별 문서와 공통 전략 문서 구분 | domain/scope/source_type metadata |
| 문서 preview | 처리 직후 chunk 수와 앞쪽 chunk 반환 | 관리자 검수 기능 |
| 직접 SQL 관리 | pgvector 테이블에서 source별 조회/삭제 | VectorStoreAdapter 내부 구현으로 캡슐화 |

### 4.5 공통화 대상

| 대상 | 공통화 방향 |
|---|---|
| `get_document_loader` | `ParserRegistry`로 통합 |
| `process_document_with_preview` | `IndexJobRunner` + `PreviewService`로 분리 |
| `query_documents` | `HybridRetriever.search(domain, query, filters)`로 확장 |
| `list/delete/get_chunks` | `SourceManager`와 `VectorStoreAdapter` 공통 API |
| `retrieve_documents` | Agent 공통 Retrieval Node 템플릿으로 분리 |

## 5. `accountBook` 구현 현황

### 5.1 Vector Store 구조

| 항목 | 구현 내용 |
|---|---|
| 핵심 클래스 | `VectorStore` |
| 저장소 | FAISS `IndexFlatL2` |
| 저장 방식 | `.index`, `.meta` 로컬 파일 |
| Embedding | OpenAI `text-embedding-3-small` |
| metadata | merchant, category_main, category_sub, source_id, updated_at |
| 검색 | merchant명으로 유사 가맹점 검색 |
| 삭제 | source_id 기준 metadata 삭제 후 index rebuild |

### 5.2 RAG 기반 분류 구조

| 단계 | 구현 내용 |
|---|---|
| 거래 입력 | 카드/가계부 거래 목록 |
| 유사 가맹점 검색 | `vector_store.search(merchant, k=1)` |
| hint 생성 | threshold 이하인 경우 과거 분류 결과를 hint로 생성 |
| LLM 분류 | hint와 표준 카테고리를 프롬프트에 포함 |
| JSON 응답 | `{"results": [...]}` 형식으로 거래별 분류 결과 파싱 |

### 5.3 Agent 구조 관점

`accountBook`에는 명시적인 LangGraph Agent는 없지만, 다음과 같은 Agent 패턴이 존재한다.

| 단계 | 현재 구현 | LangGraph 전환 후보 |
|---|---|---|
| 자료 업로드 | 카드/지출 파일 업로드 | `load_source` |
| 파싱 | 거래 데이터 추출 | `parse_transactions` |
| RAG hint 검색 | 가맹점 유사도 검색 | `retrieve_classification_hint` |
| LLM 분류 | 카테고리 분류 | `classify_transactions` |
| 결과 저장/리포트 | DB 저장, 월간 리포트 | `save_and_report` |

### 5.4 공통화 대상

| 대상 | 공통화 방향 |
|---|---|
| FAISS 저장소 | `FAISSVectorStoreAdapter`로 분리 |
| source_id 기반 삭제 | SourceManager와 VectorStoreAdapter 계약에 반영 |
| RAG hint | `RetrieverResult`를 LLM prompt에 주입하는 공통 패턴 |
| 분류 JSON 파싱 | `StructuredLLMClient` 또는 `JsonOutputParser` 공통화 |
| 파일 파싱 | `ParserRegistry`에 Excel/CSV 거래 파서 등록 |

## 6. `lotto` 구현 현황

### 6.1 LangGraph Agent 구조

| 항목 | 구현 내용 |
|---|---|
| State | `LottoAgentState`가 `common_core.ai_pipeline.langgraph.base_state.BaseAgentState` 상속 |
| Graph | `StateGraph(LottoAgentState)` |
| 노드 | `analyze`, `generate`, `llm_insight` |
| 실행 결과 | 5게임 번호, 추천 근거, confidence score |
| LLM | `ChatOpenAI(model="gpt-4o")` |

### 6.2 Agent 노드

| 노드 | 역할 | 공통화 관점 |
|---|---|---|
| `analyze` | 과거 회차 빈도, 최근 가중치, cold number 분석 | Domain Analysis Node |
| `generate` | 전략별 번호 조합 생성 | Candidate Generation Node |
| `llm_insight` | 추천 근거와 게임별 insight 생성 | LLM Explanation Node |

### 6.3 운영 구조

| 항목 | 구현 내용 | 공통화 대상 |
|---|---|---|
| API 서버 | FastAPI + router include | API bootstrap template |
| DB | `common_core.db.database` 사용 | 공통 DB 기반 확인 |
| 스케줄러 | `AsyncIOScheduler`로 동기화/리포트 실행 | Scheduler Job 표준화 |
| 알림 | 결과 리포트 발송 | Notification Adapter |

### 6.4 GraphRAG 적용 가능성

현재 `lotto`는 RAG나 Vector Store를 사용하지 않지만, GraphRAG 관점에서는 다음 확장이 가능하다.

| 확장 대상 | 설명 |
|---|---|
| 패턴 지식 그래프 | 회차, 번호, 번호대, 홀짝, 합계, AC값, 전략 간 관계 저장 |
| 추천 근거 Evidence | 특정 번호 조합이 선택된 통계 근거를 evidence로 연결 |
| 회차 결과 추적 | 추천 조합과 실제 당첨 결과 관계를 그래프로 축적 |
| Agent 평가 | 추천 전략별 성과를 graph 기반으로 조회 |

## 7. 공통화 대상 도출

### 7.1 RAG Core

| 공통 컴포넌트 | 포함 기능 | 기존 근거 |
|---|---|---|
| `DocumentPipeline` | load, parse, split, metadata enrich, validate | `Sol-Bat.ingest`, `VectorMoon.process_document` |
| `EmbeddingProvider` | OpenAI embedding 모델 설정, 오류 처리 | 3개 프로젝트에서 OpenAI embedding 사용 |
| `VectorStoreAdapter` | add, search, delete, list, get_chunks, preview | PGVector/FAISS 구현 중복 |
| `RetrieverService` | query 생성, metadata filter, k 설정, 결과 format | `RAGManager.search`, `query_documents`, `vector_store.search` |
| `ContextAssembler` | 검색 결과를 LLM 컨텍스트로 변환 | Sol-Bat/VectorMoon의 출처 포함 문자열 생성 |

### 7.2 GraphRAG Core

| 공통 컴포넌트 | 포함 기능 | 적용 대상 |
|---|---|---|
| `GraphSchemaRegistry` | domain별 entity/relation schema 등록 | 농업, 투자, 가계부, 로또 |
| `EntityExtractor` | chunk에서 entity 후보 추출 | 문서 인덱싱 단계 |
| `RelationExtractor` | entity 간 관계 추출 | 문서 인덱싱 단계 |
| `EvidenceLinker` | chunk, source, entity, relation 연결 | 근거 추적 |
| `GraphStore` | entity/relation/evidence 저장 및 조회 | PostgreSQL graph tables 우선 |
| `HybridRetriever` | vector 검색 + graph traversal + reranking | Agent 검색 노드 |

### 7.3 Agent Core

| 공통 컴포넌트 | 포함 기능 | 기존 근거 |
|---|---|---|
| `BaseAgentState` 확장 | messages, context, metadata, error, next_node | `vm-common-core`, `lotto` |
| `WorkflowFactory` | 노드 등록, edge 구성, compile | `Sol-Bat`, `VectorMoon`, `lotto` |
| `GraphRAGRetrieveNode` | state 기반 질의 생성, 검색, context 주입 | `retrieve_knowledge`, `retrieve_documents` |
| `LLMSummaryNode` | 컨텍스트 요약 | VectorMoon 문서/뉴스/가격 요약 |
| `LLMAnswerNode` | 최종 답변/추천 생성 | Sol-Bat, VectorMoon, lotto |
| `StructuredOutputParser` | JSON 응답 파싱, fallback 처리 | Sol-Bat, accountBook, lotto |

### 7.4 Admin/Operation Core

| 공통 컴포넌트 | 포함 기능 | 기존 근거 |
|---|---|---|
| `SourceManager` | 자료 등록, 목록, 상세, 삭제, 상태 관리 | Sol-Bat, VectorMoon |
| `IndexJobManager` | 인덱싱 작업 생성, 실행, 상태, 실패 사유, 재시도 | Sol-Bat, VectorMoon, accountBook |
| `PreviewService` | chunk/entity/relation preview | VectorMoon, Sol-Bat |
| `SearchTestService` | 관리자 검색 테스트 | VectorMoon, Sol-Bat |
| `SchedulerAdapter` | 정기 인덱싱, 평가, 동기화 | VectorMoon, lotto |
| `NotificationAdapter` | 인덱싱 실패, 작업 완료, 리포트 알림 | VectorMoon, lotto, accountBook |

## 8. 프로젝트별 공통화 적용 매핑

| 공통 모듈 | Sol-Bat | VectorMoon | accountBook | lotto |
|---|---|---|---|---|
| `DocumentPipeline` | 정책/농법 문서 인덱싱 | 전략/종목 문서 인덱싱 | 카드/거래 파일 파싱 | 적용 낮음 |
| `VectorStoreAdapter` | PGVector | PGVector | FAISS | 향후 적용 |
| `SourceManager` | KB 문서 관리 | 문서 관리 | 학습데이터 관리 | 추천 결과/회차 자료 관리 후보 |
| `IndexJobManager` | KB 인덱싱 | 문서 인덱싱 | 학습데이터 embedding | 회차 동기화 job 후보 |
| `HybridRetriever` | 농업 지식 검색 | 전략/종목 검색 | 가맹점 hint 검색 | 향후 패턴 검색 |
| `GraphRAGRetrieveNode` | `retrieve_knowledge` 대체 | `retrieve_documents` 대체 | 분류 hint node 후보 | 향후 전략 근거 node |
| `StructuredOutputParser` | 조언 JSON 파싱 | 최종 분석 파싱 보강 | 거래 분류 JSON 파싱 | insight JSON 파싱 |
| `SchedulerAdapter` | 배치 인덱싱 후보 | 리포트/매매 작업 | 월간 리포트 | 동기화/리포트 |

## 9. GraphRAG 프레임워크 목표 구조

```text
aicore/
  rag/
    document_pipeline.py
    parser_registry.py
    embedding_provider.py
    retriever_service.py
    context_assembler.py
  vectorstores/
    base.py
    pgvector_adapter.py
    faiss_adapter.py
    chroma_adapter.py
  graphrag/
    schema_registry.py
    entity_extractor.py
    relation_extractor.py
    evidence_linker.py
    graph_store.py
    hybrid_retriever.py
  agents/
    base_state.py
    workflow_factory.py
    nodes/
      graph_retrieve_node.py
      llm_summary_node.py
      llm_answer_node.py
      structured_output_node.py
  admin/
    source_manager.py
    index_job_manager.py
    preview_service.py
    search_test_service.py
  ops/
    scheduler_adapter.py
    notification_adapter.py
    metrics.py
```

## 10. 우선순위

### 10.1 MVP 우선순위

| 우선순위 | 구현 대상 | 선정 사유 | 1차 적용 프로젝트 |
|---:|---|---|---|
| 1 | `VectorStoreAdapter` | PGVector/FAISS 중복을 먼저 해소해야 RAG 공통화 가능 | `Sol-Bat`, `VectorMoon`, `accountBook` |
| 2 | `DocumentPipeline` | 로딩, chunking, metadata 부여가 반복 구현됨 | `Sol-Bat`, `VectorMoon` |
| 3 | `SourceManager` | 관리자 사이트 자료 관리의 핵심 기능 | `Sol-Bat` |
| 4 | `IndexJobManager` | 벡터화 실행/상태 모니터링 요구사항과 직접 연결 | `Sol-Bat` |
| 5 | `GraphRAGRetrieveNode` | 기존 LangGraph Agent에 공통 검색 노드를 삽입하기 쉬움 | `Sol-Bat`, `VectorMoon` |
| 6 | `GraphStore`/`EvidenceLinker` | GraphRAG 전환을 위한 신규 핵심 기능 | `Sol-Bat` |
| 7 | `HybridRetriever` | vector + graph 통합 검색 가치 검증 | `Sol-Bat` |

### 10.2 1차 파일럿 권고

1차 파일럿은 `Sol-Bat`을 기준으로 수행한다.

| 이유 | 설명 |
|---|---|
| RAG 구조가 단순하고 명확함 | `RAGManager`, `ingest`, `retrieve_knowledge` 흐름이 분리되어 있음 |
| 관리자 요구사항과 직접 연결 | 자료 등록, 벡터화 실행, 상태 모니터링, 청크 조회 요구가 자연스럽게 적용됨 |
| GraphRAG 도메인이 선명함 | 작물, 병해충, 기상, 토양, 정책, 작업 간 관계를 entity/relation으로 정의하기 좋음 |
| 이후 확장성 | `VectorMoon`의 관리자/preview 구현을 흡수해 기능을 고도화 가능 |

## 11. 리스크 및 대응

| 리스크 ID | 리스크 | 영향 | 대응 방안 |
|---|---|---|---|
| RA-001 | PGVector와 FAISS API 차이 | 공통 Adapter 설계 복잡도 증가 | `add/search/delete/list/get_chunks` 최소 계약을 먼저 정의 |
| RA-002 | 서비스별 metadata 구조 불일치 | 검색 필터와 권한 처리 오류 | `domain`, `source_id`, `scope`, `tenant_id`, `user_id`, `tags` 표준 필드 정의 |
| RA-003 | GraphRAG 신규 기능 범위 과대 | MVP 일정 지연 | 1차는 PostgreSQL 기반 graph table과 rule+LLM extractor로 제한 |
| RA-004 | LLM JSON 파싱 실패 | Agent 결과 품질 저하 | schema validation, retry, fallback message 공통화 |
| RA-005 | 기존 서비스 직접 수정 부담 | 회귀 위험 | 공통 모듈을 먼저 만들고 `Sol-Bat`에 adapter 방식으로 시범 적용 |
| RA-006 | 문서 인코딩/한글 정규화 문제 | 검색 품질 저하 | TextNormalizer, Unicode NFC 정규화, chunk 검수 preview 제공 |

## 12. 분석 결론

기존 프로젝트들은 모두 AI Agent 개발 과정에서 반복적으로 필요한 핵심 패턴을 이미 구현하고 있다. 특히 `Sol-Bat`과 `VectorMoon`은 PGVector 기반 RAG와 LangGraph Agent가 모두 존재하므로 GraphRAG 공통 프레임워크의 직접적인 원형으로 활용할 수 있다. `accountBook`은 FAISS 기반 로컬 Vector Store와 RAG hint 기반 분류 구조를 제공하므로 VectorStoreAdapter와 Structured Output 공통화 검증에 적합하다. `lotto`는 RAG 구현은 없지만 `vm-common-core`의 `BaseAgentState`를 상속한 LangGraph Agent 사례로, Agent Core 공통화 검증에 의미가 있다.

따라서 1차 구현은 `VectorStoreAdapter`, `DocumentPipeline`, `SourceManager`, `IndexJobManager`, `GraphRAGRetrieveNode` 순서로 진행하고, 이후 `GraphStore`, `EvidenceLinker`, `HybridRetriever`를 추가하는 방식이 적합하다.

## 13. 후속 작업

| 우선순위 | WBS 연계 | 후속 작업 | 산출물 |
|---:|---|---|---|
| 1 | 230.분석 | 도메인 개념 및 용어 분석 | 도메인정의서, 용어정의서 |
| 2 | 230.분석 | 논리 데이터 모델 분석 | 논리 ERD 초안 |
| 3 | 240.설계 | GraphRAG 공통 모듈 상세설계 | 공통모듈상세설계서 |
| 4 | 240.설계 | 관리자 사이트 화면/API 설계 | 화면정의서, API명세서 |
| 5 | 300.구현 | `vm-common-core` GraphRAG 패키지 구현 | 공통 프레임워크 소스 |

## 14. 승인 및 변경 이력

### 14.1 승인 기록

| 구분 | 역할 | 승인 여부 | 일자 | 비고 |
|---|---|---|---|---|
| 작성 | GraphRAG Engineer | 작성 완료 | 2026-06-21 | 초안 |
| 검토 | 아키텍터 | 검토 필요 | - | 공통 모듈 구조 검토 |
| 검토 | PM | 검토 필요 | - | 일정 및 WBS 반영 |
| 승인 | Product Owner | 승인 필요 | - | 사용자 확인 필요 |

### 14.2 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-21 | RAG/Agent 구현 현황 분석서 최초 작성 | GraphRAG Engineer |
