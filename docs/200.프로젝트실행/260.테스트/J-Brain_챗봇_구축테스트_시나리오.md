# J-Brain 챗봇 구축 테스트 시나리오

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 문서명 | J-Brain 챗봇 구축 테스트 시나리오 |
| 작성일 | 2026-06-30 |
| 버전 | v1.0 |
| 대상 프로젝트 | J-Brain |
| 테스트 목적 | J-Brain 운영 매뉴얼을 Source로 사용하여 구축 워크플로우 12단계를 처음부터 끝까지 검증 |
| 테스트 방식 | 화면 기반 수동 테스트 + Runtime QA 결과 확인 |
| 기준 문서 | `backend/app_data/J-Brain_Manual.txt` |

## 2. 테스트 목표

이번 테스트의 목표는 현재 구축된 J-Brain Intent Factory 기능을 이용하여 J-Brain 챗봇을 처음부터 구성하고, 운영 가능한 Pack이 만들어지는지 확인하는 것입니다.

검증할 핵심 흐름은 다음과 같습니다.

1. `J-Brain` 프로젝트를 선택한다.
2. J-Brain 운영 매뉴얼 Source를 등록하고 벡터화한다.
3. J-Brain 관련 Intent, Example, Entity, FAQ, Action을 구성한다.
4. Pack Draft를 생성하고 ZIP으로 Export한다.
5. Export Pack을 Runtime Pack Store에 Import한다.
6. 검증 질문으로 Pack 품질을 확인한다.
7. 승인된 Pack을 Active Pack으로 전환한다.
8. Runtime QA에서 J-Brain 관련 질문이 정상 응답되는지 확인한다.
9. 미응답 질문을 개선 후보로 전환할 수 있는지 확인한다.

## 3. 테스트 범위

### 3.1 포함 범위

- 프로젝트 선택 및 기반 설정 확인
- Source 등록 및 벡터화 상태 확인
- 검색 테스트
- Intent 등록 및 Example 관리
- Entity/Synonym 등록
- FAQ 등록 및 Pack 반영 여부 확인
- Action 등록 및 Intent-Action 연결
- Pack Builder Draft 생성
- Pack Export ZIP 생성
- Pack Repository Import
- Pack 검증 질문 등록 및 검증 실행
- Pack 승인 및 Active 전환
- Runtime QA 테스트
- 미응답 분석 및 개선 후보 등록

### 3.2 제외 범위

- 실제 고객 운영 DB Query 실행
- 실제 고객 내부망 배포
- 고객사 SSO/LDAP 연동
- 전자서명/암호화
- 다중 결재선 Workflow
- 외부 LLM 기반 FAQ 자동 생성
- 운영 서버 배포 자동화

## 4. 테스트 사전 조건

| 구분 | 사전 조건 |
|---|---|
| 서버 | 백엔드 서버와 프론트엔드 서버가 실행 중이어야 합니다. |
| 로그인 | 관리자 계정으로 로그인 가능해야 합니다. |
| 프로젝트 | `J-Brain` 프로젝트가 프로젝트 목록에 존재해야 합니다. |
| Source 파일 | `backend/app_data/J-Brain_Manual.txt` 파일이 최신 운영 매뉴얼 내용으로 준비되어야 합니다. |
| 데이터 상태 | 기존 탄소중립/NetZero 데이터는 테스트 대상에서 제외하고, J-Brain 프로젝트 기준으로만 확인합니다. |
| 메뉴 | 좌측 메뉴에 구축 워크플로우, 관리 기능, 운영/분석, 시스템 관리 메뉴가 표시되어야 합니다. |

## 5. 테스트 데이터 기준

### 5.1 Source 기준

| 항목 | 값 |
|---|---|
| Source 파일 | `J-Brain_Manual.txt` |
| Source 설명 | J-Brain 운영자 매뉴얼 v3.0 |
| 프로젝트 | J-Brain |
| 목적 | J-Brain 기능, 메뉴, 운영 절차, 운영자 응대 답변 근거 제공 |

### 5.2 대표 Intent 후보

