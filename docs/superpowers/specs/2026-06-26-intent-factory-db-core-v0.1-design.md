# JWP Intent Factory DB Core v0.1 설계서

## 1. 목적

본 설계서는 JWP Intent Factory를 JSON Pack 수동 관리 구조에서 DB 기반 관리 구조로 전환하기 위한 1차 범위를 정의한다.

이번 단계의 목표는 전체 Intent Factory CRUD를 한 번에 완성하는 것이 아니라, 실서비스에 필요한 가장 얇은 세로 흐름을 먼저 만드는 것이다.

```text
Intent 등록
-> 예시 질문 등록
-> Action 연결
-> Source 검색 범위 지정
-> 화면에서 조회/수정
-> 이후 Pack Builder가 이 데이터를 Pack으로 빌드
```

## 2. 확정 범위

이번 v0.1에 포함하는 범위는 다음과 같다.

- Intent 관리 CRUD
- Intent 예시 질문 관리
- Intent와 Action 연결
- Intent별 Source 검색 범위 관리
- 기존 JSON Pack에서 Intent/Example/Action 후보를 DB로 가져오는 Import 초안
- Intent 관리 화면의 목록/상세/등록/수정/삭제 1차

이번 v0.1에서 제외하는 범위는 다음과 같다.

- Entity CRUD 전체
- Synonym CRUD 전체
- FAQ CRUD 전체
- Action 상세 CRUD 전체
- Pack Builder 완성
- Pack ZIP 생성
- Runtime이 DB를 직접 읽는 구조 전환
- 배포 승인 워크플로우
- 고객 내부망 Import UI

## 3. 핵심 설계 원칙

Runtime은 DB를 직접 실행 데이터로 사용하지 않는다.

관리 DB는 Intent Factory 운영자가 Intent와 연결 정보를 편집하는 공간이고, Runtime은 검증된 Pack을 실행한다.

```text
관리 DB
-> Pack Builder
-> 검증된 Intent Pack
-> 고객 내부망 Runtime
```

이 원칙을 유지해야 버전 관리, 검증, 롤백, 폐쇄망 배포가 가능하다.

## 4. Source와 Intent의 관계

Source는 고객 문서, 매뉴얼, 정책, FAQ 등 지식 원천이다.

Intent는 사용자의 질문이 어떤 업무 의도인지 정의한다.

Intent는 Source를 직접 소유하지 않고 검색 범위 정책으로 참조한다.

```text
Intent
-> Action
-> SEARCH_DOC인 경우 Source Search Scope 참조
-> Vector Search
```

예시는 다음과 같다.

```text
사용자 질문: Scope 1 기준 알려줘
Intent: INT-NZ-SCOPE1-GUIDE
Action: SEARCH_DOC
Source 검색 범위:
  project_id = netzero
  tags = scope1, 온실가스, 산정기준
  status = completed
  top_k = 5
```

## 5. 데이터 모델 초안

### 5.1 intent_definitions

Intent의 기본 정보를 저장한다.

| 컬럼 | 설명 |
|---|---|
| id | 내부 PK |
| project_id | 프로젝트 식별자 |
| intent_id | Pack에 들어갈 Intent ID |
| intent_name | Intent 이름 |
| description | 설명 |
| category | NAVIGATION, SEARCH_DOC, QUERY, GUIDE 등 |
| action_id | 연결 Action ID |
| status | draft, active, archived |
| priority | 동일 점수 보정용 우선순위 |
| created_at | 생성일 |
| updated_at | 수정일 |

### 5.2 intent_examples

Intent 매칭에 사용할 예시 질문을 저장한다.

| 컬럼 | 설명 |
|---|---|
| id | 내부 PK |
| intent_id | intent_definitions.intent_id |
| example_text | 예시 질문 |
| normalized_text | 정규화 텍스트 |
| is_active | 사용 여부 |
| created_at | 생성일 |
| updated_at | 수정일 |

### 5.3 intent_action_links

Intent와 Action 연결 정보를 저장한다.

| 컬럼 | 설명 |
|---|---|
| id | 내부 PK |
| project_id | 프로젝트 식별자 |
| intent_id | Intent ID |
| action_id | Action ID |
| action_type | NAVIGATE, SEARCH_DOC, QUERY, GUIDE |
| is_primary | 대표 Action 여부 |
| created_at | 생성일 |
| updated_at | 수정일 |

### 5.4 intent_source_scopes

SEARCH_DOC Intent가 검색할 Source 범위를 저장한다.

| 컬럼 | 설명 |
|---|---|
| id | 내부 PK |
| project_id | 프로젝트 식별자 |
| intent_id | Intent ID |
| source_category | Source category |
| source_status | completed, success 등 |
| document_types | JSON array |
| tags | JSON array |
| top_k | 검색 결과 수 |
| score_threshold | 최소 점수 |
| created_at | 생성일 |
| updated_at | 수정일 |

## 6. Backend API 초안

### 6.1 Intent 목록

```text
GET /api/v1/intent-factory/projects/{project_id}/intents
```

반환:

```json
{
  "project_id": "J-Brain",
  "items": [
    {
      "intent_id": "INT-JB-NAV-DASHBOARD",
      "intent_name": "운영 현황 화면 이동",
      "category": "NAVIGATION",
      "action_id": "ACT-JB-NAV-DASHBOARD",
      "example_count": 3,
      "has_source_scope": false,
      "status": "active"
    }
  ]
}
```

### 6.2 Intent 상세

```text
GET /api/v1/intent-factory/projects/{project_id}/intents/{intent_id}
```

반환:

