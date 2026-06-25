# 17. 다음 작업 프롬프트 - Intent Matcher 1차 구현

아래 프롬프트를 다음 작업 시작 시 사용한다.

```text
현재 J-Brain 프로젝트에서 Pack Loader 구현까지 완료되어 있습니다.

완료된 내용:
- 탄소중립플랫폼 기준 Intent Pack v0.1.0 JSON 구조 생성
- J-Brain 관리자 화면 기준 Navigation Action 5개 정의
- backend/app/ai/intent_pack_loader.py 구현
- backend/app/api/intent_packs.py API 추가
- /api/v1/intent-packs 목록 조회
- /api/v1/intent-packs/{pack_id}?version=0.1.0 상세/검증 요약 조회
- backend/test_intent_pack_loader.py 단위 테스트 통과

다음 작업으로 Intent Matcher 1차 구현을 진행해 주세요.

목표:
1. 사용자의 자연어 질문을 입력받아 Intent Pack의 intent_examples.json과 매칭합니다.
2. 외부 LLM/API 없이 로컬 CPU 기반 규칙/문자열 유사도 방식으로 동작해야 합니다.
3. 1차 구현은 임베딩 모델 없이 다음 기준으로 점수를 계산합니다.
   - 정규화된 토큰 유사도
   - 문자 n-gram 또는 부분 문자열 유사도
   - Entity synonym 매칭 보너스
   - Intent category/action 타입 보정은 최소화
4. 결과는 Top-3 Intent 후보를 반환해야 합니다.
5. 각 후보는 intent_id, intent_name, action_id, category, score, confidence_label, matched_examples, matched_entities를 포함해야 합니다.
6. High/Medium/Low/Very Low confidence label은 nlu/confidence_policy.json 기준을 사용합니다.
7. J-Brain Navigation 질문 5개가 실제 route와 연결되는지 확인합니다.

구현 대상:
- backend/app/ai/intent_matcher.py
- 필요 시 backend/app/api/intent_match.py 또는 기존 챗봇 테스트 API 연계용 라우터
- backend/test_intent_matcher.py

우선 검증 질문:
- 운영 현황 보여줘
- 문서 목록 열어줘
- 인덱싱 작업 현황 보여줘
- AI 챗봇 테스트 화면으로 가줘
- 사용 로그 조회 화면 열어줘
- Scope 1 기준 알려줘
- A공장 탄소 배출량 알려줘
- B현장 이번 달 전기 사용량 알려줘

수용 기준:
- test_intent_pack_loader.py 통과
- test_intent_matcher.py 통과
- J-Brain Navigation 5개 질문은 Top-1으로 올바른 Intent를 반환
- 탄소중립 문서/조회 대표 질문은 Top-3 안에 기대 Intent를 반환
- 외부 LLM/API 호출 없음
```
 
