# GraphRAG AI Agent 공통 프레임워크 운영자매뉴얼

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 290.이행 |
| WBS | 9.2 운영자매뉴얼 작성 |
| 담당 | Technical Writer / DevOps |
| 작성 목적 | GraphRAG AI Agent 공통 프레임워크의 배포, 환경 설정, 로그 확인, 장애 대응, 저장소 점검, 백업/복구, 보안 점검 절차 정의 |
| 작성일 | 2026-06-21 |

## 2. 운영 대상 범위

본 운영자매뉴얼은 다음 구성요소를 운영 대상으로 한다.

| 구분 | 운영 대상 |
| --- | --- |
| 관리자 사이트 | Source 등록/조회/삭제, IndexJob 실행/상태 확인, Preview, GraphRAG 검색 테스트 |
| 관리자 API | `/api/admin/sources`, `/api/admin/index-jobs`, `/api/admin/retrieval-tests` |
| Agent API | `/api/agents/{agent_id}/runs`, `/api/agents/{agent_id}/runs/{agent_run_id}` |
| RAG Core | DocumentPipeline, ParserRegistry, Chunker, MetadataEnricher, TextNormalizer |
| GraphRAG Core | EntityExtractor, RelationExtractor, EvidenceLinker, HybridRetriever, ContextAssembler |
| 저장소 | VectorStore, GraphStore, Source/IndexJob 데이터 저장소 |
| 파일럿 도메인 | Sol-Bat 도메인 스키마 및 파일럿 데이터 |

## 3. 배포 구성

### 3.1 기본 구성

```mermaid
flowchart LR
    Admin["Admin Web"] --> API["Admin / Agent API"]
    API --> Pipeline["DocumentPipeline"]
    Pipeline --> VS["VectorStore"]
    Pipeline --> GS["GraphStore"]
    API --> Retriever["HybridRetriever"]
    Retriever --> VS
    Retriever --> GS
    API --> Agent["Agent Workflow"]
    Agent --> Retriever
```

### 3.2 배포 단위

| 배포 단위 | 설명 | 현재 상태 |
| --- | --- | --- |
| Python Package | `src/common_core` 공통 프레임워크 패키지 | 구현 완료 |
| Admin Service | Source/IndexJob/Preview/Search service | MVP 구현 완료 |
| Admin Router | FastAPI Router skeleton | 구현 완료 |
| Admin Web | 정적 관리자 MVP HTML | 구현 완료 |
| Agent Workflow | WorkflowFactory 및 node 구성 | 구현 완료 |
| VectorStore | InMemory 구현, FAISS/PGVector adapter 골격 | InMemory 중심 |
| GraphStore | InMemory 구현, PostgreSQL adapter 골격 | InMemory 중심 |

### 3.3 권장 운영 배포 구성

| 환경 | 권장 구성 |
| --- | --- |
| Local/개발 | InMemoryVectorStore, InMemoryGraphStore, 정적 Admin MVP |
| 검증 | FastAPI Admin API, 테스트 DB, PGVector/FAISS 후보 저장소 |
| 운영 | FastAPI 또는 서비스 API, PostgreSQL/PGVector, PostgreSQL GraphStoreAdapter, 인증/권한 모듈, 중앙 로그 |

### 3.4 배포 전 확인 명령

```powershell
cd D:\Dev\codex\GitHub\GraphRAG-AI-Agnet
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m compileall src tests tools
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pytest
```

정상 기준은 다음과 같다.

| 항목 | 기준 |
| --- | --- |
| compileall | 오류 없음 |
| pytest | 전체 테스트 PASS |
| 관리자 화면 | `admin_mvp.html` 로딩 가능 |
| Source/IndexJob flow | Source 등록 -> IndexJob 완료 -> Preview/Search 가능 |

## 4. 환경 변수 및 설정

### 4.1 기본 환경 변수

