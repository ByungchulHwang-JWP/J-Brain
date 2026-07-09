# 12. Intent Pack 표준 정의서

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | Intent Pack 표준 정의서 |
| 작성일 | 2026-06-24 |
| 버전 | v0.1 |
| 목적 | 폐쇄망 대응형 Lightweight NLU 기반 챗봇 플랫폼에서 각 서비스별 Intent, Entity, Action, SQL Template, 화면 경로, 답변 템플릿을 표준 패키지 형태로 정의하기 위한 기준 수립 |
| 적용 대상 | 탄소중립플랫폼, 광고 플랫폼, 한도 관리 시스템 등 챗봇 플랫폼 적용 대상 서비스 |

---

## 2. 정의

### 2.1 Intent Pack
Intent Pack은 특정 서비스의 사용자 질문을 업무 기능으로 연결하기 위한 설정 데이터 묶음이다.

공통 플랫폼은 NLU Engine, Intent Matcher, Entity Extractor, Action Runtime, SQL Template Runtime, Package Importer를 제공하고, 각 서비스는 별도 Intent Pack을 통해 업무별 Intent와 실행 방식을 정의한다.

```text
공통 Lightweight NLU / Action 플랫폼
 ├─ 탄소중립플랫폼 Intent Pack
 ├─ 광고 플랫폼 Intent Pack
 ├─ 한도 관리 시스템 Intent Pack
 └─ 기타 서비스 Intent Pack
```

### 2.2 공통 영역과 서비스별 영역
| 구분 | 공통화 여부 | 설명 |
|---|---:|---|
| NLU Engine | 공통 | 질문 전처리, Intent 후보 매칭, Confidence 산정 |
| Entity Extractor 구조 | 공통 | Entity 추출 프레임워크 및 검증 방식 |
| Action Runtime | 공통 | Action 유형별 실행, 권한 검증, 감사 로그 |
| SQL Template Runtime | 공통 | 승인된 SQL Template 실행, Parameter Binding |
| Package Import/Validation/Rollback | 공통 | 폐쇄망 반입 패키지 검증, 적용, 복구 |
| Intent 목록 | 서비스별 | 서비스 업무에 맞는 사용자 의도 목록 |
| Entity Dictionary | 서비스별 | 서비스 업무 용어, 동의어, 코드값 |
| Action Registry | 서비스별 | Intent와 실제 실행 기능 매핑 |
| SQL Template | 서비스별 | 서비스 DB/API 정책에 맞는 승인 조회 템플릿 |
| Screen Routes | 서비스별 | 서비스 화면 메뉴 ID, URL, 라우팅 경로 |
| FAQ/Document Index | 서비스별 | 서비스 지식 문서, FAQ, 매뉴얼 |

---

## 3. Intent Pack 구성 원칙

### 3.1 기본 원칙
| 원칙 | 설명 |
|---|---|
| 서비스 단위 격리 | Intent Pack은 `workspace_id` 또는 `service_id` 단위로 분리한다. |
| 버전 관리 | 운영 반영 단위는 Pack 버전으로 관리한다. 예: `netzero-intent-pack-v0.1.0` |
| 선언형 설정 | Intent, Entity, Action, SQL, Route는 가능한 JSON/YAML 기반 선언형 데이터로 관리한다. |
| 실행 통제 | 자연어 질문에서 SQL이나 Action을 직접 생성하지 않고 등록된 Action/Template만 실행한다. |
| 폐쇄망 반입 가능 | 모든 구성 파일은 Manifest, Checksum, Signature 검증 대상이 되어야 한다. |
| 롤백 가능 | 신규 Pack 적용 실패 또는 품질 저하 시 이전 버전으로 복구 가능해야 한다. |

### 3.2 Intent 상태 관리
| 상태 | 의미 | 운영 기준 |
|---|---|---|
| `candidate` | 후보 Intent | 업무 검토 또는 질문 수집 단계 |
| `mvp` | 1차 MVP 적용 대상 | PoC 및 초기 운영 반영 대상 |
| `active` | 운영 적용 | 운영 환경에서 매칭 및 실행 가능 |
| `hold` | 보류 | 필요성은 있으나 정책/연계/API 미확정 |
| `excluded` | 제외 | 챗봇 처리 대상에서 제외 |
| `deprecated` | 폐기 예정 | 기존 운영 중이나 신규 버전에서 제거 예정 |

