# GraphRAG AI Agent 공통 프레임워크 VectorMoon 관리자/벡터화 관리 UI 및 기능 검토

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 250.구현 |
| 역할 | PM |
| 검토 대상 | VectorMoon 관리자 기능, VectorMoon 벡터화 관리 기능 |
| 작성 목적 | VectorMoon의 기존 관리자/벡터화 관리 기능을 검토하여 GraphRAG AI Agent 공통 프레임워크 관리자 사이트의 UI 및 기능 반영 방향을 정의 |
| 작성일 | 2026-06-21 |

## 2. 검토 대상 파일

| 구분 | 파일 | 주요 내용 |
| --- | --- | --- |
| 관리자 화면 | `VectorMoon/frontend/src/pages/AdminDashboard.jsx` | 관리자 대시보드, 사용자 관리, 벡터화 관리, 거래 설정, 시스템 설정 탭 구성 |
| 벡터화 화면 | `VectorMoon/frontend/src/components/VectorizationScreen.jsx` | 파일 업로드, 문서 목록, 청크 조회, 벡터 검색 테스트 UI |
| 벡터 저장소 | `VectorMoon/src/vector_store.py` | 문서 로딩, 청킹, 임베딩 저장, 검색, 문서 목록/삭제/청크 조회 |
| API | `VectorMoon/app/api.py` | 문서 업로드, 문서 목록, 검색, 청크 조회, 문서 삭제 API |

## 3. VectorMoon 관리자 기능 요약

### 3.1 관리자 대시보드 구조

VectorMoon 관리자 화면은 좌측 사이드바와 우측 콘텐츠 영역으로 구성되어 있으며, 다음 관리 탭을 제공한다.

| 탭 | 기능 |
| --- | --- |
| 사용자 관리 | 사용자 목록, 권한/승인 상태 관리 |
| 벡터화 관리 | 문서 업로드, 벡터화, 문서 목록, 청크 조회, 검색 테스트 |
| 거래 설정 | 거래 관련 환경 설정 |
| 시스템 설정 | 관리자 시스템 설정 |

벡터화 관리는 별도 화면이 아니라 관리자 대시보드 내부 탭으로 임베딩되어 있다. GraphRAG 공통 프레임워크도 관리자 사이트 안에서 Source/IndexJob/검색 테스트를 하나의 관리 흐름으로 제공하는 방식이 적합하다.

### 3.2 벡터화 관리 화면 기능

| 기능 | VectorMoon 구현 현황 | GraphRAG 반영 방향 |
| --- | --- | --- |
| 파일 업로드 | 드래그 앤 드롭, 다중 파일 선택, 업로드 전 파일 목록 표시 | Source 등록 화면에 반영 |
| 범위 지정 | 종목명 입력, 전체 공통 문서 여부 선택 | Domain/Scope/Tenant/Global 범위 모델로 확장 |
| 벡터화 실행 | 업로드 API 호출 시 즉시 문서 처리 및 벡터 저장 | 비동기 IndexJob 실행 구조로 전환 |
| 처리 결과 | 파일명, 티커, 청크 수, 미리보기 청크 표시 | 청크 수, 엔티티 수, 관계 수, Evidence 수까지 확장 |
| 문서 목록 | 저장된 문서 목록 조회, 상태 표시 | Source 목록 + 최근 IndexJob 상태 + 버전 정보 표시 |
| 청크 조회 | 문서별 청크 모달 조회 | Chunk/Entity/Relation/Evidence 탭형 Preview로 확장 |
| 문서 삭제 | source 기준 삭제 | Source 삭제/비활성화 + Vector/Graph 인덱스 정리 정책 필요 |
| 검색 테스트 | 티커와 질의어 기반 벡터 검색 테스트 | VECTOR_ONLY, GRAPH_ONLY, HYBRID 검색 전략 테스트로 확장 |

## 4. VectorMoon API 및 백엔드 구조 요약

