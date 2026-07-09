# 13. 탄소중립플랫폼 Intent Pack v0.1

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | 탄소중립플랫폼 Intent Pack v0.1 |
| 작성일 | 2026-06-24 |
| 버전 | v0.1 |
| 목적 | 폐쇄망 대응형 Lightweight NLU 기반 챗봇 플랫폼의 1차 기준 서비스로 탄소중립플랫폼 Intent Pack 초안을 정의 |
| 상태 | PM 가설 기반 초안 |
| 참조 문서 | 12_Intent_Pack_표준정의서.md |

---

## 2. 적용 범위

본 문서는 탄소중립플랫폼 1차 MVP 검증을 위한 Intent Pack 초안이다. 고객 업무 담당자 확정 전 단계이므로 Intent 상태는 `mvp`, `candidate`, `hold`, `excluded`로 관리한다.

1차 MVP는 문서/FAQ 안내, 화면 이동 안내, 조회형 Action 일부를 우선 대상으로 한다. 데이터 등록/수정/삭제 등 변경성 Action은 보안 및 권한 정책 확정 전까지 제외 또는 보류한다.

---

## 3. Service Profile

```json
{
  "service_id": "NETZERO",
  "service_name": "탄소중립플랫폼",
  "pack_id": "netzero-intent-pack",
  "pack_version": "0.1.0",
  "target_environment": "closed-network",
  "owner": "탄소중립플랫폼 운영팀",
  "description": "탄소중립플랫폼 1차 MVP 검증용 Intent Pack"
}
```

---

## 4. Intent 목록

### 4.1 MVP 우선 Intent
| Intent ID | Intent 명 | 유형 | 상태 | 필수 Entity | 선택 Entity | Action ID | 자동 실행 | 확인 필요 | 리스크 |
|---|---|---|---|---|---|---|:---:|:---:|---|
| INT-NZ-DOC-001 | 배출량 산정 기준 안내 | search_doc | mvp | `topic` | `scope`, `metric` | ACT-NZ-SEARCH-CALC-GUIDE | O | X | low |
| INT-NZ-DOC-002 | Scope 기준 안내 | search_doc | mvp | `scope` | `topic` | ACT-NZ-SEARCH-SCOPE-GUIDE | O | X | low |
| INT-NZ-DOC-003 | 배출계수 기준 안내 | search_doc | mvp | `emission_factor` | `fuel_type`, `metric` | ACT-NZ-SEARCH-FACTOR-GUIDE | O | X | low |
| INT-NZ-NAV-001 | 배출량 입력 화면 안내 | navigate | mvp | `menu` | `scope` | ACT-NZ-GO-EMISSION-INPUT | O | X | low |
| INT-NZ-NAV-002 | 보고서 화면 안내 | navigate | mvp | `menu` | `report_type` | ACT-NZ-GO-REPORT | O | X | low |
| INT-NZ-GUIDE-001 | 배출량 등록 방법 안내 | guide | mvp | `task` | `scope`, `menu` | ACT-NZ-GUIDE-EMISSION-INPUT | O | X | low |
| INT-NZ-ERR-001 | 권한 오류 안내 | error_help | mvp | `error_type` | `menu`, `action_type` | ACT-NZ-GUIDE-PERMISSION-ERROR | O | X | low |
| INT-NZ-FBK-001 | 미응답 질문 등록 | fallback | mvp | `question_text` | `topic` | ACT-NZ-CREATE-UNANSWERED | O | X | low |
| INT-NZ-QUERY-001 | 공장별 탄소 배출량 조회 | query | mvp | `factory`, `period` | `scope`, `metric` | ACT-NZ-QUERY-EMISSION | X | O | medium |
| INT-NZ-QUERY-002 | 전력 사용량 조회 | query | mvp | `site_or_factory`, `period` | `metric` | ACT-NZ-QUERY-POWER | X | O | medium |
| INT-NZ-QUERY-003 | 데이터 미입력 현황 조회 | query | mvp | `period` | `site_or_factory`, `task` | ACT-NZ-QUERY-MISSING-INPUT | X | O | medium |