---

## 4. 표준 패키지 구조

```text
service_intent_pack/
 ├─ manifest/
 │  ├─ pack_manifest.json
 │  ├─ checksum.sha256
 │  └─ package_signature.sig
 ├─ profile/
 │  └─ service_profile.json
 ├─ nlu/
 │  ├─ intents.json
 │  ├─ intent_examples.json
 │  ├─ entities.json
 │  ├─ entity_synonyms.json
 │  └─ confidence_policy.json
 ├─ action/
 │  ├─ action_registry.json
 │  ├─ action_parameters.json
 │  ├─ sql_templates.json
 │  ├─ api_mappings.json
 │  └─ screen_routes.json
 ├─ knowledge/
 │  ├─ faqs.json
 │  ├─ approved_documents.json
 │  └─ metadata_policy.json
 ├─ templates/
 │  ├─ response_templates.json
 │  ├─ card_templates.json
 │  └─ fallback_templates.json
 └─ validation/
    ├─ validation_questions.json
    ├─ expected_results.json
    └─ acceptance_criteria.json
```

---

## 5. 구성 파일 정의

### 5.1 `service_profile.json`
서비스의 기본 정보와 Pack 적용 범위를 정의한다.

| 필드 | 필수 | 설명 | 예시 |
|---|:---:|---|---|
| `service_id` | O | 서비스 식별자 | `NETZERO` |
| `service_name` | O | 서비스명 | `탄소중립플랫폼` |
| `pack_id` | O | Pack 고유 ID | `netzero-intent-pack` |
| `pack_version` | O | Pack 버전 | `0.1.0` |
| `target_environment` | O | 적용 환경 | `closed-network` |
| `owner` | O | 업무/운영 책임자 | `탄소중립플랫폼 운영팀` |
| `description` | N | 설명 | `탄소중립 업무 Intent Pack` |

예시:

```json
{
  "service_id": "NETZERO",
  "service_name": "탄소중립플랫폼",
  "pack_id": "netzero-intent-pack",
  "pack_version": "0.1.0",
  "target_environment": "closed-network",
  "owner": "탄소중립플랫폼 운영팀",
  "description": "탄소중립플랫폼 1차 MVP Intent Pack"
}
```

### 5.2 `intents.json`
Intent 기본 정보를 정의한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `intent_id` | O | Intent 고유 ID |
| `intent_name` | O | Intent 명 |
| `description` | O | Intent 목적 |
| `category` | O | `query`, `navigate`, `search_doc`, `download`, `guide`, `error_help`, `fallback` |
| `status` | O | `candidate`, `mvp`, `active`, `hold`, `excluded`, `deprecated` |
| `required_entities` | O | 실행에 필요한 필수 Entity |
| `optional_entities` | N | 선택 Entity |
| `action_id` | N | 연결 Action ID |
| `auto_execute` | O | 자동 실행 가능 여부 |
| `confirmation_required` | O | 사용자 확인 필요 여부 |
| `risk_level` | O | `low`, `medium`, `high` |

예시:

```json
{
  "intent_id": "INT-NZ-EMI-001",
  "intent_name": "공장별 탄소 배출량 조회",
  "description": "공장과 기간 조건을 기준으로 탄소 배출량을 조회한다.",
  "category": "query",
  "status": "mvp",
  "required_entities": ["factory", "period"],
  "optional_entities": ["scope", "metric"],
  "action_id": "ACT-NZ-QUERY-EMISSION",
  "auto_execute": false,
  "confirmation_required": true,
  "risk_level": "medium"
}
```

### 5.3 `intent_examples.json`
Intent별 예상 질문을 정의한다. Intent 매칭 품질은 예시 질문의 다양성에 직접 영향을 받으므로 실제 사용자 표현을 우선 수집한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `example_id` | O | 예시 고유 ID |
| `intent_id` | O | 연결 Intent ID |
| `text` | O | 사용자 질문 예시 |
| `entities` | N | 문장 내 Entity 라벨링 |
| `source` | O | `pm_draft`, `business_user`, `log`, `test_set` |
| `is_validation` | O | 검증 질문셋 포함 여부 |