| 환경 변수 | 설명 | 예시 | 필수 |
| --- | --- | --- | --- |
| `APP_ENV` | 실행 환경 | `local`, `dev`, `stg`, `prod` | Y |
| `LOG_LEVEL` | 로그 레벨 | `INFO`, `DEBUG`, `WARNING`, `ERROR` | Y |
| `ADMIN_API_BASE_URL` | 관리자 API Base URL | `http://localhost:8000/api/admin` | Y |
| `DEFAULT_DOMAIN` | 기본 도메인 | `sol_bat` | N |
| `DEFAULT_RETRIEVAL_STRATEGY` | 기본 검색 전략 | `HYBRID` | N |
| `MAX_SOURCE_SIZE_MB` | Source 최대 크기 | `10` | N |
| `INDEX_JOB_TIMEOUT_SEC` | IndexJob 제한 시간 | `600` | N |

### 4.2 저장소 설정

| 환경 변수 | 설명 | 예시 | 적용 대상 |
| --- | --- | --- | --- |
| `VECTOR_STORE_PROVIDER` | VectorStore provider | `in_memory`, `faiss`, `pgvector` | VectorStoreFactory |
| `VECTOR_COLLECTION_NAME` | 기본 collection | `default` | VectorStore |
| `FAISS_INDEX_PATH` | FAISS index 저장 경로 | `D:\data\faiss\default.index` | FAISS |
| `PGVECTOR_DSN` | PGVector 연결 문자열 | `postgresql://user:***@host:5432/db` | PGVector |
| `GRAPH_STORE_PROVIDER` | GraphStore provider | `in_memory`, `postgresql` | GraphStoreAdapter |
| `GRAPH_STORE_DSN` | GraphStore DB 연결 문자열 | `postgresql://user:***@host:5432/db` | PostgreSQL GraphStore |

### 4.3 AI/Embedding 설정

