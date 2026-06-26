# 12. WBS 및 단계별 수행계획

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | 폐쇄망 대응형 Lightweight NLU + Action 플랫폼 WBS 및 수행계획 |
| 작성일 | 2026-06-24 |
| 버전 | v2.0 |
| 작성 관점 | PM |
| 목적 | 대표님 지시 기반 내부 선행 프로젝트로 공통 NLU/Action 플랫폼 골격과 탄소중립플랫폼 Intent Pack PoC를 수행하기 위한 단계별 작업 정의 |
| 기준 문서 | 13_프로젝트목표_및_1차범위정의서.md, 12_Intent_Pack_표준정의서.md, 13_탄소중립플랫폼_Intent_Pack_v0.1.md |

---

## 2. 수행 방향

기존 WBS는 GraphRAG/LLM 기반 지식 Q&A 챗봇 구축을 기준으로 작성되었다. 본 개정안은 폐쇄망 대응형 Lightweight NLU + Action 플랫폼으로 방향을 전환하여, 1차 범위를 설계 산출물과 개발 PoC까지 포함하는 내부 선행 프로젝트로 재정의한다.

1차 수행 방향은 다음과 같다.

```text
공통 플랫폼은 NLU/Action Runtime 중심으로 개발하고,
서비스별 업무 정의는 Intent Pack으로 분리한다.
탄소중립플랫폼을 기준 서비스로 삼아
질문 분류, Entity 추출, Action 라우팅, Mock 응답까지 검증한다.
```

---

## 3. 1차 수행 일정

총 수행 기간은 6주 기준으로 계획한다.

| 주차 | 단계 | 핵심 목표 |
|---:|---|---|
| Week 1 | 기준선/상세설계 | 목표/범위 확정, WBS 개정, 질문셋/아키텍처/Schema 설계 착수 |
| Week 2 | Pack/도메인 설계 | 탄소중립 질문셋 v0.2, Entity Dictionary, Intent Pack JSON Schema 작성 |
| Week 3 | NLU PoC 개발 | Pack Loader, Intent Matcher, Entity Extractor, Confidence Router 개발 |
| Week 4 | Action PoC 개발 | Action Router, Mock Query Action, Navigation/Fallback 처리 개발 |
| Week 5 | 통합/검증 | Validation Questions 기반 Intent/Entity/Action 테스트 |
| Week 6 | 정리/확장계획 | PoC 결과 정리, 광고/한도 관리 시스템 확장 가이드 작성 |

---

## 4. 상세 WBS

