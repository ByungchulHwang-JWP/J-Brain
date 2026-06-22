# GraphRAG AI Agent 공통 프레임워크 관리자 사이트 후속 작업 상세 계획서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 250.구현 후속 보완 |
| 역할 | PM |
| 작성 목적 | VectorMoon 관리자/벡터화 관리 기능 검토 결과를 바탕으로 GraphRAG 관리자 사이트의 후속 작업 범위, 일정, 담당, 산출물, 완료 기준을 정의 |
| 기준 문서 | `GraphRAG_AI_Agent_공통프레임워크_VectorMoon관리자_벡터화관리_UI기능검토.md` |
| 작성일 | 2026-06-21 |

## 2. 추진 배경

VectorMoon 관리자 기능은 파일 업로드, 벡터화 실행, 청크 미리보기, 문서 목록, 검색 테스트의 기본 흐름을 제공하고 있어 GraphRAG 관리자 사이트 MVP의 사용자 경험 기준으로 활용할 수 있다.

다만 GraphRAG AI Agent 공통 프레임워크는 단순 벡터화 관리가 아니라 Source 관리, 비동기 IndexJob, GraphStore 연계, Entity/Relation/Evidence Preview, Hybrid Retrieval 테스트까지 제공해야 한다. 따라서 기존 관리자 사이트 MVP를 VectorMoon UX 패턴을 반영한 GraphRAG 운영 관리 화면으로 확장하는 후속 작업이 필요하다.

## 3. 후속 작업 목표

| 목표 ID | 목표 | 설명 |
| --- | --- | --- |
| GOAL-01 | 관리자 사이트 기능 범위 재정의 | VectorMoon 벡터화 관리 기능과 GraphRAG 확장 기능의 반영 범위를 확정 |
| GOAL-02 | Source 관리 UX 보완 | 파일 업로드, Source 메타데이터, Scope/Domain 관리 흐름 개선 |
| GOAL-03 | IndexJob 운영 기능 강화 | 인덱싱 실행, 상태 모니터링, 단계별 로그, 실패/재시도 구조 정의 |
| GOAL-04 | GraphRAG Preview 기능 확장 | Chunk뿐 아니라 Entity, Relation, Evidence 미리보기 제공 |
| GOAL-05 | Hybrid Retrieval 테스트 기능 보완 | VECTOR_ONLY, GRAPH_ONLY, HYBRID 전략별 검색 테스트와 결과 비교 지원 |
| GOAL-06 | 산출물 및 테스트 기준 정비 | 화면정의서, API 명세, 테스트 시나리오, WBS에 후속 작업 반영 |

## 4. 작업 범위

### 4.1 포함 범위

| 구분 | 포함 작업 |
| --- | --- |
| 기획 | 관리자 사이트 MVP 범위 재정의, 유스케이스 보완, 화면 흐름 보완 |
| 설계 | 화면정의서 보완, Frontend 컴포넌트 설계 보완, API DTO 보완 |
| 백엔드 | Source/IndexJob/Preview/RetrievalTest API 보완 설계 및 구현 계획 수립 |
| 프론트엔드 | VectorMoon 스타일의 업로드/목록/Preview/검색 테스트 UI 반영 계획 수립 |
| 데이터 | Source, IndexJob, IndexJobStep, Preview 조회 모델 보완 |
| QA | 관리자 사이트 통합 테스트 시나리오 보완 |
| PM | WBS 변경안, 일정, 담당, 완료 기준 관리 |

### 4.2 제외 범위

| 구분 | 제외 사유 |
| --- | --- |
| 실 운영 배포 자동화 | 본 후속 작업은 관리자 기능 보완 계획 수립 및 MVP 개선 중심 |
| 외부 인증 시스템 연동 | 권한 모델은 설계 기준만 보완하고 실제 SSO/OAuth 연동은 별도 이행 단계에서 추진 |
| 대용량 성능 튜닝 | 기본 구조 확정 후 테스트 단계에서 별도 성능 검증 과제로 진행 |
| 상용 Vector/Graph DB 완전 구현 | Adapter 골격과 연동 지점은 유지하되 운영 DB별 최적화는 후속 기술 과제로 분리 |

## 5. 상세 작업 계획

### 5.1 작업 목록

