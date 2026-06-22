# GraphRAG AI Agent 공통 프레임워크 관리자 및 GraphRAG API/화면 통합 테스트 시나리오

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크의 `240.설계` 단계 QA 산출물로, 관리자 사이트 화면과 GraphRAG API의 통합 검증 시나리오를 정의한다.

테스트 범위는 Source 등록/조회/삭제, IndexJob 실행/상태 모니터링, GraphRAG 검색 테스트, Agent 실행, 권한/오류 케이스를 포함한다.

### 1.2 검토 기준 산출물

| 산출물 | 검토 내용 |
|---|---|
| 관리자 및 GraphRAG API 명세서 | API endpoint, request/response DTO, 오류 코드 |
| 관리자 및 GraphRAG API OpenAPI YAML | API 계약 자동화 기준 |
| 관리자 사이트 화면정의서 | 화면 흐름, UI 상태, 오류 표시 |
| Frontend 컴포넌트 설계서 | 상태 관리, API hook, polling, 권한 제어 |
| 물리 데이터 모델 설계서 | Source/Chunk/Evidence/RetrievalRun/AgentRun 추적성 |

### 1.3 테스트 유형

| 유형 | 설명 |
|---|---|
| API 기능 테스트 | REST API 정상/오류 response 검증 |
| 화면 통합 테스트 | 화면 액션과 API 호출, UI 상태 변화 검증 |
| 권한 테스트 | ADMIN/OPERATOR/VIEWER/USER 권한별 접근 제어 검증 |
| 오류 테스트 | 표준 오류 코드, 메시지, request_id 표시 검증 |
| 경계값 테스트 | 필수값, enum, page/size, top_k, graph_depth 등 입력 범위 검증 |
| 비동기 테스트 | IndexJob polling, 취소, 재시도, 완료 후 후속 화면 이동 검증 |

## 2. 테스트 전제 조건

### 2.1 테스트 계정

| 계정 | 역할 | domain 권한 | 목적 |
|---|---|---|---|
| `admin01` | `ADMIN` | 전체 | 전체 기능 검증 |
| `operator-solbat` | `OPERATOR` | `SOLBAT` | 담당 domain 운영 기능 검증 |
| `viewer-solbat` | `VIEWER` | `SOLBAT` | 조회 전용 화면 검증 |
| `user01` | `USER` | 사용자 접근 Source | Agent 실행/조회 권한 검증 |
| `operator-other` | `OPERATOR` | `VECTOR_MOON` | 타 domain 접근 제한 검증 |

### 2.2 테스트 데이터

| 데이터 ID | 유형 | 설명 |
|---|---|---|
| `SRC-FILE-001` | FILE Source | 정상 PDF 또는 txt 파일 |
| `SRC-URL-001` | URL Source | 접근 가능한 URL |
| `SRC-MANUAL-001` | MANUAL Source | 수기 입력 텍스트 |
| `SRC-DUP-001` | 중복 Source | 동일 checksum/uri 검증용 |
| `SRC-LOCK-001` | 인덱싱 중 Source | 수정/삭제 lock 검증용 |
| `JOB-FULL-001` | FULL_INDEX Job | 정상 인덱싱 흐름 검증 |
| `JOB-FAIL-001` | 실패 Job | 재시도/오류 표시 검증 |
| `RET-HIT-001` | 검색 hit 데이터 | GraphRAG 검색 결과 검증 |
| `AGT-001` | Agent | GraphRAG retrieve node 포함 Agent |

### 2.3 공통 검증 기준

| 항목 | 기대 결과 |
|---|---|
| 인증 header | `Authorization: Bearer {token}` 적용 |
| tenant header | 필요한 경우 `X-Tenant-Id` 적용 |
| 성공 응답 | `success=true`, `data`, `meta.request_id` 포함 |
| 오류 응답 | `success=false`, `error.code`, `error.message`, `meta.request_id` 포함 |
| 화면 오류 | ErrorPanel 또는 field error에 code/message/request_id 표시 |
| 감사 대상 | Source 변경, IndexJob 실행/취소/재시도, 검색 테스트, Agent 실행 기록 |

## 3. 테스트 범위 매트릭스