### 4.2 Candidate Intent
| Intent ID | Intent 명 | 유형 | 상태 | 필수 Entity | 선택 Entity | Action ID | 비고 |
|---|---|---|---|---|---|---|---|
| INT-NZ-QUERY-004 | 기간별 배출량 추이 조회 | query | candidate | `period` | `factory`, `site`, `scope` | ACT-NZ-QUERY-EMISSION-TREND | DB/API 확인 필요 |
| INT-NZ-QUERY-005 | Scope별 배출량 조회 | query | candidate | `scope`, `period` | `factory`, `site` | ACT-NZ-QUERY-SCOPE-EMISSION | DB/API 확인 필요 |
| INT-NZ-QUERY-006 | 감축 실적 조회 | query | candidate | `period` | `factory`, `site` | ACT-NZ-QUERY-REDUCTION | 업무 지표 확인 필요 |
| INT-NZ-QUERY-007 | 목표 대비 실적 조회 | query | candidate | `period` | `factory`, `site`, `metric` | ACT-NZ-QUERY-TARGET-ACTUAL | 목표 데이터 확인 필요 |
| INT-NZ-DWN-001 | 조회 결과 엑셀 다운로드 | download | candidate | `source_query` | `file_format` | ACT-NZ-DOWNLOAD-EXCEL | 다운로드 권한 확인 필요 |
| INT-NZ-DWN-002 | 보고서 다운로드 | download | candidate | `report_type`, `period` | `factory`, `site` | ACT-NZ-DOWNLOAD-REPORT | 보고서 생성/파일 정책 확인 필요 |
| INT-NZ-NAV-003 | 사용자/권한 관리 화면 안내 | navigate | candidate | `menu` | `role` | ACT-NZ-GO-USER-PERMISSION | 관리자 권한 확인 필요 |
| INT-NZ-DOC-004 | 용어 설명 | search_doc | candidate | `term` | `topic` | ACT-NZ-SEARCH-GLOSSARY | FAQ 보강 필요 |

### 4.3 Hold/Excluded Intent
| Intent ID | Intent 명 | 유형 | 상태 | 사유 |
|---|---|---|---|---|
| INT-NZ-CMD-001 | 배출량 데이터 등록 | create_request | hold | 변경성 업무로 권한/승인/감사 정책 확정 필요 |
| INT-NZ-CMD-002 | 배출량 데이터 수정 | create_request | excluded | 챗봇 자동 실행 대상 부적합 |
| INT-NZ-CMD-003 | 배출량 데이터 삭제 | create_request | excluded | 데이터 훼손 리스크로 1차 범위 제외 |
| INT-NZ-CMD-004 | 사용자 권한 변경 | create_request | excluded | 보안상 관리자 화면 직접 처리 대상 |

---

## 5. Intent별 예상 질문

### 5.1 문서/FAQ 안내
| Intent ID | 예상 질문 |
|---|---|
| INT-NZ-DOC-001 | 탄소 배출량은 어떻게 계산해? |
| INT-NZ-DOC-001 | 배출량 산정 기준 알려줘 |
| INT-NZ-DOC-001 | 온실가스 배출량 계산 방식이 뭐야? |
| INT-NZ-DOC-002 | Scope 1 기준 알려줘 |
| INT-NZ-DOC-002 | Scope 2는 어떻게 계산해? |
| INT-NZ-DOC-002 | Scope 3 산정 기준이 뭐야? |
| INT-NZ-DOC-003 | 배출계수 기준이 뭐야? |
| INT-NZ-DOC-003 | 전력 사용량 배출계수 알려줘 |
| INT-NZ-DOC-003 | 도시가스 배출계수는 어디 기준이야? |
| INT-NZ-DOC-004 | tCO2e가 무슨 뜻이야? |
| INT-NZ-DOC-004 | 온실가스 배출권이 뭐야? |

### 5.2 화면 이동/사용 방법
| Intent ID | 예상 질문 |
|---|---|
| INT-NZ-NAV-001 | 배출량 입력 어디서 해? |
| INT-NZ-NAV-001 | Scope 1 입력 화면으로 가고 싶어 |
| INT-NZ-NAV-001 | 전력 사용량 등록 메뉴 어디야? |
| INT-NZ-NAV-002 | 보고서 메뉴 어디 있어? |
| INT-NZ-NAV-002 | 배출량 보고서 화면 열어줘 |
| INT-NZ-GUIDE-001 | 배출량 등록 방법 알려줘 |
| INT-NZ-GUIDE-001 | 전기 사용량은 어떻게 입력해? |
| INT-NZ-GUIDE-001 | 감축 실적 등록 절차 알려줘 |