### 5.4 `entities.json`
서비스별 Entity 유형과 검증 규칙을 정의한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `entity_type` | O | Entity 유형 |
| `display_name` | O | 표시명 |
| `value_type` | O | `string`, `date`, `date_range`, `number`, `enum`, `code` |
| `required_validation` | O | 유효성 검증 필요 여부 |
| `normalization_rule` | N | 정규화 규칙 |
| `description` | N | 설명 |

### 5.5 `entity_synonyms.json`
동의어와 표준값을 정의한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `entity_type` | O | Entity 유형 |
| `canonical_value` | O | 표준값 |
| `synonyms` | O | 동의어 목록 |
| `code` | N | 내부 코드 |
| `is_active` | O | 사용 여부 |

### 5.6 `confidence_policy.json`
Intent 매칭 신뢰도별 처리 방식을 정의한다.

| 구간 | 기본 기준 | 처리 방식 |
|---|---:|---|
| High | 0.85 이상 | Intent 확정 후 Action 실행 또는 답변 |
| Medium | 0.65 이상 0.85 미만 | 후보 Intent 2~3개 제시 후 사용자 선택 |
| Low | 0.45 이상 0.65 미만 | FAQ/문서 검색 Fallback |
| Very Low | 0.45 미만 | 미응답 질문 등록 및 보완 요청 |

서비스별 업무 리스크에 따라 임계값은 조정할 수 있다. 조회/다운로드/등록 Action은 문서 안내보다 높은 임계값을 적용한다.

### 5.7 `action_registry.json`
Intent와 실제 실행 기능을 매핑한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `action_id` | O | Action 고유 ID |
| `action_name` | O | Action 명 |
| `action_type` | O | `QUERY`, `DOWNLOAD`, `NAVIGATE`, `SEARCH_DOC`, `SHOW_FAQ`, `CREATE_REQUEST`, `GUIDE` |
| `description` | O | 설명 |
| `execution_mode` | O | `sql_template`, `internal_api`, `route`, `search`, `template` |
| `permission_policy` | O | 권한 검증 정책 ID |
| `audit_required` | O | 감사 로그 저장 여부 |
| `enabled` | O | 사용 여부 |

### 5.8 `action_parameters.json`
Action 실행에 필요한 파라미터를 정의한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `action_id` | O | 연결 Action ID |
| `parameter_name` | O | 파라미터명 |
| `entity_type` | O | 매핑 Entity |
| `required` | O | 필수 여부 |
| `default_policy` | N | 기본값 정책 |
| `validation_rule` | N | 검증 규칙 |

### 5.9 `sql_templates.json`
승인된 SQL Template을 정의한다. 자연어 질문으로 SQL을 생성하지 않는다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `template_id` | O | SQL Template ID |
| `action_id` | O | 연결 Action ID |
| `template_name` | O | 템플릿명 |
| `sql` | O | Parameter Binding 기반 SQL |
| `allowed_roles` | O | 실행 가능 권한 |
| `max_rows` | O | 최대 조회 건수 |
| `masking_policy` | N | 결과 마스킹 정책 |
| `enabled` | O | 사용 여부 |

### 5.10 `screen_routes.json`
화면 이동 Action에서 사용할 메뉴/화면 경로를 정의한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `route_id` | O | 화면 경로 ID |
| `action_id` | O | 연결 Action ID |
| `menu_name` | O | 메뉴명 |
| `route_type` | O | `menu_id`, `url`, `deep_link` |
| `route_value` | O | 메뉴 ID 또는 URL |
| `required_role` | N | 필요 권한 |

### 5.11 `response_templates.json`
Action 결과 또는 검색 결과를 사용자에게 보여줄 답변 템플릿을 정의한다.

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `template_id` | O | 답변 템플릿 ID |
| `action_id` | N | 연결 Action ID |
| `card_type` | O | `data`, `guide`, `document`, `navigation`, `download`, `fallback` |
| `title` | O | 카드 제목 |
| `body_template` | O | 본문 템플릿 |
| `evidence_required` | O | 근거 표시 필요 여부 |

---

## 6. 처리 흐름