| 기능 | API/함수 | 설명 |
| --- | --- | --- |
| 문서 목록 | `GET /api/list_docs` | PGVector 저장 테이블에서 source/ticker 기준 문서 목록 조회 |
| 문서 업로드 | `POST /api/upload_doc` | 파일 업로드 후 문서 로딩, 청킹, 임베딩 저장, 미리보기 반환 |
| 검색 테스트 | `POST /api/search_docs` | 티커 필터와 사용자 질의로 유사도 검색 수행 |
| 청크 조회 | `GET /api/docs/chunks?source=` | source 기준 저장된 청크 목록 조회 |
| 문서 삭제 | `DELETE /api/docs?source=` | source 기준 임베딩 문서 삭제 |
| 문서 처리 | `process_document_with_preview` | 로더 선택, 청킹, 메타데이터 구성, PGVector 저장 |
| 저장소 | `PGVector(collection_name="stock_docs")` | LangChain PGVector 기반 벡터 저장 |

## 5. VectorMoon 기능 중 재사용할 좋은 패턴

| 패턴 | 재사용 사유 | GraphRAG 적용 방안 |
| --- | --- | --- |
| 관리자 대시보드 내 벡터화 탭 | 운영자가 별도 화면 이동 없이 자료 관리 가능 | 관리자 사이트 메뉴에 `자료 관리`, `인덱싱 작업`, `검색 테스트` 배치 |
| 드래그 앤 드롭 파일 업로드 | 자료 등록 사용성이 좋음 | Source 등록 컴포넌트에 기본 적용 |
| 전체 공통 문서 토글 | 특정 도메인 전용 문서와 공통 문서 구분 가능 | Scope를 `GLOBAL`, `DOMAIN`, `TENANT`, `USER`로 일반화 |
| 업로드 결과 미리보기 | 벡터화 결과를 즉시 확인 가능 | Chunk/Entity/Relation/Evidence 미리보기로 확장 |
| 문서별 청크 모달 | 저장 결과 검증이 쉬움 | Preview Drawer 또는 Modal로 확장 |
| 검색 테스트 패널 | 인덱싱 결과를 운영자가 직접 검증 가능 | Hybrid Retrieval 테스트 화면으로 확장 |

## 6. GraphRAG 공통 프레임워크 적용 시 보완 필요 사항

| 보완 항목 | VectorMoon 현재 방식 | GraphRAG 권장 방식 |
| --- | --- | --- |
| 처리 방식 | 업로드 시 동기 벡터화 | Source 등록과 IndexJob 실행 분리 |
| 작업 상태 | 업로드 응답 중심 | IndexJob 상태, 단계별 진행률, 실패 원인 관리 |
| Source 식별 | 파일명/source 문자열 중심 | `source_id`, `source_version`, checksum 기반 식별 |
| 저장 구조 | 임베딩 테이블 메타데이터에서 문서 목록 추출 | Source, Document, Chunk, EmbeddingRef, Entity, Relation, Evidence 테이블 분리 |
| 삭제 정책 | source 기준 직접 삭제 | Soft delete, 재처리, 인덱스 정리, 감사 로그 정책 필요 |
| 검색 방식 | 벡터 검색 중심 | VectorStore + GraphStore + Evidence 기반 Hybrid Retrieval |
| 결과 설명 | source 텍스트 중심 | score breakdown, entity path, relation, evidence citation 제공 |
| 권한 | 관리자 인증 기반 | 역할 기반 권한, 자료 범위 권한, 감사 로그 적용 |
| 운영성 | 실패 시 예외 메시지 반환 | 재시도, 작업 중단, 단계별 로그, 알림 기능 필요 |

## 7. 권장 관리자 사이트 UI 구성

### 7.1 메뉴 구조