| Intent ID | Intent 이름 | Category | Action ID |
|---|---|---|---|
| INT-JB-DOC-INTRO | J-Brain 소개 안내 | search_doc | ACT-JB-SEARCH-DOC |
| INT-JB-DOC-WORKFLOW | 구축 워크플로우 안내 | search_doc | ACT-JB-SEARCH-DOC |
| INT-JB-DOC-SOURCE | Source 관리 안내 | search_doc | ACT-JB-SEARCH-DOC |
| INT-JB-DOC-INTENT | Intent Factory 안내 | search_doc | ACT-JB-SEARCH-DOC |
| INT-JB-DOC-PACK | Pack Build/배포 안내 | search_doc | ACT-JB-SEARCH-DOC |
| INT-JB-DOC-RUNTIME | Runtime QA 안내 | search_doc | ACT-JB-SEARCH-DOC |
| INT-JB-NAV-SOURCE | Source 관리 화면 이동 | navigate | ACT-JB-GO-SOURCE |
| INT-JB-NAV-INTENT | Intent 관리 화면 이동 | navigate | ACT-JB-GO-INTENT |
| INT-JB-NAV-PACK-BUILDER | Pack Builder 화면 이동 | navigate | ACT-JB-GO-PACK-BUILDER |
| INT-JB-NAV-RUNTIME-QA | Runtime QA 화면 이동 | navigate | ACT-JB-GO-RUNTIME-QA |

### 5.3 대표 Entity/Synonym 후보

| Entity | Synonym |
|---|---|
| SOURCE | Source, 지식문서, 문서, 자료, 매뉴얼 |
| INTENT | Intent, 의도, 질문 의도, 질문 분류 |
| PACK | Pack, Intent Pack, 배포 패키지, ZIP, 패키지 |
| RUNTIME | Runtime, 챗봇 엔진, 고객망 엔진, 실행 환경 |
| FAQ | FAQ, 자주 묻는 질문, 문답, 표준 답변 |
| ACTION | Action, 실행 연결, 화면 이동, 업무 동작 |

### 5.4 대표 FAQ 후보

| FAQ ID | 질문 | 답변 요약 |
|---|---|---|
| FAQ-JB-001 | J-Brain은 무엇인가요? | 프로젝트별 Source, Intent, FAQ, Action, Pack을 관리하는 폐쇄망 대응형 챗봇 구축/운영 플랫폼입니다. |
| FAQ-JB-002 | 구축 워크플로우는 무엇인가요? | 기반 설정부터 운영 분석까지 챗봇 구축을 12단계로 안내하는 운영자용 절차입니다. |
| FAQ-JB-003 | Source는 무엇인가요? | 챗봇 답변 근거가 되는 원천 문서이며, 벡터화 후 검색에 사용됩니다. |
| FAQ-JB-004 | Intent는 무엇인가요? | 사용자의 질문 목적이며, Example과 Action 연결을 통해 Runtime 응답을 결정합니다. |
| FAQ-JB-005 | FAQ를 추가하면 바로 반영되나요? | 바로 반영되지 않으며 Pack Build, Export, Import, 검증, 승인, Active 전환이 필요합니다. |
| FAQ-JB-006 | Pack은 무엇인가요? | Runtime에 반입되는 Intent, Entity, FAQ, Action, 설정 파일의 배포 단위입니다. |
| FAQ-JB-007 | Runtime QA는 무엇을 확인하나요? | Intent 매칭, Action Card, 답변 근거, Confidence, Top-3 후보를 확인합니다. |
| FAQ-JB-008 | 미응답 분석은 왜 필요한가요? | 답변 실패 질문을 FAQ, Intent, Source, Action 개선 후보로 전환하기 위해 필요합니다. |

### 5.5 대표 Action 후보

| Action ID | Action 이름 | 유형 | Route 또는 목적 |
|---|---|---|---|
| ACT-JB-SEARCH-DOC | J-Brain 문서/FAQ 검색 | SEARCH_DOC | J-Brain Source와 FAQ 검색 |
| ACT-JB-GO-SOURCE | Source 관리 화면 이동 | NAVIGATE | `/admin/knowledge/sources` |
| ACT-JB-GO-INTENT | Intent 관리 화면 이동 | NAVIGATE | `/admin/intent-factory/intents` |
| ACT-JB-GO-PACK-BUILDER | Pack Builder 화면 이동 | NAVIGATE | `/admin/packs/builder` |
| ACT-JB-GO-RUNTIME-QA | Runtime QA 화면 이동 | NAVIGATE | `/admin/runtime/qa` |
| ACT-JB-GUIDE-BUILD | 구축 절차 안내 | GUIDE | 12단계 구축 절차 안내 |