| 업무 | API | 화면 | 정상 | 오류 | 권한 | 경계값 |
|---|---|---|---:|---:|---:|---:|
| Source 등록 | `POST /api/admin/graphrag/sources` | Source 등록 | Y | Y | Y | Y |
| Source 조회 | `GET /api/admin/graphrag/sources` | Source 목록 | Y | Y | Y | Y |
| Source 상세 | `GET /api/admin/graphrag/sources/{source_id}` | Source 상세 | Y | Y | Y | N |
| Source 삭제 | `DELETE /api/admin/graphrag/sources/{source_id}` | Source 목록/상세 | Y | Y | Y | N |
| Source Preview | `GET /api/admin/graphrag/sources/{source_id}/preview` | Source Preview | Y | Y | Y | Y |
| IndexJob 생성/실행 | `POST /api/admin/graphrag/index-jobs`, `/run` | IndexJob 실행 | Y | Y | Y | Y |
| IndexJob 상태조회 | `GET /api/admin/graphrag/index-jobs/{job_id}` | 상태 모니터링 | Y | Y | Y | N |
| IndexJob 재시도/취소 | `/retry`, `/cancel` | 상태 모니터링 | Y | Y | Y | N |
| GraphRAG 검색 테스트 | `POST /api/admin/graphrag/retrieval-tests` | 검색 테스트 | Y | Y | Y | Y |
| Agent 실행 | `POST /api/agents/{agent_id}/runs` | Agent 실행 연계 | Y | Y | Y | Y |

## 4. Source 관리 테스트 시나리오

### 4.1 Source 등록

| TC ID | 시나리오 | 사전조건 | 절차 | 기대 결과 |
|---|---|---|---|---|
| `SRC-C-001` | FILE Source 정상 등록 | `ADMIN` 로그인 | Source 등록 화면에서 FILE, domain, title, file, index_options 입력 후 저장 | `201`, Source 생성, 상세 화면 이동, 상태 `REGISTERED` |
| `SRC-C-002` | 저장 후 인덱싱 | `OPERATOR` 로그인 | `auto_create_index_job=true` 또는 저장 후 인덱싱 클릭 | Source 생성 후 IndexJob 생성, 모니터링 화면 이동 |
| `SRC-C-003` | URL Source 정상 등록 | 접근 가능한 URL 준비 | source_type `URL`, uri 입력 후 저장 | Source 생성, uri 표시 |
| `SRC-C-004` | MANUAL Source 정상 등록 | 수기 텍스트 준비 | source_type `MANUAL`, manual_text 입력 | Source 생성, metadata 저장 |
| `SRC-C-005` | metadata_json 정상 등록 | 유효 JSON 입력 | metadata_json에 domain 확장 속성 입력 | 상세 화면 JSON Viewer에 동일 값 표시 |

### 4.2 Source 등록 오류/경계값

| TC ID | 시나리오 | 입력 | 기대 결과 |
|---|---|---|---|
| `SRC-E-001` | 필수값 누락 | title 없음 | `GRAG-SRC-001`, title field error 표시 |
| `SRC-E-002` | 미지원 source_type | `UNKNOWN` | `GRAG-SRC-002`, 저장 실패 |
| `SRC-E-003` | 접근 불가 URL | 존재하지 않는 URL | `GRAG-SRC-003`, uri 오류 표시 |
| `SRC-E-004` | 중복 Source | 동일 uri/checksum | `GRAG-SRC-409`, 기존 Source 상세 링크 표시 |
| `SRC-E-005` | 잘못된 metadata_json | JSON parse 불가 | API 호출 전 field error |
| `SRC-B-001` | title 최대 길이 초과 | 301자 이상 | field error 또는 `GRAG-SRC-001` |
| `SRC-B-002` | chunk_overlap >= chunk_size | chunk_size 500, overlap 500 | index_options 검증 오류 |