### 5.3 조회형 Action
| Intent ID | 예상 질문 |
|---|---|
| INT-NZ-QUERY-001 | A공장 탄소 배출량 알려줘 |
| INT-NZ-QUERY-001 | 에이공장 작년 배출량 조회해줘 |
| INT-NZ-QUERY-001 | A Factory 2024년 온실가스 배출량 보여줘 |
| INT-NZ-QUERY-002 | B현장 이번 달 전력 사용량 알려줘 |
| INT-NZ-QUERY-002 | 비현장 전기 사용량 조회해줘 |
| INT-NZ-QUERY-002 | 지난달 전력량 얼마나 썼어? |
| INT-NZ-QUERY-003 | 아직 입력 안 한 현장 알려줘 |
| INT-NZ-QUERY-003 | 이번 달 미입력 데이터 있어? |
| INT-NZ-QUERY-003 | 배출량 등록 누락된 공장 보여줘 |

### 5.4 오류/운영
| Intent ID | 예상 질문 |
|---|---|
| INT-NZ-ERR-001 | 배출량 조회 권한이 없다고 나와 |
| INT-NZ-ERR-001 | 보고서 다운로드가 안 돼 |
| INT-NZ-ERR-001 | 메뉴가 안 보여 |
| INT-NZ-FBK-001 | 이 질문은 왜 답을 못 해? |
| INT-NZ-FBK-001 | 답변이 이상해 |
| INT-NZ-FBK-001 | 담당자가 확인해줬으면 좋겠어 |

---

## 6. Entity Dictionary

### 6.1 Entity Type
| Entity Type | 표시명 | 값 유형 | 설명 | 예시 |
|---|---|---|---|---|
| `factory` | 공장 | string/code | 공장 단위 조회 조건 | A공장, B공장 |
| `site` | 현장 | string/code | 현장 단위 조회 조건 | B현장, C사업장 |
| `site_or_factory` | 공장/현장 | string/code | 공장 또는 현장 통합 조건 | A공장, B현장 |
| `period` | 기간 | date_range | 조회 또는 기준 기간 | 오늘, 이번 달, 2024년 |
| `scope` | Scope | enum | 온실가스 Scope 구분 | Scope 1, Scope 2, Scope 3 |
| `metric` | 지표 | enum | 조회/검색 지표 | 탄소 배출량, 전력 사용량 |
| `fuel_type` | 연료종류 | enum | 연료 또는 에너지원 | 도시가스, 휘발유, 전력 |
| `emission_factor` | 배출계수 | string | 배출계수 기준 | 전력 배출계수, 연료 배출계수 |
| `menu` | 메뉴 | string | 화면 이동 대상 메뉴 | 배출량 입력, 보고서 |
| `report_type` | 보고서 유형 | enum | 다운로드/조회 보고서 유형 | 배출량 보고서, 실적 보고서 |
| `file_format` | 파일 형식 | enum | 다운로드 파일 형식 | Excel, xlsx |
| `task` | 업무 | string | 절차 안내 대상 업무 | 배출량 등록, 감축 실적 등록 |
| `topic` | 주제 | string | 문서/FAQ 검색 주제 | 산정 기준, 사용 방법 |
| `term` | 용어 | string | 용어 설명 대상 | tCO2e, Scope |
| `error_type` | 오류 유형 | enum | 오류/조치 안내 유형 | 권한 오류, 로그인 오류 |
| `question_text` | 질문 원문 | string | 미응답 등록용 원문 | 사용자 입력 전체 |

