# 관리자 사이트 Frontend 컴포넌트 설계서 VectorMoon UX 보완본

## 1. 컴포넌트 구조

| 컴포넌트 | 책임 | 연동 API |
| --- | --- | --- |
| AdminShell | Header, 2-column layout, section 배치 | - |
| SourceRegistrationPanel | Source 등록, drag & drop, 등록 후 실행 | POST `/api/admin/sources`, POST `/api/admin/index-jobs`, POST `/api/admin/index-jobs/{job_id}/run` |
| UploadDropzone | 파일 선택/드롭 이벤트, 파일명 표시 | MVP에서는 Content placeholder 반영 |
| SourceListPanel | Source 목록 카드 렌더링, 선택 상태 전달 | GET `/api/admin/sources` |
| IndexJobPanel | Job 생성/실행/재시도, 단계 타임라인 표시 | POST/GET `/api/admin/index-jobs` |
| JobTimeline | 10단계 상태 표시 | IndexJobResponse.steps |
| PreviewPanel | Chunk/Entity/Relation/Evidence 탭 조회 | GET `/api/admin/sources/{source_id}/preview` |
| RetrievalTestPanel | GraphRAG 검색 전략 테스트 | POST `/api/admin/retrieval-tests` |
| JsonResultPanel | API 응답 JSON 표시 | 공통 |

## 2. 상태 관리

| 상태 | 설명 |
| --- | --- |
| selectedSourceId | Source 목록에서 선택한 Source ID |
| selectedJobId | 생성/실행/재시도 대상 Job ID |
| sources | Source 목록 |
| currentJob | 최근 생성/실행된 Job |
| previewData | Source Preview 응답 |
| previewTab | chunks, entities, relations, evidence |
| searchRequest | query, strategy, top_k, filters |

## 3. API 연동 방식

- 모든 API는 `/api/admin` prefix를 사용한다.
- 응답은 `AdminApiResponse` envelope를 기준으로 `data`를 화면 상태에 반영한다.
- Source 생성 성공 시 `source_id`를 Job/Preview/Search 영역에 자동 세팅한다.
- Job 실행 성공 시 Source 목록을 재조회하여 count와 status를 갱신한다.
- Preview 탭 변경은 API를 다시 호출하지 않고 보유한 `previewData`를 탭별로 렌더링한다.

## 4. VectorMoon UX 반영 사항

| VectorMoon 요소 | 반영 방식 |
| --- | --- |
| drag & drop 파일 등록 | UploadDropzone으로 반영 |
| 문서 목록 카드 | SourceListPanel 카드 형태로 반영 |
| 청크 미리보기 | PreviewPanel Chunk 탭으로 반영 |
| 검색 테스트 | RetrievalTestPanel로 확장 |
| Global 문서 토글 | Scope select의 GLOBAL 값으로 일반화 |

## 5. 향후 컴포넌트 분리 기준

현재 MVP는 단일 HTML 파일로 구성하되, React/Vue 등 프레임워크 적용 시 위 컴포넌트 단위로 분리한다. API client, 상태 store, JsonResultPanel은 공통 모듈로 추출한다.
