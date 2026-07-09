# 19. ProjectQA Intent Factory 통합 개발 계획

## 1. 목적

본 문서는 JWP Intent Factory 기반 AI 챗봇 플랫폼의 전체 아키텍처 방향성을 기준으로, 이번 구현에서 수행할 고객 내부망 Runtime 1차 통합 계획을 정리한다.

이번 구현의 핵심 목적은 기존 `/admin/qa` 화면을 기본 Intent Runtime 운영자 검증 및 운영 화면으로 전환하는 것이다. 운영자는 이 화면에서 사용자의 자연어 질문이 어떤 Intent로 매칭되는지 확인하고, Entity 추출 결과와 Action 실행 결과를 함께 검증할 수 있어야 한다.

기존 `/admin/prompt/test` 화면은 개발자 및 시스템 관리자를 위한 진단 화면 성격으로 유지한다. 즉, 실제 운영 흐름은 `/admin/qa` 중심으로 정리하고, 세부 진단과 개별 모듈 확인은 `/admin/prompt/test`에서 보조하도록 역할을 분리한다.

## 2. 전체 아키텍처와 이번 구현 위치

JWP Intent Factory 플랫폼은 외부망에서 Intent Pack을 생성하고 검증한 뒤, 고객 내부망에서 해당 Pack을 Import하여 Runtime에 적용하는 구조를 목표로 한다.

외부망에서는 다음 기능을 담당한다.

- JWP Intent Factory에서 LLM 기반 Intent 생성 및 분석을 수행한다.
- 도메인 전문가가 생성된 Intent, Entity, FAQ, Action 후보를 검수한다.
- 검수된 구성요소를 기준으로 Pack Build를 수행한다.
- Pack 품질 검증, 테스트, 회귀 검사를 수행한다.
- Pack Repository에 Pack과 버전 정보를 관리한다.
- 고객 내부망 반입을 위한 배포 패키지를 생성한다.

고객 내부망에서는 다음 기능을 담당한다.

- 외부망에서 전달받은 Pack을 내부망에 Import한다.
- Chatbot Runtime이 사용자 질문을 수신한다.
- NLU/Intent Engine이 Intent 매칭과 Entity 추출을 수행한다.
- Action Orchestrator가 허용된 Action만 실행한다.
- 화면 이동, 문서/FAQ 검색, 정형 데이터 조회 등 내부 업무 기능과 연계한다.
- 운영 로그, 감사 로그, 미응답 로그, 모니터링 정보를 관리한다.

Intent Pack은 다음 구성요소를 포함한다.

- Intent
- Entity
- Menu
- FAQ
- Action
- Synonym
- 설정 및 메타 정보

이번 구현은 위 전체 플랫폼 중 고객 내부망 Runtime 1차 통합에 해당한다. Pack Builder, Pack Repository, Pack Import 전체 관리 기능을 완성하는 작업이 아니라, 이미 준비된 로컬 Pack과 Intent Matcher, Action Router를 `/admin/qa` 운영 화면에 연결하는 작업이다.

```text
전체 목표 흐름
외부망 JWP Intent Factory
  -> Intent/Entity/FAQ/Action 생성
  -> 전문가 검수
  -> Pack Build 및 검증
  -> Pack Repository
  -> 배포 패키지 생성

고객 내부망 Runtime
  -> Pack Import
  -> Chatbot Runtime
  -> NLU/Intent Engine
  -> Action Orchestrator
  -> 화면 이동, 문서/FAQ 검색, 정형 데이터 조회
  -> 운영/모니터링

이번 구현 흐름
준비된 로컬 Pack
  -> /admin/qa
  -> Runtime API
  -> Intent Matcher
  -> Action Router
  -> 응답 카드 및 로그
```

## 3. 적용 요구사항

이번 구현에서 적용할 요구사항은 다음과 같다.

