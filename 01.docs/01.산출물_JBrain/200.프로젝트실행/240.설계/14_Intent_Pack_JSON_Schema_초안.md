# 14. Intent Pack JSON Schema 초안

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | Intent Pack JSON Schema 초안 |
| 작성일 | 2026-06-24 |
| 버전 | v0.1 |
| 작성 관점 | Backend |
| 목적 | Intent Pack 구성 파일을 기계적으로 검증하기 위한 JSON Schema 초안 정의 |
| 기준 문서 | 12_Intent_Pack_표준정의서.md, 13_탄소중립플랫폼_Intent_Pack_v0.1.md, 15_탄소중립_표준질문셋_v0.2.md |

---

## 2. 설계 원칙

Intent Pack은 폐쇄망 반입 및 서비스별 확장을 고려하여 JSON 기반 선언형 설정으로 관리한다. 본 문서는 Pack Validator, Pack Importer, Pack Builder 개발 시 사용할 JSON Schema 초안이다.

| 원칙 | 설명 |
|---|---|
| Schema Draft | JSON Schema Draft 2020-12 기준으로 작성한다. |
| 파일 단위 검증 | 각 구성 파일은 독립 Schema로 구조와 타입을 검증한다. |
| Pack 단위 검증 | 파일 간 참조 무결성은 별도 Pack Validator에서 검증한다. |
| 명시적 Enum | Intent 유형, 상태, Action 유형 등은 enum으로 제한한다. |
| 추가 필드 제한 | 기본적으로 `additionalProperties: false`를 적용한다. |
| 버전 호환성 | `schema_version` 필드를 두어 향후 변경에 대응한다. |
| 폐쇄망 대응 | 외부 URL 참조 없이 로컬 Schema 번들로 검증 가능해야 한다. |

---

## 3. 공통 타입 및 Enum

### 3.1 공통 ID 패턴
| 구분 | 패턴 | 예시 |
|---|---|---|
| Service ID | `^[A-Z][A-Z0-9_]{1,30}$` | `NETZERO` |
| Intent ID | `^INT-[A-Z0-9]+-[A-Z0-9]+-[0-9]{3}$` | `INT-NZ-QUERY-001` |
| Action ID | `^ACT-[A-Z0-9]+-[A-Z0-9-]+$` | `ACT-NZ-QUERY-EMISSION` |
| Template ID | `^(SQL|RSP|CARD|FBK)-[A-Z0-9]+-[A-Z0-9-]+$` | `SQL-NZ-EMISSION-001` |
| Route ID | `^RTE-[A-Z0-9]+-[A-Z0-9-]+$` | `RTE-NZ-REPORT` |
| Question ID | `^VQ-[A-Z0-9]+-[0-9]{3}$` | `VQ-NZ-027` |

### 3.2 공통 Enum
| 이름 | 값 |
|---|---|
| `target_environment` | `local`, `dev`, `staging`, `production`, `closed-network` |
| `intent_category` | `query`, `navigate`, `search_doc`, `download`, `guide`, `error_help`, `fallback` |
| `intent_status` | `candidate`, `mvp`, `active`, `hold`, `excluded`, `deprecated` |
| `risk_level` | `low`, `medium`, `high` |
| `value_type` | `string`, `date`, `date_range`, `number`, `enum`, `code`, `boolean`, `object` |
| `action_type` | `QUERY`, `DOWNLOAD`, `NAVIGATE`, `SEARCH_DOC`, `SHOW_FAQ`, `CREATE_REQUEST`, `GUIDE` |
| `execution_mode` | `sql_template`, `internal_api`, `route`, `search`, `template`, `mock` |
| `route_type` | `menu_id`, `url`, `deep_link` |
| `question_source` | `pm_draft`, `ba_draft`, `business_user`, `log`, `test_set`, `generated` |
| `expected_route` | `document_search`, `navigation`, `guide_template`, `query_mock_action`, `candidate`, `error_help`, `unanswered_logging`, `fallback` |
| `priority` | `P0`, `P1`, `P2` |

---

## 4. Pack 파일 구조

본 Schema 초안은 아래 파일을 1차 대상으로 한다.

```text
service_intent_pack/
 ├─ profile/service_profile.json
 ├─ nlu/intents.json
 ├─ nlu/intent_examples.json
 ├─ nlu/entities.json
 ├─ nlu/entity_synonyms.json
 ├─ action/action_registry.json
 ├─ action/action_parameters.json
 ├─ action/sql_templates.json
 ├─ action/screen_routes.json
 └─ validation/validation_questions.json
```

---

