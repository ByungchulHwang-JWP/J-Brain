# 다음 작업 프롬프트: Intent Factory Pack Export v0.2 구현

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory DB 기반 Intent/Entity/Synonym 관리 및 Pack Builder Draft 기능을 기준으로 다음 단계 구현을 진행해 주세요.

목표:
1. DB Pack Draft를 표준 Intent Pack 파일 구조로 Export합니다.
2. Export 결과를 ZIP 패키지로 생성하고 다운로드할 수 있게 합니다.
3. Pack Manifest, Profile, NLU, Action, Knowledge, Templates, Validation 기본 파일을 생성합니다.
4. Pack Validation을 Export 전/후 모두 실행할 수 있게 합니다.
5. Pack Repository v0.1 테이블과 목록 화면을 추가하여 생성 이력, 버전, 상태를 관리합니다.
6. Runtime은 계속 검증된 파일 Pack 기반으로 유지하되, Export된 Pack을 Runtime 선택 후보로 등록할 수 있는 구조를 준비합니다.

구현 순서:
1. 현재 `test_intent_factory_*`, `test_chat_runtime.py`, `npm run build` 기준선을 재확인합니다.
2. Backend에 Pack Export Service를 추가합니다.
3. DB Draft -> 표준 Intent Pack 디렉터리 구조 변환 로직을 구현합니다.
4. ZIP 생성 API와 다운로드 API를 추가합니다.
5. Pack Repository 테이블/API를 추가합니다.
6. Pack Builder 화면에 Export, Validation, ZIP 다운로드 버튼을 추가합니다.
7. Pack Repository 화면에 Export 이력 목록을 표시합니다.
8. 산출물/WBS 문서에 완료 상태와 다음 리스크를 반영합니다.

수용 기준:
- 기존 테스트가 모두 통과해야 합니다.
- 신규 Pack Export/Repository API 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- 화면에서 DB Draft 생성, Export, ZIP 다운로드 흐름을 확인할 수 있어야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 배포 패키지 생성 흐름을 유지해야 합니다.

완료 후:
- GitHub 커밋/푸시를 진행합니다.
- 화면 테스트 방법을 한글로 안내합니다.
- 다음 작업 프롬프트를 생성합니다.
```