### 6.2 Entity Synonym 초안
| Entity Type | 표준값 | 동의어 | 내부 코드 |
|---|---|---|---|
| `factory` | A공장 | A공장, 에이공장, A Factory, A현장 | TBD |
| `factory` | B공장 | B공장, 비공장, B Factory | TBD |
| `site` | B현장 | B현장, 비현장, B Site, B사업장 | TBD |
| `metric` | 탄소 배출량 | 배출량, 온실가스 배출량, 탄소량, CO2 배출량 | `emission_amount` |
| `metric` | 전력 사용량 | 전기 사용량, 전력량, 전기사용내역, kWh | `power_usage` |
| `scope` | Scope 1 | Scope1, 스코프1, 직접배출 | `scope_1` |
| `scope` | Scope 2 | Scope2, 스코프2, 간접배출, 전력배출 | `scope_2` |
| `scope` | Scope 3 | Scope3, 스코프3, 기타간접배출 | `scope_3` |
| `fuel_type` | 도시가스 | LNG, 가스, 도시 가스 | `lng` |
| `file_format` | Excel | 엑셀, xlsx, 파일, 다운로드 | `xlsx` |
| `menu` | 배출량 입력 | 배출량 등록, 입력 화면, 산정 입력 | TBD |
| `menu` | 보고서 | 리포트, 보고서 다운로드, 배출량 보고서 | TBD |
| `error_type` | 권한 오류 | 권한 없음, 접근 불가, 메뉴가 안 보임 | `permission_denied` |

---

## 7. Action Registry

| Action ID | Action 명 | 유형 | 실행 방식 | 권한 정책 | 감사 로그 | 사용 여부 |
|---|---|---|---|---|:---:|:---:|
| ACT-NZ-SEARCH-CALC-GUIDE | 배출량 산정 기준 검색 | SEARCH_DOC | search | public_or_workspace | O | O |
| ACT-NZ-SEARCH-SCOPE-GUIDE | Scope 기준 검색 | SEARCH_DOC | search | public_or_workspace | O | O |
| ACT-NZ-SEARCH-FACTOR-GUIDE | 배출계수 기준 검색 | SEARCH_DOC | search | public_or_workspace | O | O |
| ACT-NZ-GO-EMISSION-INPUT | 배출량 입력 화면 이동 | NAVIGATE | route | workspace_user | O | O |
| ACT-NZ-GO-REPORT | 보고서 화면 이동 | NAVIGATE | route | workspace_user | O | O |
| ACT-NZ-GUIDE-EMISSION-INPUT | 배출량 등록 방법 안내 | GUIDE | template | public_or_workspace | O | O |
| ACT-NZ-GUIDE-PERMISSION-ERROR | 권한 오류 조치 안내 | GUIDE | template | public_or_workspace | O | O |
| ACT-NZ-CREATE-UNANSWERED | 미응답 질문 등록 | CREATE_REQUEST | internal_api | workspace_user | O | O |
| ACT-NZ-QUERY-EMISSION | 공장별 배출량 조회 | QUERY | sql_template_or_api | data_viewer | O | 검토 |
| ACT-NZ-QUERY-POWER | 전력 사용량 조회 | QUERY | sql_template_or_api | data_viewer | O | 검토 |
| ACT-NZ-QUERY-MISSING-INPUT | 데이터 미입력 현황 조회 | QUERY | sql_template_or_api | operator | O | 검토 |
| ACT-NZ-DOWNLOAD-EXCEL | 조회 결과 엑셀 다운로드 | DOWNLOAD | internal_api | data_exporter | O | 검토 |
| ACT-NZ-DOWNLOAD-REPORT | 보고서 다운로드 | DOWNLOAD | internal_api | data_exporter | O | 검토 |

---

## 8. Action Parameters

| Action ID | Parameter | Entity Type | 필수 | 기본값 정책 | 검증 규칙 |
|---|---|---|:---:|---|---|
| ACT-NZ-QUERY-EMISSION | `factory_id` | `factory` | O | 없음 | 사용자 권한 내 공장인지 확인 |
| ACT-NZ-QUERY-EMISSION | `period` | `period` | O | 미입력 시 당해년도 또는 사용자 확인 | 기간 형식 정규화 |
| ACT-NZ-QUERY-EMISSION | `scope` | `scope` | N | 전체 Scope | 허용 Scope 값 |
| ACT-NZ-QUERY-POWER | `site_or_factory_id` | `site_or_factory` | O | 없음 | 사용자 권한 범위 확인 |
| ACT-NZ-QUERY-POWER | `period` | `period` | O | 미입력 시 사용자 확인 | 기간 형식 정규화 |
| ACT-NZ-QUERY-MISSING-INPUT | `period` | `period` | O | 당월 | 기간 형식 정규화 |
| ACT-NZ-GO-EMISSION-INPUT | `menu` | `menu` | O | 배출량 입력 | 메뉴 권한 확인 |
| ACT-NZ-GO-REPORT | `menu` | `menu` | O | 보고서 | 메뉴 권한 확인 |
| ACT-NZ-CREATE-UNANSWERED | `question_text` | `question_text` | O | 사용자 원문 | PII 마스킹 후 저장 |

