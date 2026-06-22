# 관리자 사이트 후속 보완 기능 통합 테스트 시나리오 및 결과

## 1. 테스트 개요

| 항목 | 내용 |
| --- | --- |
| 단계 | 260.테스트 선행 검증 |
| 담당 | QA |
| 대상 | 관리자 사이트 Source/IndexJob/Preview/RetrievalTest 후속 보완 기능 |
| 테스트일 | 2026-06-21 |

## 2. 테스트 시나리오

| ID | 시나리오 | 절차 | 기대 결과 | 결과 |
| --- | --- | --- | --- | --- |
| TC-ADM-001 | Source 등록 | SourceCreateRequest로 domain/name/content/scope/tags 입력 | REGISTERED Source 생성 | 통과 |
| TC-ADM-002 | IndexJob 생성 | Source ID로 Job 생성 | PENDING Job 및 10단계 steps 생성 | 통과 |
| TC-ADM-003 | IndexJob 실행 | 생성된 Job 실행 | COMPLETED, chunk/entity/relation/evidence metrics 생성 | 통과 |
| TC-ADM-004 | Source 목록 갱신 | Job 실행 후 Source 조회 | INDEXED 상태와 count 표시 | 통과 |
| TC-ADM-005 | Source Preview | Source ID로 preview 조회 | chunks/entities/relations/evidence 반환 | 통과 |
| TC-ADM-006 | GraphRAG 검색 테스트 | HYBRID 전략으로 질의 실행 | HIT 및 result_count 반환 | 통과 |
| TC-ADM-007 | IndexJob 재시도 | 기존 Job retry 호출 | steps 초기화 후 COMPLETED | 통과 |
| TC-ADM-008 | Source 삭제 | Source 삭제 호출 | 목록에서 제외 | 통과 |
| TC-ADM-009 | UI 한글 라벨 | 관리자 HTML 확인 | 주요 라벨 한글 정상 표시 | 통과 |
| TC-ADM-010 | 오류/권한 | 미존재 ID/권한 상세 | 후속 FastAPI 예외 핸들러에서 보완 필요 | 조건부 |

## 3. 실행 명령 및 결과

| 검증 | 명령 | 결과 |
| --- | --- | --- |
| 컴파일 | `python -m compileall src tests` | 통과 |
| 수동 흐름 | Source 생성, Job 실행, Preview, Search, Retry 스크립트 | 통과 |
| pytest | `python -m pytest tests/test_admin_mvp.py` | pytest 미설치로 실행 불가 |

## 4. 결함 및 조치

| 결함 ID | 내용 | 조치 |
| --- | --- | --- |
| DEF-ADM-001 | 기존 관리자 HTML 한글 라벨 깨짐 | `admin_mvp.html` 재작성으로 조치 |
| DEF-ADM-002 | Preview API 부재 | `/api/admin/sources/{source_id}/preview` 추가 |
| DEF-ADM-003 | IndexJob 단계 표시 부재 | `IndexJobStepResponse`와 10단계 timeline 추가 |
| DEF-ADM-004 | Job 재시도 API 부재 | `/api/admin/index-jobs/{job_id}/retry` 추가 |

## 5. QA 결론

관리자 사이트 후속 보완 기능은 InMemory MVP 기준으로 Source 등록, IndexJob 실행, Preview, GraphRAG 검색 테스트 흐름이 검증되었다. 운영 수준의 multipart file upload, 비동기 queue, 권한/오류 핸들러 상세화는 후속 구현 및 테스트 과제로 관리한다.
