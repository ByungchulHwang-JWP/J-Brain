# GraphRAG AI Agent 공통 프레임워크 테스트계획서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 280.테스트 |
| WBS | 8.1 테스트계획서 작성 |
| 담당 | QA |
| 작성 목적 | GraphRAG Core, 관리자 사이트, Sol-Bat 파일럿, Source/IndexJob/Preview/Hybrid Retrieval, Agent 연계, 보안/권한/오류/성능/품질 검증을 위한 테스트 범위와 수행 계획을 정의 |
| 작성일 | 2026-06-21 |

## 2. 테스트 목적

본 테스트의 목적은 GraphRAG AI Agent 공통 프레임워크가 신규 서비스 적용에 필요한 공통 기능을 안정적으로 제공하는지 검증하는 것이다.

주요 검증 목표는 다음과 같다.

- RAG Core의 Source 처리, Parser, Chunking, Metadata 처리 기능 검증
- VectorStore, GraphStore, Entity/Relation/Evidence 추출 기능 검증
- Hybrid Retrieval의 Vector + Graph + Evidence 통합 검색 품질 검증
- Agent Workflow와 GraphRAG Retrieve Node 연계 검증
- 관리자 사이트의 Source 관리, IndexJob 실행, Preview, 검색 테스트 기능 검증
- Sol-Bat 파일럿 적용 결과의 재현성 및 도메인 적합성 검증
- 보안/권한, 오류 처리, 성능, 운영성, AI 품질 기준 검증

## 3. 테스트 범위

### 3.1 포함 범위

| 구분 | 테스트 대상 | 주요 검증 항목 |
| --- | --- | --- |
| GraphRAG Core | EntityExtractor, RelationExtractor, EvidenceLinker, GraphStoreAdapter, HybridRetriever, ContextAssembler | Entity/Relation/Evidence 추출, Graph 저장/조회, Hybrid 검색, context 조립 |
| RAG Core | DocumentPipeline, ParserRegistry, Chunker, MetadataEnricher, TextNormalizer | Source 처리, 파싱, 청킹, 메타데이터 보강 |
| Vector Store | InMemoryVectorStore, FAISS/PGVector Adapter 골격, VectorStoreFactory | add/search/delete, provider registry, 한글 토큰 검색 |
| Graph Store | InMemoryGraphStore, PostgreSQL GraphStoreAdapter 골격 | entity/relation/evidence upsert/find/traverse/delete |
| 관리자 사이트 | Source 관리, IndexJob, Preview, RetrievalTest UI/API | Source 등록/조회/삭제, IndexJob 실행/재시도, Preview, HYBRID 검색 |
| Agent 연계 | WorkflowFactory, GraphRAGRetrieveNode, LLM Answer Node, Structured Output Node | Agent state context/evidence/citation 반영 |
| Sol-Bat 파일럿 | Sol-Bat 도메인 스키마, 파일럿 데이터 인덱싱, GraphRAG 검색 adapter | P1 데이터 3건, HYBRID 검색, state adapter |
| 보안/권한 | Admin API, Source scope, AuthContext | 역할/범위/오류 응답 |
| 성능/운영 | IndexJob, Retrieval, Preview | 처리 시간, 로그, 실패 단계, 재시도 |
| AI 품질 | 검색 관련성, 근거성, 출처성, 안전성 | HIT율, evidence coverage, hallucination risk |

### 3.2 제외 범위

| 제외 항목 | 사유 | 후속 계획 |
| --- | --- | --- |
| 운영 Supabase/PGVector 완전 부하 테스트 | 현재 PoC는 InMemory 중심 | 운영 DB adapter 확정 후 별도 성능 테스트 |
| 외부 API 실시간 품질 검증 | KMA/NPMS/토양 API 자체 품질은 Sol-Bat 외부 연계 영역 | 연계 테스트 단계에서 별도 수행 |
| LLM 모델 품질 대규모 평가 | 현재 LLM Answer Node는 골격 수준 | 모델/프롬프트 확정 후 AI 평가셋 확장 |
| UI 브라우저 자동화 전체 회귀 | 현재 관리자 MVP는 정적 HTML/API 골격 | 프론트엔드 프레임워크 적용 후 E2E 확대 |

## 4. 테스트 전략

