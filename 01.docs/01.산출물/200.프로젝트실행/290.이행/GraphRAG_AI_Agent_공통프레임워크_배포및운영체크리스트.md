# GraphRAG AI Agent 공통 프레임워크 배포 및 운영 체크리스트

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 290.이행 |
| WBS | 9.4 배포 및 운영 체크리스트 작성 |
| 담당 | DevOps / PM |
| 작성 목적 | GraphRAG AI Agent 공통 프레임워크 배포 전 점검, 환경 변수, 테스트 수행, 저장소 확인, 보안 점검, 롤백 기준, 운영 인수인계 항목을 체크리스트로 정의 |
| 작성일 | 2026-06-21 |

## 2. 체크리스트 사용 방법

본 체크리스트는 배포 승인 전, 배포 수행 중, 배포 후 안정화 확인, 운영 인수인계 시 사용한다.

| 결과 값 | 의미 |
| --- | --- |
| PASS | 점검 완료, 이상 없음 |
| FAIL | 점검 실패, 조치 필요 |
| N/A | 해당 환경에 적용하지 않음 |
| HOLD | 확인 보류, 승인 전 재확인 필요 |

## 3. 배포 기본 정보

| 항목 | 값 |
| --- | --- |
| 배포 대상 서비스 |  |
| 배포 환경 | Local / Dev / Staging / Production |
| 배포 버전 |  |
| 배포 일시 |  |
| 배포 담당자 |  |
| 승인자 |  |
| 롤백 담당자 |  |
| 운영 인수자 |  |

## 4. 배포 전 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| PRE-001 | Git 작업 브랜치 확인 | 배포 대상 브랜치와 commit hash 확정 | DevOps |  |  |
| PRE-002 | 변경 범위 확인 | Source, IndexJob, GraphRAG, Agent, 관리자 UI 변경 내역 검토 | PM / Architect |  |  |
| PRE-003 | 산출물 확인 | 사용자매뉴얼, 운영자매뉴얼, 신규서비스적용가이드 작성 완료 | PM |  |  |
| PRE-004 | 빌드 가능 여부 | 패키지 설치 및 import 오류 없음 | DevOps |  |  |
| PRE-005 | 의존성 확인 | `pydantic`, `fastapi`, `uvicorn`, `sqlalchemy`, `pytest` 등 환경별 의존성 확인 | DevOps |  |  |
| PRE-006 | 배포 창 확인 | 업무 영향이 낮은 시간대 또는 승인된 배포 시간 | PM |  |  |
| PRE-007 | 백업 완료 | Source/DB/VectorStore/GraphStore 백업 완료 | DevOps / Data Engineer |  |  |
| PRE-008 | 롤백 계획 승인 | 롤백 조건, 절차, 담당자 확정 | PM / DevOps |  |  |

## 5. 환경 변수 점검

