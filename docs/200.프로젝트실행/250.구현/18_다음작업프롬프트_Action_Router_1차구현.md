# 18. 다음 작업 프롬프트 - Action Router 1차 구현

아래 프롬프트를 다음 작업 시작 시 사용한다.

```text
현재 J-Brain 프로젝트에서 Intent Pack Loader와 Intent Matcher 1차 구현까지 완료되어 있습니다.

완료된 내용:
- 탄소중립플랫폼 기준 Intent Pack v0.1.0 JSON 구조 생성
- J-Brain 관리자 화면 기준 Navigation Action 5개 정의
- backend/app/ai/intent_pack_loader.py 구현
- backend/app/ai/intent_matcher.py 구현
- backend/app/api/intent_packs.py API 추가
- backend/app/api/intent_match.py API 추가
- /api/v1/intent-packs 목록/상세 조회 가능
- /api/v1/intent-match 로 Top-K Intent 후보 반환 가능
- test_intent_pack_loader.py 통과
- test_intent_matcher.py 통과

다음 작업으로 Action Router 1차 구현을 진행해 주세요.

목표:
1. Intent Matcher 결과의 Top-1 후보를 받아 action_id 기준으로 실행 가능한 응답 카드로 변환합니다.
2. 외부 LLM/API 호출 없이 로컬 CPU 기반으로 동작해야 합니다.
3. 1차 구현 범위는 다음 Action Type만 포함합니다.
   - NAVIGATE: 화면 이동 버튼 카드 반환
   - SEARCH_DOC: 문서 검색용 placeholder 카드 반환
   - QUERY: Mock 조회 카드 반환
   - GUIDE: 안내 템플릿 카드 반환
   - CREATE_REQUEST 또는 fallback: 미응답 로그 placeholder 카드 반환
4. 실제 DB 조회, 실제 SQL 실행, 외부 LLM 호출, 다운로드, 등록/수정/삭제 실행은 제외합니다.
5. confidence_label이 low 또는 very_low인 경우 실제 Action을 실행하지 않고 fallback 카드로 처리합니다.
6. query 계열 Action은 confidence_label이 high여도 confirmation_required=true이면 "확인 필요" 상태로 반환합니다.
7. NAVIGATE Action은 screen_routes.json의 route_value를 사용해 button_label과 route를 포함해야 합니다.
8. J-Brain Navigation 5개 질문은 실제 route와 연결된 navigation_card를 반환해야 합니다.

구현 대상:
- backend/app/ai/action_router.py
- backend/app/api/action_route.py 또는 기존 intent_match API 확장
- backend/test_action_router.py

권장 데이터 흐름:
1. 사용자 질문 입력
2. IntentMatcher.match(question, top_k=3)
3. Top-1 후보 선택
4. ActionRouter.route(question, matches)
5. 응답 카드 반환

응답 포맷 예시:

NAVIGATE:
{
  "type": "navigation_card",
  "status": "ready",
  "intent_id": "INT-JB-NAV-JOBS",
  "action_id": "ACT-JB-GO-JOBS",
  "confidence_label": "high",
  "title": "인덱싱 작업 현황",
  "message": "요청하신 화면으로 이동할 수 있습니다.",
  "route": "/admin/jobs",
  "button_label": "인덱싱 작업 현황 열기"
}

SEARCH_DOC:
{
  "type": "document_card",
  "status": "ready",
  "intent_id": "INT-NZ-DOC-002",
  "action_id": "ACT-NZ-SEARCH-SCOPE-GUIDE",
  "confidence_label": "high",
  "title": "Scope 기준 안내",
  "message": "승인된 문서에서 관련 근거를 검색합니다.",
  "query": "Scope 1 기준 알려줘",
  "sources": []
}

QUERY MOCK:
{
  "type": "query_card",
  "status": "confirmation_required",
  "intent_id": "INT-NZ-QUERY-001",
  "action_id": "ACT-NZ-QUERY-EMISSION",
  "confidence_label": "high",
  "title": "공장별 배출량 조회",
  "message": "조회 조건을 확인한 뒤 Mock 데이터를 조회합니다.",
  "parameters": {
    "factory": "A공장",
    "period": "기본값 또는 추출값"
  }
}

FALLBACK:
{
  "type": "fallback_card",
  "status": "blocked",
  "intent_id": null,
  "action_id": null,
  "confidence_label": "very_low",
  "title": "답변 보완 필요",
  "message": "질문 의도를 확인하지 못했습니다. 미응답 질문으로 기록합니다.",
  "logged": true
}

우선 검증 질문:
- 운영 현황 보여줘
- 문서 목록 열어줘
- 인덱싱 작업 현황 보여줘
- AI 챗봇 테스트 화면으로 가줘
- 사용 로그 조회 화면 열어줘
- Scope 1 기준 알려줘
- A공장 탄소 배출량 알려줘
- B현장 이번 달 전기 사용량 알려줘
- 대표님이 원하는 그거 해줘

수용 기준:
- test_intent_pack_loader.py 통과
- test_intent_matcher.py 통과
- test_action_router.py 통과
- J-Brain Navigation 5개 질문은 navigation_card로 반환
- Navigation 카드에는 route와 button_label 포함
- 탄소중립 문서 질문은 document_card로 반환
- 탄소중립 query 질문은 query_card이며 confirmation_required 상태 반환
- 의도 불명 질문은 fallback_card로 반환
- 외부 LLM/API 호출 없음
- 실제 SQL 실행 없음

주의사항:
- 기존 사용자 변경 사항이 많은 작업트리이므로 관련 파일만 수정합니다.
- Action Router는 실제 실행기가 아니라 1차 MVP용 응답 카드 변환 계층으로 구현합니다.
- Query 계열은 Mock 응답 또는 확인 필요 카드까지만 처리합니다.
- 검색 품질 자체는 다음 단계 Search Doc Action에서 구현합니다.
```