| 테스트 유형 | 전략 |
| --- | --- |
| 단위 테스트 | 모듈별 순수 함수/클래스 동작 검증. pytest 또는 직접 호출 방식 사용 |
| 통합 테스트 | DocumentPipeline → VectorStore/GraphStore → HybridRetriever → ContextAssembler 흐름 검증 |
| API 테스트 | FastAPI Router 사용 가능 환경에서 Admin API request/response 검증 |
| UI 테스트 | 관리자 HTML 화면의 주요 버튼/입력/결과 표시 흐름 수동 확인 |
| 파일럿 테스트 | Sol-Bat P1 데이터 3건으로 Source 등록, IndexJob, Preview, 검색 재현 |
| 오류 테스트 | 빈 content, 미존재 source/job, 잘못된 strategy, delete 후 조회 등 검증 |
| 보안/권한 테스트 | AuthContext roles, scope, tenant/user filter 정책 검증 |
| 성능 테스트 | 소량/중량 데이터 기준 indexing/retrieval latency 측정 |
| AI 품질 테스트 | 검색 결과 관련성, evidence coverage, citation, 안전 문구 확인 |

## 5. 테스트 환경

| 항목 | 내용 |
| --- | --- |
| 로컬 저장소 | `D:\Dev\codex\GitHub\GraphRAG-AI-Agnet` |
| 파일럿 대상 | `D:\Dev\codex\GitHub\Sol-Bat` |
| Python Runtime | Codex bundled Python |
| 주요 실행 명령 | `python -m compileall src tests` |
| 테스트 실행 방식 | pytest 설치 시 pytest 사용, 미설치 시 테스트 함수 직접 호출 |
| 기본 저장소 | InMemoryVectorStore, InMemoryGraphStore |
| 파일럿 데이터 | Sol-Bat P1 데이터 3건 |
| 관리자 UI | `src/common_core/admin/web/admin_mvp.html` |

## 6. 테스트 데이터 계획

### 6.1 기본 테스트 데이터

| 데이터 ID | 데이터 | 목적 |
| --- | --- | --- |
| TD-CORE-01 | `Tomato disease prevention guide...` | 영문 RAG/GraphRAG 기본 흐름 |
| TD-CORE-02 | `토마토 개화기에는 다습한 환경...` | 한글 Entity/Relation/검색 검증 |
| TD-CORE-03 | 빈 content 또는 공백 content | 오류 처리 검증 |
| TD-CORE-04 | 다중 Source 동일 domain | Source filter 및 delete 검증 |

### 6.2 Sol-Bat 파일럿 데이터

| 데이터 ID | 파일 | 목적 |
| --- | --- | --- |
| DATA-01 | `Sol-Bat/doc/귀농 정착 지원을 위한 AI 농사코치 서비스 구축_프롬프트.txt` | 도메인 지식 인덱싱/검색 검증 |
| DATA-02 | `Sol-Bat/test.txt` | TXT smoke test |
| DATA-03 | `Sol-Bat/valid_test.pdf` | PDF 추출 smoke test |
| DATA-P2 | 실제 농업 TXT/PDF 5건 이상 | 8.4 품질 평가 확장 데이터 |

## 7. 테스트 항목

### 7.1 GraphRAG Core

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-GRAG-001 | Sol-Bat schema 등록/조회 | `sol_bat` schema 조회 성공 |
| TC-GRAG-002 | EntityExtractor 한글/영문 alias 추출 | CROP, PEST_DISEASE, ENVIRONMENT_CONDITION 등 추출 |
| TC-GRAG-003 | EntityResolver 중복 병합 | 동일 normalized_name 단일 Entity로 병합 |
| TC-GRAG-004 | RelationExtractor relation rule 적용 | HAS_RISK_OF, PREVENTS, TREATS, AFFECTS, APPLIES_AT 추출 |
| TC-GRAG-005 | EvidenceLinker Entity/Relation Evidence 연결 | ENTITY/RELATION link 생성 |
| TC-GRAG-006 | InMemoryGraphStore traverse | seed entity 기준 relation/evidence 반환 |
| TC-GRAG-007 | delete_by_source | source 관련 graph data 삭제 |