- `/admin/qa`는 기본적으로 Intent Factory Runtime을 호출한다.
- 사용자 질문은 프로젝트 기준 Pack 설정을 확인한 뒤 Intent Matcher로 전달한다.
- Intent Matcher는 Intent 후보, 신뢰도, Entity 추출 결과를 반환한다.
- Action Router는 매칭된 Intent와 Entity를 기준으로 실행 가능한 Action을 결정하고, Action 결과 및 카드 데이터를 반환한다.
- Runtime API는 Action Router 결과를 안정적인 응답 Envelope로 조립한다.
- 화면 이동, 문서/FAQ 검색, 정형 데이터 조회 안내, 가이드, fallback 응답은 구조화된 카드 형태로 화면에 전달한다.
- 미응답 또는 낮은 신뢰도 질문은 Unanswered Logging 대상으로 기록할 수 있어야 한다.
- 응답 Envelope는 운영 화면과 진단 화면이 함께 사용할 수 있도록 안정적인 구조를 유지한다.
- `/admin/prompt/test`는 Action Router와 Validation Runner를 확인하는 진단 화면으로 유지한다.
- 고객 데이터는 고객 내부망에만 존재한다는 보안 원칙을 유지한다.
- 고객 원천 데이터와 사용자 질문 원문은 고객 내부망에만 보관한다.
- 외부망에는 Pack 산출물과 승인된 비식별 Pack 개선 요청 및 피드백만 전달할 수 있다.
- Runtime에서는 허용된 Action만 실행한다.
- 사용자 권한, 실행 권한, 감사 로그를 관리할 수 있는 확장 지점을 남긴다.

## 4. 개발 범위

이번 개발 범위는 고객 내부망 Runtime 1차 통합에 한정한다.

Backend 개발 범위는 다음과 같다.

- 프로젝트별 Pack 설정을 해석하는 Project Pack Resolver를 추가한다.
- `/api/v1/projects/{project_id}/chat/runtime` 형태의 Runtime API를 추가한다.
- Runtime API에서 Intent Matcher와 Action Router를 순차 호출한다.
- 응답 결과를 Intent 정보, Entity 정보, Action 정보, 카드 정보, 로그 메타 정보가 포함된 구조로 정리한다.
- fallback 또는 미응답 상황에서 운영 분석에 필요한 로그 식별자를 반환할 수 있도록 한다.

Runtime API와 응답 Envelope 계약은 다음 기준으로 정의한다.

- API 경로: `POST /api/v1/projects/{project_id}/chat/runtime`
- Request 필드: `query`, `conversation_id`, `pack_id`, `pack_version`, `top_k`
- Response 상위 필드: `project_id`, `pack_id`, `pack_version`, `runtime_mode`, `message`, `card`, `matches`, `diagnostics`, `log_id`
- `log_id`는 fallback, 미응답, 운영 분석 대상 요청 등 로그가 생성된 경우에 포함한다.
- `card`는 카드 유형을 구분하는 구분자를 포함한다.
- 카드 유형 구분자는 `navigation_card`, `document_card`, `query_card`, `guide_card`, `fallback_card`를 사용한다.

Frontend 개발 범위는 다음과 같다.

- `/admin/qa`의 기본 메시지 전송 흐름을 Intent Runtime API 호출로 전환한다.
- `navigation_card`, `document_card`, `query_card`, `guide_card`, `fallback_card`를 운영 화면에서 표시한다.
- Intent, Action, 신뢰도, Entity, 후보 매칭 결과를 운영자가 확인할 수 있는 진단 영역을 제공한다.
- `/admin/prompt/test`에서 사용하던 카드 렌더링 구조를 재사용 가능한 컴포넌트로 분리한다.
- `/admin/prompt/test`는 기존처럼 진단 화면으로 유지한다.

문서 범위는 다음과 같다.