| ID | 환경 변수 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| ENV-001 | `APP_ENV` | 배포 환경과 일치 | DevOps |  |  |
| ENV-002 | `LOG_LEVEL` | 운영은 `INFO` 이상 권장 | DevOps |  |  |
| ENV-003 | `ADMIN_API_BASE_URL` | 관리자 API Base URL 정상 | DevOps |  |  |
| ENV-004 | `DEFAULT_DOMAIN` | 서비스 기본 domain 확인 | Architect |  |  |
| ENV-005 | `DEFAULT_RETRIEVAL_STRATEGY` | 기본 `HYBRID` 권장 | GraphRAG Engineer |  |  |
| ENV-006 | `VECTOR_STORE_PROVIDER` | 운영 provider 확정 | Data Engineer |  |  |
| ENV-007 | `VECTOR_COLLECTION_NAME` | collection 이름 확인 | Data Engineer |  |  |
| ENV-008 | `PGVECTOR_DSN` | PGVector 사용 시 Secret 관리 확인 | Data Engineer / Security |  |  |
| ENV-009 | `FAISS_INDEX_PATH` | FAISS 사용 시 경로/권한 확인 | Data Engineer |  |  |
| ENV-010 | `GRAPH_STORE_PROVIDER` | 운영 provider 확정 | Data Engineer |  |  |
| ENV-011 | `GRAPH_STORE_DSN` | GraphStore DB 연결 Secret 관리 확인 | Data Engineer / Security |  |  |
| ENV-012 | `EMBEDDING_PROVIDER` | embedding provider 확정 | AI Engineer |  |  |
| ENV-013 | `EMBEDDING_MODEL` | embedding model 확정 | AI Engineer |  |  |
| ENV-014 | `LLM_PROVIDER` | Agent 사용 시 LLM provider 확정 | AI Engineer |  |  |
| ENV-015 | `LLM_MODEL` | Agent 사용 시 LLM model 확정 | AI Engineer |  |  |
| ENV-016 | `INDEX_JOB_TIMEOUT_SEC` | 대량 Source 기준 timeout 설정 | Backend Engineer |  |  |
| ENV-017 | Secret 노출 점검 | 코드/문서/log에 token/password 없음 | Security |  |  |

## 6. 테스트 수행 체크리스트

| ID | 테스트 | 수행 명령 또는 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| TST-001 | Python compile 검증 | `python -m compileall src tests tools` PASS | QA |  |  |
| TST-002 | pytest 전체 수행 | `python -m pytest` 전체 PASS | QA |  |  |
| TST-003 | Admin MVP 테스트 | `tests/test_admin_mvp.py` PASS | QA |  |  |
| TST-004 | RAG Core 테스트 | `tests/test_document_pipeline.py` PASS | QA |  |  |
| TST-005 | VectorStore 테스트 | `tests/test_vectorstores.py` PASS | QA / Data Engineer |  |  |
| TST-006 | GraphStore 테스트 | `tests/test_graph_store.py` PASS | QA / Data Engineer |  |  |
| TST-007 | HybridRetriever 테스트 | `tests/test_hybrid_retriever.py` PASS | QA / GraphRAG Engineer |  |  |
| TST-008 | Agent Workflow 테스트 | `tests/test_agent_workflow.py` PASS | QA / AI Engineer |  |  |
| TST-009 | Sol-Bat 파일럿 테스트 | `tests/test_sol_bat_pilot.py` PASS | QA / Domain Expert |  |  |
| TST-010 | 간이 테스트 러너 | pytest 사용 불가 시 `tools/run_tests.py` PASS | QA |  |  |
| TST-011 | 대표 E2E 흐름 | Source 등록 -> IndexJob 완료 -> Preview -> GraphRAG 검색 HIT | QA |  |  |
| TST-012 | 오류 흐름 | 빈 content, 잘못된 source_id, 잘못된 strategy 오류 응답 확인 | QA |  |  |

## 7. DB 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| DB-001 | DB 연결 | 애플리케이션 계정으로 접속 가능 | Data Engineer |  |  |
| DB-002 | Schema 적용 | Source, Document, Chunk, Entity, Relation, Evidence, RetrievalRun, AgentRun 관련 schema 적용 | Data Architect |  |  |
| DB-003 | Migration 이력 | 배포 대상 migration 누락 없음 | Backend Engineer |  |  |
| DB-004 | 권한 | 애플리케이션 계정 최소 권한 적용 | Security / DBA |  |  |
| DB-005 | 용량 | Source/IndexJob/Run 이력 저장 가능 용량 확보 | DBA |  |  |
| DB-006 | 인덱스 | 조회/검색/상태 모니터링용 index 존재 | Data Engineer |  |  |
| DB-007 | 백업 | 배포 직전 백업 완료 | DBA / DevOps |  |  |
| DB-008 | 복구 리허설 | 최근 복구 절차 또는 샘플 복구 확인 | DevOps |  |  |

