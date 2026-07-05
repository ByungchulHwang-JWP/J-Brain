# 다음 작업 프롬프트: 미응답 분석 및 FAQ 후보 전환 v0.8

`$superpowers:subagent-driven-development`

현재 구현된 JWP Intent Factory FAQ 관리 v0.1, FAQ Runtime 검색 연계 v0.7, Pack Export/Import/Validation/Approval/Active 기능을 기준으로 다음 단계 구현을 진행해 주세요.

## 목표

1. Runtime에서 답변하지 못한 질문을 운영자가 확인할 수 있는 미응답 분석 화면을 구현합니다.
2. 미응답 질문을 FAQ 후보로 전환할 수 있게 합니다.
3. FAQ 후보를 검토하여 실제 FAQ로 승격할 수 있는 1차 흐름을 제공합니다.
4. FAQ 후보 상태를 `new`, `reviewing`, `approved`, `converted`, `rejected`, `archived` 기준으로 관리합니다.
5. FAQ 후보가 실제 FAQ로 전환되면 Pack Build → Export → Import → Validation → Approval → Active 흐름에서 반영 여부를 추적할 수 있게 합니다.
6. 운영자가 FAQ 후보와 기존 FAQ/Intent 중복 여부를 판단할 수 있도록 기본 검색 또는 필터를 제공합니다.

## 구현 순서

1. 현재 Backend 테스트와 Frontend 빌드를 재실행하여 기준선을 확인합니다.
2. `unanswered_questions.jsonl` 조회 API를 추가하거나 기존 로그 구조를 DB 후보 구조와 연결합니다.
3. `faq_candidates` API를 보강합니다.
   - 목록 조회
   - 상세 조회
   - 등록/수정
   - 상태 변경
   - FAQ 전환
4. `/admin/operations/unanswered` 화면을 실제 목록/필터/상태 변경 화면으로 구현합니다.
5. FAQ 후보 상세에서 실제 FAQ 생성 화면으로 이어지는 UX를 구현합니다.
6. FAQ 전환 후 Pack Builder의 FAQ 건수와 Runtime QA 검색 결과에서 반영 여부를 확인합니다.
7. WBS 및 개발 계획 문서에 완료 상태와 남은 리스크를 반영합니다.

## 수용 기준

- 기존 Backend 테스트가 모두 통과해야 합니다.
- 신규 미응답/FAQ 후보 API 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- 미응답 질문을 화면에서 확인하고 FAQ 후보로 등록할 수 있어야 합니다.
- FAQ 후보를 실제 FAQ로 전환할 수 있어야 합니다.
- 전환된 FAQ가 Pack Export ZIP의 `knowledge/faqs.json`에 포함되어야 합니다.
- Active Pack 기준 Runtime QA에서 전환된 FAQ 기반 답변 근거를 확인할 수 있어야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 Runtime 구조를 유지해야 합니다.

## 제외 범위

- 외부 LLM 기반 FAQ 자동 생성
- 고객 원문 데이터 외부망 전송
- 다중 승인 결재선 완성
- 전자서명/암호화
- 실제 운영 DB Query 실행

## 완료 후

- 화면에서 확인 가능한 변경점과 테스트 기준을 한글로 요약해 주세요.
- 다음 단계 구현 프롬프트를 생성해 주세요.