### 4.3 Source 목록/상세/Preview

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `SRC-R-001` | Source 목록 조회 | Source 관리 진입 | 목록 표시, pagination meta 표시 |
| `SRC-R-002` | domain 필터 | domain `SOLBAT` 선택 후 검색 | `SOLBAT` Source만 표시 |
| `SRC-R-003` | keyword 검색 | title 일부 입력 | 매칭 Source 표시 |
| `SRC-R-004` | Source 상세 조회 | 목록에서 상세 클릭 | 기본정보, counts, metadata 표시 |
| `SRC-R-005` | Source Preview 조회 | 인덱싱 완료 Source에서 Preview 클릭 | chunk/entity/relation/evidence 탭 표시 |
| `SRC-R-006` | Preview 결과 필터 | result_type `EVIDENCE` 선택 | evidence만 표시 |
| `SRC-R-007` | Preview 빈 상태 | 인덱싱 전 Source Preview | IndexJob 실행 안내 또는 빈 상태 표시 |

### 4.4 Source 삭제/비활성화

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `SRC-D-001` | Source soft delete | 삭제 modal에서 `SOFT_DELETE` 선택 | 상태 `DELETED`, 목록에서 기본 제외 |
| `SRC-D-002` | Vector/Graph 포함 삭제 | `delete_vectors=true`, `delete_graph=true` | 삭제 결과에 vector/graph 삭제 여부 표시 |
| `SRC-D-003` | 인덱싱 중 Source 삭제 제한 | `SRC-LOCK-001` 삭제 시도 | `GRAG-SRC-423`, 삭제 버튼 비활성 또는 오류 표시 |
| `SRC-D-004` | 존재하지 않는 Source 삭제 | invalid source_id | `GRAG-SRC-404` |

## 5. IndexJob 테스트 시나리오

### 5.1 IndexJob 생성/실행

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `JOB-C-001` | FULL_INDEX Job 생성 | Source 상세에서 IndexJob 실행 클릭, FULL_INDEX 선택 | `201`, job_id 생성, 상태 `PENDING` |
| `JOB-C-002` | IndexJob 실행 | 생성된 job에서 실행 클릭 | `202`, 상태 `RUNNING`, monitor_uri 반환 |
| `JOB-C-003` | REINDEX 실행 | 기존 인덱싱 완료 Source에서 REINDEX 실행 | 기존 산출물 soft delete 후 신규 작업 시작 |
| `JOB-C-004` | PARSE_ONLY 실행 | job_type `PARSE_ONLY` 선택 | parse 단계까지만 완료 |
| `JOB-C-005` | dry_run 실행 | dry_run true | 저장 없이 검증 결과 표시 |

### 5.2 IndexJob 상태 모니터링

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `JOB-M-001` | RUNNING polling | 상태 모니터링 화면 진입 | 5초 주기 상태 갱신 |
| `JOB-M-002` | 단계별 진행 표시 | embedding 진행 중 job 조회 | Parse/Chunking/Embedding 등 step_status 표시 |
| `JOB-M-003` | 완료 상태 | job 완료까지 대기 | `COMPLETED`, polling 중지, Preview/검색 테스트 버튼 활성화 |
| `JOB-M-004` | 실패 상태 | 실패 job 조회 | `FAILED`, error_code/error_message, 로그 표시 |
| `JOB-M-005` | 목록 조회 | IndexJob 목록 화면 진입 | job_type/status/source 필터와 pagination 동작 |

### 5.3 IndexJob 재시도/취소/오류

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `JOB-A-001` | RUNNING job 취소 | 상태 화면에서 취소 클릭 | `202`, 상태 `CANCELED` 또는 cancel requested |
| `JOB-A-002` | FAILED job 재시도 | 실패 job에서 재시도 클릭 | `202`, 상태 `RETRYING` 또는 `PENDING` |
| `JOB-E-001` | 미지원 job_type | `UNKNOWN` | `GRAG-JOB-002` |
| `JOB-E-002` | 실행 조건 미충족 | 삭제된 Source 대상으로 실행 | `GRAG-JOB-001` |
| `JOB-E-003` | 중복 실행 | 동일 Source RUNNING 상태에서 추가 실행 | `GRAG-JOB-409` |
| `JOB-E-004` | 취소 불가 상태 | COMPLETED job 취소 | `GRAG-JOB-423` |
| `JOB-E-005` | job 없음 | invalid job_id 조회 | `GRAG-JOB-404` |