| 작업 ID | 작업명 | 담당 | 기간 | 선행 작업 | 주요 산출물 | 완료 기준 |
| --- | --- | --- | ---:| --- | --- | --- |
| F-01 | 관리자 사이트 후속 범위 확정 | PM, Product Owner | 0.5일 | VectorMoon 기능 검토 | 후속 범위 확정 메모 | P1/P2/P3 반영 범위 승인 |
| F-02 | 요구사항/유스케이스 보완 | 기획자, PM | 0.5일 | F-01 | 요구사항 보완안, 유스케이스 보완안 | Source, IndexJob, Preview, 검색 테스트 요구사항 반영 |
| F-03 | 관리자 화면정의서 보완 | 기획자, 디자이너 | 1일 | F-02 | 화면정의서 보완본 | Source 등록/목록/상세, IndexJob, Preview, 검색 테스트 화면 정의 완료 |
| F-04 | Frontend 컴포넌트 설계 보완 | Frontend Engineer | 0.5일 | F-03 | 컴포넌트 설계 보완본 | UploadDropzone, SourceTable, JobTimeline, PreviewTabs, RetrievalTester 구조 정의 |
| F-05 | API 명세 및 DTO 보완 | Backend Engineer, Architect | 1일 | F-02 | API 명세 보완본, OpenAPI YAML 보완안 | Source/IndexJob/Preview/RetrievalTest API request/response 확정 |
| F-06 | 데이터 모델 보완 | Data Architect, Data Engineer | 0.5일 | F-05 | 데이터 모델 보완안 | SourceVersion, IndexJobStep, Preview 조회 모델 반영 |
| F-07 | 관리자 MVP 소스 개선 | Backend Engineer, Frontend Engineer | 2일 | F-03, F-04, F-05, F-06 | 관리자 사이트 개선 소스 | 등록/목록/작업/Preview/검색 테스트 기본 흐름 동작 |
| F-08 | 테스트 시나리오 보완 및 수행 | QA, 개발자 | 1일 | F-07 | 테스트 시나리오 보완본, 테스트 결과 | 성공/실패/재시도/권한/오류 케이스 검증 |
| F-09 | WBS 및 산출물 현행화 | PM | 0.5일 | F-08 | WBS 업데이트, 후속 작업 완료 보고 | 작업 완료 상태와 후속 파일럿 진입 조건 반영 |
| F-10 | GitHub 업데이트 | PM, Configuration Manager | 0.5일 | F-09 | Git commit/push 결과 | 원격 저장소 반영 확인 |

### 5.2 권장 일정

| 순서 | 작업 | 권장 소요 | 누적 소요 |
| --- | --- | ---:| ---:|
| 1 | F-01 관리자 사이트 후속 범위 확정 | 0.5일 | 0.5일 |
| 2 | F-02 요구사항/유스케이스 보완 | 0.5일 | 1.0일 |
| 3 | F-03 화면정의서 보완 | 1.0일 | 2.0일 |
| 4 | F-04 컴포넌트 설계 보완 | 0.5일 | 2.5일 |
| 5 | F-05 API 명세 및 DTO 보완 | 1.0일 | 3.5일 |
| 6 | F-06 데이터 모델 보완 | 0.5일 | 4.0일 |
| 7 | F-07 관리자 MVP 소스 개선 | 2.0일 | 6.0일 |
| 8 | F-08 테스트 시나리오 보완 및 수행 | 1.0일 | 7.0일 |
| 9 | F-09 WBS 및 산출물 현행화 | 0.5일 | 7.5일 |
| 10 | F-10 GitHub 업데이트 | 0.5일 | 8.0일 |

권장 총 소요 기간은 8영업일이다. 단, F-03 화면정의서 보완과 F-05 API 명세 보완은 초안 수준에서는 병행 가능하므로 최소 6영업일까지 단축할 수 있다.

## 6. 역할별 수행 계획

| 역할 | 담당 작업 | 책임 범위 |
| --- | --- | --- |
| PM | F-01, F-09, F-10 | 범위 확정, 일정 관리, WBS 반영, GitHub 업데이트 관리 |
| Product Owner | F-01 | 관리자 기능 우선순위 승인 |
| 기획자 | F-02, F-03 | 요구사항, 유스케이스, 화면 흐름 보완 |
| 디자이너 | F-03 | 관리자 화면 레이아웃, 상태 표현, 사용성 보완 |
| Architect | F-05 | API 구조, 모듈 경계, 공통 프레임워크 반영 기준 검토 |
| Backend Engineer | F-05, F-07 | Source/IndexJob/Preview/RetrievalTest API 구현 |
| Frontend Engineer | F-04, F-07 | 관리자 화면 컴포넌트 및 API 연동 구현 |
| Data Architect | F-06 | Source/IndexJob/Preview 데이터 모델 보완 |
| Data Engineer | F-06, F-07 | 인덱싱 작업 상태, 저장소 연계 구조 보완 |
| GraphRAG Engineer | F-05, F-07 | Entity/Relation/Evidence Preview, Hybrid Retrieval 테스트 연계 |
| QA | F-08 | 테스트 시나리오 보완 및 검증 |
| Configuration Manager | F-10 | 변경 파일 확인, Git 반영 지원 |