## 5. `service_profile.json` Schema

### 5.1 목적
서비스와 Pack의 기본 정보를 정의한다.

### 5.2 필수 필드
| 필드 | 타입 | 필수 | 설명 |
|---|---|:---:|---|
| `schema_version` | string | O | Schema 버전 |
| `service_id` | string | O | 서비스 식별자 |
| `service_name` | string | O | 서비스명 |
| `pack_id` | string | O | Pack ID |
| `pack_version` | string | O | SemVer 형식 버전 |
| `target_environment` | string | O | 적용 환경 |
| `owner` | string | O | 소유/관리 주체 |
| `description` | string | N | 설명 |

### 5.3 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "service_profile.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "service_name", "pack_id", "pack_version", "target_environment", "owner"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "service_name": { "type": "string", "minLength": 1, "maxLength": 100 },
    "pack_id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{2,80}$" },
    "pack_version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
    "target_environment": { "type": "string", "enum": ["local", "dev", "staging", "production", "closed-network"] },
    "owner": { "type": "string", "minLength": 1, "maxLength": 100 },
    "description": { "type": "string", "maxLength": 500 }
  }
}
```

---

## 6. `intents.json` Schema

### 6.1 목적
서비스별 Intent 기본 정보를 정의한다.

### 6.2 파일 구조
```json
{
  "schema_version": "0.1",
  "service_id": "NETZERO",
  "items": []
}
```

### 6.3 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "intents.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "intent_id",
          "intent_name",
          "description",
          "category",
          "status",
          "required_entities",
          "optional_entities",
          "action_id",
          "auto_execute",
          "confirmation_required",
          "risk_level"
        ],
        "properties": {
          "intent_id": { "type": "string", "pattern": "^INT-[A-Z0-9]+-[A-Z0-9]+-[0-9]{3}$" },
          "intent_name": { "type": "string", "minLength": 1, "maxLength": 100 },
          "description": { "type": "string", "minLength": 1, "maxLength": 500 },
          "category": { "type": "string", "enum": ["query", "navigate", "search_doc", "download", "guide", "error_help", "fallback"] },
          "status": { "type": "string", "enum": ["candidate", "mvp", "active", "hold", "excluded", "deprecated"] },
          "required_entities": { "type": "array", "items": { "type": "string" }, "uniqueItems": true },
          "optional_entities": { "type": "array", "items": { "type": "string" }, "uniqueItems": true },
          "action_id": { "type": ["string", "null"], "pattern": "^ACT-[A-Z0-9]+-[A-Z0-9-]+$" },
          "auto_execute": { "type": "boolean" },
          "confirmation_required": { "type": "boolean" },
          "risk_level": { "type": "string", "enum": ["low", "medium", "high"] }
        }
      }
    }
  }
}
```

### 6.4 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Intent ID 중복 금지 | `items[*].intent_id`는 Pack 내 유일해야 한다. |
| Entity 참조 검증 | `required_entities`, `optional_entities`는 `entities.json`에 정의되어야 한다. |
| Action 참조 검증 | `action_id`가 null이 아니면 `action_registry.json`에 존재해야 한다. |
| 고위험 자동 실행 제한 | `risk_level=high`이면 `auto_execute=false`여야 한다. |
| 제외 Intent 실행 금지 | `status=excluded`이면 `action_id=null` 또는 disabled Action이어야 한다. |

---

## 7. `intent_examples.json` Schema

### 7.1 목적
Intent별 예상 질문과 검증용 질문 예시를 정의한다.

### 7.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "intent_examples.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["example_id", "intent_id", "text", "entities", "source", "is_validation"],
        "properties": {
          "example_id": { "type": "string", "pattern": "^EX-[A-Z0-9]+-[0-9]{3,5}$" },
          "intent_id": { "type": "string", "pattern": "^INT-[A-Z0-9]+-[A-Z0-9]+-[0-9]{3}$" },
          "text": { "type": "string", "minLength": 2, "maxLength": 500 },
          "entities": {
            "type": "object",
            "additionalProperties": {
              "type": ["string", "number", "boolean", "array", "object", "null"]
            }
          },
          "source": { "type": "string", "enum": ["pm_draft", "ba_draft", "business_user", "log", "test_set", "generated"] },
          "is_validation": { "type": "boolean" }
        }
      }
    }
  }
}
```

### 7.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Intent 참조 검증 | `intent_id`는 `intents.json`에 존재해야 한다. |
| Entity Key 검증 | `entities`의 key는 `entities.json`의 `entity_type`이어야 한다. |
| Validation 질문 수 | PoC Pack은 `is_validation=true` 질문을 최소 30개 이상 포함해야 한다. |

---

## 8. `entities.json` Schema

### 8.1 목적
서비스별 Entity Type, 값 유형, 정규화/검증 규칙을 정의한다.

### 8.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "entities.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["entity_type", "display_name", "value_type", "required_validation"],
        "properties": {
          "entity_type": { "type": "string", "pattern": "^[a-z][a-z0-9_]{1,50}$" },
          "display_name": { "type": "string", "minLength": 1, "maxLength": 100 },
          "value_type": { "type": "string", "enum": ["string", "date", "date_range", "number", "enum", "code", "boolean", "object"] },
          "required_validation": { "type": "boolean" },
          "normalization_rule": { "type": ["string", "null"], "maxLength": 100 },
          "description": { "type": ["string", "null"], "maxLength": 500 }
        }
      }
    }
  }
}
```

