# J-Brain 챗봇 구축 테스트 체크리스트

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 문서명 | J-Brain 챗봇 구축 테스트 체크리스트 |
| 작성일 | 2026-06-30 |
| 버전 | v1.0 |
| 대상 프로젝트 | J-Brain |
| 사용 목적 | 기반 설정부터 Runtime QA까지 테스트 수행 결과를 단계별로 기록 |
| 연계 문서 | `J-Brain_챗봇_구축테스트_시나리오.md` |

## 2. 테스트 수행 정보

| 항목 | 기록 |
|---|---|
| 테스트 수행일 |  |
| 테스트 수행자 |  |
| 테스트 환경 | 로컬 개발 환경 |
| 프론트엔드 URL | `http://localhost:5174` |
| 백엔드 URL | `http://localhost:8000/api/v1` |
| 대상 프로젝트 | J-Brain |
| Source 기준 파일 | `backend/app_data/J-Brain_Manual.txt` |
| 테스트 시작 시각 |  |
| 테스트 종료 시각 |  |
| 최종 결과 | Pass / Fail / 보류 |

## 3. 사전 점검 체크리스트

| 번호 | 점검 항목 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|
| PRE-01 | 백엔드 서버 실행 | API 요청 가능 |  |  |
| PRE-02 | 프론트엔드 서버 실행 | 로그인 화면 접근 가능 |  |  |
| PRE-03 | 관리자 로그인 | 관리자 화면 진입 가능 |  |  |
| PRE-04 | 좌측 메뉴 표시 | 구축 워크플로우/관리 기능/운영 분석/시스템 관리 표시 |  |  |
| PRE-05 | J-Brain 프로젝트 존재 | 프로젝트 목록에서 J-Brain 확인 |  |  |
| PRE-06 | 운영 매뉴얼 파일 준비 | `J-Brain_Manual.txt` 최신 내용 반영 |  |  |
| PRE-07 | 기존 테스트 데이터 정리 여부 확인 | J-Brain 기준 테스트 가능 상태 |  |  |

## 4. 1단계 기반 설정 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST1-01 | 프로젝트 선택/목록 진입 | `/admin/workflow/projects` | J-Brain 프로젝트 표시 |  |  |
| ST1-02 | J-Brain 프로젝트 선택 | 프로젝트 선택/목록 | 프로젝트 상세 워크플로우 진입 |  |  |
| ST1-03 | 기반 설정 화면 진입 | `/admin/workflow/projects/J-Brain/stages/1` | 1단계 화면 표시 |  |  |
| ST1-04 | 프로젝트 ID 확인 | 기반 설정 | `J-Brain` 표시 |  |  |
| ST1-05 | 프로젝트명 확인 | 기반 설정 | J-Brain 또는 운영 기준명 표시 |  |  |
| ST1-06 | 프로젝트 상태 확인 | 기반 설정 | 활성 또는 테스트 가능 상태 |  |  |
| ST1-07 | 다음 단계 이동 가능 여부 | 기반 설정 | 2단계 지식 준비 이동 가능 |  |  |

## 5. 2단계 지식 준비 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST2-01 | Source 관리 진입 | `/admin/knowledge/sources` | Source 목록 표시 |  |  |
| ST2-02 | J-Brain Source 등록 | Source 관리 | `J-Brain_Manual.txt` 등록 |  |  |
| ST2-03 | Source 상태 확인 | Source 관리 | pending/active/success 등 상태 표시 |  |  |
| ST2-04 | 벡터화 작업 실행 | Source 관리 | 작업 생성 |  |  |
| ST2-05 | 벡터화 작업 현황 확인 | `/admin/knowledge/jobs` | 작업 상태 표시 |  |  |
| ST2-06 | 벡터화 성공 확인 | 벡터화 작업 현황 | SUCCESS 또는 검색 가능 상태 |  |  |
| ST2-07 | 검색 테스트 진입 | `/admin/knowledge/search-test` | 검색 입력 가능 |  |  |
| ST2-08 | 대표 질문 검색 | 검색 테스트 | Source 근거 반환 |  | 질문: J-Brain은 무엇인가요? |
| ST2-09 | Source 근거 품질 확인 | 검색 테스트 | 운영 매뉴얼 내용과 일치 |  |  |

