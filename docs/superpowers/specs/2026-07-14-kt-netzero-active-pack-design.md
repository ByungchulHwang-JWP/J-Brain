# KT-NetZero Active Pack 정합성 설계

## 목표

KT-NetZero의 Runtime Pack `KT-NetZero-intent-pack v0.1.0`을 개발 서버에서 검증, 승인, 활성화하고, 채팅과 운영 인사이트가 동일한 활성 Pack 정보를 사용하도록 정합성을 확보한다.

## 현황 및 원인

- KT-NetZero Runtime Pack의 manifest와 service profile은 `KT-NetZero-intent-pack v0.1.0`을 정의한다.
- 운영 인사이트의 Active Pack 버전은 `graphrag.runtime_event_logs`에서 최근 1시간 요청의 `MAX(active_pack_version)`을 조회한다.
- 최근 요청이 없으면 Active Pack이 존재하더라도 화면에는 `-`가 표시된다.
- 최근 요청 목록은 시간 제한 없이 조회하므로 상단 KPI와 목록의 Pack 정보가 서로 다를 수 있다.
- KT-NetZero Pack 파일은 현재 Git 추적 대상이 아니므로 Git 기반 개발 서버 배포만으로는 Runtime Pack 파일이 반영되지 않는다.
- 질문 `이 프로젝트의 핵심 목표는 무엇인가요?`는 목표 Intent와 유사하지만 기록된 점수 `0.4051`이 Pack의 Medium 기준 `0.65`보다 낮아 fallback 처리됐다.

## 결정

`graphrag.active_runtime_packs`를 프로젝트별 활성 Pack의 유일한 기준으로 사용한다.

- 운영 인사이트의 Active Pack ID 및 버전은 요청 로그가 아니라 `active_runtime_packs`에서 읽는다.
- 최근 1시간 KPI는 요청 로그를 계속 사용한다. Active Pack 표기와 시간 기반 운영 지표를 분리한다.
- 채팅 런타임은 활성 Pack 레코드와 Runtime Pack Store의 Pack 파일이 모두 존재하는 상태에서만 KT-NetZero Pack을 사용한다.
- Pack 반입, 검증, 승인, 활성화는 기존 Pack Lifecycle API 및 서비스 절차를 사용한다. 별도 활성 상태 저장소는 만들지 않는다.

## 데이터 흐름

1. KT-NetZero Pack `v0.1.0`을 Runtime Pack Store에 반입한다.
2. 검증을 통과한 Pack을 승인한다.
3. 승인된 Pack을 활성화해 `graphrag.active_runtime_packs`의 `KT-NetZero` 행을 갱신한다.
4. 채팅 요청은 활성 Pack 기준으로 Pack 파일을 로드하고, 결과의 Pack ID와 버전을 Runtime 이벤트 로그에 기록한다.
5. 운영 인사이트는 `active_runtime_packs`에서 Active Pack을 조회하고, `runtime_event_logs`에서 최근 1시간의 요청 수, fallback, 응답 시간, 오류 수를 집계한다.

## 구현 범위

- `backend/app/api/operations.py`
  - 실시간 운영 API에서 활성 Pack을 별도로 조회한다.
  - `kpi.active_pack`은 활성 Pack의 버전, `kpi.active_pack_id`는 활성 Pack의 ID를 반환한다.
  - 활성 Pack이 없을 때만 `-`를 반환한다.
- `frontend/src/pages/operations/RealtimeMonitoring.jsx`
  - API 응답의 활성 Pack 정보를 그대로 전달한다.
- `frontend/src/components/operations/OperationKpiStrip.jsx`
  - Active Pack 카드가 실제 활성 Pack 버전을 표시하도록 유지하고, 필요 시 Pack ID를 보조 정보로 표시한다.
- `tests/test_operations_api.py`
  - 활성 Pack 조회와 요청 KPI 집계가 독립적으로 수행되는 계약을 추가한다.
- `tests/test_operations_frontend_contract.py`
  - Active Pack 카드가 API의 활성 Pack 값을 사용한다는 계약을 유지한다.
- `backend/app_data/runtime_pack_store/KT-NetZero-intent-pack-v0.1.0/`
  - Pack 전체를 Git 추적 대상으로 포함한다.
- KT-NetZero Intent examples 또는 confidence policy
  - 목표 설명 질의의 매칭 점수가 Medium 이상이 되도록 동의 표현을 추가하거나, 검증 결과를 근거로 정책을 조정한다.

## 오류 처리 및 운영 원칙

- 활성 Pack DB 레코드가 없으면 API는 성공 응답을 유지하고 Active Pack만 `-`로 반환한다.
- 활성 Pack 레코드는 있으나 Runtime Pack 파일을 찾을 수 없으면 채팅은 명시적인 오류 또는 fallback 사유를 남기고 Runtime 이벤트 로그에 Pack 정보를 기록한다.
- 최근 1시간 요청이 0건이어도 활성 Pack 표시는 유지한다.
- Pack 버전은 `pack_id`와 함께 취급한다. 버전만으로 다른 프로젝트의 Pack을 식별하지 않는다.

## 검증 기준

1. KT-NetZero `v0.1.0` Pack이 개발 서버 Runtime Store에 존재한다.
2. `active_runtime_packs`의 KT-NetZero 행이 `KT-NetZero-intent-pack` 및 `0.1.0`을 가리킨다.
3. 운영 인사이트의 최근 1시간 요청이 0건이어도 Active Pack 카드가 `0.1.0`을 표시한다.
4. KT-NetZero 채팅 응답과 Runtime 이벤트 로그의 Pack ID 및 버전이 `KT-NetZero-intent-pack`, `0.1.0`으로 일치한다.
5. `이 프로젝트의 핵심 목표는 무엇인가요?`는 목표 Intent로 매칭되고, 설정된 최소 신뢰도 기준을 넘어 문서 검색 Action으로 처리된다.
6. 기존 J-Brain Pack의 활성 상태, 채팅, 운영 지표에 회귀가 없다.

## 배포 순서

1. 테스트와 Pack 구조 검증을 실행한다.
2. KT-NetZero Pack 파일과 코드 변경을 커밋하고 GitHub 브랜치에 푸시한다.
3. 개발 서버에 배포한다.
4. Pack Lifecycle 절차로 KT-NetZero Pack을 반입, 검증, 승인, 활성화한다.
5. 개발 서버에서 운영 인사이트와 채팅을 수동 점검하고, API 응답과 Runtime 이벤트 로그를 대조한다.