### 8.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Entity Type 중복 금지 | `entity_type`은 Pack 내 유일해야 한다. |
| 정규화 규칙 존재 검증 | `normalization_rule` 값은 런타임에서 지원하는 규칙이어야 한다. |

---

## 9. `entity_synonyms.json` Schema

### 9.1 목적
Entity 표준값, 동의어, 내부 코드를 정의한다.

### 9.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "entity_synonyms.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["entity_type", "canonical_value", "synonyms", "is_active"],
        "properties": {
          "entity_type": { "type": "string", "pattern": "^[a-z][a-z0-9_]{1,50}$" },
          "canonical_value": { "type": "string", "minLength": 1, "maxLength": 200 },
          "synonyms": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": { "type": "string", "minLength": 1, "maxLength": 200 }
          },
          "code": { "type": ["string", "null"], "maxLength": 100 },
          "is_active": { "type": "boolean" }
        }
      }
    }
  }
}
```

### 9.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Entity 참조 검증 | `entity_type`은 `entities.json`에 존재해야 한다. |
| 동의어 중복 경고 | 동일 `entity_type` 안에서 같은 synonym이 다른 canonical value에 중복 매핑되면 경고한다. |
| 표준값 포함 권장 | `synonyms`에는 `canonical_value` 자체를 포함하는 것을 권장한다. |

---

## 10. `action_registry.json` Schema

### 10.1 목적
Intent와 연결되는 실제 실행 Action을 정의한다.

### 10.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "action_registry.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["action_id", "action_name", "action_type", "description", "execution_mode", "permission_policy", "audit_required", "enabled"],
        "properties": {
          "action_id": { "type": "string", "pattern": "^ACT-[A-Z0-9]+-[A-Z0-9-]+$" },
          "action_name": { "type": "string", "minLength": 1, "maxLength": 100 },
          "action_type": { "type": "string", "enum": ["QUERY", "DOWNLOAD", "NAVIGATE", "SEARCH_DOC", "SHOW_FAQ", "CREATE_REQUEST", "GUIDE"] },
          "description": { "type": "string", "minLength": 1, "maxLength": 500 },
          "execution_mode": { "type": "string", "enum": ["sql_template", "internal_api", "route", "search", "template", "mock"] },
          "permission_policy": { "type": "string", "minLength": 1, "maxLength": 100 },
          "audit_required": { "type": "boolean" },
          "enabled": { "type": "boolean" }
        }
      }
    }
  }
}
```

### 10.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Action ID 중복 금지 | `action_id`는 Pack 내 유일해야 한다. |
| 실행 방식 일관성 | `QUERY`는 `sql_template`, `internal_api`, `mock` 중 하나여야 한다. |
| 화면 이동 일관성 | `NAVIGATE`는 `route`여야 한다. |
| 보안 기본값 | `QUERY`, `DOWNLOAD`, `CREATE_REQUEST`는 `audit_required=true`여야 한다. |

---

## 11. `action_parameters.json` Schema

### 11.1 목적
Action 실행에 필요한 파라미터와 Entity 매핑을 정의한다.

