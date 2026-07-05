# J-Brain 운영 관리 스크립트

이 폴더는 개발/운영 테스트 중 반복 사용할 수 있는 관리자용 스크립트를 관리합니다.

## reset_project_workflow_data.py

J-Brain Intent Factory 구축 워크플로우 테스트를 처음부터 다시 수행할 수 있도록 프로젝트 업무 데이터를 초기화합니다.

### 삭제 대상

- 프로젝트 목록의 기준이 되는 Source 데이터
- Source Chunk 및 인덱싱 작업 이력
- Intent, Example, Entity, Synonym
- FAQ, FAQ 후보
- Action, Intent-Action 연결
- Pack Export, Runtime Pack Store, Active Pack
- Pack 검증 질문 및 검증 결과
- Pack 운영 감사 로그
- Chat Session 및 Chat History
- 생성된 Pack ZIP, Runtime Pack Store 파일, 검증 Draft, 업로드 파일

### 유지 대상

- 사용자 계정
- 권한 설정
- 메뉴 설정
- 시스템 설정
- 소스 코드
- 산출물 문서
- `backend/app_data/J-Brain_Manual.txt`

### 실행 방법

백엔드 루트 기준으로 실행합니다.

```bash
cd backend
python3 scripts/admin/reset_project_workflow_data.py
```

실행 결과는 삭제 전 카운트, 삭제 건수, 삭제 후 카운트, 파일 정리 결과를 JSON으로 출력합니다.

## delete_project_workflow_data.py

특정 프로젝트 ID에 연결된 Workflow, Source, Intent, Pack, Runtime, 검증/운영 데이터를 삭제합니다.
전체 초기화가 아니라 특정 프로젝트만 제거해야 할 때 사용합니다.

### 삭제 대상

- `graphrag_sources.category = <PROJECT_ID>` 기준 Source/프로젝트 항목
- `project_id = <PROJECT_ID>` 기준 Intent, Entity, FAQ, Action, Pack, Runtime, 검증, 운영 이력
- 해당 프로젝트명으로 생성된 Pack Export, Runtime Pack Store, 임시 검증 파일

### 실행 방법

백엔드 루트 기준으로 실행합니다.

```bash
cd backend
python3 scripts/admin/delete_project_workflow_data.py NETZERO
```

실행 결과는 프로젝트별 삭제 전 카운트, 삭제 건수, 삭제 후 카운트, 파일 정리 결과를 JSON으로 출력합니다.

### 주의사항

이 스크립트는 프로젝트 생성부터 다시 테스트하기 위한 초기화 스크립트입니다.

실행 후에는 프로젝트 목록이 비거나 기본 안내 프로젝트만 보일 수 있습니다. 이후 화면에서 신규 프로젝트를 생성하고, Source 등록부터 다시 진행해야 합니다.
