# GraphRAG AI Agent 공통 프레임워크 결함관리대장 및 테스트 보완사항 목록

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 280.테스트 |
| WBS | 8.4 결함관리 및 테스트 보완사항 정리 |
| 담당 | QA |
| 작성 목적 | 테스트 자동화 수행 결과에서 확인된 제약, 미검증 영역, 후속 보완사항을 결함관리대장과 개선 과제로 정리 |
| 작성일 | 2026-06-21 |

## 2. 기준 산출물

| 구분 | 산출물 |
| --- | --- |
| 테스트계획 | `GraphRAG_AI_Agent_공통프레임워크_테스트계획서.md` |
| 테스트시나리오 | `GraphRAG_AI_Agent_공통프레임워크_테스트시나리오.md` |
| 테스트 자동화/수행 결과 | `GraphRAG_AI_Agent_공통프레임워크_테스트자동화구조_및_수행결과서.md` |

## 3. 테스트 수행 결과 요약

| 항목 | 결과 |
| --- | --- |
| 컴파일 검증 | PASS |
| 간이 테스트 러너 | PASS |
| 테스트 수 | 32 |
| 성공 | 32 |
| 실패 | 0 |
| 스킵 | 0 |
| pytest 실행 | PASS - pytest 9.1.1 기준 32개 테스트 통과 |
| 전체 판단 | 핵심 회귀 테스트는 통과했으나, 운영 수준 검증을 위해 E2E/성능/실저장소/보안 테스트 보완 필요 |

현재 확인된 이슈는 기능 결함보다는 테스트 환경 제약과 미검증 범위에 해당한다. 따라서 본 문서에서는 결함관리대장과 함께 보완 과제를 별도 관리한다.

## 4. 결함 등급 및 상태 기준

### 4.1 결함 등급

| 등급 | 기준 | 예시 |
| --- | --- | --- |
| Critical | 핵심 업무 흐름이 전체 차단되거나 데이터 정합성이 크게 훼손됨 | Source 등록 불가, IndexJob 전체 실패, 검색 전체 실패 |
| Major | 주요 기능 일부 실패 또는 보안/권한 우회 가능성 존재 | Evidence 누락, 권한 검증 미동작, Agent context 누락 |
| Minor | 기능은 동작하나 사용성, 표시, 보조 기능에 문제가 있음 | 상태 배지 오표시, 오류 메시지 미흡 |
| Trivial | 문서, 라벨, 테스트 보강 수준의 개선 | 설명 문구 보완, 테스트 명칭 정리 |

### 4.2 상태 기준

| 상태 | 의미 |
| --- | --- |
| Open | 신규 등록, 조치 필요 |
| In Progress | 담당자가 조치 중 |
| Resolved | 수정 또는 보완 완료, 재검증 대기 |
| Closed | 재검증 완료 |
| Deferred | 후속 단계 또는 별도 환경에서 처리 |
| Blocked | 외부 환경, 도구, 권한 등으로 진행 차단 |

## 5. 결함관리대장

