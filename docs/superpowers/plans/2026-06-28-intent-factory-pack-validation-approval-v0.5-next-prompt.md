# 다음 작업 프롬프트: Pack 검증 및 승인 Workflow v0.5

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory Action 관리 v0.1, Pack Export/Import/Active/Rollback 기능을 기준으로 다음 단계 구현을 진행해 주세요.

목표:
1. Pack 검증 화면 v0.1을 구현합니다.
2. 검증 질문(Validation Question)을 프로젝트/Pack 기준으로 등록/수정/삭제할 수 있게 합니다.
3. 각 검증 질문에 기대 Intent, 기대 Action, 최소 Confidence 기준을 설정할 수 있게 합니다.
4. 선택한 Pack Draft 또는 Export Pack에 대해 검증을 실행하고 Pass/Fail 결과를 저장합니다.
5. Pack 승인 Workflow v0.1을 구현합니다.
6. Pack 상태를 Draft, Exported, Imported, Validated, Approved, Active, Archived 기준으로 관리합니다.
7. Approved 상태가 아닌 Pack은 Activate할 수 없도록 정책을 추가합니다.
8. 검증/승인/반려/활성화/롤백 이력을 감사 로그로 남깁니다.

구현 순서:
1. 현재 Backend 테스트와 Frontend 빌드를 재실행하여 기준선을 확인합니다.
2. Validation Question DB 테이블과 Pack Validation Result DB 테이블을 추가합니다.
3. Backend API를 추가합니다.
   - 검증 질문 목록/상세/등록/수정/삭제
   - Pack 검증 실행
   - Pack 검증 결과 조회
   - Pack 승인/반려
4. Pack Store/Repository API에 Pack 승인 상태를 반영합니다.
5. Activate API에서 Approved 상태 검증을 추가합니다.
6. `/admin/packs/validation` 화면을 실제 검증 질문 관리 및 실행 화면으로 구현합니다.
7. `/admin/packs/repository` 화면에 승인/반려 버튼과 승인 상태를 표시합니다.
8. WBS 및 개발 계획 문서에 완료 상태와 남은 리스크를 반영합니다.

수용 기준:
- 기존 Backend 테스트가 모두 통과해야 합니다.
- 신규 Pack Validation/Approval 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- Pack 검증 화면에서 질문 등록, 기대 Intent/Action 설정, 검증 실행, 결과 확인이 가능해야 합니다.
- 승인되지 않은 Pack은 Active 전환할 수 없어야 합니다.
- 승인된 Pack은 Active 전환 및 Rollback이 가능해야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 Runtime 구조를 유지해야 합니다.

제외 범위:
- 다중 결재선 Workflow 완성
- 전자서명/암호화
- 실제 고객 운영 DB Query 실행
- Kubernetes/운영 배포 자동화
- 고객사 SSO/LDAP 연동

완료 후:
- 화면에서 확인 가능한 변경점과 테스트 기준을 한글로 요약해 주세요.
- 다음 단계 구현 프롬프트를 생성해 주세요.
```