- 전체 Intent Factory 아키텍처와 이번 구현 위치를 구분해 설명한다.
- 이번 구현에 포함되는 범위와 제외되는 범위를 명확히 기록한다.
- 완료 기준과 다음 단계를 산출물 문서로 남긴다.

## 5. 주요 처리 흐름

기본 Runtime 처리 흐름은 다음과 같다.

1. 운영자가 `/admin/qa` 화면에서 사용자 질문을 입력한다.
2. Frontend는 현재 프로젝트 식별자와 질문을 Runtime API로 전달한다.
3. Backend는 Project Pack Resolver를 통해 적용할 Pack 정보를 결정한다.
4. Intent Matcher는 질문을 분석하여 Intent 후보, 신뢰도, Entity 정보를 산출한다.
5. Action Router는 최종 Intent와 Entity를 기준으로 실행 가능한 Action을 결정한다.
6. Action Router는 Action 유형에 맞는 Action 결과와 카드 데이터를 반환한다.
7. Runtime API는 응답 본문, 카드 데이터, 매칭 결과, 진단 메타 정보, 로그 식별자를 하나의 Envelope로 조립해 반환한다.
8. `/admin/qa`는 운영자가 이해할 수 있는 채팅 응답과 구조화 카드를 표시한다.
9. fallback 또는 미응답이 발생하면 Unanswered Logging에 기록하고, 운영 분석에 사용할 수 있는 정보를 남긴다.

Action 유형별 처리 방향은 다음과 같다.

- `NAVIGATE`: 내부 메뉴 또는 화면 이동 정보를 카드로 제공한다.
- `SEARCH_DOC`: FAQ 또는 문서 검색 결과와 출처 정보를 카드로 제공한다.
- `QUERY`: 실제 고객 DB Query 실행은 이번 범위에서 제외하고, 조회 의도와 필요한 조건을 구조화해 표시한다.
- `GUIDE`: 사용자가 다음에 수행할 수 있는 업무 절차를 안내한다.
- `FALLBACK`: 매칭 실패 또는 신뢰도 부족 상황을 설명하고 미응답 로그와 연결한다.

## 6. 화면 적용 방안

`/admin/qa` 화면은 운영자가 사용하는 기본 Intent Runtime 운영자 검증 및 운영 화면으로 전환한다.

적용 방향은 다음과 같다.

- 기존 GraphRAG 중심 호출 대신 Intent Runtime API를 기본 호출 경로로 사용한다.
- 채팅 타임라인에는 사용자 질문, Runtime 응답, Action 카드를 함께 표시한다.
- 운영자 진단 영역에는 Intent, Action, 신뢰도, Entity, Pack 정보, fallback 로그 식별자를 표시한다.
- 운영자가 필요할 때만 상세 진단 정보를 볼 수 있도록 진단 표시를 접거나 펼칠 수 있게 한다.
- 기존 소스 표시나 응답 이력 구조는 가능한 범위에서 유지하되, 기본 응답 모델은 Intent Runtime Envelope를 기준으로 정리한다.

`/admin/prompt/test` 화면은 진단 화면으로 유지한다.

유지 방향은 다음과 같다.

- Intent Matcher, Action Router, Validation Runner의 개별 동작 확인에 사용한다.
- 운영 화면에서 재사용하는 Action Card 컴포넌트를 함께 사용한다.
- 운영자용 기본 화면이 아니라 개발자 및 시스템 관리자용 검증 화면으로 역할을 명확히 한다.

## 7. 완료 기준

이번 구현의 완료 기준은 다음과 같다.