| 결함 ID | 제목 | 유형 | 등급 | 상태 | 발견 단계 | 재현/확인 내용 | 영향 | 조치 방향 | 담당 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEF-280-001 | pytest 설치 및 공식 테스트 재수행 완료 | 환경 제약 | Minor | Closed | 테스트 수행 | pytest 설치 후 `python -m pytest` 재수행 | 표준 pytest 리포트 확보 | pytest 9.1.1 기준 32개 테스트 통과 확인 | QA / DevOps |
| DEF-280-002 | 관리자 사이트 실제 브라우저 E2E 미검증 | 테스트 범위 | Major | Deferred | 테스트 설계 | 현재 `test_admin_mvp.py`는 service-level 테스트 중심 | 실제 UI 조작, 화면 표시, 브라우저 호환성 검증 부족 | 290.이행 또는 UI 고도화 시 Playwright 기반 Source/IndexJob/Preview/Search E2E 구성 | QA Automation / Frontend |
| DEF-280-003 | 성능 기준치 및 자동 측정 스크립트 미정의 | 테스트 범위 | Major | Deferred | 테스트 설계 | indexing/retrieval latency 기준 및 반복 측정 자동화 없음 | 대량 데이터 적용 시 성능 품질 판단 곤란 | 운영 저장소/데이터 규모 확정 후 성능 기준 정의, 반복 실행 스크립트, 결과 리포트 추가 | QA / Backend |
| DEF-280-004 | 실제 저장소 통합 테스트 미수행 | 테스트 범위 | Major | Deferred | 테스트 수행 | FAISS/PGVector/PostgreSQL GraphStore는 skeleton 또는 InMemory 중심 검증 | 운영 저장소 연결 시 장애를 사전 발견하기 어려움 | 실제 provider 설정 후 통합 테스트 환경 구성 | Backend / Data Engineer |
| DEF-280-005 | 보안/권한 API 테스트가 실제 인증 모듈과 미연계 | 테스트 범위 | Major | Deferred | 테스트 설계 | AuthContext 또는 서비스 내부 권한 기준 검증 중심 | 실제 인증 토큰, role, scope 검증 누락 가능 | 인증/권한 미들웨어 확정 후 API 테스트 추가 | Backend / QA |
| DEF-280-006 | 테스트 결과 리포트 산출 자동화 미흡 | 운영 개선 | Minor | Deferred | 테스트 수행 | 현재 결과는 콘솔 출력과 수기 문서 반영 중심 | 회귀 테스트 이력 추적성 부족 | CI 연계 시 JUnit XML, Markdown summary, 수행 일시 자동 기록 추가 | QA Automation |
| DEF-280-007 | Sol-Bat 파일럿 데이터 규모가 P1 3건 중심 | 테스트 데이터 | Minor | Deferred | 파일럿 검증 | 현재 샘플 중심 회귀 테스트 | 다양한 작물/병해충/지역/생육단계 검증 부족 | P2/P3 데이터셋 확대 후 회귀 테스트 추가 | Knowledge Engineer / QA |

## 6. 테스트 보완사항 목록

### 6.1 pytest 환경 제약 보완

| 보완 ID | 보완 항목 | 현재 상태 | 보완 내용 | 완료 기준 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| QA-ACT-001 | pytest 설치 및 공식 테스트 수행 | 완료 | Codex 번들 Python에 pytest 설치 후 `python -m pytest` 실행 | pytest 9.1.1 기준 32개 테스트 PASS | P1 |
| QA-ACT-002 | 테스트 실행 명령 표준화 | 간이 러너와 pytest 병행 | README 또는 테스트 가이드에 pytest/간이 러너 명령 정리 | 신규 개발자가 동일 명령으로 실행 가능 | P2 |
| QA-ACT-003 | CI 연계 준비 | 미구성 | GitHub Actions 또는 local batch에서 compileall + pytest 실행 | PR/Push 시 자동 테스트 가능 | P2 |

### 6.2 관리자 E2E 테스트 보완

| 보완 ID | 보완 항목 | 현재 상태 | 보완 내용 | 완료 기준 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| QA-ACT-004 | Source 등록 E2E | service-level 검증 완료 | 브라우저에서 Source 등록 폼 입력, 저장, 목록 반영 확인 | 실제 화면 기준 Source 생성 확인 | P1 |
| QA-ACT-005 | IndexJob 실행/모니터링 E2E | service-level 검증 완료 | 실행 버튼 클릭, 상태 badge 변화, 실패 상세 확인 | QUEUED/RUNNING/COMPLETED/FAILED 화면 검증 | P1 |
| QA-ACT-006 | Preview 화면 E2E | service-level 검증 완료 | Chunk/Entity/Relation/Evidence 탭 또는 영역 표시 확인 | preview 데이터가 화면에 표시됨 | P1 |
| QA-ACT-007 | GraphRAG 검색 테스트 E2E | service-level 검증 완료 | 질의 입력, 검색 실행, score/evidence/citation 표시 확인 | 검색 결과와 근거가 화면에 표시됨 | P1 |
| QA-ACT-008 | VectorMoon UX 반영 회귀 확인 | 문서 반영 중심 | 필터, 상태 배지, 목록/상세 전환, 액션 버튼 사용성 확인 | UX 체크리스트 PASS | P2 |