| WBS ID | 단계 | 작업명 | 기간 | 담당 역할 | 선행 작업 | 산출물 | 비고 |
|---|---|---|:---:|---|---|---|---|
| **P100** | **PM/기준선** | 대표님 지시사항 기준 프로젝트 목표, 1차 범위, 제외 범위 정리 | W1 | PM | - | 프로젝트 목표 및 1차 범위 정의서 | 완료 |
| **P110** | **PM/기준선** | 기존 GraphRAG 중심 WBS를 NLU/Action 플랫폼 기준으로 개정 | W1 | PM | P100 | WBS 및 수행계획 v2.0 | 본 문서 |
| **P120** | **PM/관리** | 내부 의사결정 로그, 이슈/보류 목록 관리 체계 정의 | W1 | PM | P100 | 의사결정/이슈관리대장 | |
| **P130** | **PM/관리** | 1차 PoC 완료 기준 및 대표님 보고 기준 정의 | W1 | PM, QA | P100 | PoC 수용 기준 | |
| **P200** | **분석/BA** | 탄소중립 사용자 질문 50개 작성 | W1~W2 | BA | P100 | 탄소중립 표준 질문셋 v0.2 | 자체 가정 기반 |
| **P210** | **분석/BA** | 질문셋을 Intent 후보로 분류 | W2 | BA, AI | P200 | 질문-Intent 매핑표 | |
| **P220** | **분석/BA** | 탄소중립 Entity Dictionary v0.2 작성 | W2 | BA | P200 | Entity Dictionary v0.2 | 공장/현장/기간/Scope/지표/메뉴 |
| **P230** | **분석/BA** | 광고 플랫폼, 한도 관리 시스템 공통 Intent 유형 도출 | W6 | BA, PM | P210 | 서비스 확장 후보 Intent 목록 | |
| **P300** | **설계/TA** | 공통 NLU/Action 플랫폼 목표 아키텍처 작성 | W1~W2 | TA | P100 | 공통 NLU/Action 아키텍처 정의서 | |
| **P310** | **설계/TA** | Workspace/Service와 Intent Pack Version 결합 구조 정의 | W2 | TA, Backend | P300 | Pack Version 관리 설계 | |
| **P320** | **설계/TA** | Pack Import/Validation/Rollback 처리 흐름 정의 | W2~W3 | TA, Backend, 보안 | P310 | Pack 반입/검증/롤백 설계 | 폐쇄망 고려 |
| **P400** | **설계/Backend** | Intent Pack JSON Schema 초안 작성 | W1~W2 | Backend | P100 | JSON Schema 초안 | intents/entities/actions/routes/templates |
| **P410** | **설계/Backend** | Intent/Entity/Action/Pack Version 데이터 모델 초안 작성 | W2 | Backend | P400 | 데이터 모델 개정안 | |
| **P420** | **설계/Backend** | Intent Pack 관리 및 매칭 테스트 API 초안 작성 | W2 | Backend | P400 | API 명세 개정안 | |
| **P430** | **설계/Backend** | Action Runtime 요청/응답 인터페이스 설계 | W2~W3 | Backend | P420 | Action Runtime 인터페이스 | |
| **P440** | **설계/Backend** | SQL Template Runtime 보안 구조 설계 | W3 | Backend, 보안 | P430 | SQL Template 실행 설계 | Allowlist/Binding |
| **P500** | **개발/Backend** | Intent Pack Loader 개발 | W3 | Backend | P400 | Pack Loader 코드 | 탄소중립 Pack 로드 |
| **P510** | **개발/AI** | Lightweight Intent Matcher PoC 개발 | W3 | AI Engineer | P210, P500 | Intent Matcher 코드 | Top-1/Top-3 후보 반환 |
| **P520** | **개발/AI** | Rule 기반 Entity Extractor PoC 개발 | W3 | AI Engineer | P220 | Entity Extractor 코드 | 주요 Entity 추출 |
| **P530** | **개발/AI** | Confidence Router 개발 | W3~W4 | AI Engineer, Backend | P510 | Confidence 분기 코드 | High/Medium/Low/Very Low |
| **P540** | **개발/Backend** | Action Router 개발 | W4 | Backend | P430, P530 | Action Router 코드 | Intent → Action 매핑 |
| **P550** | **개발/Backend** | 탄소중립 Mock Query Action 3종 개발 | W4 | Backend | P540 | Mock Action 코드 | 배출량/전력/미입력 |
| **P560** | **개발/Backend** | Navigation Action Stub 개발 | W4 | Backend, Frontend | P540 | 화면 이동 응답 Stub | 실제 메뉴 ID는 TBD |
| **P570** | **개발/Backend** | Document/FAQ Fallback Stub 개발 | W4 | Backend, AI | P540 | Fallback 응답 Stub | 문서 검색 연계 전 |
| **P580** | **개발/Backend** | 미응답 질문 기록 기능 개발 | W4 | Backend | P570 | Unanswered Logging 코드 | 파일 또는 DB Stub |
| **P590** | **개발/Backend** | Intent Factory DB Core 및 Entity/Synonym CRUD 구현 | W5 | Backend | P400, P410 | DB Schema, CRUD API, Pack Import 확장 | 완료 |
| **P600** | **설계/Frontend** | 답변 카드 유형 정의 | W2~W3 | Frontend, PM | P100 | 답변 카드 UI 정의 | Data/Document/Navigate/Fallback |
| **P610** | **개발/Frontend** | PoC용 챗봇 응답 카드 표시 보완 | W4 | Frontend | P600, P550 | UI 코드 | Mock 응답 표시 |
| **P620** | **설계/Frontend** | 관리자 Intent/Entity/Action 관리 화면 범위 검토 | W5~W6 | Frontend, PM | P400 | 관리자 화면 영향도 | 2차 개발 후보 |
| **P630** | **개발/Frontend** | Intent/Entity/Synonym 관리 및 Pack Builder Draft 화면 구현 | W5 | Frontend | P590 | 관리자 화면 코드 | 완료 |
| **P700** | **보안** | SQL Template 실행 보안 기준 수립 | W3 | 보안, Backend | P440 | 보안 기준 | Injection/권한/마스킹 |
| **P710** | **보안** | Action 실행 및 로그 마스킹 기준 정의 | W3~W4 | 보안 | P430 | 로그/마스킹 정책 | |
| **P720** | **보안** | 다운로드 Action 1차 포함 여부 검토 | W5 | 보안, PM | P700 | 다운로드 Action 판단 근거 | 기본 보류 |
| **P800** | **QA** | Validation Questions v0.2 작성 | W2 | QA, BA | P200 | 검증 질문셋 | 50개 기준 |
| **P810** | **QA** | Intent/Entity 테스트 시나리오 작성 | W3 | QA, AI | P510, P520 | 테스트 시나리오 | |
| **P820** | **QA** | Action Routing 테스트 시나리오 작성 | W4 | QA, Backend | P540 | Action 테스트 시나리오 | |
| **P830** | **QA** | 통합 PoC 테스트 수행 | W5 | QA, Backend, AI, Frontend | P550~P610 | PoC 테스트 결과서 | |
| **P840** | **QA** | 결함/개선 과제 정리 | W5 | QA, PM | P830 | 결함 및 개선 과제 목록 | |
| **P900** | **정리/확장** | PoC 결과 요약 및 대표님 보고자료 작성 | W6 | PM | P830, P840 | PoC 결과 요약 | |
| **P910** | **정리/확장** | 광고 플랫폼/한도 관리 시스템 확장 전략 작성 | W6 | PM, BA, TA | P230, P900 | 서비스별 Pack 확장 가이드 | |
| **P920** | **정리/확장** | 2차 개발 범위 및 우선순위 도출 | W6 | PM, TA, Backend, AI | P900 | 2차 범위 정의서 | |