- `/admin/qa`에서 질문 입력 시 Intent Runtime API가 기본 호출된다.
- Runtime API가 프로젝트 기준 Pack 정보를 포함해 응답한다.
- Intent Matcher 결과가 응답 Envelope에 포함된다.
- Entity 추출 결과가 운영자가 확인 가능한 형태로 표시된다.
- Action Router 결과가 `navigation_card`, `document_card`, `query_card`, `guide_card`, `fallback_card` 형태로 렌더링된다.
- `NAVIGATE`, `SEARCH_DOC`, `QUERY`, `GUIDE`, `FALLBACK` 응답 유형을 화면에서 구분해 표시한다.
- fallback 또는 미응답 상황에서 fallback 카드와 운영 분석용 로그 정보가 함께 표시된다.
- 운영자 진단 정보는 기본 채팅 흐름을 방해하지 않도록 토글로 표시하거나 숨길 수 있다.
- `/admin/prompt/test`에서 기존 Action Router 및 Validation Runner 진단 흐름이 회귀 없이 동작한다.
- Pack Builder Draft 화면에서 DB 기반 Pack 초안을 조회할 수 있다.
- Pack Repository UI와 Pack ZIP 배포 없이도 준비된 파일 Pack 기준 Runtime 테스트가 가능하다.
- Backend 단위 테스트와 Frontend 기본 검증을 통해 Runtime 연결이 확인된다.

작업 원칙으로 기존 사용자 변경사항이나 관련 없는 파일은 되돌리지 않는다.

## 8. 제외 범위

이번 구현에서 제외하는 범위는 다음과 같다.

- Pack Builder 완성형 구현
- Pack Repository UI 구현
- Pack ZIP Export/Import UI 구현
- 외부망 JWP Intent Factory 전체 관리 화면 구현
- Pack 검수 Workflow 전체 구현
- LDAP/SSO 연동
- 실제 고객 DB Query 실행
- 고객 내부 시스템에 대한 실시간 권한 검증 연동
- 운영 통계 대시보드 고도화
- 배포 패키지 생성 자동화
- 외부망과 고객 내부망 사이의 물리적 반입 절차 자동화
- 전체 보안 감사 체계 완성

`QUERY` Action은 이번 단계에서 실제 DB Query를 실행하지 않는다. 대신 조회 의도, 필요한 Entity, 예상 조건, 향후 실행 연계 지점을 구조화해 표시하는 수준으로 제한한다.

Pack Import는 이번 단계에서 JSON Pack을 DB로 가져오는 API 초안과 기본 화면 흐름까지만 제공한다. Runtime은 아직 DB를 직접 읽지 않고, 현재 저장소에 준비된 Pack 또는 설정된 기본 파일 Pack을 기준으로 동작하도록 한다.

## 8.1 2026-06-26 추가 구현 결과

DB 기반 관리 기능 확장으로 다음 항목을 추가 구현했다.

| 구분 | 구현 결과 |
|---|---|
| Entity/Synonym DB 관리 | Entity 정의, 값 유형, 정규화 규칙, Canonical Value, Synonym, Code 저장/수정/보관 API 및 화면 구현 |
| Intent Example UX | Intent 상세 화면에서 예시 질문을 한 줄 입력/추가/삭제 chip 형태로 관리 가능 |
| Intent-Entity 연결 | Intent 상세 화면에서 Entity 후보를 선택하고 Intent와 연결 저장 가능 |
| Pack Import 확장 | JSON Pack Import 시 Entity/Synonym과 Action Parameter 기반 Intent-Entity Link를 함께 적재 |
| Pack Builder Draft | DB 데이터를 기반으로 Pack JSON 초안을 생성하고 화면에서 미리보기 가능 |
| Runtime 선택 흐름 | Runtime 테스트 화면에서 기본 파일 Pack과 DB Draft Pack 확인 선택지를 제공 |

현재 검증 결과는 다음과 같다.

| 검증 항목 | 결과 |
|---|---|
| Backend 테스트 | `test_intent_factory_*` 및 관련 Runtime 테스트 통과 |
| Frontend 빌드 | `npm run build` 통과 |
| Pack Import API | Intent 17건, Entity 15건 적재 확인 |
| Entity 목록 API | Entity 15건 및 Synonym Count 조회 확인 |
| Intent-Entity 연결 API | `INT-NZ-QUERY-001` 기준 factory, period, scope 연결 확인 |
| Pack Draft API | Intent, Example, Entity, Synonym, Action Parameter, Source Scope 포함 JSON 초안 생성 확인 |

