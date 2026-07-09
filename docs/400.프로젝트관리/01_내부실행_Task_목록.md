# 01. 내부 실행 Task 목록

## 1. 문서 개요
| 항목 | 내용 |
|---|---|
| 문서명 | 내부 실행 Task 목록 |
| 작성일 | 2026-06-24 |
| 버전 | v0.2 |
| 목적 | 대표님 지시 기반 내부 선행 프로젝트로 폐쇄망 대응형 Lightweight NLU + Action 플랫폼 1차 목표를 추진하기 위한 담당자별 실행 업무 정의 |
| 적용 기준 | 공통 NLU/Action 플랫폼 구조 정의, 탄소중립플랫폼 Intent Pack 샘플 구축, 타 서비스 확장 가능한 Intent Pack 표준 수립 |
| 현재 상태 | C-lite MVP 1차 개발 완료, 산출물 정리 및 시연 준비 단계 |

---

## 2. 진행 전제

본 프로젝트는 외부 고객 협의형 프로젝트가 아니라 대표님 지시 기반의 내부 선행 프로젝트로 진행한다. 따라서 고객 확인 대기 없이 PM/개발팀이 합리적 가정값을 수립하고, 탄소중립플랫폼을 기준 서비스로 삼아 표준 구조와 PoC 가능 범위를 먼저 확정한다.

1차 목표는 다음과 같다.

```text
1. 공통 NLU/Action 플랫폼 구조 개발 방향 확정
2. 탄소중립플랫폼 Intent Pack v0.1 구체화
3. 서비스별 Intent Pack 표준 검증
4. 이후 광고 플랫폼, 한도 관리 시스템 등으로 복제 적용 가능한 기준 마련
```

---

## 3. 담당자별 진행 업무

[PM] 대표님 지시사항을 기준으로 프로젝트 목표, 1차 범위, 제외 범위 정리

[PM] 기존 GraphRAG 중심 WBS를 Lightweight NLU + Action 플랫폼 기준 WBS로 개정

[PM] `12_Intent_Pack_표준정의서.md`, `13_탄소중립플랫폼_Intent_Pack_v0.1.md` 기준으로 내부 검토회의 진행

[PM] 탄소중립플랫폼 1차 MVP 범위를 문서/FAQ 안내, 화면 이동, 조회형 Action 일부로 잠정 확정

[PM] 등록/수정/삭제, 권한 변경 등 변경성 Action을 1차 범위 제외 또는 보류로 관리

[PM] 내부 의사결정 로그, 이슈 목록, 보류 항목을 프로젝트관리 폴더에 관리

[서비스기획/BA] 탄소중립플랫폼 기준 사용자 질문 예시 50개를 자체 작성

[서비스기획/BA] 사용자 질문을 Intent별로 분류하고 중복/유사 Intent를 정리

[서비스기획/BA] 탄소중립플랫폼 Entity Dictionary v0.2 작성

[서비스기획/BA] 공장, 현장, Scope, 지표, 메뉴, 보고서, 오류 유형의 표준값과 동의어 정리

[서비스기획/BA] 광고 플랫폼, 한도 관리 시스템에 적용 가능한 공통 Intent 유형을 도출

[TA/아키텍트] 공통 NLU/Action 플랫폼 목표 아키텍처 초안 작성

[TA/아키텍트] 기존 Workspace 구조와 Intent Pack 버전 관리 구조의 결합 방안 정의

[TA/아키텍트] Pack Import, Validation, Rollback 처리 흐름 정의

[TA/아키텍트] 폐쇄망 반입 패키지 구조와 운영 환경 적용 방식을 설계

[Backend] Intent Pack JSON Schema 초안 작성

[Backend] Intent, Entity, Action, SQL Template, Screen Route를 저장할 데이터 모델 초안 작성

[Backend] Action Registry Runtime 인터페이스 초안 작성

[Backend] SQL Template Runtime의 Allowlist, Parameter Binding, 권한 검증 구조 설계

[Backend] 탄소중립 조회형 Action 3개에 대한 Mock API 또는 Mock Repository 작성