## 6. End-to-End 테스트 시나리오

### TC-JB-E2E-001. 로그인 및 프로젝트 선택

| 항목 | 내용 |
|---|---|
| 목적 | J-Brain 프로젝트를 기준으로 테스트를 시작할 수 있는지 확인 |
| 화면 | `/login`, `/admin/workflow/projects` |
| 절차 | 1. 관리자 계정으로 로그인합니다. 2. 좌측 메뉴에서 `구축 워크플로우 > 프로젝트 선택/목록`을 클릭합니다. 3. `J-Brain` 프로젝트를 선택합니다. |
| 기대 결과 | J-Brain 프로젝트가 선택되고 워크플로우 대시보드 또는 기반 설정 화면으로 이동할 수 있습니다. |
| 실패 시 확인 | 로그인 API, 프로젝트 목록 API, DB 연결 상태를 확인합니다. |

### TC-JB-E2E-002. 1단계 기반 설정 확인

| 항목 | 내용 |
|---|---|
| 목적 | 프로젝트 기본 정보와 구축 시작 조건 확인 |
| 화면 | `/admin/workflow/projects/J-Brain/stages/1` |
| 절차 | 1. `1. 기반 설정`을 클릭합니다. 2. 프로젝트 ID, 프로젝트명, 상태, 설명을 확인합니다. 3. 필요한 경우 `프로젝트 관리`로 이동해 내용을 수정합니다. |
| 기대 결과 | 프로젝트 정보가 J-Brain 기준으로 표시되고 다음 단계로 이동할 수 있습니다. |
| 완료 기준 | 프로젝트가 활성 또는 테스트 가능한 상태입니다. |

### TC-JB-E2E-003. 2단계 Source 등록 및 벡터화

| 항목 | 내용 |
|---|---|
| 목적 | J-Brain 운영 매뉴얼을 지식 Source로 등록하고 검색 가능 상태로 준비 |
| 화면 | `/admin/knowledge/sources`, `/admin/knowledge/jobs` |
| 절차 | 1. `Source 관리`로 이동합니다. 2. `J-Brain_Manual.txt`를 등록합니다. 3. 벡터화 작업을 실행합니다. 4. `벡터화 작업 현황`에서 성공 상태를 확인합니다. |
| 기대 결과 | Source가 등록되고 벡터화 작업이 성공합니다. |
| 완료 기준 | Source 1건 이상, 인덱싱 상태 SUCCESS 또는 검색 가능한 상태입니다. |

### TC-JB-E2E-004. 검색 테스트

| 항목 | 내용 |
|---|---|
| 목적 | 등록된 Source가 실제 질문에 대한 검색 근거로 사용되는지 확인 |
| 화면 | `/admin/knowledge/search-test` |
| 절차 | 1. 검색 테스트 화면으로 이동합니다. 2. 프로젝트를 `J-Brain`으로 선택합니다. 3. 대표 질문을 입력합니다. |
| 테스트 질문 | `J-Brain은 무엇인가요?`, `Source 관리는 무엇인가요?`, `Pack은 왜 필요한가요?` |
| 기대 결과 | J-Brain 운영 매뉴얼 Source 또는 관련 Chunk가 검색 결과로 표시됩니다. |
| 실패 시 확인 | Source 벡터화 상태, 프로젝트 선택, 문서 내용, 검색어 표현을 확인합니다. |

### TC-JB-E2E-005. 3단계 Intent 등록

| 항목 | 내용 |
|---|---|
| 목적 | J-Brain 대표 질문 의도를 Intent로 등록 |
| 화면 | `/admin/intent-factory/intents` |
| 절차 | 1. `Intent 관리`로 이동합니다. 2. 프로젝트를 `J-Brain`으로 선택합니다. 3. 대표 Intent를 등록합니다. 4. 각 Intent에 Action ID를 지정합니다. |
| 기대 결과 | J-Brain 대표 Intent가 목록에 표시됩니다. |
| 완료 기준 | 최소 5개 이상 Intent가 등록되어 있습니다. |