## 6. GraphRAG 검색 테스트 시나리오

### 6.1 검색 테스트 정상

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `RET-C-001` | HYBRID_RERANK 검색 | query, domain, indexed Source, strategy 입력 후 실행 | `200`, retrieval_run_id, results, evidence 표시 |
| `RET-C-002` | VECTOR_ONLY 검색 | strategy `VECTOR_ONLY` | vector 기반 result 표시, graph_paths 없거나 최소화 |
| `RET-C-003` | GRAPH_ONLY 검색 | strategy `GRAPH_ONLY` | entity/relation 기반 result 표시 |
| `RET-C-004` | evidence 포함 검색 | include_evidence true | Evidence 탭에 quote/source/chunk 표시 |
| `RET-C-005` | graph context 포함 검색 | include_graph_context true | 그래프 경로 탭에 node/edge 표시 |
| `RET-C-006` | 결과 상세 조회 | retrieval_run_id로 상세 진입 | 동일 query/result/context 재조회 |

### 6.2 검색 테스트 오류/경계값

| TC ID | 시나리오 | 입력 | 기대 결과 |
|---|---|---|---|
| `RET-E-001` | query 없음 | 빈 query | `GRAG-RET-001`, field error |
| `RET-E-002` | 미지원 strategy | `UNKNOWN` | `GRAG-RET-002` |
| `RET-E-003` | 결과 없음 | 매칭 불가 query | `MISS` 또는 `GRAG-RET-404`, 빈 상태 표시 |
| `RET-E-004` | Vector Store 오류 | Vector provider 장애 | `GRAG-VEC-001`, provider 정보 표시 |
| `RET-E-005` | Graph Store 오류 | Graph store 장애 | `GRAG-GPH-001` 또는 `GRAG-GPH-002` |
| `RET-B-001` | top_k 최소값 | `top_k=0` | 입력 검증 오류 |
| `RET-B-002` | top_k 최대값 초과 | `top_k=51` | 입력 검증 오류 |
| `RET-B-003` | graph_depth 범위 초과 | `graph_depth=6` | 입력 검증 오류 |
| `RET-B-004` | min_score 범위 초과 | `min_score=1.5` | 입력 검증 오류 |

### 6.3 검색 결과 화면 연계

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `RET-UI-001` | 결과 Source 이동 | 검색 결과의 Source 클릭 | Source 상세 화면 이동 |
| `RET-UI-002` | 결과 Chunk 이동 | 검색 결과의 chunk 클릭 | Source Preview의 해당 chunk 표시 |
| `RET-UI-003` | Evidence 확인 | Evidence 탭에서 quote 확인 | source/document/chunk 추적 정보 표시 |
| `RET-UI-004` | Raw JSON 복사 | Raw JSON 복사 클릭 | clipboard 복사 toast 표시 |

## 7. Agent 실행 테스트 시나리오

### 7.1 Agent 실행 정상

| TC ID | 시나리오 | 절차 | 기대 결과 |
|---|---|---|---|
| `AGT-C-001` | Agent 실행 요청 | agent_id, input_text, retrieval_options 입력 | `202`, agent_run_id, status `PENDING` 또는 `RUNNING` |
| `AGT-C-002` | GraphRAG retrieve 포함 실행 | source_ids와 domain 지정 | retrieval_run_id 생성, AgentRun과 연결 |
| `AGT-C-003` | Agent 실행 결과 조회 | agent_run_id 조회 | status, input_text, final_output, retrieval_run_id 표시 |
| `AGT-C-004` | 실행자 본인 조회 | `user01` 본인 run 조회 | 조회 성공 |

### 7.2 Agent 실행 오류/권한

| TC ID | 시나리오 | 입력/조건 | 기대 결과 |
|---|---|---|---|
| `AGT-E-001` | input_text 없음 | 빈 input_text | `GRAG-AGT-001` |
| `AGT-E-002` | agent 없음 | invalid agent_id | `GRAG-AGT-404` |
| `AGT-E-003` | workflow 없음 | invalid workflow_id | `GRAG-AGT-404` |
| `AGT-E-004` | 중복/상태 충돌 | 동일 idempotency 또는 실행 충돌 | `GRAG-AGT-409` |
| `AGT-E-005` | LLM 오류 | LLM 호출 실패 | `GRAG-LLM-001` |
| `AGT-P-001` | 타 사용자 run 조회 | user01이 타 사용자 run 조회 | `GRAG-AUTH-403` |