[Backend] 미응답 질문 등록 API 초안 작성

[AI Engineer] Lightweight Intent Matcher PoC 구조 설계

[AI Engineer] Rule 기반 Entity Extractor 초안 설계

[AI Engineer] Intent 예시 질문 기반 유사도 매칭 방식 검토

[AI Engineer] Confidence Policy를 High/Medium/Low/Very Low 기준으로 구현 가능한 형태로 정리

[AI Engineer] 탄소중립 Validation Questions v0.1 기준 매칭 테스트 스크립트 초안 작성

[Frontend] 챗봇 답변 카드 유형을 데이터 조회, 문서 안내, 화면 이동, 오류 안내, Fallback으로 정리

[Frontend] 화면 이동 버튼 UI와 메뉴 Route 처리 방식 검토

[Frontend] 관리자 화면에 Intent/Entity/Action 관리 메뉴 추가 필요 범위 검토

[Frontend] 탄소중립 Intent Pack을 관리자가 확인할 수 있는 목록 화면 초안 검토

[QA] Intent/Entity 검증 질문셋 v0.2 작성

[QA] Intent Top-1, Top-3, Entity 추출, Fallback 적정성 기준으로 테스트 케이스 작성

[QA] Action 실행 테스트 시나리오 작성

[QA] 권한 검증, 잘못된 Action 실행 방지, SQL Injection 방지 테스트 항목 작성

[보안] SQL Template 실행 보안 기준 수립

[보안] 로그 저장 시 질문 원문, Entity, Action 실행 이력의 마스킹 기준 정의

[보안] 다운로드 Action의 1차 MVP 포함 여부 검토

[보안] 폐쇄망 반입 패키지의 Manifest, Checksum, Signature 검증 기준 정의

---

## 4. 우선순위별 Task

### 4.1 P0: 즉시 착수
| 담당 | Task | 완료 기준 | 상태 |
|---|---|---|---|
| PM | 기존 WBS 개정 방향 정리 | NLU/Action 기준 WBS 초안 작성 | 완료 |
| 서비스기획/BA | 탄소중립 사용자 질문 50개 작성 | 질문셋 v0.2 초안 작성 | 1차 완료 |
| Backend | Intent Pack JSON Schema 초안 작성 | JSON 파일별 필수 필드 정의 | 완료 |
| AI Engineer | Intent Matcher PoC 방식 결정 | rule/embedding/hybrid 중 1차 방식 선정 | 완료 |
| TA/아키텍트 | 공통 NLU/Action 아키텍처 초안 작성 | 구성도 및 처리 흐름 작성 | 완료 |

### 4.2 P1: 1차 PoC 준비
| 담당 | Task | 완료 기준 | 상태 |
|---|---|---|---|
| BA | Entity Dictionary v0.2 작성 | 표준값/동의어/코드 매핑 초안 | 1차 완료 |
| Backend | Action Registry Runtime 인터페이스 설계 | Action 실행 요청/응답 구조 정의 | 완료 |
| Backend | Mock 조회 Action 3종 작성 | 배출량/전력/미입력 Mock 결과 반환 | 완료 |
| AI Engineer | Validation Questions 매칭 테스트 작성 | 질문별 기대 Intent/Entity 비교 가능 | 완료 |
| Frontend | 답변 카드 유형 UI 검토 | 카드별 표시 항목 정의 | 완료 |
| QA | Intent/Entity 테스트 시나리오 작성 | 수용 기준별 테스트 케이스 작성 | 완료 |

### 4.3 P2: PoC 이후 확장
| 담당 | Task | 완료 기준 | 상태 |
|---|---|---|---|
| Backend | Pack Importer/Validator 설계 | Manifest/Checksum 검증 흐름 정의 | 후속 |
| Backend | Pack Rollback 설계 | 이전 버전 복구 절차 정의 | 후속 |
| Frontend | 관리자 Intent 관리 화면 설계 | Intent 목록/상세/테스트 화면 정의 | 후속 |
| 보안 | 다운로드 Action 정책 정의 | 1차 포함/보류 판단 근거 작성 | 후속 |
| PM | 광고/한도 관리 시스템 확장 전략 작성 | 서비스별 Pack 복제 적용 가이드 초안 | 후속 |