## 8. VectorStore 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| VS-001 | provider 확인 | `in_memory`, `faiss`, `pgvector` 중 배포 환경 기준 확정 | Data Engineer |  |  |
| VS-002 | collection 확인 | 기본 collection 생성 또는 접근 가능 | Data Engineer |  |  |
| VS-003 | add 검증 | 샘플 chunk 저장 성공 | QA / Data Engineer |  |  |
| VS-004 | search 검증 | 샘플 query로 result 반환 | QA / Data Engineer |  |  |
| VS-005 | delete 검증 | 삭제 대상 chunk 검색 제외 | QA / Data Engineer |  |  |
| VS-006 | metadata 확인 | source_id, document_id, domain, chunk_id 저장 | QA |  |  |
| VS-007 | 백업 | FAISS index 또는 PGVector table 백업 완료 | DevOps |  |  |
| VS-008 | 성능 | 대표 query 평균 응답시간 기준 내 | QA / Backend |  |  |

## 9. GraphStore 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| GS-001 | provider 확인 | `in_memory` 또는 `postgresql` 운영 기준 확정 | Data Engineer |  |  |
| GS-002 | entity upsert | 샘플 Entity 저장/갱신 성공 | QA / Data Engineer |  |  |
| GS-003 | relation upsert | 샘플 Relation 저장/조회 성공 | QA / Data Engineer |  |  |
| GS-004 | evidence link | Evidence와 Relation 연결 확인 | QA / GraphRAG Engineer |  |  |
| GS-005 | traverse | 기준 Entity에서 연결 Relation/Evidence 조회 | QA / GraphRAG Engineer |  |  |
| GS-006 | delete/source cleanup | Source 삭제 시 graph 데이터 정리 정책 확인 | Backend Engineer |  |  |
| GS-007 | 권한 필터 | tenant/user/scope 기반 접근 제한 확인 | Security / Backend |  |  |
| GS-008 | 백업 | Graph table 또는 provider 데이터 백업 완료 | DevOps |  |  |

## 10. 관리자/API 기능 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| API-001 | Source 등록 | `POST /api/admin/sources` 정상 | Backend / QA |  |  |
| API-002 | Source 목록/상세 | `GET /api/admin/sources`, `GET /api/admin/sources/{source_id}` 정상 | Backend / QA |  |  |
| API-003 | Source 삭제 | `DELETE /api/admin/sources/{source_id}` 정상 | Backend / QA |  |  |
| API-004 | IndexJob 생성 | `POST /api/admin/index-jobs` 정상 | Backend / QA |  |  |
| API-005 | IndexJob 실행 | `POST /api/admin/index-jobs/{job_id}/run` 정상 | Backend / QA |  |  |
| API-006 | IndexJob 상태 조회 | `GET /api/admin/index-jobs/{job_id}` 정상 | Backend / QA |  |  |
| API-007 | IndexJob 재실행 | `POST /api/admin/index-jobs/{job_id}/retry` 정상 | Backend / QA |  |  |
| API-008 | Preview 조회 | `GET /api/admin/sources/{source_id}/preview` 정상 | Backend / QA |  |  |
| API-009 | GraphRAG 검색 테스트 | `POST /api/admin/retrieval-tests` 정상 | Backend / QA |  |  |
| API-010 | Agent 실행 | `/api/agents/{agent_id}/runs` 또는 WorkflowFactory 연계 확인 | AI Engineer / QA |  |  |