---

## 9. SQL Template 초안

실제 테이블명과 컬럼명은 고객 DB/API 확인 후 확정한다. 본 절의 SQL은 설계 방향을 설명하기 위한 초안이다.

### 9.1 공장별 탄소 배출량 조회
| 항목 | 내용 |
|---|---|
| Template ID | SQL-NZ-EMISSION-001 |
| Action ID | ACT-NZ-QUERY-EMISSION |
| 설명 | 공장/기간 기준 탄소 배출량 조회 |
| 권한 | `data_viewer`, `operator`, `workspace_admin` |
| 최대 건수 | 100 |

```sql
SELECT
    factory_name,
    base_period,
    scope,
    emission_amount,
    unit
FROM carbon_emission_summary
WHERE factory_id = :factory_id
  AND base_period BETWEEN :period_start AND :period_end
  AND (:scope IS NULL OR scope = :scope)
  AND EXISTS (
      SELECT 1
      FROM user_factory_permission
      WHERE user_id = :user_id
        AND factory_id = carbon_emission_summary.factory_id
  )
ORDER BY base_period DESC, scope;
```

### 9.2 전력 사용량 조회
| 항목 | 내용 |
|---|---|
| Template ID | SQL-NZ-POWER-001 |
| Action ID | ACT-NZ-QUERY-POWER |
| 설명 | 공장/현장/기간 기준 전력 사용량 조회 |
| 권한 | `data_viewer`, `operator`, `workspace_admin` |
| 최대 건수 | 100 |

```sql
SELECT
    site_name,
    usage_period,
    power_usage,
    unit
FROM power_usage_summary
WHERE site_id = :site_or_factory_id
  AND usage_period BETWEEN :period_start AND :period_end
  AND EXISTS (
      SELECT 1
      FROM user_site_permission
      WHERE user_id = :user_id
        AND site_id = power_usage_summary.site_id
  )
ORDER BY usage_period DESC;
```

### 9.3 미입력 현황 조회
| 항목 | 내용 |
|---|---|
| Template ID | SQL-NZ-MISSING-001 |
| Action ID | ACT-NZ-QUERY-MISSING-INPUT |
| 설명 | 기간 기준 배출량 또는 사용량 미입력 현황 조회 |
| 권한 | `operator`, `workspace_admin` |
| 최대 건수 | 200 |

```sql
SELECT
    site_name,
    input_item,
    target_period,
    input_status,
    due_date
FROM input_status_summary
WHERE target_period BETWEEN :period_start AND :period_end
  AND input_status = 'MISSING'
  AND EXISTS (
      SELECT 1
      FROM user_site_permission
      WHERE user_id = :user_id
        AND site_id = input_status_summary.site_id
  )
ORDER BY due_date ASC, site_name;
```

---

## 10. Screen Routes 초안

실제 메뉴 ID, URL, 라우팅 파라미터는 탄소중립플랫폼 화면 정의서 또는 고객 시스템 메뉴 정보를 기준으로 확정한다.

| Route ID | Action ID | 메뉴명 | Route Type | Route Value | 필요 권한 | 상태 |
|---|---|---|---|---|---|---|
| RTE-NZ-EMISSION-INPUT | ACT-NZ-GO-EMISSION-INPUT | 배출량 입력 | menu_id | TBD_EMISSION_INPUT | workspace_user | 확인 필요 |
| RTE-NZ-REPORT | ACT-NZ-GO-REPORT | 보고서 | menu_id | TBD_REPORT | workspace_user | 확인 필요 |
| RTE-NZ-POWER-INPUT | ACT-NZ-GO-EMISSION-INPUT | 전력 사용량 입력 | menu_id | TBD_POWER_INPUT | workspace_user | 확인 필요 |
| RTE-NZ-USER-PERMISSION | ACT-NZ-GO-USER-PERMISSION | 사용자/권한 관리 | menu_id | TBD_USER_PERMISSION | workspace_admin | 확인 필요 |