### 6.3 성능 테스트 보완

| 보완 ID | 보완 항목 | 현재 상태 | 보완 내용 | 완료 기준 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| QA-ACT-009 | IndexJob 성능 기준 정의 | 기준 미정 | Source 크기별 indexing 목표 시간 정의 | P1/P2/P3 데이터별 기준 수립 | P1 |
| QA-ACT-010 | Hybrid Retrieval 응답 시간 측정 | 미구성 | 대표 질의 10회 이상 반복 측정 | 평균/최대 응답 시간 리포트 생성 | P1 |
| QA-ACT-011 | Preview 응답 시간 측정 | 미구성 | Chunk/Entity/Relation/Evidence preview API 반복 호출 | 기준 시간 내 응답 확인 | P2 |
| QA-ACT-012 | 대량 Source 회귀 데이터 구성 | P1 3건 중심 | 10건, 100건 단위 테스트 데이터 확장 | 데이터 규모별 성능 추세 확인 | P2 |
| QA-ACT-013 | 성능 결과 문서화 | 미구성 | Markdown 또는 CSV 결과 저장 | 테스트 수행 이력 추적 가능 | P2 |

### 6.4 실제 저장소 통합 테스트 보완

| 보완 ID | 보완 항목 | 현재 상태 | 보완 내용 | 완료 기준 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| QA-ACT-014 | FAISS Adapter 통합 테스트 | skeleton 검증 | 로컬 FAISS 설치 또는 mock provider 기반 add/search/delete 검증 | FAISS provider 검색 PASS | P2 |
| QA-ACT-015 | PGVector Adapter 통합 테스트 | skeleton 검증 | PostgreSQL + pgvector 연결 설정 후 embedding 저장/검색 검증 | PGVector provider 검색 PASS | P1 |
| QA-ACT-016 | PostgreSQL GraphStoreAdapter 통합 테스트 | skeleton 검증 | entity/relation/evidence upsert/find/traverse/delete 검증 | PostgreSQL graph adapter CRUD PASS | P1 |
| QA-ACT-017 | InMemory와 실제 저장소 결과 비교 | 미구성 | 동일 데이터로 검색 결과와 graph traverse 결과 비교 | 핵심 결과 정합성 확인 | P2 |
| QA-ACT-018 | 저장소 장애/재시도 테스트 | 미구성 | 연결 실패, timeout, query error 시나리오 검증 | 표준 오류 응답과 재시도 정책 확인 | P2 |

### 6.5 보안/권한 API 테스트 보완

| 보완 ID | 보완 항목 | 현재 상태 | 보완 내용 | 완료 기준 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| QA-ACT-019 | 미인증 API 차단 테스트 | 설계 완료, 실제 연계 미흡 | 인증 토큰 없는 요청으로 Source/IndexJob/Search API 호출 | 401 응답 확인 | P1 |
| QA-ACT-020 | role 기반 권한 테스트 | AuthContext 중심 | viewer/editor/admin role별 등록/삭제/실행 권한 검증 | 권한별 허용/차단 기준 PASS | P1 |
| QA-ACT-021 | scope/tenant 접근 제어 테스트 | 설계 완료 | 다른 tenant/source scope 접근 시도 | 403 또는 빈 결과 확인 | P1 |
| QA-ACT-022 | 오류 응답 표준 테스트 | 일부 설계 | validation_error, not_found, forbidden, conflict 응답 형식 검증 | code/message/request_id 형식 일치 | P1 |
| QA-ACT-023 | 감사 로그 테스트 | 미구성 | Source 등록/삭제, IndexJob 실행, Agent 실행 이벤트 기록 확인 | actor/action/resource/time 추적 가능 | P2 |

## 7. 우선순위별 조치 계획