## 6. 3단계 의도 설계 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST3-01 | Intent 관리 진입 | `/admin/intent-factory/intents` | Intent 목록 표시 |  |  |
| ST3-02 | 프로젝트 선택 | Intent 관리 | J-Brain 선택 |  |  |
| ST3-03 | J-Brain 소개 Intent 등록 | Intent 등록 | INT-JB-DOC-INTRO 등록 |  |  |
| ST3-04 | Source 관리 Intent 등록 | Intent 등록 | INT-JB-DOC-SOURCE 등록 |  |  |
| ST3-05 | Pack 안내 Intent 등록 | Intent 등록 | INT-JB-DOC-PACK 등록 |  |  |
| ST3-06 | Runtime QA Intent 등록 | Intent 등록 | INT-JB-DOC-RUNTIME 등록 |  |  |
| ST3-07 | 화면 이동 Intent 등록 | Intent 등록 | NAVIGATE 계열 Intent 등록 |  |  |
| ST3-08 | Intent 목록 조회 | Intent 관리 | 등록 Intent 표시 |  |  |

## 7. 4단계 질문 커버리지 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST4-01 | Intent 상세 진입 | Intent 상세 | Example 편집 가능 |  |  |
| ST4-02 | J-Brain 소개 Example 등록 | Intent 상세 | 3건 이상 등록 |  |  |
| ST4-03 | Source 관리 Example 등록 | Intent 상세 | 3건 이상 등록 |  |  |
| ST4-04 | Pack 관련 Example 등록 | Intent 상세 | 3건 이상 등록 |  |  |
| ST4-05 | Runtime QA Example 등록 | Intent 상세 | 3건 이상 등록 |  |  |
| ST4-06 | NAVIGATE Example 등록 | Intent 상세 | 화면 이동 표현 등록 |  |  |
| ST4-07 | 중복 Example 확인 | Intent 상세 | 중복/모호 표현 없음 |  |  |

## 8. 5단계 용어 사전 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST5-01 | Entity/Synonym 관리 진입 | `/admin/intent-factory/entities` | Entity 목록 표시 |  |  |
| ST5-02 | SOURCE Entity 등록 | Entity 관리 | Source 동의어 포함 |  |  |
| ST5-03 | INTENT Entity 등록 | Entity 관리 | Intent 동의어 포함 |  |  |
| ST5-04 | PACK Entity 등록 | Entity 관리 | Pack 동의어 포함 |  |  |
| ST5-05 | RUNTIME Entity 등록 | Entity 관리 | Runtime 동의어 포함 |  |  |
| ST5-06 | FAQ Entity 등록 | Entity 관리 | FAQ 동의어 포함 |  |  |
| ST5-07 | ACTION Entity 등록 | Entity 관리 | Action 동의어 포함 |  |  |
| ST5-08 | Intent-Entity 연결 확인 | Intent 상세 | Entity 후보 연결 가능 |  |  |

## 9. 6단계 답변 근거 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST6-01 | FAQ 관리 진입 | `/admin/intent-factory/faqs` | FAQ 목록 표시 |  |  |
| ST6-02 | FAQ-JB-001 등록 | FAQ 관리 | J-Brain 개요 FAQ 등록 |  |  |
| ST6-03 | FAQ-JB-002 등록 | FAQ 관리 | 구축 워크플로우 FAQ 등록 |  |  |
| ST6-04 | FAQ-JB-003 등록 | FAQ 관리 | Source FAQ 등록 |  |  |
| ST6-05 | FAQ-JB-004 등록 | FAQ 관리 | Intent FAQ 등록 |  |  |
| ST6-06 | FAQ-JB-005 등록 | FAQ 관리 | FAQ 반영 절차 FAQ 등록 |  |  |
| ST6-07 | Pack 반영 옵션 확인 | FAQ 관리 | Pack Export 반영 활성 |  |  |
| ST6-08 | FAQ 검색 가능성 확인 | 검색 테스트 또는 Runtime QA | FAQ 기반 근거 확인 |  |  |

