# 관리자 및 GraphRAG API 명세서 VectorMoon UX 보완본

## 1. 보완 API 목록

| API | Method | Path | 설명 |
| --- | --- | --- | --- |
| Source 등록 | POST | `/api/admin/sources` | Source 등록, scope/tags 포함 |
| Source 목록 | GET | `/api/admin/sources` | Source 목록, count, last_job_id 조회 |
| Source 상세 | GET | `/api/admin/sources/{source_id}` | Source 상태 조회 |
| Source 삭제 | DELETE | `/api/admin/sources/{source_id}` | Source soft delete 및 인덱스 삭제 |
| Source Preview | GET | `/api/admin/sources/{source_id}/preview` | Chunk/Entity/Relation/Evidence Preview |
| IndexJob 생성 | POST | `/api/admin/index-jobs` | PENDING Job 생성 |
| IndexJob 실행 | POST | `/api/admin/index-jobs/{job_id}/run` | MVP 동기 실행 |
| IndexJob 재시도 | POST | `/api/admin/index-jobs/{job_id}/retry` | 단계 타임라인 초기화 후 재실행 |
| IndexJob 목록 | GET | `/api/admin/index-jobs` | 전체 Job 조회 |
| IndexJob 상세 | GET | `/api/admin/index-jobs/{job_id}` | Job 상태와 steps 조회 |
| Retrieval Test | POST | `/api/admin/retrieval-tests` | GraphRAG 검색 테스트 |

## 2. 주요 DTO 보완

### 2.1 SourceCreateRequest

| 필드 | 유형 | 설명 |
| --- | --- | --- |
| domain | string | 도메인 코드 |
| source_type | enum | TEXT, MARKDOWN, JSON, CSV, FILE, URL, API |
| name | string | Source명 |
| content | string | MVP 처리 대상 본문 |
| metadata | object | 확장 메타데이터 |
| scope | string | GLOBAL, DOMAIN, TENANT, USER |
| tags | string[] | 운영 필터용 태그 |
| tenant_id | string | 테넌트 ID |
| user_id | string | 사용자 ID |
| auto_run_index | boolean | 등록 후 즉시 인덱싱 여부 |

### 2.2 IndexJobResponse

| 필드 | 유형 | 설명 |
| --- | --- | --- |
| job_id | string | Job ID |
| source_id | string | 대상 Source ID |
| status | enum | PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| step | string | 현재 단계 |
| metrics | object | 처리 건수 |
| steps | IndexJobStepResponse[] | 단계별 상태 |
| error | object | 실패 상세 |

### 2.3 SourcePreviewResponse

| 필드 | 유형 | 설명 |
| --- | --- | --- |
| source_id | string | 대상 Source ID |
| chunks | array | Chunk Preview |
| entities | array | Entity Preview |
| relations | array | Relation Preview |
| evidence | array | Evidence Preview |
| metrics | object | 각 항목 count |

## 3. 오류 코드

| 코드 | HTTP | 설명 |
| --- | --- | --- |
| SOURCE_NOT_FOUND | 404 | Source ID 없음 |
| JOB_NOT_FOUND | 404 | Job ID 없음 |
| INDEX_FAILED | 500 | 인덱싱 실패 |
| INDEX_STEP_FAILED | 500 | 단계 처리 실패 |
| INVALID_RETRIEVAL_STRATEGY | 400 | 지원하지 않는 검색 전략 |