```text
사용자 질문
 → Query Preprocessor
 → 서비스 식별(workspace_id/service_id)
 → 해당 서비스 Intent Pack 로드
 → Intent Matcher
 → Entity Extractor
 → Slot Filling
 → Confidence 판단
 → Intent Router
    ├─ QUERY/DOWNLOAD: 권한 검증 → SQL/API 실행 → 결과 카드
    ├─ NAVIGATE: 화면 경로 조회 → 이동 버튼
    ├─ SEARCH_DOC/SHOW_FAQ: FAQ/문서 검색 → 근거 카드
    ├─ GUIDE: 절차 템플릿 답변
    └─ Fallback: 후보 제시 또는 미응답 등록
```

---

## 7. Pack 검증 기준

| 검증 항목 | 기준 |
|---|---|
| Manifest 검증 | 모든 파일 목록, 버전, 해시가 일치해야 한다. |
| Schema 검증 | 각 JSON 파일은 표준 Schema를 통과해야 한다. |
| 참조 무결성 | `intent_id`, `action_id`, `template_id`, `route_id` 참조가 모두 유효해야 한다. |
| Entity 검증 | 필수 Entity가 Action Parameter와 연결되어야 한다. |
| SQL 검증 | SQL Template은 Allowlist, Parameter Binding, 권한 조건을 포함해야 한다. |
| 화면 경로 검증 | Route 값은 고객 시스템의 메뉴 ID 또는 URL과 매핑되어야 한다. |
| 질문셋 검증 | Validation Questions 기준 Intent/Entity 예상 결과가 정의되어야 한다. |
| 롤백 검증 | 이전 Pack 버전으로 복구 가능한지 확인해야 한다. |

---

## 8. 운영 및 변경 관리

### 8.1 버전 규칙
| 변경 유형 | 버전 증가 | 예시 |
|---|---|---|
| Major | `1.0.0` | Pack 구조 변경, 호환성 깨짐 |
| Minor | `0.2.0` | Intent/Action 추가 |
| Patch | `0.1.1` | 예시 질문, 동의어, 템플릿 보정 |

### 8.2 변경 승인 기준
| 변경 대상 | 승인 주체 | 검증 항목 |
|---|---|---|
| Intent 추가/변경 | 업무 담당자, PM | 질문 예시, Action 매핑, 테스트 질문 |
| Entity 추가/변경 | 업무 담당자, BA | 표준값, 동의어, 중복 여부 |
| Action 추가/변경 | PM, TA, 보안 담당 | 권한, 실행 방식, 감사 로그 |
| SQL Template 추가/변경 | DBA, 보안 담당 | Allowlist, Binding, 접근 범위 |
| 화면 Route 변경 | 서비스 담당자 | 메뉴 ID, 권한, 이동 가능 여부 |

---

## 9. 1차 MVP 적용 원칙

1차 MVP에서는 모든 서비스의 Intent를 확정하지 않는다. 탄소중립플랫폼을 기준 서비스로 삼아 Intent Pack 표준 구조를 검증하고, 광고 플랫폼/한도 관리 시스템 등은 동일 구조로 확장 적용한다.

1차 MVP 범위는 다음을 우선한다.

| 우선순위 | 범위 | 설명 |
|---|---|---|
| 1 | 문서/FAQ 안내 | 산정 기준, 사용 방법, 용어 설명 |
| 2 | 화면 이동 안내 | 주요 메뉴 위치, 입력/보고서 화면 이동 |
| 3 | 조회형 Action 일부 | 권한 확인 가능한 데이터 조회 |
| 4 | 다운로드 Action | 보안 정책 확인 후 제한 적용 |
| 5 | 등록/수정/삭제 Action | 1차 MVP 제외 또는 보류 |

---

## 10. 후속 과제

| 과제 | 설명 |
|---|---|
| JSON Schema 정의 | 각 구성 파일의 기계 검증용 Schema 작성 |
| Pack Builder 구현 | 서비스별 Pack을 생성하고 Manifest/Checksum을 산출하는 도구 개발 |
| Pack Importer 구현 | 폐쇄망 운영 환경에서 Pack 검증 후 반영하는 기능 개발 |
| Pack Rollback 구현 | 이전 버전 복구 및 적용 이력 관리 |
| 탄소중립 Pack v0.1 검증 | 탄소중립플랫폼 기준 질문셋으로 Intent/Entity 품질 검증 |