### 7.1 P1 즉시 보완

| 순서 | 보완 항목 | 담당 | 목표 |
| ---: | --- | --- | --- |
| 1 | pytest 설치 환경 기준 공식 테스트 수행 | QA / DevOps | 표준 테스트 결과 확보 |
| 2 | 관리자 Source/IndexJob/Preview/Search E2E 구성 | QA Automation / Frontend | 주요 관리자 흐름 화면 검증 |
| 3 | Hybrid Retrieval 응답 시간 측정 | QA / Backend | 검색 성능 기준 수립 |
| 4 | PGVector/PostgreSQL 통합 테스트 환경 정의 | Backend / Data Engineer | 실제 저장소 리스크 제거 |
| 5 | 보안/권한 API 테스트 구성 | Backend / QA | 인증/권한 기준 검증 |

### 7.2 P2 후속 보완

| 순서 | 보완 항목 | 담당 | 목표 |
| ---: | --- | --- | --- |
| 1 | GitHub Actions 테스트 자동화 | DevOps / QA Automation | push/PR 회귀 검증 |
| 2 | 성능 테스트 결과 리포트 자동 생성 | QA Automation | 성능 이력 관리 |
| 3 | Sol-Bat P2/P3 데이터셋 확대 | Knowledge Engineer / QA | 도메인 검증 범위 확대 |
| 4 | VectorMoon UX 체크리스트 기반 E2E 보강 | 기획자 / 디자이너 / QA | 관리자 사용성 품질 개선 |

## 8. 재검증 기준

| 구분 | 재검증 기준 |
| --- | --- |
| pytest 환경 | `python -m pytest` 전체 PASS |
| 관리자 E2E | Source 등록, IndexJob 실행/상태, Preview, GraphRAG 검색 테스트 화면 흐름 PASS |
| 성능 테스트 | IndexJob, Preview, Hybrid Retrieval 응답 시간이 기준 내 충족 |
| 실제 저장소 | PGVector/PostgreSQL adapter 통합 테스트 PASS |
| 보안/권한 | 미인증, role, scope, 오류 응답 표준 테스트 PASS |
| Sol-Bat 파일럿 | P1 회귀 테스트 유지, P2/P3 확장 데이터 검증 PASS |

## 9. 품질 게이트 반영안

280.테스트 단계 완료 전 다음 품질 게이트를 적용한다.

| 게이트 | 필수 여부 | 기준 |
| --- | --- | --- |
| Compile Gate | 필수 | `python -m compileall src tests tools` PASS |
| Unit/Component Gate | 필수 | GraphRAG Core, VectorStore, GraphStore 테스트 PASS |
| Integration Gate | 필수 | HybridRetriever, Agent Workflow, Admin service flow PASS |
| Pilot Gate | 필수 | Sol-Bat P1 회귀 테스트 PASS |
| Security Gate | 필수 | 인증/권한/오류 응답 테스트 PASS |
| E2E Gate | 조건부 필수 | 관리자 MVP 화면 고정 이후 적용 |
| Performance Gate | 조건부 필수 | 운영 저장소 및 데이터 규모 확정 이후 적용 |

## 10. 다음 작업

결함관리대장과 테스트 보완사항 목록은 8.5 결함 조치 및 테스트 결과 확정 문서에서 최종 검토되었으며, 미완료 항목은 후속 이관 항목으로 관리한다.

권장 요청 문구는 다음과 같다.

```text
[Technical Writer/개발자] 290.이행 단계의 사용자매뉴얼을 작성해 주세요. 관리자 사이트 Source 등록/조회/삭제, IndexJob 실행/상태 확인, Preview 조회, GraphRAG 검색 테스트, Agent 실행 사용 절차를 포함해 주세요.
```

또는 테스트 단계 마무리를 진행하려면 다음 문구를 사용한다.

```text
[PM/QA] 280.테스트 단계 산출물 검토 및 확정 문서를 작성하고 WBS에 8.1~8.4 완료 상태를 반영해 주세요.
```