| 환경 변수 | 설명 | 예시 | 비고 |
| --- | --- | --- | --- |
| `EMBEDDING_PROVIDER` | Embedding provider | `openai`, `local`, `mock` | 운영 전 확정 필요 |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` | provider별 상이 |
| `LLM_PROVIDER` | LLM provider | `openai`, `local`, `mock` | Agent Answer Node |
| `LLM_MODEL` | LLM model | `gpt-4.1-mini` | 운영 정책에 따름 |
| `AI_REQUEST_TIMEOUT_SEC` | AI 요청 timeout | `60` | 장애 격리용 |

민감정보는 `.env`, OS Secret Store, CI/CD Secret, Vault 등 안전한 저장소로 관리한다. 문서나 Source metadata에 API Key, Password, Token을 남기지 않는다.

## 5. 로그 확인

### 5.1 로그 종류

| 로그 | 확인 내용 |
| --- | --- |
| API Access Log | 요청 URI, status code, latency |
| Admin Service Log | Source 등록/삭제, IndexJob 생성/실행/재시도 |
| IndexJob Step Log | Parse, Chunk, Vector Write, Extract, Evidence Link, Finalize 단계 |
| Retrieval Log | query, strategy, result_count, elapsed_ms |
| AgentRun Log | agent_id, agent_run_id, status, retrieval_run_id, error |
| Security/Audit Log | actor, role, source_id, action, request_id |

### 5.2 로그 필수 필드

| 필드 | 설명 |
| --- | --- |
| `timestamp` | 로그 발생 시각 |
| `level` | `INFO`, `WARNING`, `ERROR` |
| `request_id` | API 요청 추적 ID |
| `actor_id` | 요청 사용자 또는 시스템 ID |
| `source_id` | Source 관련 작업 식별자 |
| `job_id` | IndexJob 식별자 |
| `retrieval_run_id` | 검색 실행 이력 |
| `agent_run_id` | Agent 실행 이력 |
| `error_code` | 표준 오류 코드 |
| `elapsed_ms` | 처리 시간 |

### 5.3 로그 확인 절차

1. 장애 발생 시각을 확인한다.
2. 사용자 요청의 `request_id` 또는 `job_id`를 확보한다.
3. API Access Log에서 status code와 latency를 확인한다.
4. Admin Service Log에서 작업 생성 여부를 확인한다.
5. IndexJob 장애라면 Step Log에서 실패 단계를 확인한다.
6. Retrieval/Agent 장애라면 `retrieval_run_id`, `agent_run_id` 기준으로 연결 로그를 확인한다.
7. 보안 오류라면 actor, role, scope, tenant 값을 확인한다.

## 6. IndexJob 장애 대응

### 6.1 상태별 대응

| 상태 | 의미 | 운영자 조치 |
| --- | --- | --- |
| `PENDING` | 생성 후 실행 대기 | 실행 요청 또는 worker 상태 확인 |
| `RUNNING` | 처리 중 | 장시간 지속 시 timeout 기준 확인 |
| `COMPLETED` | 정상 완료 | Preview/Search 확인 |
| `FAILED` | 실패 | 실패 step과 error 확인 후 재시도 또는 개발자 전달 |
| `CANCELLED` | 취소됨 | 취소 요청자와 사유 확인 |

### 6.2 장애 유형별 대응

| 장애 유형 | 주요 원인 | 확인 방법 | 조치 |
| --- | --- | --- | --- |
| Source Load 실패 | source_id 오류, 삭제 Source | Source 상세 조회 | Source 재등록 또는 올바른 source_id로 재실행 |
| Parse 실패 | 지원하지 않는 source_type, 깨진 파일 | IndexJob step `PARSE` 확인 | Source Type/파일 인코딩 확인 |
| Chunk 실패 | 빈 content, 비정상 텍스트 | Source content 확인 | 본문 보완 후 재실행 |
| Vector Write 실패 | VectorStore 연결 오류, provider 설정 오류 | VectorStore health check | provider 설정/연결 확인 |
| Entity Extract 실패 | schema 미등록, 도메인 값 오류 | SchemaRegistry domain 확인 | domain/schema 보완 |
| Relation Extract 실패 | entity 부족, schema relation 오류 | entity_count/relation_count 확인 | Source 품질 또는 schema 확인 |
| Evidence Link 실패 | chunk_id 불일치, evidence 생성 실패 | Evidence metrics 확인 | IndexJob 재실행 또는 개발자 전달 |
| Finalize 실패 | 상태 저장소 오류 | Source status, job status 확인 | 저장소 연결 복구 후 재시도 |

### 6.3 재시도 절차

1. 실패한 `job_id`를 확인한다.
2. `GET /api/admin/index-jobs/{job_id}`로 실패 단계와 오류를 확인한다.
3. Source content, domain, provider 설정을 확인한다.
4. 수정이 필요하면 Source를 보완하거나 신규 Source로 재등록한다.
5. 다음 API로 재시도한다.

```http
POST /api/admin/index-jobs/{job_id}/retry
```

6. 재시도 후 `steps` 전체가 `COMPLETED`인지 확인한다.
7. Preview와 GraphRAG 검색 테스트로 후속 검증을 수행한다.

### 6.4 개발자 에스컬레이션 기준

| 기준 | 에스컬레이션 대상 |
| --- | --- |
| 동일 Source에서 2회 이상 동일 step 실패 | Backend Engineer |
| VectorStore/GraphStore 연결 오류 반복 | Data Engineer / DevOps |
| Entity/Relation 품질 저하 | Knowledge Engineer / GraphRAG Engineer |
| 권한이 정상인데 401/403 반복 | Backend Engineer / Security |
| Agent 실행 중 retrieval context 누락 | GraphRAG Engineer / AI Engineer |

## 7. VectorStore 점검

### 7.1 점검 항목

| 항목 | 확인 기준 |
| --- | --- |
| provider 설정 | `VECTOR_STORE_PROVIDER` 값이 운영 구성과 일치 |
| collection | `VECTOR_COLLECTION_NAME` 존재 |
| add/search/delete | 테스트 데이터 기준 정상 수행 |
| chunk metadata | source_id, document_id, domain 포함 |
| 검색 응답 | top_k 기준 result_count 반환 |
| latency | 운영 기준 응답 시간 내 처리 |

### 7.2 점검 절차

1. provider 설정을 확인한다.
2. IndexJob 완료 Source의 `chunk_count`를 확인한다.
3. GraphRAG 검색 테스트에서 `strategy=VECTOR_ONLY` 또는 `HYBRID`로 검색한다.
4. 검색 결과의 `source_id`, `chunk_id`, `score`를 확인한다.
5. 검색 결과가 없으면 Source가 `INDEXED` 상태인지 확인한다.
6. provider가 PGVector/FAISS인 경우 index 파일 또는 DB table 상태를 확인한다.

### 7.3 장애 조치

| 증상 | 조치 |
| --- | --- |
| 검색 결과 없음 | Source 인덱싱 상태, collection, filter 확인 |
| score가 모두 낮음 | embedding provider/model 변경 여부 확인 |
| provider 생성 실패 | 환경 변수와 dependency 확인 |
| delete 후 결과 노출 | delete propagation 또는 cache 여부 확인 |

## 8. GraphStore 점검

### 8.1 점검 항목

| 항목 | 확인 기준 |
| --- | --- |
| provider 설정 | `GRAPH_STORE_PROVIDER` 값 확인 |
| entity 저장 | entity_count가 1 이상 |
| relation 저장 | relation_count가 domain 특성에 맞게 생성 |
| evidence 연결 | evidence_count가 생성되고 relation과 연결 |
| traverse | 기준 Entity에서 연결 Relation/Evidence 조회 가능 |
| 권한 필터 | 접근 가능한 Source 기반 결과만 반환 |

### 8.2 점검 절차

1. IndexJob 완료 후 Source 상세의 `entity_count`, `relation_count`, `evidence_count`를 확인한다.
2. Preview에서 Entity/Relation/Evidence 목록을 확인한다.
3. GraphRAG 검색 테스트에서 `strategy=HYBRID`로 검색한다.
4. 결과에 Graph 기반 evidence 또는 relation 정보가 포함되는지 확인한다.
5. PostgreSQL GraphStore 사용 시 관련 table row count와 index 상태를 확인한다.

### 8.3 장애 조치

| 증상 | 조치 |
| --- | --- |
| entity_count가 0 | domain/schema 등록 여부, Source 본문 품질 확인 |
| relation_count가 0 | RelationExtractor keyword/schema 확인 |
| evidence가 없음 | EvidenceLinker 처리 단계 확인 |
| traverse 결과 없음 | entity_id/relation source-target 연결 확인 |
| 권한 외 Source 노출 | tenant/user/scope 필터 정책 즉시 점검 |

## 9. 백업 및 복구

### 9.1 백업 대상

| 대상 | 백업 필요성 | 권장 주기 |
| --- | --- | --- |
| Source 원문 | 재인덱싱 기준 데이터 | 매일 또는 변경 즉시 |
| Source metadata | scope, tags, tenant, user 추적 | 매일 |
| IndexJob 이력 | 장애 분석과 감사 | 매일 |
| VectorStore index | 빠른 검색 복구 | 변경량 기준 또는 매일 |
| GraphStore table | Entity/Relation/Evidence 복구 | 매일 |
| RetrievalRun/AgentRun | 품질 분석, 감사 | 정책에 따라 30~180일 |
| 환경 설정 | 배포 재현성 | 변경 즉시 |

### 9.2 백업 절차

1. 백업 대상 환경을 확인한다.
2. Source/metadata DB 백업을 수행한다.
3. VectorStore provider별 백업을 수행한다.
   - FAISS: index 파일과 metadata 파일 백업
   - PGVector: PostgreSQL dump 또는 table-level backup
   - InMemory: 운영 백업 대상으로 사용하지 않음
4. GraphStore provider별 백업을 수행한다.
   - PostgreSQL: graph 관련 table dump
   - InMemory: 운영 백업 대상으로 사용하지 않음
5. 백업 파일 checksum과 생성 시간을 기록한다.
6. 백업 결과를 운영 점검표에 기록한다.

### 9.3 복구 절차

1. 장애 범위를 확인한다.
2. Source 원문과 metadata가 보존되어 있는지 확인한다.
3. 저장소 복구가 필요한지 재인덱싱으로 충분한지 판단한다.
4. VectorStore/GraphStore 백업을 복원한다.
5. 복원 후 Source 목록, IndexJob 이력, Preview를 확인한다.
6. 대표 GraphRAG 검색 테스트를 수행한다.
7. Agent 실행이 Retrieval context를 정상 참조하는지 확인한다.

### 9.4 재인덱싱 복구 기준

다음 경우에는 저장소 백업 복원보다 Source 기반 재인덱싱을 우선 검토한다.

- Source 원문이 정상 보존되어 있음
- VectorStore index만 손상됨
- GraphStore relation/evidence 품질 개선이 함께 필요함
- provider 또는 embedding model 변경 후 재구성이 필요함

## 10. 보안 점검 절차

### 10.1 계정 및 권한

| 점검 항목 | 확인 기준 |
| --- | --- |
| 관리자 권한 | 최소 인원에게만 부여 |
| 운영자 권한 | IndexJob 실행/재시도 권한 제한 |
| 도메인 사용자 권한 | 접근 가능한 Source scope로 제한 |
| Agent 실행 권한 | 사용자별 Source 접근 범위 적용 |
| 퇴사/역할변경 계정 | 즉시 비활성화 |

### 10.2 데이터 보안

| 점검 항목 | 확인 기준 |
| --- | --- |
| Source content | 민감정보 포함 여부 확인 |
| metadata | API Key, token, password 저장 금지 |
| Evidence quote | 개인정보/민감정보 masking 정책 적용 |
| Retrieval/Agent log | 입력과 응답의 보관 기간 및 masking 확인 |
| 백업 파일 | 암호화 및 접근 권한 제한 |

### 10.3 API 보안

| 점검 항목 | 확인 기준 |
| --- | --- |
| 인증 | 미인증 요청 401 처리 |
| 권한 | role별 Source/IndexJob/Agent 권한 제한 |
| scope | tenant/user/source scope 필터 적용 |
| 오류 응답 | 내부 stack trace 노출 금지 |
| 감사 로그 | Source 변경, IndexJob 실행, Agent 실행 기록 |

### 10.4 보안 점검 주기

| 주기 | 점검 내용 |
| --- | --- |
| 매일 | 실패 로그인, 401/403 증가, IndexJob 실패 급증 확인 |
| 매주 | 관리자 계정, API 오류 로그, 민감정보 노출 여부 확인 |
| 매월 | 권한 재검토, 백업 복구 리허설, 보안 패치 적용 현황 확인 |
| 배포 전 | 신규 API 권한, 환경 변수, Secret, CORS, 로그 masking 확인 |

## 11. 운영 모니터링 지표

| 지표 | 설명 | 경고 기준 예시 |
| --- | --- | --- |
| `index_job_failed_count` | IndexJob 실패 건수 | 1시간 내 3건 이상 |
| `index_job_duration_seconds` | IndexJob 처리 시간 | 기준 대비 2배 초과 |
| `retrieval_latency_ms` | GraphRAG 검색 응답 시간 | 평균 2초 초과 |
| `retrieval_miss_rate` | 검색 MISS 비율 | 30% 초과 |
| `agent_run_failed_count` | Agent 실행 실패 건수 | 1시간 내 3건 이상 |
| `vector_store_error_count` | VectorStore 오류 수 | 오류 발생 즉시 확인 |
| `graph_store_error_count` | GraphStore 오류 수 | 오류 발생 즉시 확인 |
| `unauthorized_request_count` | 401/403 요청 수 | 비정상 증가 시 보안 확인 |

## 12. 정기 점검 체크리스트

### 12.1 일일 점검

| 점검 항목 | 결과 |
| --- | --- |
| API health 정상 |  |
| 최근 IndexJob 실패 없음 |  |
| GraphRAG 검색 테스트 대표 질의 HIT |  |
| Agent 실행 대표 시나리오 정상 |  |
| VectorStore/GraphStore 오류 없음 |  |
| 401/403 비정상 증가 없음 |  |
| 백업 작업 정상 종료 |  |

### 12.2 주간 점검

| 점검 항목 | 결과 |
| --- | --- |
| Source 증가량과 저장소 용량 확인 |  |
| IndexJob 평균 처리 시간 추세 확인 |  |
| Retrieval MISS 질의 분석 |  |
| Evidence/Citation 누락 사례 확인 |  |
| 관리자 계정 및 권한 검토 |  |
| 실패 Job 재처리 완료 여부 확인 |  |

### 12.3 배포 전 점검

| 점검 항목 | 결과 |
| --- | --- |
| `python -m pytest` 전체 PASS |  |
| `compileall` PASS |  |
| 환경 변수 누락 없음 |  |
| Secret이 코드/문서에 포함되지 않음 |  |
| DB migration 또는 schema 변경 확인 |  |
| 백업 완료 |  |
| rollback 절차 확인 |  |

## 13. 장애 대응 연락 체계

| 장애 유형 | 1차 담당 | 2차 담당 |
| --- | --- | --- |
| 관리자 화면 오류 | Frontend Engineer | PM |
| Admin API 오류 | Backend Engineer | Architect |
| IndexJob 반복 실패 | Backend Engineer | Data Engineer |
| VectorStore 장애 | Data Engineer | DevOps |
| GraphStore 장애 | Data Engineer | GraphRAG Engineer |
| 검색 품질 저하 | GraphRAG Engineer | Knowledge Engineer |
| Agent 응답 오류 | AI Engineer | GraphRAG Engineer |
| 권한/보안 오류 | Security / Backend Engineer | PM |

## 14. 운영 제한 및 후속 보완사항

현재 구현 기준 운영 제한 사항은 다음과 같다.

| 제한 사항 | 설명 | 후속 조치 |
| --- | --- | --- |
| 관리자 사이트 MVP | 실제 운영용 완성 UI가 아닌 MVP 화면 | UI 고도화 및 E2E 테스트 추가 |
| InMemory 저장소 중심 | 운영 장애 복구/확장에 부적합 | PGVector/PostgreSQL provider 통합 |
| Agent 실행 화면 미구현 | API/Workflow 기준 사용 가능 | 관리자 Agent 실행 화면 추가 |
| 성능 기준 미확정 | 대량 Source 기준 성능 미측정 | 성능 테스트 및 기준 수립 |
| 보안 모듈 미연계 | AuthContext 중심 검증 | 실제 인증/권한 모듈 연계 |

## 15. 다음 작업

운영자매뉴얼 작성 이후 다음 작업은 WBS 기준 `9.3 신규 서비스 적용 가이드 작성`이다.

권장 요청 문구는 다음과 같다.

```text
[아키텍터/Technical Writer] 290.이행 단계의 신규 서비스 적용 가이드를 작성해 주세요. GraphRAG AI Agent 공통 프레임워크를 신규 서비스에 적용하는 절차, 패키지 연동, Source/IndexJob/Schema/VectorStore/GraphStore/Agent Workflow 설정 방법을 포함해 주세요.
```