---

## 5. 담당자별 핵심 업무

[PM] 프로젝트 목표/범위 기준선 관리, WBS 개정, 이슈/보류 관리, 대표님 보고자료 작성

[BA] 탄소중립 질문셋 작성, Intent 분류, Entity Dictionary 보강, 타 서비스 확장 후보 도출

[TA/아키텍트] 공통 NLU/Action 아키텍처, Pack Version 관리, Import/Validation/Rollback 구조 정의

[Backend] Intent Pack Schema, Pack Loader, Action Runtime, Mock Action, 미응답 기록 기능 개발

[AI Engineer] Intent Matcher, Entity Extractor, Confidence Router, 매칭 테스트 스크립트 개발

[Frontend] 답변 카드 UI 정의, PoC용 응답 카드 표시, 관리자 화면 영향도 검토

[QA] Validation Questions, Intent/Entity/Action 테스트, 통합 PoC 검증, 개선 과제 정리

[보안] SQL Template 보안, Action 로그/마스킹, 다운로드 Action 정책 검토

---

## 6. 주요 마일스톤

| 마일스톤 | 시점 | 완료 기준 |
|---|---|---|
| M1. 기준선 확정 | Week 1 말 | 목표/범위/제외범위, WBS v2.0 작성 완료 |
| M2. Pack 설계 완료 | Week 2 말 | 질문셋 v0.2, Entity Dictionary v0.2, JSON Schema 초안 완료 |
| M3. NLU PoC 완료 | Week 3 말 | Pack Loader, Intent Matcher, Entity Extractor, Confidence Router 동작 |
| M4. Action PoC 완료 | Week 4 말 | Action Router, Mock Query, Navigation, Fallback, 미응답 기록 동작 |
| M5. 통합 검증 완료 | Week 5 말 | Validation Questions 기반 테스트 결과 및 개선 과제 정리 |
| M6. 확장 계획 완료 | Week 6 말 | 대표님 보고자료, 서비스별 Pack 확장 가이드, 2차 범위 정의 |

---

## 7. 1차 PoC 수용 기준

| 항목 | 기준 |
|---|---:|
| Intent Top-1 정확도 | 80% 이상 |
| Intent Top-3 정확도 | 90% 이상 |
| Entity 추출 정확도 | 85% 이상 |
| Action Routing 성공률 | 95% 이상 |
| 잘못된 Action 실행률 | 1% 이하 |
| Fallback 적정 처리율 | 90% 이상 |
| Mock Query 응답 성공률 | 95% 이상 |
| 미응답 질문 기록 성공률 | 100% |