---

## 5. 2026-06-25 기준 구현 완료 현황

현재 C-lite MVP 1차 개발은 완료 상태로 판단한다. 완료 범위는 다음과 같다.

| 구분 | 완료 내용 | 검증 근거 |
|---|---|---|
| Intent Pack | 탄소중립플랫폼 기준 `netzero-intent-pack-v0.1.0` JSON 구조 생성 | Pack Loader 테스트 통과 |
| Pack Runtime | Intent Pack Loader 구현 및 Manifest/참조 무결성 검증 | `test_intent_pack_loader.py` |
| NLU | 로컬 CPU 기반 Intent Matcher 구현 | `test_intent_matcher.py` |
| Entity | 공장/현장, 메뉴, Scope, 기간, 주제, 배출계수 추출 | Validation Runner entity accuracy 100% |
| Confidence | High/Medium/Low/Very Low 기준 분기 | Action Router fallback 차단 테스트 |
| Action | Navigation/Search Doc/Query Mock Action Router 구현 | `test_action_router.py` |
| Navigation | J-Brain 관리자 화면 5개 route 연결 | `/admin/dashboard`, `/admin/sources`, `/admin/jobs`, `/admin/prompt/test`, `/admin/logs` |
| Search Doc | Pack 내 FAQ/승인 문서 기반 로컬 검색 | `test_search_doc_action.py` |
| Query Mock | 배출량/전력/미입력 현황 Mock 조회 | `test_query_mock_action.py` |
| Logging | Low/Very Low fallback 질문 JSONL 저장 | `test_unanswered_logger.py` |
| QA | Pack validation questions 자동 검증 | `test_validation_runner.py` |
| Frontend | 챗봇 테스트 화면에서 Navigate/Search/Query/Fallback 카드 표시 | 브라우저 수동 검증 |

검증 결과는 다음과 같다.

```text
Validation Questions: 14개
Top-1 Accuracy: 100%
Top-3 Accuracy: 100%
Entity Accuracy: 100%
Wrong Action Execution Rate: 0%
External LLM/API Calls: 0건
Customer Data External Transfer: 0건
```

---

## 6. 이번 주 실행 순서

1. [완료] 기존 WBS를 NLU/Action 플랫폼 기준으로 개정한다.
2. [완료] 탄소중립 사용자 질문셋과 Intent Pack v0.1을 작성한다.
3. [완료] Intent Pack JSON 구조와 Loader를 구현한다.
4. [완료] Intent Matcher, Entity Extractor, Confidence Policy를 구현한다.
5. [완료] Action Router와 3종 Action을 구현한다.
6. [완료] Validation Runner와 Unanswered Logging을 구현한다.
7. [진행 예정] 대표님 시연용 리허설과 보고 자료를 정리한다.

---

## 7. 대표님 보고용 요약

```text
현재 단계는 내부 선행 표준화의 C-lite MVP 1차 개발 완료 단계입니다.
외부 LLM/API 없이 Intent Pack, 로컬 Intent Matcher, Action Router 구조로
탄소중립플랫폼 파일럿 기준 화면 이동, 문서 검색, 제한 조회, Fallback 로그를 검증했습니다.
다음 단계는 대표님 시연 리허설과 타 프로젝트 확장 적용 계획 수립입니다.
```

---

## 8. 다음 산출물

| 순서 | 산출물 | 담당 |
|---:|---|---|
| 1 | 대표님 시연 스크립트 | PM |
| 2 | 시연용 테스트 질문/결과표 | QA/AI |
| 3 | 타 프로젝트 Intent Pack 확장 가이드 | PM/TA |
| 4 | Pack Import/Export 운영 설계 | Backend |
| 5 | 관리자 Intent Pack 관리 화면 설계 | Frontend |
| 6 | 보안/반입 패키지 정책 상세화 | 보안/TA |