## 7. 산출물 계획

| 산출물 ID | 산출물명 | 저장 위치 | 담당 | 관련 작업 |
| --- | --- | --- | --- | --- |
| D-F-01 | 관리자 사이트 후속 범위 확정서 | `250.구현` | PM | F-01 |
| D-F-02 | 관리자 요구사항/유스케이스 보완안 | `220.요구정의` | 기획자 | F-02 |
| D-F-03 | 관리자 사이트 화면정의서 보완본 | `240.설계` | 기획자/디자이너 | F-03 |
| D-F-04 | 관리자 Frontend 컴포넌트 설계 보완본 | `240.설계` | Frontend Engineer | F-04 |
| D-F-05 | 관리자 및 GraphRAG API 명세 보완본 | `240.설계` | Backend Engineer | F-05 |
| D-F-06 | 관리자 API OpenAPI YAML 보완본 | `240.설계` | Backend Engineer | F-05 |
| D-F-07 | 물리 데이터 모델 보완본 | `240.설계` | Data Architect | F-06 |
| D-F-08 | 관리자 MVP 개선 구현 결과서 | `250.구현` | Backend/Frontend Engineer | F-07 |
| D-F-09 | 관리자 통합 테스트 시나리오 보완본 | `240.설계` 또는 `260.테스트` | QA | F-08 |
| D-F-10 | 후속 작업 완료 및 파일럿 진입 검토서 | `250.구현` | PM | F-09 |

## 8. 기능별 상세 보완 계획

### 8.1 Source 관리

| 항목 | 현재 MVP | 보완 계획 | 우선순위 |
| --- | --- | --- | --- |
| 파일 등록 | 기본 Source 등록 | VectorMoon 방식의 drag & drop, 다중 파일 선택, 업로드 전 목록 표시 | P1 |
| 메타데이터 | 기본 name/type 수준 | Domain, Scope, tags, owner, checksum, version 추가 | P1 |
| Source 목록 | 단순 목록 | 상태, 최근 IndexJob, chunk/entity/relation/evidence count 표시 | P1 |
| Source 상세 | 제한적 정보 | 기본 정보, 버전, 작업 이력, Preview 탭 구성 | P2 |
| 삭제 | 삭제 API | soft delete, 인덱스 정리 정책, 감사 로그 고려 | P2 |

### 8.2 IndexJob 관리

| 항목 | 현재 MVP | 보완 계획 | 우선순위 |
| --- | --- | --- | --- |
| 작업 실행 | 기본 실행 | Source 등록 후 즉시 실행/수동 실행 선택 제공 | P1 |
| 상태 조회 | 기본 상태 | PENDING/RUNNING/COMPLETED/FAILED/CANCELLED 표준화 | P1 |
| 단계 관리 | 제한적 | LOAD_SOURCE, PARSE_DOCUMENT, CHUNK_DOCUMENT, EMBED_CHUNK, SAVE_VECTOR, EXTRACT_ENTITY, EXTRACT_RELATION, LINK_EVIDENCE, SAVE_GRAPH, FINALIZE 단계 관리 | P1 |
| 로그 | 제한적 | 단계별 로그, 오류 상세, 처리 건수 표시 | P2 |
| 재시도 | 없음 또는 제한적 | 실패 단계 기준 retry 기능 정의 | P2 |

### 8.3 Preview 기능

| 항목 | 현재 MVP | 보완 계획 | 우선순위 |
| --- | --- | --- | --- |
| Chunk Preview | 기본 조회 | source_id 기준 탭형 조회, token count, metadata 표시 | P1 |
| Entity Preview | 미흡 | entity type, normalized name, mention count, confidence 표시 | P2 |
| Relation Preview | 미흡 | relation type, source/target entity, evidence 연결 표시 | P2 |
| Evidence Preview | 미흡 | evidence text, chunk, relation/entity link 표시 | P2 |
| 검색 Preview | 미흡 | 샘플 질의 기준 retrieval 후보 문맥 표시 | P3 |

### 8.4 GraphRAG 검색 테스트

| 항목 | 현재 MVP | 보완 계획 | 우선순위 |
| --- | --- | --- | --- |
| 검색 실행 | 기본 검색 테스트 | VECTOR_ONLY, GRAPH_ONLY, HYBRID 전략 선택 | P1 |
| 필터 | 제한적 | Domain, Scope, Source, Entity type 필터 추가 | P2 |
| 파라미터 | 제한적 | top_k, vector_weight, graph_weight, rerank 옵션 추가 | P2 |
| 결과 표시 | 텍스트 중심 | chunk, entity path, evidence, score breakdown 분리 표시 | P2 |
| 비교 | 없음 | 전략별 결과 비교 실행 | P3 |