### TC-JB-E2E-006. 4단계 질문 커버리지 보강

| 항목 | 내용 |
|---|---|
| 목적 | Intent별 실제 사용자 질문 표현을 보강 |
| 화면 | Intent 상세 화면 |
| 절차 | 1. Intent 목록에서 상세 화면으로 이동합니다. 2. Example을 3개 이상 등록합니다. 3. 중복되거나 모호한 표현을 제거합니다. |
| 예시 | `J-Brain이 뭔가요?`, `이 시스템은 무엇을 하나요?`, `J-Brain 핵심 기능 알려줘` |
| 기대 결과 | Intent별 Example이 저장되고 Runtime 매칭에 사용할 수 있습니다. |
| 완료 기준 | 주요 Intent별 Example 3건 이상 권장 |

### TC-JB-E2E-007. 5단계 Entity/Synonym 등록

| 항목 | 내용 |
|---|---|
| 목적 | J-Brain 운영 용어와 동의어를 정리 |
| 화면 | `/admin/intent-factory/entities` |
| 절차 | 1. Entity/Synonym 관리로 이동합니다. 2. SOURCE, INTENT, PACK, RUNTIME, FAQ, ACTION Entity를 등록합니다. 3. 각 Entity에 Synonym을 등록합니다. |
| 기대 결과 | Entity와 Synonym이 저장되고 Intent 연결 후보로 사용할 수 있습니다. |
| 완료 기준 | 핵심 Entity 5개 이상, Entity별 Synonym 2개 이상 |

### TC-JB-E2E-008. 6단계 FAQ 등록 및 답변 근거 준비

| 항목 | 내용 |
|---|---|
| 목적 | 운영자 응대용 FAQ를 Pack 반영 대상으로 등록 |
| 화면 | `/admin/intent-factory/faqs` |
| 절차 | 1. FAQ 관리로 이동합니다. 2. FAQ 후보 8건을 등록합니다. 3. `Pack Export에 반영` 옵션을 켭니다. 4. 필요 시 Source ID를 연결합니다. |
| 기대 결과 | FAQ가 저장되고 Pack 반영 대상 카운트에 포함됩니다. |
| 완료 기준 | FAQ 5건 이상, Pack 반영 대상 5건 이상 |

### TC-JB-E2E-009. 7단계 Action 등록 및 실행 연결 확인

| 항목 | 내용 |
|---|---|
| 목적 | Intent가 실제 Runtime Action으로 연결되는지 확인 |
| 화면 | `/admin/intent-factory/actions`, `/admin/workflow/projects/J-Brain/stages/7` |
| 절차 | 1. Action 관리로 이동합니다. 2. SEARCH_DOC, NAVIGATE, GUIDE Action을 등록합니다. 3. Intent 상세 화면에서 Action ID를 연결합니다. 4. 7단계 실행 연결 화면에서 미연결 Intent와 미사용 Action을 확인합니다. |
| 기대 결과 | Intent-Action 연결률이 100% 또는 미연결 Intent 0건으로 표시됩니다. |
| 실패 시 확인 | Intent의 action_id와 Action 목록의 action_id가 일치하는지 확인합니다. |

### TC-JB-E2E-010. 8단계 Pack 검증 질문 등록

| 항목 | 내용 |
|---|---|
| 목적 | Pack 품질검증에 사용할 검증 질문 준비 |
| 화면 | `/admin/packs/validation` |
| 절차 | 1. Pack 검증 화면으로 이동합니다. 2. 검증 질문을 등록합니다. 3. 기대 Intent ID, 기대 Action ID, 최소 Confidence를 입력합니다. |
| 기대 결과 | 검증 질문이 목록에 표시됩니다. |
| 완료 기준 | 핵심 질문 5건 이상 등록 |

### TC-JB-E2E-011. 10단계 Pack Draft 생성 및 Export