---

## 8. 1차 제외 및 보류 항목

| 구분 | 항목 | 처리 |
|---|---|---|
| 실제 운영 연동 | 실제 고객/운영 DB 연동 | 제외 |
| SQL 확정 | 운영 SQL Template 확정 | 보류 |
| 메뉴 연동 | 실제 메뉴 ID/URL 연동 | 보류 |
| 다운로드 | 엑셀/보고서 다운로드 운영 기능 | 보류 |
| 변경성 업무 | 등록/수정/삭제 Action | 제외 |
| 권한 변경 | 사용자 권한 변경 Action | 제외 |
| 외부 LLM | OpenAI/Azure OpenAI 등 외부 API 연동 | 제외 |
| 전체 서비스 적용 | 광고/한도 관리 시스템 Pack 완성 | 보류 |
| 운영 배포 | 실제 사용자 대상 오픈 | 제외 |

---

## 9. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 질문셋 품질 부족 | Intent 정확도 저하 | 내부 가정 질문 50개 작성 후 반복 보강 |
| Entity 동의어 부족 | 공장/현장/지표 인식 실패 | Entity Dictionary v0.2부터 동의어 중심 보강 |
| Mock과 운영 데이터 차이 | 2차 연동 시 재작업 가능 | 1차는 인터페이스 중심으로 개발 |
| Action 오실행 | 업무 신뢰도 저하 | 조회형 Action도 확인 후 실행 정책 적용 |
| 범위 확장 | 일정 지연 | 다운로드/등록/수정/삭제는 1차 제외 |
| 폐쇄망 반입 요건 누락 | 운영 적용 지연 | Pack Import/Validation/Rollback 설계를 W2~W3에 선반영 |

---

## 10. 다음 작업

본 WBS 개정 이후 즉시 착수할 다음 작업은 다음과 같다.

1. [BA] 탄소중립 표준 질문셋 v0.2 작성
2. [Backend] Intent Pack JSON Schema 초안 작성
3. [TA/아키텍트] 공통 NLU/Action 아키텍처 정의서 작성
4. [AI Engineer] Intent Matcher PoC 방식 결정 및 설계서 작성
5. [QA] Validation Questions v0.2 및 테스트 기준 작성

---

## 11. 2026-06-26 현재 구현 반영

이번 개발을 통해 WBS의 1차 PoC 범위가 단순 Pack 파일 테스트에서 DB 기반 운영관리 초안까지 확장되었다.

| 구분 | 반영 내용 | 상태 |
|---|---|---|
| Intent DB Core | Intent, Example, Action Link, Source Scope DB 테이블 및 CRUD API 구현 | 완료 |
| Entity/Synonym 관리 | Entity 정의, Canonical Value, Synonym 사전 DB 테이블 및 CRUD API 구현 | 완료 |
| Intent-Entity 연결 | Intent 상세 화면에서 Entity 후보 연결 및 저장 가능 | 완료 |
| Pack Import 확장 | 기존 JSON Pack Import 시 Intent, Entity/Synonym, Action Parameter 기반 Entity Link 적재 | 완료 |
| Pack Builder Draft | DB의 Intent/Example/Entity/Synonym/Action Parameter/Source Scope를 JSON Pack 초안으로 조회 | 완료 |
| Runtime Pack 선택 흐름 | Runtime 테스트 화면에서 파일 Pack과 DB Draft Pack 확인 흐름 제공 | 완료 |

잔여 작업과 리스크는 다음과 같다.

| 항목 | 현재 상태 | 후속 방향 |
|---|---|---|
| Pack ZIP 배포 | 미구현 | Pack Draft를 파일 구조로 Export하고 ZIP 패키지 생성 기능 구현 |
| Pack Repository | 미구현 | 버전, 승인 상태, 배포 이력을 관리하는 Repository 테이블/화면 구현 |
| Runtime DB 직접 연동 | 보류 | 운영 원칙상 Runtime은 검증된 Pack 기반으로 유지하고, DB는 Pack Build 전 관리 저장소로 사용 |
| 실제 고객 API/SQL 실행 | 보류 | 승인된 API/SQL Template, 권한, 감사 로그 설계 후 연결 |
| 운영 권한/감사 | 일부 보류 | Entity/Intent 변경 이력과 Pack 승인 Workflow 추가 필요 |