| 메뉴 | 하위 기능 | 설명 |
| --- | --- | --- |
| Dashboard | 인덱싱 현황, 실패 작업, 최근 검색 테스트 | 관리자 첫 화면 요약 |
| Source 관리 | Source 목록, 등록, 상세, 삭제, 재인덱싱 | 자료의 원본과 버전 관리 |
| IndexJob 관리 | 작업 실행, 상태 모니터링, 로그 조회, 재시도 | 벡터화/GraphRAG 인덱싱 작업 관리 |
| Preview | Chunk, Entity, Relation, Evidence 조회 | 인덱싱 결과 검증 |
| GraphRAG 검색 테스트 | 검색 전략 선택, 질의 실행, 결과 비교 | 운영자 검증 및 튜닝 |
| 설정 | Parser, Chunker, Embedding, GraphRAG 옵션 | 공통 프레임워크 운영 설정 |

### 7.2 Source 등록 화면

| UI 요소 | 설명 |
| --- | --- |
| 파일 드롭존 | VectorMoon 방식의 드래그 앤 드롭/다중 파일 선택 적용 |
| Source 유형 | FILE, URL, TEXT, DATABASE, API 등 선택 |
| Domain | Sol-Bat, VectorMoon, accountBook, lotto, common 등 |
| Scope | GLOBAL, DOMAIN, TENANT, USER 선택 |
| 태그 | 검색/필터링용 태그 입력 |
| Parser 옵션 | 파일 유형별 파서 자동 선택, 필요 시 수동 지정 |
| Chunk 옵션 | chunk size, overlap, splitter strategy 지정 |
| 등록 후 실행 옵션 | Source 등록만 수행 또는 즉시 IndexJob 생성/실행 |

### 7.3 Source 목록/상세 화면

| UI 요소 | 설명 |
| --- | --- |
| 목록 테이블 | Source명, 유형, Domain, Scope, 상태, 버전, 최근 작업 상태 표시 |
| 필터 | Domain, Scope, 상태, 파일 유형, 등록자 기준 필터 |
| 액션 | 상세, Preview, 재인덱싱, 삭제, 비활성화 |
| 상세 탭 | 기본 정보, 버전 이력, 관련 IndexJob, Preview, 감사 로그 |

### 7.4 IndexJob 모니터링 화면

| UI 요소 | 설명 |
| --- | --- |
| 작업 목록 | Job ID, Source, 상태, 진행률, 시작/종료 시간, 실행자 표시 |
| 상태 배지 | PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| 단계 타임라인 | LOAD_SOURCE, PARSE_DOCUMENT, CHUNK_DOCUMENT, EMBED_CHUNK, SAVE_VECTOR, EXTRACT_ENTITY, EXTRACT_RELATION, LINK_EVIDENCE, SAVE_GRAPH, FINALIZE |
| 로그 패널 | 단계별 처리 로그, 오류 메시지, 재시도 가능 여부 표시 |
| 운영 액션 | 재시도, 중단, 재실행, 실패 원인 다운로드 |

### 7.5 Preview 화면

| 탭 | 표시 항목 |
| --- | --- |
| Chunk | chunk id, sequence, text preview, token count, metadata |
| Entity | entity id, type, name, normalized name, confidence |
| Relation | source entity, target entity, relation type, confidence |
| Evidence | evidence text, linked chunk, linked relation/entity |
| Retrieval Preview | 샘플 질의 기준 후보 문맥, 점수, citation |

### 7.6 GraphRAG 검색 테스트 화면

| UI 요소 | 설명 |
| --- | --- |
| 질의 입력 | 테스트 질의 입력 |
| 검색 전략 | VECTOR_ONLY, GRAPH_ONLY, HYBRID 선택 |
| 필터 | Domain, Scope, Source, Entity type, 기간 등 |
| 튜닝 파라미터 | top_k, vector_weight, graph_weight, rerank 여부 |
| 결과 영역 | answer context, chunk, entity path, evidence, score breakdown |
| 비교 실행 | 동일 질의를 전략별로 비교하는 기능 |

## 8. 권장 API 보완안