---

## 11. Response Templates

| Template ID | 연결 Action | 카드 유형 | 제목 | 근거 표시 |
|---|---|---|---|:---:|
| RSP-NZ-DOC-GUIDE | ACT-NZ-SEARCH-CALC-GUIDE | document | 산정 기준 안내 | O |
| RSP-NZ-SCOPE-GUIDE | ACT-NZ-SEARCH-SCOPE-GUIDE | document | Scope 기준 안내 | O |
| RSP-NZ-NAVIGATION | ACT-NZ-GO-EMISSION-INPUT | navigation | 화면 이동 안내 | X |
| RSP-NZ-QUERY-DATA | ACT-NZ-QUERY-EMISSION | data | 조회 결과 | O |
| RSP-NZ-ERROR-PERMISSION | ACT-NZ-GUIDE-PERMISSION-ERROR | guide | 권한 오류 안내 | X |
| RSP-NZ-FALLBACK | ACT-NZ-CREATE-UNANSWERED | fallback | 답변 보완 필요 | X |

### 11.1 데이터 조회 카드 예시
```text
{factory_name}의 {period_label} 탄소 배출량은 {emission_amount}{unit}입니다.
조회 기준: {scope_label}
데이터 기준일: {base_period}
```

### 11.2 화면 이동 카드 예시
```text
요청하신 업무는 "{menu_name}" 화면에서 처리할 수 있습니다.
[화면으로 이동] 버튼을 선택하면 해당 메뉴로 이동합니다.
```

### 11.3 문서 안내 카드 예시
```text
{topic}에 대한 기준은 아래 문서에서 확인할 수 있습니다.
- 문서명: {source_name}
- 위치: {page_or_section}
- 요약: {summary}
```

---

## 12. Confidence Policy

| Intent 유형 | High | Medium | Low | 처리 기준 |
|---|---:|---:|---:|---|
| 문서/FAQ | 0.80 이상 | 0.60 이상 | 0.45 이상 | Low 이상이면 검색 Fallback 허용 |
| 화면 이동 | 0.85 이상 | 0.65 이상 | 0.45 이상 | Medium은 후보 메뉴 제시 |
| 조회 Action | 0.90 이상 | 0.70 이상 | 0.50 이상 | High라도 사용자 확인 후 실행 |
| 다운로드 Action | 0.92 이상 | 0.75 이상 | 0.50 이상 | 사용자 확인 및 권한 검증 필수 |
| 변경성 Action | N/A | N/A | N/A | 1차 MVP 제외 |

---

## 13. Validation Questions v0.1