### 11.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "action_parameters.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["action_id", "parameter_name", "entity_type", "required"],
        "properties": {
          "action_id": { "type": "string", "pattern": "^ACT-[A-Z0-9]+-[A-Z0-9-]+$" },
          "parameter_name": { "type": "string", "pattern": "^[a-z][a-z0-9_]{1,60}$" },
          "entity_type": { "type": "string", "pattern": "^[a-z][a-z0-9_]{1,50}$" },
          "required": { "type": "boolean" },
          "default_policy": { "type": ["string", "null"], "maxLength": 200 },
          "validation_rule": { "type": ["string", "null"], "maxLength": 200 }
        }
      }
    }
  }
}
```

### 11.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Action 참조 검증 | `action_id`는 `action_registry.json`에 존재해야 한다. |
| Entity 참조 검증 | `entity_type`은 `entities.json`에 존재해야 한다. |
| 필수 파라미터 검증 | Intent의 `required_entities`와 Action Parameter의 필수값이 충돌하지 않아야 한다. |

---

## 12. `sql_templates.json` Schema

### 12.1 목적
승인된 SQL Template과 실행 통제 정보를 정의한다.

### 12.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "sql_templates.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["template_id", "action_id", "template_name", "sql", "allowed_roles", "max_rows", "enabled"],
        "properties": {
          "template_id": { "type": "string", "pattern": "^SQL-[A-Z0-9]+-[A-Z0-9-]+$" },
          "action_id": { "type": "string", "pattern": "^ACT-[A-Z0-9]+-[A-Z0-9-]+$" },
          "template_name": { "type": "string", "minLength": 1, "maxLength": 100 },
          "sql": { "type": "string", "minLength": 10, "maxLength": 10000 },
          "allowed_roles": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": { "type": "string", "minLength": 1, "maxLength": 100 }
          },
          "max_rows": { "type": "integer", "minimum": 1, "maximum": 10000 },
          "masking_policy": { "type": ["string", "null"], "maxLength": 100 },
          "enabled": { "type": "boolean" }
        }
      }
    }
  }
}
```

### 12.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Action 참조 검증 | `action_id`는 QUERY/DOWNLOAD 계열 Action이어야 한다. |
| 읽기 전용 SQL | 1차 MVP에서는 `SELECT`만 허용한다. |
| 파라미터 바인딩 | 문자열 조합 SQL은 금지하고 `:parameter_name` 형식만 허용한다. |
| 위험 키워드 차단 | `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `EXEC` 포함 시 실패 처리한다. |
| 권한 조건 권장 | 조회 SQL은 사용자 권한 또는 조직/공장/현장 범위 조건을 포함해야 한다. |
| 최대 행 제한 | `max_rows`는 필수이며 운영 반영 전 기본 1000 이하를 권장한다. |

---

## 13. `screen_routes.json` Schema

### 13.1 목적
화면 이동 Action에서 사용할 메뉴 ID, URL, Deep Link 정보를 정의한다.

### 13.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "screen_routes.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["route_id", "action_id", "menu_name", "route_type", "route_value"],
        "properties": {
          "route_id": { "type": "string", "pattern": "^RTE-[A-Z0-9]+-[A-Z0-9-]+$" },
          "action_id": { "type": "string", "pattern": "^ACT-[A-Z0-9]+-[A-Z0-9-]+$" },
          "menu_name": { "type": "string", "minLength": 1, "maxLength": 100 },
          "route_type": { "type": "string", "enum": ["menu_id", "url", "deep_link"] },
          "route_value": { "type": "string", "minLength": 1, "maxLength": 500 },
          "required_role": { "type": ["string", "null"], "maxLength": 100 },
          "enabled": { "type": "boolean", "default": true }
        }
      }
    }
  }
}
```

### 13.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Action 참조 검증 | `action_id`는 `NAVIGATE` 유형이어야 한다. |
| URL 제한 | `route_type=url`이면 허용된 내부 도메인 또는 상대 경로만 허용한다. |
| 폐쇄망 링크 제한 | 외부 인터넷 URL은 폐쇄망 Pack에서 실패 처리한다. |

---

## 14. `validation_questions.json` Schema

### 14.1 목적
PoC 자동 검증용 질문, 기대 Intent, 기대 Entity, 기대 Route를 정의한다.