## 8.2 2026-06-27 Pack Export v0.2 추가 구현 결과

DB 기반 Pack Draft를 실제 폐쇄망 반입 단위인 Service-Pack ZIP으로 생성하기 위한 1차 기능을 추가했다.

| 구분 | 구현 결과 |
|---|---|
| Pack Export Service | DB Draft를 `IntentPackLoader.REQUIRED_FILES` 기준 표준 파일 구조로 변환 |
| Manifest/Profile 생성 | Pack ID, Version, Project ID, 파일 목록, 폐쇄망 Runtime 모드 메타 정보 생성 |
| NLU/Action/Knowledge 파일 생성 | Intent, Example, Entity, Synonym, Action Registry, Action Parameter, Source Scope 파일화 |
| Template/Validation 기본 파일 생성 | 응답 템플릿, 카드 템플릿, fallback 템플릿, 검증 기준 기본 파일 생성 |
| ZIP 생성/다운로드 | Export 디렉터리를 ZIP으로 압축하고 다운로드 API 제공 |
| Pack Repository v0.1 | Export ID, Pack ID, Version, 상태, 검증 결과, Counts, 파일 경로 저장 |
| Pack Builder 화면 | Export/ZIP 생성 버튼, 검증 결과, ZIP 다운로드 링크 표시 |
| Pack Repository 화면 | 프로젝트별 Export 이력, 검증 상태, ZIP 다운로드 링크 표시 |

현재 검증 결과는 다음과 같다.

| 검증 항목 | 결과 |
|---|---|
| Backend 테스트 | `test_intent_factory_*`, `test_pack_export_service.py`, Runtime 관련 테스트 통과 |
| Frontend 빌드 | `npm run build` 통과 |
| Loader 호환성 | Export된 Pack 디렉터리가 `IntentPackLoader` 검증 통과 |
| ZIP 구조 | ZIP 안에 `manifest/pack_manifest.json`, `nlu/intents.json` 등 표준 파일 포함 확인 |

잔여 리스크는 다음과 같다.

| 리스크 | 후속 방향 |
|---|---|
| Pack 승인 상태 없음 | 검수/승인/반려 Workflow와 승인자 이력 추가 |
| 고객 내부망 Import/Rollback 미구현 | ZIP 업로드, 검증, Active 전환, Rollback 기능 구현 |
| Runtime Active Pack 미연결 | Export된 Pack을 Runtime 후보로 등록하고 Pack Resolver와 연결 |
| Action 상세 파일 제한 | API Mapping, SQL Template, Screen Route 관리 DB 확장 필요 |

## 9. 다음 단계

이번 구현 이후 다음 단계를 순차적으로 진행한다.

1. Pack Import/Rollback 운영 화면과 API를 구현한다.
2. Export된 Pack ZIP을 고객 내부망 Runtime 후보로 등록하는 Pack Store 구조를 구현한다.
3. Active Pack 전환과 직전 버전 Rollback 정책을 구현한다.
4. Pack 승인 Workflow와 감사 로그를 추가한다.
5. API Mapping, SQL Template, Screen Route 관리 DB와 화면을 확장한다.
6. Runtime API의 응답 Envelope를 운영 로그 및 통계 모델과 연결한다.
7. 고객 권한 체계와 Action 실행 권한 검증 방식을 구체화한다.
8. `QUERY` Action을 실제 고객 DB 또는 내부 API와 연결하기 위한 보안 설계를 작성한다.
9. 미응답 로그를 Intent 개선 요청과 Pack 재빌드 흐름으로 연결한다.
10. 운영 모니터링, 감사 로그, 품질 검증 지표를 대시보드 요구사항으로 확장한다.