### 7.2 RAG Core / Vector Store

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-RAG-001 | DocumentPipeline TEXT 처리 | ParsedDocument, Chunk 생성 |
| TC-RAG-002 | Chunker chunk size/overlap | 지정 옵션 기준 chunk 분리 |
| TC-RAG-003 | MetadataEnricher source metadata 반영 | source_id, domain, scope, filename 유지 |
| TC-RAG-004 | InMemoryVectorStore add/search/delete | 저장, 검색, 삭제 정상 |
| TC-RAG-005 | 한글 토큰 검색 | 한글 query로 관련 chunk HIT |
| TC-RAG-006 | VectorStoreFactory provider registry | 등록 provider 생성 |

### 7.3 Hybrid Retrieval

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-HYB-001 | VECTOR_ONLY 검색 | vector result만 반환 |
| TC-HYB-002 | GRAPH_ONLY 검색 | relation/evidence result 반환 |
| TC-HYB-003 | HYBRID 검색 | chunk + relation 결과 통합 |
| TC-HYB-004 | source_id filter | 지정 source 결과만 반환 |
| TC-HYB-005 | evidence coverage | 검색 결과에 evidence/citation 포함 |
| TC-HYB-006 | MISS 처리 | 결과 없음 상태와 metrics 반환 |

### 7.4 관리자 사이트/API

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-ADM-001 | Source 등록 | REGISTERED Source 생성 |
| TC-ADM-002 | Source 목록/상세 조회 | 등록 Source 조회 |
| TC-ADM-003 | Source 삭제 | DELETED 처리 및 목록 제외 |
| TC-ADM-004 | IndexJob 생성/실행 | COMPLETED 및 step timeline 생성 |
| TC-ADM-005 | IndexJob retry | steps 초기화 후 재실행 |
| TC-ADM-006 | Source Preview | Chunk/Entity/Relation/Evidence 반환 |
| TC-ADM-007 | RetrievalTest | HYBRID 검색 결과 반환 |
| TC-ADM-008 | 관리자 HTML UI | Source 등록/Job 실행/Preview/Search 화면 수동 확인 |

### 7.5 Agent 연계

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-AGT-001 | GraphRAGRetrieveNode context 반영 | state.context, retrieval, evidence, citations 생성 |
| TC-AGT-002 | WorkflowFactory 실행 | retrieve → answer → structured output 흐름 동작 |
| TC-AGT-003 | Sol-Bat state adapter | FarmingState 유사 dict에서 query 생성 |
| TC-AGT-004 | fallback 설계 확인 | 검색 실패 시 기존 RAG/기본 규칙 fallback 가능 |

### 7.6 Sol-Bat 파일럿

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-PILOT-001 | P1 데이터 3건 인덱싱 | 3건 COMPLETED |
| TC-PILOT-002 | DATA-01 도메인 Entity/Relation 추출 | Entity/Relation/Evidence 생성 |
| TC-PILOT-003 | DATA-02 TXT smoke | Chunk/Evidence 생성 및 검색 HIT |
| TC-PILOT-004 | DATA-03 PDF smoke | PDF 추출 텍스트 인덱싱 및 검색 HIT |
| TC-PILOT-005 | `retrieve_knowledge_with_graphrag` | GraphRAG context state 반영 |

### 7.7 보안/권한/오류

| ID | 테스트 항목 | 기대 결과 |
| --- | --- | --- |
| TC-SEC-001 | roles 없는 Admin API 접근 | 정책에 따른 거부 또는 제한 |
| TC-SEC-002 | tenant/user scope filter | 권한 범위 외 Source 미조회 |
| TC-ERR-001 | 미존재 source_id preview | 명확한 오류 반환 |
| TC-ERR-002 | 미존재 job_id retry | 명확한 오류 반환 |
| TC-ERR-003 | 잘못된 retrieval strategy | validation error |
| TC-ERR-004 | 빈 content 인덱싱 | 실패 상태와 오류 detail 기록 |

### 7.8 성능/운영/품질

| ID | 테스트 항목 | 목표 |
| --- | --- | --- |
| TC-PERF-001 | P1 데이터 인덱싱 시간 | 로컬 InMemory 기준 5초 이내 |
| TC-PERF-002 | HYBRID 검색 응답 시간 | 로컬 InMemory 기준 1초 이내 |
| TC-OPS-001 | IndexJob step 기록 | 실패 단계 식별 가능 |
| TC-OPS-002 | 로그/metrics | document/chunk/entity/relation/evidence count 확인 |
| TC-AIQ-001 | 질의 5건 관련 문맥 반환 | 3건 이상 HIT 또는 PARTIAL_HIT |
| TC-AIQ-002 | Evidence 기반 답변 가능성 | 검색 결과 60% 이상 evidence/citation 포함 |
| TC-AIQ-003 | 농자재/방제 안전성 | 안전 문구와 전문가 확인 권고 정책 적용 |