| 항목 | 내용 |
|---|---|
| 목적 | DB 데이터를 표준 Intent Pack ZIP으로 생성 |
| 화면 | `/admin/packs/builder` |
| 절차 | 1. Pack Builder로 이동합니다. 2. 프로젝트를 `J-Brain`으로 선택합니다. 3. `Draft 생성`을 클릭합니다. 4. Intent, Entity, FAQ, Action Count를 확인합니다. 5. `Export / ZIP 생성`을 클릭합니다. |
| 기대 결과 | Pack Export가 완료되고 ZIP 다운로드 링크가 표시됩니다. |
| 완료 기준 | Export 결과 valid, ZIP 생성 성공 |

### TC-JB-E2E-012. Pack Import 및 Repository 확인

| 항목 | 내용 |
|---|---|
| 목적 | Export Pack을 Runtime Pack Store에 반입 |
| 화면 | `/admin/packs/repository` |
| 절차 | 1. Pack Repository로 이동합니다. 2. Export ZIP 이력에서 대상 Pack을 확인합니다. 3. `Import`를 클릭합니다. 4. Runtime Pack Store 목록을 확인합니다. |
| 기대 결과 | Runtime Pack Store에 J-Brain Pack이 등록됩니다. |
| 완료 기준 | Runtime Pack 상태가 validated 또는 import 성공 상태 |

### TC-JB-E2E-013. Pack 검증 실행

| 항목 | 내용 |
|---|---|
| 목적 | 검증 질문 기준으로 Pack 품질 확인 |
| 화면 | `/admin/packs/validation` |
| 절차 | 1. 검증 대상 Runtime Pack을 선택합니다. 2. `검증 실행`을 클릭합니다. 3. Pass/Fail 결과를 확인합니다. |
| 기대 결과 | 주요 질문이 Pass 처리됩니다. |
| 완료 기준 | 핵심 질문 Pass율 80% 이상, 실패 원인 기록 |

### TC-JB-E2E-014. Pack 승인 및 Active 전환

| 항목 | 내용 |
|---|---|
| 목적 | 검증된 Pack을 운영 Runtime Pack으로 활성화 |
| 화면 | `/admin/packs/repository` |
| 절차 | 1. Runtime Pack Store에서 대상 Pack을 확인합니다. 2. `Approve`를 클릭합니다. 3. `Activate`를 클릭합니다. 4. Active Pack 카드에 대상 Pack이 표시되는지 확인합니다. |
| 기대 결과 | J-Brain Pack이 Active Pack으로 전환됩니다. |
| 완료 기준 | Active Pack이 J-Brain Pack으로 표시됩니다. |

### TC-JB-E2E-015. 9단계 Runtime QA

| 항목 | 내용 |
|---|---|
| 목적 | Active Pack 기준으로 실제 질의응답 동작 확인 |
| 화면 | `/admin/runtime/qa` |
| 절차 | 1. Runtime QA로 이동합니다. 2. 프로젝트를 `J-Brain`으로 선택합니다. 3. Pack 모드를 Active Pack으로 선택합니다. 4. 대표 질문을 입력합니다. 5. 답변, Intent, Action, FAQ/Source 근거를 확인합니다. |
| 테스트 질문 | `J-Brain은 무엇인가요?`, `FAQ를 추가하면 바로 반영되나요?`, `Pack Builder 화면으로 이동해줘`, `Runtime QA는 무엇을 확인하나요?` |
| 기대 결과 | 기대 Intent와 Action이 반환되고 답변 근거가 표시됩니다. |
| 완료 기준 | 대표 질문 5건 중 4건 이상 기대 결과 |

### TC-JB-E2E-016. 미응답 분석 및 개선 후보 전환

| 항목 | 내용 |
|---|---|
| 목적 | 답변 실패 질문을 개선 후보로 관리할 수 있는지 확인 |
| 화면 | `/admin/operations/unanswered`, `/admin/operations/improvement-requests` |
| 절차 | 1. Runtime QA에서 의도적으로 범위 밖 질문을 입력합니다. 2. 미응답 분석 화면으로 이동합니다. 3. 해당 질문이 기록되었는지 확인합니다. 4. FAQ 후보 또는 개선 요청으로 전환합니다. |
| 테스트 질문 | `전혀 관련 없는 임의 질문입니다`, `이 메뉴는 왜 안 보이나요?` |
| 기대 결과 | 미응답 질문이 개선 후보로 관리됩니다. |
| 완료 기준 | 미응답 로그 확인 및 개선 후보 전환 가능 |