| 질문 ID | 질문 | 기대 Intent | 기대 Entity | 기대 처리 |
|---|---|---|---|---|
| VQ-NZ-001 | A공장 탄소 배출량 알려줘 | INT-NZ-QUERY-001 | factory=A공장, metric=탄소 배출량 | 권한 확인 후 조회 확인 |
| VQ-NZ-002 | 에이공장 작년 배출량 조회해줘 | INT-NZ-QUERY-001 | factory=A공장, period=작년 | 권한 확인 후 조회 확인 |
| VQ-NZ-003 | B현장 이번 달 전기 사용량 알려줘 | INT-NZ-QUERY-002 | site=B현장, period=이번 달, metric=전력 사용량 | 권한 확인 후 조회 확인 |
| VQ-NZ-004 | 아직 입력 안 한 현장 있어? | INT-NZ-QUERY-003 | period=기본값 당월 | 조회 후보 확인 |
| VQ-NZ-005 | Scope 1 기준 알려줘 | INT-NZ-DOC-002 | scope=Scope 1 | 문서 검색 |
| VQ-NZ-006 | Scope 3 산정 기준이 뭐야? | INT-NZ-DOC-002 | scope=Scope 3, topic=산정 기준 | 문서 검색 |
| VQ-NZ-007 | 배출계수 기준이 뭐야? | INT-NZ-DOC-003 | emission_factor=배출계수 | 문서 검색 |
| VQ-NZ-008 | 배출량 입력 어디서 해? | INT-NZ-NAV-001 | menu=배출량 입력 | 화면 이동 |
| VQ-NZ-009 | 보고서 메뉴 어디 있어? | INT-NZ-NAV-002 | menu=보고서 | 화면 이동 |
| VQ-NZ-010 | 전기 사용량은 어떻게 입력해? | INT-NZ-GUIDE-001 | task=전력 사용량 입력 | 절차 안내 |
| VQ-NZ-011 | 배출량 조회 권한이 없다고 나와 | INT-NZ-ERR-001 | error_type=권한 오류 | 오류 조치 안내 |
| VQ-NZ-012 | tCO2e가 뭐야? | INT-NZ-DOC-004 | term=tCO2e | FAQ/문서 검색 |
| VQ-NZ-013 | 이 질문은 왜 답을 못 해? | INT-NZ-FBK-001 | question_text=원문 | 미응답 등록 |
| VQ-NZ-014 | 작년 대비 배출량 늘었어? | INT-NZ-QUERY-004 | period=작년/비교기간, metric=탄소 배출량 | candidate 처리 |
| VQ-NZ-015 | 이 결과 엑셀로 뽑아줘 | INT-NZ-DWN-001 | file_format=Excel | candidate 처리 |

---

## 14. 고객 확인 필요사항

| 확인 항목 | 확인 내용 | 영향 |
|---|---|---|
| 주요 메뉴 목록 | 배출량 입력, 전력 사용량 입력, 보고서 등 메뉴 ID/URL | Screen Route 확정 |
| 공장/현장 마스터 | 공장명, 현장명, 코드, 동의어 | Entity Dictionary 확정 |
| 조회 가능 데이터 | 배출량, 전력 사용량, 미입력 현황 등 조회 가능 여부 | Query Action 확정 |
| DB/API 접근 방식 | SQL 직접 조회 또는 내부 API 사용 여부 | Action Runtime/SQL Template 확정 |
| 사용자 권한 구조 | 사용자별 공장/현장/메뉴 접근 범위 | 권한 검증 정책 확정 |
| 보고서/엑셀 정책 | 다운로드 허용 여부, 마스킹, 파일 보관 | Download Action 확정 |
| FAQ/매뉴얼 문서 | 산정 기준, Scope 기준, 배출계수 기준 문서 | Knowledge Index 구축 |
| 폐쇄망 반입 절차 | 모델/인덱스/Pack 반입 승인 방식 | Migration Package 설계 |

---

## 15. 1차 PoC 수용 기준

| 항목 | 목표 |
|---|---:|
| Intent Top-1 정확도 | 80% 이상 |
| Intent Top-3 정확도 | 90% 이상 |
| Entity 추출 정확도 | 85% 이상 |
| 잘못된 Action 실행률 | 1% 이하 |
| Fallback 적정 처리율 | 90% 이상 |
| 문서/FAQ Top-3 적중률 | 80% 이상 |
| 조회형 Action 권한 검증 성공률 | 100% |
| Pack 검증/반입 성공률 | 100% |
| Rollback 성공률 | 100% |

---

## 16. 후속 작업

| 순서 | 작업 | 담당 | 산출물 |
|---:|---|---|---|
| 1 | 고객 질문 예시 30~50개 수집 | PM, 업무 담당자 | 표준 질문셋 v0.2 |
| 2 | 메뉴 ID/URL 확인 | PM, Frontend, 고객 시스템 담당 | Screen Routes 확정본 |
| 3 | 공장/현장/지표 마스터 확인 | BA, Backend, 고객 업무 담당 | Entity Dictionary v0.2 |
| 4 | DB/API 조회 가능성 확인 | Backend, DBA, 고객 IT | Action/SQL Template 확정 |
| 5 | 탄소중립 문서/FAQ 수집 | PM, 업무 담당자 | Knowledge Index 대상 목록 |
| 6 | Intent Pack JSON 변환 | Backend, AI Engineer | Pack 파일 초안 |
| 7 | PoC 질문셋 검증 | QA, AI Engineer | Intent/Entity 품질 결과서 |