## 8. 권한 테스트 시나리오

| TC ID | 역할 | 시나리오 | 기대 결과 |
|---|---|---|---|
| `AUTH-001` | 미인증 | Source 목록 API 호출 | `GRAG-AUTH-401`, 로그인 이동 |
| `AUTH-002` | `VIEWER` | Source 등록 화면 접근 | 접근 제한 또는 저장 버튼 미노출 |
| `AUTH-003` | `VIEWER` | IndexJob 실행 버튼 확인 | 버튼 미노출 또는 disabled |
| `AUTH-004` | `OPERATOR` | 담당 domain Source 등록 | 성공 |
| `AUTH-005` | `OPERATOR` | 타 domain Source 조회 | 목록 제외 또는 `GRAG-AUTH-404` |
| `AUTH-006` | `OPERATOR` | 타 domain Source 삭제 | `GRAG-AUTH-403` |
| `AUTH-007` | `ADMIN` | 전체 domain Source 목록 조회 | 전체 조회 |
| `AUTH-008` | `USER` | 관리자 API 호출 | `GRAG-AUTH-403` |
| `AUTH-009` | `USER` | Agent 실행 | 접근 가능한 Source 기준 성공 |

## 9. 화면 통합 E2E 시나리오

### 9.1 Source 등록부터 검색 테스트까지

| 단계 | 액션 | 검증 |
|---:|---|---|
| 1 | `OPERATOR` 로그인 | 담당 domain만 선택 가능 |
| 2 | Source 등록 화면 이동 | 등록 form 표시 |
| 3 | FILE Source 저장 후 인덱싱 | Source 생성, IndexJob 생성 |
| 4 | IndexJob 상태 모니터링 | polling, step_status 표시 |
| 5 | COMPLETED 확인 | Preview/검색 테스트 버튼 활성화 |
| 6 | Source Preview 이동 | chunk/evidence 표시 |
| 7 | GraphRAG 검색 테스트 이동 | Source가 검색 범위에 자동 반영 |
| 8 | 검색 실행 | results/evidence/graph_paths 표시 |

### 9.2 실패 IndexJob 재시도

| 단계 | 액션 | 검증 |
|---:|---|---|
| 1 | 실패 job 상태 화면 진입 | `FAILED`, error_code 표시 |
| 2 | 로그 확인 | 실패 단계와 메시지 표시 |
| 3 | 재시도 클릭 | confirm modal 표시 |
| 4 | 재시도 승인 | 상태 `RETRYING` 또는 `PENDING` |
| 5 | 완료 대기 | `COMPLETED` 전환 및 polling 중지 |

### 9.3 권한별 UI 제어

| 단계 | 액션 | 검증 |
|---:|---|---|
| 1 | `VIEWER` 로그인 | Source 목록 조회 가능 |
| 2 | Source 등록 버튼 확인 | 미노출 또는 disabled |
| 3 | IndexJob 실행 버튼 확인 | 미노출 또는 disabled |
| 4 | GraphRAG 검색 테스트 실행 | 권한 정책에 따라 허용 또는 조회형 테스트만 허용 |
| 5 | API 직접 호출 시도 | Backend에서 `403` 반환 |

## 10. API 계약 검증 시나리오

| TC ID | 검증 대상 | 검증 기준 |
|---|---|---|
| `CON-001` | OpenAPI path | API 명세서 endpoint와 OpenAPI path 일치 |
| `CON-002` | request DTO | 필수값, enum, type 일치 |
| `CON-003` | response DTO | 화면 표시 항목에 필요한 field 포함 |
| `CON-004` | 오류 response | `ApiErrorResponse` 구조 통일 |
| `CON-005` | 인증 | 모든 관리자 API에 bearerAuth 적용 |
| `CON-006` | pagination | 목록 API에 page/size/meta 포함 |
| `CON-007` | request_id | 성공/오류 응답 meta에 request_id 포함 |

