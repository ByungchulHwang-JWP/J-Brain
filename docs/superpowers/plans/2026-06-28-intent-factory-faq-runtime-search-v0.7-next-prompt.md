# 다음 작업 프롬프트: FAQ Runtime 검색 연계 및 품질 확인 v0.7

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory FAQ 관리 v0.1, Pack Export/Import/Validation/Approval 기능을 기준으로 다음 단계 구현을 진행해 주세요.

목표:
1. FAQ 관리 화면에서 등록한 FAQ가 Pack Export 후 Runtime 검색 결과에 반영되는지 확인할 수 있게 합니다.
2. SEARCH_DOC Action이 FAQ와 Source 문서를 함께 검색하는 구조를 명확히 합니다.
3. Runtime QA 또는 별도 검색 테스트 화면에서 FAQ 매칭 결과를 확인할 수 있게 합니다.
4. FAQ 검색 결과에는 FAQ ID, 질문, 답변, 카테고리, 태그, Source ID, Score를 표시합니다.
5. FAQ 변경 후 Pack Build → Export → Import → Validation → Approval → Active 흐름에서 FAQ 반영 여부를 추적할 수 있게 합니다.
6. 미응답 질문을 FAQ 후보로 전환할 수 있는 준비 구조를 추가합니다.

구현 순서:
1. 현재 Backend 테스트와 Frontend 빌드를 재실행하여 기준선을 확인합니다.
2. `SearchDocAction` 또는 Runtime 검색 Adapter가 Pack의 `knowledge/faqs.json`을 검색 대상으로 사용하는지 확인하고 부족한 부분을 보강합니다.
3. Backend에 FAQ 검색 테스트 API 또는 기존 Runtime QA 응답 진단 정보에 FAQ 매칭 근거를 추가합니다.
4. Frontend Runtime QA 또는 검색 테스트 화면에 FAQ 검색 결과 카드를 표시합니다.
5. Pack Builder/Repository 화면에서 FAQ 포함 건수를 더 명확히 표시합니다.
6. 미응답 질문을 FAQ 후보로 전환하기 위한 API/상태 모델 초안을 추가합니다.
7. WBS 및 개발 계획 문서에 완료 상태와 남은 리스크를 반영합니다.

수용 기준:
- 기존 Backend 테스트가 모두 통과해야 합니다.
- 신규 FAQ 검색/Runtime 근거 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- FAQ 등록 후 Pack Export ZIP의 `knowledge/faqs.json`에 포함되어야 합니다.
- Active Pack 기준 Runtime QA에서 FAQ 기반 답변 근거를 확인할 수 있어야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 Runtime 구조를 유지해야 합니다.

제외 범위:
- 외부 LLM 기반 FAQ 자동 생성
- 고객 원문 데이터 외부망 전송
- 실제 운영 DB Query 실행
- 전자서명/암호화
- 다중 승인 결재선 완성

완료 후:
- 화면에서 확인 가능한 변경점과 테스트 기준을 한글로 요약해 주세요.
- 다음 단계 구현 프롬프트를 생성해 주세요.
```