## 11. 보안 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| SEC-001 | 인증 | 미인증 요청 401 처리 | Security / Backend |  |  |
| SEC-002 | 권한 | role별 Source/IndexJob/Agent 권한 제한 | Security / Backend |  |  |
| SEC-003 | scope | tenant/user/source scope 필터 적용 | Security / Backend |  |  |
| SEC-004 | Secret 관리 | API Key, DB Password, Token이 코드/문서/log에 없음 | Security |  |  |
| SEC-005 | 오류 응답 | stack trace, 내부 경로, secret 노출 없음 | Security / QA |  |  |
| SEC-006 | 감사 로그 | Source 변경, IndexJob 실행, 검색 테스트, Agent 실행 기록 | Security / DevOps |  |  |
| SEC-007 | 민감정보 masking | Source, Evidence, Retrieval/Agent log masking 정책 확인 | Security / PM |  |  |
| SEC-008 | CORS/외부 접근 | 허용 origin과 관리자 접근망 제한 확인 | Security / DevOps |  |  |
| SEC-009 | 백업 보안 | 백업 파일 암호화 및 접근 권한 확인 | Security / DevOps |  |  |

## 12. 배포 수행 체크리스트

| ID | 수행 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| DEP-001 | 배포 시작 공지 | 배포 시간, 영향도, 담당자 공지 | PM |  |  |
| DEP-002 | 서비스 중지 필요 여부 확인 | 무중단/중단 배포 방식 확정 | DevOps |  |  |
| DEP-003 | 배포 artifact 확인 | 배포 대상 package 또는 commit hash 확인 | DevOps |  |  |
| DEP-004 | 환경 변수 적용 | 대상 환경에 설정 반영 | DevOps |  |  |
| DEP-005 | DB migration 수행 | 필요한 경우 migration 완료 | Backend / DBA |  |  |
| DEP-006 | 애플리케이션 배포 | API/Admin/Agent runtime 배포 완료 | DevOps |  |  |
| DEP-007 | 서비스 기동 | health check 정상 | DevOps |  |  |
| DEP-008 | smoke test | Source 등록, IndexJob, Preview, Retrieval 대표 흐름 PASS | QA |  |  |
| DEP-009 | 배포 완료 공지 | 결과와 후속 모니터링 안내 | PM |  |  |

## 13. 배포 후 안정화 점검

| ID | 점검 항목 | 기준 | 담당 | 결과 | 비고 |
| --- | --- | --- | --- | --- | --- |
| POST-001 | API 오류율 | 5xx 오류 급증 없음 | DevOps |  |  |
| POST-002 | 응답 시간 | Admin API/Retrieval 응답 시간 기준 내 | DevOps / QA |  |  |
| POST-003 | IndexJob 실패율 | 신규 실패 급증 없음 | Backend / QA |  |  |
| POST-004 | Retrieval 품질 | 대표 질의 HIT 및 Evidence/Citation 확인 | GraphRAG Engineer |  |  |
| POST-005 | Agent 실행 | 대표 Agent workflow 정상 | AI Engineer / QA |  |  |
| POST-006 | VectorStore 오류 | provider connection/search 오류 없음 | Data Engineer |  |  |
| POST-007 | GraphStore 오류 | upsert/traverse 오류 없음 | Data Engineer |  |  |
| POST-008 | 보안 이벤트 | 401/403, 비정상 접근 급증 없음 | Security |  |  |
| POST-009 | 로그 수집 | request_id/job_id/run_id 추적 가능 | DevOps |  |  |

## 14. 롤백 기준

### 14.1 즉시 롤백 기준

| ID | 롤백 조건 | 판단 기준 | 승인 |
| --- | --- | --- | --- |
| RB-001 | 서비스 기동 실패 | health check 실패 지속 | PM / DevOps |
| RB-002 | 핵심 API 실패 | Source 등록 또는 IndexJob 실행 불가 | PM / Backend |
| RB-003 | 검색 불가 | 대표 GraphRAG 검색 테스트 전체 MISS 또는 오류 | PM / GraphRAG Engineer |
| RB-004 | 데이터 손상 위험 | Source/VectorStore/GraphStore 정합성 오류 | PM / Data Engineer |
| RB-005 | 보안 사고 | 권한 우회, 민감정보 노출, Secret 노출 | PM / Security |
| RB-006 | 장애 확산 | 5xx 또는 timeout 급증이 기준 시간 이상 지속 | PM / DevOps |

