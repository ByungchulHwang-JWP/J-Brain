# 다음 작업 프롬프트: Intent Factory DB Core v0.1 후속 구현

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory DB Core v0.1을 기준으로 다음 단계 구현을 진행해 주세요.

목표:
1. DB 기반 Intent 관리 화면에서 Intent Example을 더 편하게 추가/삭제할 수 있게 개선합니다.
2. Entity/Synonym 관리 CRUD v0.1을 구현합니다.
3. Intent 상세 화면에서 Entity 후보와 Synonym을 연결할 수 있게 합니다.
4. Pack Builder가 DB Intent/Example/Action/Source Scope 정보를 읽어 JSON Intent Pack 초안을 생성하도록 구현합니다.
5. Runtime은 아직 Pack 기반 구조를 유지하되, DB에서 생성한 Pack을 기존 Runtime 테스트 화면에서 선택할 수 있게 합니다.

구현 순서:
1. 현재 DB Core v0.1 테스트와 프론트 빌드를 먼저 재실행하여 기준선을 확인합니다.
2. Entity/Synonym DB 테이블과 API를 추가합니다.
3. Entity/Synonym 관리자 화면을 구현합니다.
4. Intent 상세 화면에 Entity 연결 UI를 추가합니다.
5. DB 기반 Pack Builder 초안을 구현합니다.
6. `/admin/runtime/qa` 또는 `/admin/qa`에서 생성 Pack 선택 흐름을 확인합니다.
7. 산출물/WBS 문서에 완료 상태와 다음 단계 리스크를 반영합니다.

수용 기준:
- 기존 `test_intent_factory_*` 테스트가 모두 통과해야 합니다.
- 신규 Entity/Synonym API 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- 화면에서 프로젝트 선택, Intent 조회, Entity/Synonym 등록, Pack 초안 생성 흐름을 확인할 수 있어야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 Runtime 구조를 유지해야 합니다.

완료 후:
- GitHub 커밋/푸시를 진행합니다.
- 화면 테스트 방법을 한글로 안내합니다.
- 다음 작업 프롬프트를 생성합니다.
```