## 7. Runtime QA 대표 질문 및 기대 결과

| 번호 | 질문 | 기대 유형 | 기대 결과 |
|---:|---|---|---|
| 1 | J-Brain은 무엇인가요? | SEARCH_DOC/FAQ | J-Brain 개요 설명과 FAQ 또는 Source 근거 표시 |
| 2 | 구축 워크플로우는 무엇인가요? | SEARCH_DOC/FAQ | 12단계 구축 절차 설명 |
| 3 | Source는 무엇인가요? | SEARCH_DOC/FAQ | Source 정의와 벡터화 필요성 설명 |
| 4 | Intent는 무엇인가요? | SEARCH_DOC/FAQ | Intent와 Example 개념 설명 |
| 5 | FAQ를 추가하면 바로 반영되나요? | SEARCH_DOC/FAQ | Pack Build/Export/Import/승인/Active 필요 설명 |
| 6 | Pack은 무엇인가요? | SEARCH_DOC/FAQ | Pack 배포 단위 설명 |
| 7 | Runtime QA는 무엇을 확인하나요? | SEARCH_DOC/FAQ | Intent, Action, 근거, Confidence 확인 설명 |
| 8 | Source 관리 화면으로 이동해줘 | NAVIGATE | `/admin/knowledge/sources` 이동 Action Card |
| 9 | Intent 관리 열어줘 | NAVIGATE | `/admin/intent-factory/intents` 이동 Action Card |
| 10 | Pack Builder 화면으로 이동해줘 | NAVIGATE | `/admin/packs/builder` 이동 Action Card |
| 11 | Runtime QA 화면 보여줘 | NAVIGATE | `/admin/runtime/qa` 이동 Action Card |
| 12 | 미응답 분석은 왜 필요한가요? | SEARCH_DOC/FAQ | 개선 후보 관리 목적 설명 |

## 8. 결함 기록 기준

테스트 중 문제가 발견되면 다음 기준으로 기록합니다.

| 항목 | 기록 내용 |
|---|---|
| 결함 ID | `BUG-JB-YYYYMMDD-001` 형식 |
| 발생 단계 | 1~12단계 중 하나 |
| 화면 | 오류가 발생한 화면 URL |
| 입력값 | 사용자가 입력한 질문 또는 등록 데이터 |
| 기대 결과 | 원래 기대한 결과 |
| 실제 결과 | 실제 화면 또는 API 결과 |
| 심각도 | Critical, High, Medium, Low |
| 원인 후보 | Source, Intent, Entity, FAQ, Action, Pack, Runtime, UI, API |
| 조치 방향 | 수정 또는 보류 방향 |

## 9. 테스트 완료 기준

J-Brain 챗봇 구축 테스트는 다음 기준을 만족하면 완료로 판단합니다.

| 구분 | 완료 기준 |
|---|---|
| 프로젝트 | J-Brain 프로젝트 선택 및 기반 설정 확인 |
| Source | J-Brain 운영 매뉴얼 등록 및 검색 가능 |
| Intent | 대표 Intent 5건 이상 등록 |
| Example | 주요 Intent별 Example 3건 이상 |
| Entity | 핵심 Entity/Synonym 등록 |
| FAQ | FAQ 5건 이상 Pack 반영 대상 |
| Action | SEARCH_DOC, NAVIGATE, GUIDE Action 등록 |
| 연결 | Intent-Action 연결 정상 |
| Pack Build | Export ZIP 생성 성공 |
| Pack Import | Runtime Pack Store 등록 성공 |
| 검증 | 대표 검증 질문 80% 이상 Pass |
| 활성화 | Active Pack 전환 성공 |
| Runtime QA | 대표 질문 80% 이상 기대 결과 |
| 개선 | 미응답 질문 개선 후보 전환 가능 |

## 10. 다음 단계

본 시나리오 기준으로 기반 설정 단계부터 테스트를 수행한 뒤, 실패 항목은 체크리스트에 기록합니다.

첫 테스트는 데이터 클린징 이후 `J-Brain_Manual.txt` Source 등록부터 진행하는 것을 권장합니다.
