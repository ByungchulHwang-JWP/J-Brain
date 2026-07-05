# 다음 작업 프롬프트: Intent Factory Pack Import / Rollback v0.3 구현

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory Pack Export / ZIP 배포 v0.2 기능을 기준으로 다음 단계 구현을 진행해 주세요.

목표:
1. Export된 Service-Pack ZIP을 고객 내부망 Runtime Pack Store에 Import할 수 있게 합니다.
2. Import 시 Pack 압축 해제, 필수 파일 검증, Manifest 검증, Loader 검증을 수행합니다.
3. 프로젝트별 Active Pack Version을 관리합니다.
4. 신규 Pack 활성화 전 직전 정상 Pack을 보관하고 Rollback할 수 있게 합니다.
5. Runtime Pack Resolver가 Active Pack 후보를 조회할 수 있는 구조를 준비합니다.
6. Pack Import, Activate, Rollback, Validation 결과를 감사 로그로 남길 수 있는 기본 구조를 추가합니다.

구현 순서:
1. 현재 `test_intent_factory_*`, `test_pack_export_service.py`, `test_chat_runtime.py`, `npm run build` 기준선을 재확인합니다.
2. Backend에 Pack Store / Active Pack / Pack Import 이력 테이블을 추가합니다.
3. Pack ZIP Import Service를 구현합니다.
4. Import된 Pack을 `IntentPackLoader`로 검증합니다.
5. Active Pack 전환 API와 Rollback API를 추가합니다.
6. Pack Repository 화면에 Import/Activate/Rollback 상태 표시를 추가합니다.
7. Runtime QA 화면의 Pack 선택 후보에 Active Pack 정보를 표시합니다.
8. 산출물/WBS 문서에 완료 상태와 다음 리스크를 반영합니다.

수용 기준:
- 기존 테스트가 모두 통과해야 합니다.
- 신규 Pack Import/Rollback API 테스트가 통과해야 합니다.
- `npm run build`가 통과해야 합니다.
- 외부 LLM/API 호출 없이 로컬/폐쇄망 Pack Store 구조를 유지해야 합니다.
- Runtime은 여전히 검증된 파일 Pack 기반으로 동작해야 하며, DB를 직접 Runtime 소스로 읽지 않아야 합니다.

제외 범위:
- 실제 고객 운영 DB Query 실행
- Pack 전자서명/암호화
- 다중 승인 Workflow 완성
- Kubernetes/운영 배포 자동화
```
