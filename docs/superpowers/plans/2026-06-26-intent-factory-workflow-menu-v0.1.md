# JWP Intent Factory 운영자 워크플로우 및 메뉴 정리 v0.1 개발 계획서

## 1. 목적

현재 JWP Intent Factory 관리자 화면은 프로젝트, Source, Intent, Entity, Pack, Runtime 기능이 개별 메뉴로 제공된다. 기능 단위 접근은 가능하지만, 실제 운영자가 신규 프로젝트에 챗봇을 적용할 때 어떤 순서로 작업해야 하는지 한눈에 파악하기 어렵다.

본 개발의 목적은 상용 운영자 관점에서 다음 작업 흐름을 화면에 드러내는 것이다.

```text
프로젝트 등록
-> Source 수집/벡터화
-> Intent/Entity 작업
-> Pack Build/검증
-> Runtime 테스트
-> 배포/운영 개선
```

또한 등록/수정/상세 화면은 좌측 메뉴에 직접 노출하지 않고, 각 관리 화면의 버튼이나 행 액션으로 진입하도록 메뉴 구성을 정리한다.

## 2. 설계 원칙

| 원칙 | 설명 |
|---|---|
| 메뉴는 업무 영역 중심 | 좌측 메뉴는 관리 영역과 운영 화면 중심으로 유지한다. |
| 등록 화면은 액션으로 진입 | 프로젝트 등록, Source 등록, Intent 등록 등은 목록 화면 버튼에서 진입한다. |
| 라우트는 유지 | 숨김 화면도 URL 라우트는 유지하여 기존 버튼, 링크, 권한 확장에 대응한다. |
| 워크플로우 우선 | 운영자는 기능 목록보다 다음 작업과 진행 상태를 먼저 볼 수 있어야 한다. |
| Pack 기반 Runtime 원칙 유지 | DB 관리 화면은 Pack 제작 전 단계이며 Runtime은 검증된 Pack 기반으로 유지한다. |

## 3. 개발 범위

### 3.1 Frontend

- `/admin/workflow` 구축 워크플로우 화면 추가
- 프로젝트 선택 기능 제공
- 단계별 진행 상태 표시
- 단계별 바로가기 버튼 제공
- Source, Intent, Entity, Pack Draft 상태를 조회하여 완료/주의/미완료 상태 표시
- `App.jsx`에 라우트 추가

### 3.2 Backend/Menu

- 메뉴 seed에 `구축 워크플로우` 메뉴 추가
- `프로젝트 등록`, `Source 등록` 메뉴 제거
- `프로젝트 목록`을 `프로젝트 관리`로 정리
- `Source 목록`을 `Source 관리`로 정리
- `Entity 관리`와 `Synonym 관리`를 `Entity/Synonym 관리` 메뉴로 정리
- 등록/상세/수정 React route는 유지

### 3.3 Test

- 메뉴 seed 테스트 갱신
- React Router 메뉴 계약 테스트 유지
- Frontend build 검증

## 4. 제외 범위

- Pack ZIP Export 구현
- Pack Repository DB 구현
- Pack 승인 Workflow 구현
- 실제 배포 활성화 구현
- 고객 DB/API Query Action 운영 연동
- 메뉴 권한 화면의 숨김 메뉴 타입 확장

## 5. 화면 구성

`구축 워크플로우` 화면은 다음 영역으로 구성한다.

| 영역 | 내용 |
|---|---|
| 프로젝트 선택 | 현재 작업 대상 프로젝트 선택 |
| 진행 요약 | 완료 단계 수, 다음 권장 작업, Pack 준비 상태 |
| 단계형 타임라인 | 6단계 업무 흐름과 상태 |
| 단계별 카드 | 목적, 현재 상태, 주요 지표, 바로가기 |
| 운영 원칙 | 등록 화면은 관리 화면 버튼으로 진입한다는 안내 |

## 6. 단계 정의

| 단계 | 완료 판단 기준 |
|---|---|
| 프로젝트 준비 | 프로젝트가 1개 이상 존재 |
| 지식 자료 준비 | 선택 프로젝트에 Source가 1개 이상 존재 |
| Intent 설계 | 선택 프로젝트에 Intent가 1개 이상 존재 |
| Entity/Synonym 정리 | 선택 프로젝트에 Entity가 1개 이상 존재 |
| Pack 제작 | Pack Draft 조회 가능 및 Intent가 포함됨 |
| Runtime 검증/운영 | Runtime QA 화면으로 검증 가능 |

## 7. 수용 기준

- `/admin/workflow` 화면이 접근 가능해야 한다.
- 좌측 메뉴에 `구축 워크플로우`가 보여야 한다.
- 좌측 메뉴에서 `프로젝트 등록`, `Source 등록`은 보이지 않아야 한다.
- `프로젝트 관리`, `Source 관리`, `Entity/Synonym 관리` 명칭이 적용되어야 한다.
- 등록/상세/수정 라우트는 기존처럼 동작해야 한다.
- Backend 메뉴 테스트가 통과해야 한다.
- Frontend build가 통과해야 한다.

## 8. 다음 작업 프롬프트

```text
$superpowers:subagent-driven-development

현재 구현된 JWP Intent Factory 운영자 워크플로우 대시보드 v0.1을 기준으로 다음 단계인 Pack Export / ZIP 배포 v0.2를 구현해 주세요.

목표:
1. DB Pack Draft를 표준 Intent Pack 디렉터리 구조로 Export합니다.
2. Export 결과를 ZIP 패키지로 생성하고 다운로드할 수 있게 합니다.
3. Pack Validation을 Export 전/후 모두 실행합니다.
4. Pack Repository 테이블과 화면을 추가하여 생성 이력, 버전, 상태를 관리합니다.
5. Runtime은 검증된 파일 Pack 기반 구조를 유지하되, Export된 Pack을 Runtime 선택 후보로 등록할 준비를 합니다.

완료 후:
- GitHub 커밋/푸시
- 화면 테스트 방법 한글 안내
- 다음 작업 프롬프트 생성
```