### 14.2 롤백 절차

| 순서 | 절차 | 담당 | 결과 |
| ---: | --- | --- | --- |
| 1 | 롤백 조건 충족 여부 판단 | PM / DevOps |  |
| 2 | 사용자/운영자에게 장애 및 롤백 공지 | PM |  |
| 3 | 신규 배포 artifact 중지 | DevOps |  |
| 4 | 직전 정상 버전 재배포 | DevOps |  |
| 5 | DB migration rollback 또는 백업 복구 여부 판단 | DBA / Backend |  |
| 6 | VectorStore/GraphStore 복구 또는 재인덱싱 판단 | Data Engineer |  |
| 7 | smoke test 재수행 | QA |  |
| 8 | 장애 원인과 후속 조치 기록 | PM / 담당자 |  |

### 14.3 롤백 후 확인

| 확인 항목 | 기준 | 결과 |
| --- | --- | --- |
| API health | 정상 |  |
| Source 목록 조회 | 정상 |  |
| IndexJob 실행 | 정상 |  |
| Preview 조회 | 정상 |  |
| GraphRAG 검색 | 대표 질의 HIT |  |
| Agent 실행 | 대표 workflow 정상 |  |
| 로그/감사 | 장애 및 롤백 이력 기록 |  |

## 15. 운영 인수인계 항목

| ID | 인수인계 항목 | 내용 | 담당 | 수신자 | 결과 |
| --- | --- | --- | --- | --- | --- |
| H/O-001 | 배포 버전 | commit hash, tag, package version | DevOps | 운영자 |  |
| H/O-002 | 서비스 구성 | Admin API, Agent API, VectorStore, GraphStore 구성 | Architect | 운영자 |  |
| H/O-003 | 환경 변수 | 적용된 환경 변수와 Secret 위치 | DevOps | 운영자 |  |
| H/O-004 | 운영 매뉴얼 | 사용자/운영자/신규서비스 적용 가이드 위치 | PM | 운영자 |  |
| H/O-005 | 장애 대응 | IndexJob, VectorStore, GraphStore, Agent 장애 대응 절차 | DevOps | 운영자 |  |
| H/O-006 | 백업/복구 | 백업 위치, 주기, 복구 절차 | DevOps / DBA | 운영자 |  |
| H/O-007 | 보안 정책 | 권한, scope, 감사 로그, masking 정책 | Security | 운영자 |  |
| H/O-008 | 모니터링 | 주요 지표, 알림 기준, 대시보드 위치 | DevOps | 운영자 |  |
| H/O-009 | 후속 과제 | 관리자 E2E, 성능 테스트, 실제 저장소 통합 테스트 | PM | 운영자 / 개발팀 |  |
| H/O-010 | 연락 체계 | 장애 유형별 담당자와 에스컬레이션 경로 | PM | 운영자 |  |

## 16. 최종 배포 승인

| 승인 항목 | 승인자 | 승인 일시 | 결과 | 비고 |
| --- | --- | --- | --- | --- |
| 배포 전 점검 승인 |  |  |  |  |
| 테스트 결과 승인 |  |  |  |  |
| 보안 점검 승인 |  |  |  |  |
| 롤백 계획 승인 |  |  |  |  |
| 운영 인수인계 승인 |  |  |  |  |
| 최종 배포 승인 |  |  |  |  |

## 17. 다음 작업

배포 및 운영 체크리스트 작성 이후 다음 작업은 WBS 기준 `9.5 이행 준비상태 검토`이다.

권장 요청 문구는 다음과 같다.

```text
[PM/Product Owner] 290.이행 단계의 이행 준비상태 검토서를 작성해 주세요. 사용자매뉴얼, 운영자매뉴얼, 신규 서비스 적용 가이드, 배포 및 운영 체크리스트를 검토 대상으로 포함하고 이행 승인 기준과 잔여 리스크를 정리해 주세요.
```