```json
{
  "intent_id": "INT-NZ-SCOPE1-GUIDE",
  "intent_name": "Scope 1 기준 안내",
  "category": "SEARCH_DOC",
  "action_id": "ACT-NZ-SEARCH-DOC",
  "examples": [
    "Scope 1 기준 알려줘"
  ],
  "source_scope": {
    "source_category": "netzero",
    "source_status": "completed",
    "document_types": ["manual", "faq"],
    "tags": ["scope1", "온실가스"],
    "top_k": 5,
    "score_threshold": 0.65
  }
}
```

### 6.3 Intent 생성

```text
POST /api/v1/intent-factory/projects/{project_id}/intents
```

요청:

```json
{
  "intent_id": "INT-NZ-SCOPE1-GUIDE",
  "intent_name": "Scope 1 기준 안내",
  "description": "Scope 1 산정 기준 문서를 검색한다.",
  "category": "SEARCH_DOC",
  "action_id": "ACT-NZ-SEARCH-DOC",
  "examples": ["Scope 1 기준 알려줘"],
  "source_scope": {
    "source_category": "netzero",
    "source_status": "completed",
    "document_types": ["manual"],
    "tags": ["scope1"],
    "top_k": 5,
    "score_threshold": 0.65
  }
}
```

### 6.4 Intent 수정

```text
PUT /api/v1/intent-factory/projects/{project_id}/intents/{intent_id}
```

### 6.5 Intent 삭제

```text
DELETE /api/v1/intent-factory/projects/{project_id}/intents/{intent_id}
```

삭제는 물리 삭제보다 `status = archived`를 우선한다.

### 6.6 JSON Pack Import 초안

```text
POST /api/v1/intent-factory/projects/{project_id}/import-pack
```

요청:

```json
{
  "pack_id": "netzero-intent-pack-v0.1.0",
  "pack_version": "0.1.0",
  "overwrite": false
}
```

동작:

- Pack JSON을 읽는다.
- Intent를 `intent_definitions`에 저장한다.
- 예시 질문을 `intent_examples`에 저장한다.
- Action 연결을 `intent_action_links`에 저장한다.
- SEARCH_DOC Intent는 기본 Source 검색 범위 초안을 생성한다.

## 7. Frontend 화면 초안

### 7.1 Intent 목록

경로:

```text
/admin/intent-factory/intents
```

표시 항목:

- Intent ID
- Intent 이름
- Category
- Action ID
- 예시 질문 수
- Source 검색 범위 여부
- 상태
- 관리 버튼

주요 기능:

- 프로젝트 선택
- Intent 검색
- Category 필터
- 상태 필터
- Intent 등록 버튼
- Pack Import 버튼

### 7.2 Intent 상세/편집

경로:

```text
/admin/intent-factory/intents/:intentId
```

영역:

- 기본 정보
- 예시 질문
- Action 연결
- Source 검색 범위
- 변경 저장
- 비활성화

SEARCH_DOC가 아닌 Intent에서는 Source 검색 범위 영역을 읽기 전용 안내로 표시한다.

## 8. 테스트 전략

Backend 테스트:

- Intent 생성
- Intent 목록 조회
- Intent 상세 조회
- Intent 수정
- Intent archive 삭제
- 예시 질문 저장
- Source 검색 범위 저장
- Pack Import 실행
- 중복 intent_id 처리

Frontend 테스트:

- Intent 목록 화면 build
- API 응답 렌더링
- SEARCH_DOC Intent의 Source Scope 표시
- 등록/수정 폼 상태 처리

계약 테스트:

- 메뉴 `Intent 관리` URL과 React Route 일치
- API 응답 필드와 화면 표시 필드 일치
- Pack Import 후 Intent Matcher 입력 데이터로 변환 가능한 구조인지 검증

## 9. 구현 순서

1. DB DDL 또는 idempotent migration 스크립트를 작성한다.
2. Intent Factory DB 모델/API를 추가한다.
3. JSON Pack Import 서비스를 추가한다.
4. Intent 관리 화면을 목록형 화면으로 교체한다.
5. Intent 상세/등록/수정 화면을 추가한다.
6. Source 검색 범위 UI를 연결한다.
7. 테스트를 추가한다.
8. 기존 Runtime과 Pack Loader에는 영향을 주지 않는지 확인한다.

## 10. 다음 작업 프롬프트

```text
$superpowers:writing-plans

docs/superpowers/specs/2026-06-26-intent-factory-db-core-v0.1-design.md 설계서를 기준으로 JWP Intent Factory DB Core v0.1 구현 계획서를 작성해 주세요.

목표:
1. Intent 관리 CRUD를 DB 기반으로 전환합니다.
2. Intent Example 관리 기능을 포함합니다.
3. Intent와 Action 연결 정보를 관리합니다.
4. SEARCH_DOC Intent에 대해 Source 검색 범위 정책을 저장하고 조회할 수 있게 합니다.
5. 기존 JSON Intent Pack을 DB로 가져오는 Import 기능 초안을 제공합니다.
6. Runtime은 아직 DB를 직접 읽지 않고, 기존 Pack 기반 Runtime 구조를 유지합니다.

구현 범위:
- Backend DB migration 또는 idempotent table creation
- Backend API: list/detail/create/update/archive/import-pack
- Backend service: JSON Pack -> DB import
- Frontend: Intent 목록 화면
- Frontend: Intent 상세/등록/수정 화면
- Frontend: Source 검색 범위 설정 UI
- Tests: backend unittest, frontend build, API 계약 테스트

제외 범위:
- Entity CRUD
- Synonym CRUD
- FAQ CRUD
- Action 상세 CRUD
- Pack Builder 완성
- Runtime DB 직접 연동
- Pack ZIP 배포

완료 후:
- 다음 구현 프롬프트를 생성해 주세요.
- 화면 테스트 방법을 한글로 안내해 주세요.
```
