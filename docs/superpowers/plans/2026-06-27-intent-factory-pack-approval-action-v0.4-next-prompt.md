# 다음 작업 프롬프트: Pack 승인 Workflow 및 Action 상세 관리 v0.4

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory Pack Export / Runtime Pack Store / Active Pack / Rollback v0.3 기능을 기준으로 다음 단계 구현을 진행해 주세요.

목표:
1. Pack 승인 Workflow v0.4를 구현합니다.
2. Pack 상태를 Draft, Exported, Imported, Validated, Approved, Active, Archived로 분리합니다.
3. Pack Activate 전에 Approved 상태인지 확인하는 정책을 추가합니다.
4. Action 상세 관리 v0.1을 구현합니다.
   - 화면 이동 Action
   - API 호출 Action
   - SQL Template Action
   - 문서 검색 Action
5. Intent와 Action 연결 정보를 DB에서 더 명확히 관리하고 Pack Export 결과에 반영합니다.
6. Runtime은 계속 검증된 파일 Pack 기반으로 유지하되, 프로젝트 Active Pack 자동 해석 정책을 보강합니다.
7. Pack Import, Validation, Approval, Activate, Rollback 감사 로그를 운영자 화면에서 조회할 수 있게 개선합니다.

구현 순서:
1. 현재 `test_intent_factory_*`, `test_pack_export_service.py`, `test_pack_store_service.py`, `test_chat_runtime.py`, `npm run build` 기준선을 재확인합니다.
2. Pack 상태 전이 정책을 설계하고 Backend 상수/검증 함수를 추가합니다.
3. Pack Repository 테이블/API에 승인 상태, 승인자, 승인 일시, 반려 사유 필드를 추가합니다.
4. Approve/Reject API를 구현하고 감사 로그를 남깁니다.
5. Activate API에서 승인된 Pack만 활성화되도록 검증합니다.
6. Action 상세 관리 테이블과 API를 추가합니다.
7. Intent 상세 화면 또는 Action 관리 화면에서 Action 상세 정보를 등록/수정할 수 있게 구현합니다.
8. Pack Export Service가 DB Action 상세 정보를 표준 Intent Pack `actions/*.json`에 반영하도록 수정합니다.
9. Runtime QA에서 프로젝트 선택 시 Active Pack을 자동 후보로 해석하는 흐름을 보강합니다.
10. 산출물/WBS 문서에 완료 상태와 다음 리스크를 반영합니다.

수용 기준:
- 기존 Backend 테스트가 모두 통과해야 합니다.
- 신규 Pack Approval/Action API 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- 승인되지 않은 Pack은 Activate할 수 없어야 합니다.
- 승인된 Pack은 Active 전환 및 Rollback이 가능해야 합니다.
- Action 상세 정보가 DB에서 Pack Export JSON으로 반영되어야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 Runtime 구조를 유지해야 합니다.

제외 범위:
- 실제 고객 운영 DB Query 실행
- Pack 전자서명/암호화
- 다중 승인 결재선 완성
- Kubernetes/운영 배포 자동화
- 고객사 SSO/LDAP 연동

완료 후:
- 화면에서 확인 가능한 변경점과 테스트 기준을 한글로 요약해 주세요.
- 다음 단계 구현 프롬프트를 생성해 주세요.
```