## 9. WBS 반영안

현재 WBS는 6.8 `관리자 사이트 MVP 구현 및 구현 결과 정리`까지 구현 단계 완료로 정의되어 있다. 본 후속 작업은 관리자 사이트 MVP의 기능 보완 성격이므로 다음 중 하나로 반영할 수 있다.

| 방안 | WBS 반영 방식 | 장점 | 고려사항 |
| --- | --- | --- | --- |
| A안 | 6.9 `관리자 사이트 VectorMoon UX 반영 및 GraphRAG 관리 기능 보완` 추가 | 구현 단계 안에서 자연스럽게 관리 | 7.0 파일럿 일정 조정 필요 |
| B안 | 7.0 파일럿 적용의 선행 작업으로 7.0 하위에 편입 | 파일럿 검증과 직접 연결 | 파일럿 범위가 커질 수 있음 |
| C안 | 400.프로젝트관리 변경 요청으로 등록 후 단계별 산출물만 보완 | 일정 영향 관리가 명확 | 실제 구현 착수 시 WBS 재조정 필요 |

PM 권장안은 A안이다. 관리자 사이트는 공통 프레임워크의 운영 기능이므로 Sol-Bat 파일럿 전에 Source/IndexJob/Preview/검색 테스트 흐름을 보강하는 것이 이후 파일럿 품질을 높인다.

## 10. 리스크 및 대응 방안

| 리스크 ID | 리스크 | 영향 | 대응 방안 |
| --- | --- | --- | --- |
| R-F-01 | 관리자 보완 범위가 확대되어 일정 지연 | 파일럿 착수 지연 | P1/P2/P3로 우선순위 구분, P1 우선 완료 |
| R-F-02 | VectorMoon UX를 그대로 이식하여 GraphRAG 모델과 불일치 | 재작업 발생 | UI 패턴만 재사용하고 데이터/API는 Source/IndexJob 중심으로 재설계 |
| R-F-03 | 비동기 IndexJob 구현 복잡도 증가 | 구현 지연 | MVP는 InMemory Job Runner로 시작하고 DB/Queue 연동은 Adapter 구조로 분리 |
| R-F-04 | Preview 데이터가 부족해 운영 검증이 어려움 | 품질 검증 저하 | Chunk Preview를 P1로 우선 제공하고 Entity/Relation/Evidence는 P2로 단계적 확장 |
| R-F-05 | 검색 테스트 결과의 점수 해석이 어려움 | 사용자 신뢰 저하 | score breakdown, citation, evidence path를 결과 UI에 분리 표시 |

## 11. 완료 기준

| 구분 | 완료 기준 |
| --- | --- |
| 산출물 | 후속 범위, 화면정의, API 명세, 데이터 모델, 테스트 시나리오 보완 산출물 작성 |
| 기능 | Source 등록/목록, IndexJob 실행/상태, Chunk Preview, Hybrid 검색 테스트 기본 흐름 동작 |
| 품질 | 성공/실패/오류/권한 케이스 테스트 결과 정리 |
| 관리 | WBS에 후속 작업 상태 반영 |
| 형상 | PM 요청 시 GitHub 원격 저장소 반영 완료 |

## 12. 다음 실행 순서

| 순서 | 담당 | 요청 문구 예시 | 기대 결과 |
| --- | --- | --- | --- |
| 1 | PM | `[PM] 관리자 사이트 후속 범위 확정서를 작성해 주세요.` | P1/P2/P3 범위 확정 |
| 2 | 기획자/디자이너 | `[기획자/디자이너] 관리자 사이트 화면정의서를 VectorMoon UX 반영 기준으로 보완해 주세요.` | 화면정의서 보완 |
| 3 | Backend Engineer | `[Backend Engineer] 관리자 Source/IndexJob/Preview/RetrievalTest API 명세와 OpenAPI YAML을 보완해 주세요.` | API 명세 보완 |
| 4 | Frontend Engineer | `[Frontend Engineer] 관리자 사이트 컴포넌트 설계를 VectorMoon UX 반영 기준으로 보완해 주세요.` | 컴포넌트 설계 보완 |
| 5 | Backend/Frontend Engineer | `[Backend Engineer/Frontend Engineer] 관리자 사이트 MVP에 VectorMoon UX와 GraphRAG 관리 기능을 반영해 주세요.` | 소스 개선 |
| 6 | QA | `[QA] 관리자 사이트 후속 보완 기능 통합 테스트 시나리오를 작성하고 검증해 주세요.` | 테스트 시나리오/결과 |
| 7 | PM | `[PM] 후속 작업 완료 검토 및 WBS 반영 후 GitHub 업데이트해 주세요.` | WBS 현행화 및 GitHub 반영 |