## 11. 비기능 테스트 시나리오

| TC ID | 구분 | 시나리오 | 기대 결과 |
|---|---|---|---|
| `NFR-001` | 성능 | Source 목록 1,000건 page 조회 | 응답 2초 이내 또는 목표 SLA 이내 |
| `NFR-002` | 성능 | Source Preview chunk 10,000건 pagination | 화면 멈춤 없이 페이지 조회 |
| `NFR-003` | 성능 | GraphRAG 검색 테스트 top_k 50 | timeout 없이 결과 또는 표준 오류 |
| `NFR-004` | 안정성 | IndexJob polling 중 네트워크 오류 3회 | polling 중지, 재시도 안내 |
| `NFR-005` | 보안 | chunk/evidence HTML script 포함 | text 렌더링, script 미실행 |
| `NFR-006` | 감사 | Source 삭제 실행 | 감사 로그에 사용자/시간/request_id 기록 |
| `NFR-007` | 개인정보 | final_output/quote_text masking 정책 적용 | 설정에 따라 민감정보 masking |

## 12. 결함 분류 기준

| 등급 | 기준 | 예시 |
|---|---|---|
| Critical | 핵심 업무 불가, 데이터 손상, 권한 우회 | VIEWER가 Source 삭제 가능 |
| Major | 주요 기능 실패, 후속 단계 진행 불가 | IndexJob 완료 후 Preview 불가 |
| Minor | 일부 UI/표시 오류, 우회 가능 | 상태 배지 색상 오류 |
| Trivial | 문구/정렬 등 경미한 결함 | tooltip 오탈자 |

## 13. 테스트 완료 기준

| 기준 | 완료 조건 |
|---|---|
| 기능 커버리지 | 본 문서의 정상/오류/권한 주요 시나리오 100% 수행 |
| Critical/Major 결함 | 미해결 0건 |
| API 계약 | OpenAPI 기준 request/response 불일치 0건 |
| 권한 검증 | ADMIN/OPERATOR/VIEWER/USER 권한 케이스 통과 |
| 추적성 | 검색 결과에서 Source/Document/Chunk/Evidence 이동 가능 |
| 산출물 반영 | 발견된 설계 보완 사항을 설계 산출물에 반영 |

## 14. 보완 필요 사항

| 항목 | 내용 | 담당 |
|---|---|---|
| 테스트 데이터 자동화 | Source 파일, URL, 실패 job fixture 준비 필요 | QA/Backend Engineer |
| Mock API | Frontend 선개발용 MSW 또는 mock server 필요 | Frontend Engineer |
| OpenAPI 검증 도구 | Spectral 또는 openapi-generator 기반 CI 검증 필요 | Backend Engineer |
| E2E 도구 | Playwright 기반 관리자 화면 E2E 구성 검토 | QA/Frontend Engineer |
| 성능 기준 | 검색/인덱싱 처리 SLA 수치 확정 필요 | PM/아키텍터 |

## 15. 다음 작업 제안

| 순번 | 담당 | 작업 | 산출물 |
|---:|---|---|---|
| 1 | PM | 240.설계 단계 산출물 검토 및 확정 | 설계 산출물 검토 및 확정서 |
| 2 | QA | 테스트 케이스 상세화 | 테스트 케이스 명세서 |
| 3 | Backend Engineer | OpenAPI 기반 mock server 또는 contract test 구성 | API 계약 테스트 환경 |
| 4 | Frontend Engineer | 관리자 사이트 prototype 또는 화면 개발 착수 | Frontend prototype |

### 15.1 다음 요청 문구

```text
[PM] 240.설계 단계 산출물 검토 및 확정 문서를 작성해 주세요. 공통 모듈, GraphRAG Core, 물리 데이터 모델, API 명세/OpenAPI, 관리자 사이트 화면정의서, Frontend 컴포넌트 설계서, 테스트 시나리오를 검토 대상으로 포함해 주세요.
```

## 16. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|---|---|---|---|
| 0.1 | 2026-06-21 | QA | 최초 작성 |