## 8. 테스트 일정

| WBS | 작업 | 기간 | 담당 | 산출물 |
| --- | --- | ---:| --- | --- |
| 8.1 | 테스트계획서 작성 | 1일 | QA | 테스트계획서 |
| 8.2 | 테스트시나리오 작성 | 1일 | QA, QA Automation Engineer | 테스트시나리오 |
| 8.3 | 단위 및 통합 테스트 수행 | 1일 | QA, 개발자 | 테스트결과서 |
| 8.4 | GraphRAG 품질 평가 | 1일 | AI/ML Engineer, Domain Expert | AI 품질 평가 결과 |
| 8.5 | 결함 조치 및 테스트 결과 확정 | 1일 | 개발자, QA, PM | 결함 및 조치결과 보고서 |

## 9. 역할 및 책임

| 역할 | 책임 |
| --- | --- |
| QA | 테스트계획/시나리오/결과 관리, 결함 등록 |
| QA Automation Engineer | 자동화 가능 테스트 스크립트 구성 |
| Backend Engineer | API, Store, Adapter 결함 조치 |
| GraphRAG Engineer | Entity/Relation/Evidence, Hybrid Retrieval 결함 조치 |
| AI/ML Engineer | 검색 품질, context 품질, LLM 답변 품질 평가 |
| Domain Expert | Sol-Bat 농업 도메인 적합성, 안전성 검토 |
| PM | 테스트 진척, 결함 우선순위, 단계 종료 승인 |

## 10. 진입 및 종료 기준

### 10.1 진입 기준

| 기준 | 상태 |
| --- | --- |
| 7.0 파일럿 산출물 확정 | 완료 |
| 테스트 대상 소스 커밋 | 완료 |
| P1 데이터 인덱싱 runner 준비 | 완료 |
| 관리자 MVP 기본 흐름 구현 | 완료 |
| 주요 테스트 데이터 식별 | 완료 |

### 10.2 종료 기준

| 기준 | 목표 |
| --- | --- |
| P1/P2 중요 테스트 수행 | 100% |
| 치명/상 결함 | 0건 |
| 중 결함 | 조치 또는 승인된 보류 |
| GraphRAG 품질 평가 | 기준 충족 또는 개선 과제 등록 |
| 테스트결과서 및 결함 조치결과 | 작성 완료 |

## 11. 결함 관리 기준

| 심각도 | 기준 | 조치 |
| --- | --- | --- |
| Critical | 주요 흐름 불가, 데이터 손상, 보안 위험 | 즉시 조치, 종료 불가 |
| High | Source/IndexJob/Search/Agent 핵심 기능 실패 | 테스트 단계 내 조치 |
| Medium | 특정 조건/데이터에서 기능 오류 | 우선순위 검토 후 조치 또는 보류 |
| Low | 문구, 표시, 로그, 개선 요청 | 후속 개선 과제 |

## 12. 리스크 및 대응

| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| pytest 환경 제약 | 해소 완료 | pytest 9.1.1 설치 후 32개 테스트 PASS 확인 |
| 실제 운영 DB 미검증 | 운영 전환 리스크 | PGVector/GraphStore adapter 통합 테스트 추가 |
| 한글/문서 인코딩 이슈 | 검색/추출 품질 저하 | UTF-8 파일 기반 테스트와 한글 토큰화 검증 |
| PDF 샘플 품질 부족 | PDF 파싱 검증 한계 | 실제 농업 PDF 추가 확보 |
| 농자재 처방 안전성 | 도메인/법적 리스크 | 안전 문구, 출처 표시, 전문가 확인 정책 |

## 13. 다음 작업

다음 작업은 WBS 기준 `8.2 테스트시나리오 작성`이다.

권장 요청 문구:

```text
[QA/QA Automation Engineer] 280.테스트 단계의 테스트시나리오를 작성해 주세요. GraphRAG Core, 관리자 사이트, Sol-Bat 파일럿, Source/IndexJob/Preview/Hybrid Retrieval, Agent 연계, 보안/권한/오류/성능/품질 테스트 케이스를 포함해 주세요.
```