| 구분 | Method | Path | 설명 |
| --- | --- | --- | --- |
| Source 등록 | POST | `/api/admin/sources` | 파일/URL/텍스트 Source 등록 |
| Source 목록 | GET | `/api/admin/sources` | Source 목록 및 필터 조회 |
| Source 상세 | GET | `/api/admin/sources/{source_id}` | Source 상세/버전/상태 조회 |
| Source 삭제 | DELETE | `/api/admin/sources/{source_id}` | Source 삭제 또는 비활성화 |
| Source Preview | GET | `/api/admin/sources/{source_id}/preview` | Chunk/Entity/Relation/Evidence 미리보기 |
| IndexJob 생성 | POST | `/api/admin/index-jobs` | Source 기반 인덱싱 작업 생성 |
| IndexJob 실행 | POST | `/api/admin/index-jobs/{job_id}/run` | 인덱싱 작업 실행 |
| IndexJob 목록 | GET | `/api/admin/index-jobs` | 작업 목록/상태 조회 |
| IndexJob 상세 | GET | `/api/admin/index-jobs/{job_id}` | 단계별 상태/로그 조회 |
| IndexJob 재시도 | POST | `/api/admin/index-jobs/{job_id}/retry` | 실패 작업 재시도 |
| GraphRAG 테스트 | POST | `/api/admin/retrieval-tests` | 검색 전략별 GraphRAG 테스트 |
| Agent 테스트 | POST | `/api/admin/agent-runs` | Agent Workflow 테스트 실행 |

## 9. 구현 우선순위 제안

| 우선순위 | 항목 | 설명 |
| --- | --- | --- |
| P1 | Source 등록/목록/삭제 | VectorMoon의 문서 관리 흐름을 공통 Source 관리로 전환 |
| P1 | 비동기 IndexJob 실행/상태 조회 | 동기 업로드 벡터화를 운영 가능한 작업 모델로 개선 |
| P1 | Chunk Preview | 현재 VectorMoon의 청크 미리보기 기능을 우선 반영 |
| P2 | Entity/Relation/Evidence Preview | GraphRAG 차별 기능 검증을 위해 추가 |
| P2 | Hybrid 검색 테스트 | Vector 검색 테스트를 GraphRAG 검색 테스트로 확장 |
| P2 | 작업 실패/재시도 UI | 운영 안정성 확보 |
| P3 | 전략별 검색 결과 비교 | 튜닝 및 성능 검증 편의 기능 |
| P3 | 감사 로그/권한 상세화 | 운영/보안 요구사항 강화 |

## 10. 검토 결론

VectorMoon의 관리자 벡터화 기능은 GraphRAG 관리자 사이트 MVP의 출발점으로 활용하기에 적합하다. 특히 드래그 앤 드롭 파일 업로드, 공통 문서 토글, 청크 미리보기, 문서 목록, 검색 테스트 흐름은 사용자 경험 측면에서 재사용 가치가 높다.

다만 GraphRAG AI Agent 공통 프레임워크는 단순 벡터화 관리가 아니라 Source 관리, 비동기 IndexJob, VectorStore/GraphStore 동시 인덱싱, Entity/Relation/Evidence 검증, Hybrid Retrieval 테스트까지 제공해야 한다. 따라서 VectorMoon의 화면 구조는 유지하되, 백엔드 모델과 UI 상태 관리는 Source/IndexJob/Preview/RetrievalTest 중심으로 확장하는 것이 바람직하다.

## 11. 후속 작업

| 담당 | 작업 | 비고 |
| --- | --- | --- |
| PM | 관리자 사이트 MVP 범위 재확정 | VectorMoon 반영 항목과 GraphRAG 확장 항목 구분 |
| 기획자/디자이너 | 관리자 화면정의서 보완 | Source/IndexJob/Preview/검색 테스트 화면 상세화 |
| Backend Engineer | 관리자 API DTO 보완 | Source, IndexJob, Preview, RetrievalTest API 확장 |
| Frontend Engineer | 관리자 MVP 화면 개선 | VectorMoon UX 패턴 반영 |
| QA | 관리자 기능 테스트 시나리오 보완 | 업로드, 인덱싱, Preview, 검색 테스트, 실패/재시도 포함 |