### 14.2 Schema 초안
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "validation_questions.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "service_id", "items"],
  "properties": {
    "schema_version": { "type": "string", "const": "0.1" },
    "service_id": { "type": "string", "pattern": "^[A-Z][A-Z0-9_]{1,30}$" },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["question_id", "query", "expected_intent_id", "expected_entities", "expected_route", "priority"],
        "properties": {
          "question_id": { "type": "string", "pattern": "^VQ-[A-Z0-9]+-[0-9]{3}$" },
          "query": { "type": "string", "minLength": 2, "maxLength": 500 },
          "expected_intent_id": { "type": "string", "pattern": "^INT-[A-Z0-9]+-[A-Z0-9]+-[0-9]{3}$" },
          "expected_entities": {
            "type": "object",
            "additionalProperties": {
              "type": ["string", "number", "boolean", "array", "object", "null"]
            }
          },
          "expected_route": {
            "type": "string",
            "enum": ["document_search", "navigation", "guide_template", "query_mock_action", "candidate", "error_help", "unanswered_logging", "fallback"]
          },
          "priority": { "type": "string", "enum": ["P0", "P1", "P2"] }
        }
      }
    }
  }
}
```

### 14.3 추가 검증 규칙
| 규칙 | 설명 |
|---|---|
| Intent 참조 검증 | `expected_intent_id`는 `intents.json`에 존재해야 한다. |
| Entity Key 검증 | `expected_entities` key는 `entities.json`에 존재해야 한다. |
| P0 최소 수량 | 1차 PoC Pack은 P0 질문을 최소 30개 이상 포함한다. |
| Fallback 검증 | Fallback 질문은 `expected_route`가 `unanswered_logging` 또는 `fallback`이어야 한다. |

---

## 15. Pack 단위 참조 무결성 검증

JSON Schema는 파일 내부 구조를 검증하고, 아래 항목은 Pack Validator에서 별도로 검증한다.

| 검증 항목 | 검증 방식 |
|---|---|
| Service ID 일치 | 모든 파일의 `service_id`가 `service_profile.service_id`와 일치해야 한다. |
| Intent ID 유일성 | `intents.items[*].intent_id` 중복 금지 |
| Action ID 유일성 | `action_registry.items[*].action_id` 중복 금지 |
| Entity Type 유일성 | `entities.items[*].entity_type` 중복 금지 |
| Intent → Action 참조 | Intent의 `action_id`는 Action Registry에 존재해야 한다. |
| Intent → Entity 참조 | Intent의 required/optional entity는 Entities에 존재해야 한다. |
| Action Parameter → Action 참조 | Action Parameter의 `action_id`는 Action Registry에 존재해야 한다. |
| Action Parameter → Entity 참조 | Action Parameter의 `entity_type`은 Entities에 존재해야 한다. |
| SQL Template → Action 참조 | SQL Template의 `action_id`는 QUERY/DOWNLOAD Action이어야 한다. |
| Screen Route → Action 참조 | Screen Route의 `action_id`는 NAVIGATE Action이어야 한다. |
| Validation Question → Intent 참조 | 기대 Intent는 Intents에 존재해야 한다. |
| Validation Question → Entity 참조 | 기대 Entity key는 Entities에 존재해야 한다. |

---

## 16. SQL Template 보안 검증

SQL Template은 Schema 검증 외에 별도 보안 검증이 필요하다.

| 검증 항목 | 기준 |
|---|---|
| SQL 종류 | 1차 MVP에서는 `SELECT`만 허용 |
| 금지 키워드 | `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `EXEC`, `MERGE` |
| 파라미터 방식 | `:parameter_name` 바인딩만 허용 |
| 문자열 조합 | `${}`, `{}`, `+`, `%` 기반 동적 SQL 조합 금지 |
| 권한 조건 | 사용자/조직/공장/현장 권한 조건 포함 권장 |
| 결과 제한 | `max_rows` 필수 |
| 감사 로그 | QUERY/DOWNLOAD Action은 감사 로그 필수 |

---

## 17. 탄소중립 Pack v0.1 적용 예시

### 17.1 `intents.json` 예시
```json
{
  "schema_version": "0.1",
  "service_id": "NETZERO",
  "items": [
    {
      "intent_id": "INT-NZ-QUERY-001",
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
  ]
}
```

### 17.2 `validation_questions.json` 예시
```json
{
  "schema_version": "0.1",
  "service_id": "NETZERO",
  "items": [
    {
      "question_id": "VQ-NZ-027",
      "query": "A공장 탄소 배출량 알려줘",
      "expected_intent_id": "INT-NZ-QUERY-001",
      "expected_entities": {
        "factory": "A공장",
        "metric": "탄소 배출량"
      },
      "expected_route": "query_mock_action",
      "priority": "P0"
    }
  ]
}
```

---

## 18. 후속 개발 작업

| 순서 | 작업 | 담당 |
|---:|---|---|
| 1 | 본 문서를 기준으로 실제 `.schema.json` 파일 생성 | Backend |
| 2 | Pack Validator CLI 또는 테스트 유틸 작성 | Backend |
| 3 | 탄소중립 Intent Pack v0.1을 JSON 파일로 변환 | Backend, BA |
| 4 | Validation Questions v0.2를 JSON으로 변환 | Backend, QA |
| 5 | Pack 단위 참조 무결성 테스트 작성 | Backend |
| 6 | SQL Template 보안 검증 로직 작성 | Backend, 보안 |