## 10. 7단계 실행 연결 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST7-01 | Action 관리 진입 | `/admin/intent-factory/actions` | Action 목록 표시 |  |  |
| ST7-02 | SEARCH_DOC Action 등록 | Action 관리 | ACT-JB-SEARCH-DOC 등록 |  |  |
| ST7-03 | Source 화면 이동 Action 등록 | Action 관리 | ACT-JB-GO-SOURCE 등록 |  |  |
| ST7-04 | Intent 화면 이동 Action 등록 | Action 관리 | ACT-JB-GO-INTENT 등록 |  |  |
| ST7-05 | Pack Builder 이동 Action 등록 | Action 관리 | ACT-JB-GO-PACK-BUILDER 등록 |  |  |
| ST7-06 | Runtime QA 이동 Action 등록 | Action 관리 | ACT-JB-GO-RUNTIME-QA 등록 |  |  |
| ST7-07 | Intent-Action 연결 확인 | 실행 연결 | 미연결 Intent 0건 |  |  |
| ST7-08 | 미사용 Action 확인 | 실행 연결 | 불필요 Action 없음 또는 사유 기록 |  |  |

## 11. 8단계 Pack 품질검증 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST8-01 | Pack 검증 진입 | `/admin/packs/validation` | 검증 질문 목록 표시 |  |  |
| ST8-02 | 검증 질문 등록 | Pack 검증 | 5건 이상 등록 |  |  |
| ST8-03 | 기대 Intent 입력 | Pack 검증 | expected_intent_id 저장 |  |  |
| ST8-04 | 기대 Action 입력 | Pack 검증 | expected_action_id 저장 |  |  |
| ST8-05 | 최소 Confidence 입력 | Pack 검증 | min_confidence_score 저장 |  |  |
| ST8-06 | 검증 대상 Pack 선택 | Pack 검증 | Runtime Pack 또는 DB Draft 선택 |  |  |
| ST8-07 | 검증 실행 | Pack 검증 | Pass/Fail 결과 표시 |  |  |
| ST8-08 | 실패 원인 기록 | Pack 검증 | 보완 대상 기록 |  |  |

## 12. 9단계 Runtime 시뮬레이션 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST9-01 | Runtime QA 진입 | `/admin/runtime/qa` | 대화 테스트 화면 표시 |  |  |
| ST9-02 | 프로젝트 선택 | Runtime QA | J-Brain 선택 |  |  |
| ST9-03 | Pack 모드 선택 | Runtime QA | Active Pack 또는 파일 Pack 선택 |  |  |
| ST9-04 | J-Brain 개요 질문 | Runtime QA | 개요 답변 반환 |  |  |
| ST9-05 | FAQ 반영 질문 | Runtime QA | Pack 반영 절차 답변 반환 |  |  |
| ST9-06 | Pack Builder 이동 질문 | Runtime QA | NAVIGATE Action Card 반환 |  |  |
| ST9-07 | Top-3 Intent 확인 | Runtime QA | 기대 Intent 포함 |  |  |
| ST9-08 | FAQ/Source 근거 확인 | Runtime QA | 근거 카드 표시 |  |  |

## 13. 10단계 Pack Build 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST10-01 | Pack Builder 진입 | `/admin/packs/builder` | Pack Builder 화면 표시 |  |  |
| ST10-02 | 프로젝트 선택 | Pack Builder | J-Brain 선택 |  |  |
| ST10-03 | Draft 생성 | Pack Builder | Draft JSON 표시 |  |  |
| ST10-04 | Count 확인 | Pack Builder | Intent/Entity/FAQ/Action Count 표시 |  |  |
| ST10-05 | Export 실행 | Pack Builder | Export 결과 표시 |  |  |
| ST10-06 | Validation 확인 | Pack Builder | valid 또는 오류 메시지 표시 |  |  |
| ST10-07 | ZIP 다운로드 | Pack Builder | ZIP 다운로드 가능 |  |  |

## 14. 11단계 배포/활성화 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST11-01 | Pack Repository 진입 | `/admin/packs/repository` | Repository 화면 표시 |  |  |
| ST11-02 | Export 이력 확인 | Pack Repository | J-Brain Pack Export 표시 |  |  |
| ST11-03 | Import 실행 | Pack Repository | Runtime Store 등록 |  |  |
| ST11-04 | Runtime Pack 상태 확인 | Pack Repository | validated 또는 imported 상태 |  |  |
| ST11-05 | Approve 실행 | Pack Repository | approved 상태 |  |  |
| ST11-06 | Activate 실행 | Pack Repository | Active Pack 전환 |  |  |
| ST11-07 | Rollback 후보 확인 | Pack Repository | 이전 Pack 표시 또는 없음 |  |  |
| ST11-08 | Audit 로그 확인 | Pack Repository 또는 감사 로그 | Import/Approve/Activate 로그 표시 |  |  |

## 15. 12단계 운영 분석/개선 체크리스트

| 번호 | 점검 항목 | 화면 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|---|
| ST12-01 | 미응답 질문 생성 | Runtime QA | 낮은 신뢰도 질문 입력 |  |  |
| ST12-02 | 미응답 분석 진입 | `/admin/operations/unanswered` | 미응답 목록 표시 |  |  |
| ST12-03 | 미응답 상세 확인 | 미응답 분석 | 질문, Intent 후보, Confidence 표시 |  |  |
| ST12-04 | FAQ 후보 전환 | 미응답 분석 | FAQ 후보 생성 |  |  |
| ST12-05 | 개선 요청 등록 | 개선 요청 관리 | 개선 요청 목록 표시 |  |  |
| ST12-06 | Pack 개선 이력 확인 | Pack 개선 이력 | 개선 후보 추적 가능 |  |  |

## 16. 대표 질문 검증 체크리스트

| 번호 | 질문 | 기대 결과 | 결과 | 비고 |
|---:|---|---|---|---|
| Q-01 | J-Brain은 무엇인가요? | J-Brain 개요 설명 |  |  |
| Q-02 | 구축 워크플로우는 무엇인가요? | 12단계 설명 |  |  |
| Q-03 | Source는 무엇인가요? | Source 정의와 벡터화 설명 |  |  |
| Q-04 | Intent는 무엇인가요? | Intent/Example 설명 |  |  |
| Q-05 | FAQ를 추가하면 바로 반영되나요? | Pack 반영 절차 설명 |  |  |
| Q-06 | Pack은 무엇인가요? | Runtime 배포 단위 설명 |  |  |
| Q-07 | Runtime QA는 무엇을 확인하나요? | Intent/Action/근거 확인 설명 |  |  |
| Q-08 | Source 관리 화면으로 이동해줘 | Source 관리 NAVIGATE Card |  |  |
| Q-09 | Intent 관리 열어줘 | Intent 관리 NAVIGATE Card |  |  |
| Q-10 | Pack Builder 화면으로 이동해줘 | Pack Builder NAVIGATE Card |  |  |
| Q-11 | Runtime QA 화면 보여줘 | Runtime QA NAVIGATE Card |  |  |
| Q-12 | 미응답 분석은 왜 필요한가요? | 개선 후보 관리 목적 설명 |  |  |

## 17. 결함 기록표

| 결함 ID | 단계 | 화면 | 입력값 | 기대 결과 | 실제 결과 | 심각도 | 조치 상태 |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

## 18. 최종 판정

| 구분 | 기준 | 결과 | 비고 |
|---|---|---|---|
| 기반 설정 | 프로젝트 선택 및 정보 확인 |  |  |
| 지식 준비 | Source 등록 및 검색 가능 |  |  |
| Intent 설계 | 대표 Intent 등록 |  |  |
| 질문 커버리지 | Example 보강 |  |  |
| 용어 사전 | Entity/Synonym 등록 |  |  |
| 답변 근거 | FAQ 등록 및 Pack 반영 |  |  |
| 실행 연결 | Intent-Action 연결 |  |  |
| Pack 품질검증 | 검증 질문 Pass |  |  |
| Runtime 시뮬레이션 | 대표 질문 응답 |  |  |
| Pack Build | Export ZIP 생성 |  |  |
| 배포/활성화 | Active Pack 전환 |  |  |
| 운영 분석/개선 | 미응답 개선 후보 전환 |  |  |

## 19. 테스트 후 조치

테스트 완료 후 다음 항목을 정리합니다.

1. 실패한 체크리스트 항목
2. 결함 기록표
3. J-Brain 초기 데이터 보강 필요 항목
4. J-Brain_Manual 추가 보완 필요 항목
5. Pack 재생성 필요 여부
6. 다음 테스트 반복 일정
