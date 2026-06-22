# 관리자 사이트 VectorMoon UX 및 GraphRAG 관리 기능 보완 구현 결과

## 1. 구현 개요

| 항목 | 내용 |
| --- | --- |
| 단계 | 250.구현 후속 보완 |
| 담당 | Backend Engineer / Frontend Engineer |
| 구현일 | 2026-06-21 |
| 목적 | VectorMoon 관리자 벡터화 UX를 GraphRAG 관리자 MVP에 반영하고 Source/IndexJob/Preview/RetrievalTest 기능을 보완 |

## 2. 변경 파일

| 파일 | 변경 내용 |
| --- | --- |
| `src/common_core/admin/schemas.py` | Source scope/tags, IndexJobStep, SourcePreview, RetrievalTest 옵션 DTO 추가 |
| `src/common_core/admin/service.py` | IndexJob 10단계 타임라인, retry, Source Preview 조회 구현 |
| `src/common_core/admin/routers.py` | `/sources/{source_id}/preview`, `/index-jobs/{job_id}/retry` API 추가 |
| `src/common_core/admin/__init__.py` | 신규 DTO export |
| `src/common_core/admin/web/admin_mvp.html` | 한글 라벨 정상화, drag & drop, Source 목록, Job 타임라인, Preview 탭, 검색 테스트 UI 보완 |
| `tests/test_admin_mvp.py` | Preview, retry, step timeline 테스트 추가 |

## 3. 구현 기능

| 기능 | 구현 결과 |
| --- | --- |
| Source 등록 | Domain, Scope, Tags, Content 기반 등록 |
| drag & drop UI | 파일명 placeholder 기반 MVP 반영 |
| Source 목록 | 상태, chunk/entity/relation/evidence count 표시 |
| IndexJob 실행 | LOAD_SOURCE~FINALIZE 10단계 타임라인 기록 |
| IndexJob 재시도 | 기존 Job step 초기화 후 재실행 |
| Preview | Chunk, Entity, Relation, Evidence 조회 |
| Retrieval Test | HYBRID, VECTOR_ONLY, GRAPH_ONLY, HYBRID_RERANK 선택 및 top_k/source filter 지원 |

## 4. 검증 결과

| 검증 | 결과 |
| --- | --- |
| Python compileall | 통과 |
| 관리자 MVP 수동 흐름 | 통과 |
| pytest | 현재 런타임에 pytest 미설치로 실행 불가 |

## 5. 제약 및 후속 보완

- MVP 파일 업로드는 브라우저에서 파일명을 placeholder content로 반영한다. 실제 multipart upload 저장은 후속 Backend API에서 보완한다.
- IndexJob은 InMemory 동기 실행이다. 운영 적용 시 Queue/Celery/RQ 또는 FastAPI BackgroundTask 연계가 필요하다.
- Preview는 InMemoryVectorStore/InMemoryGraphStore 기준으로 구현되었다. PGVector/PostgreSQL GraphStore 연동 시 adapter별 조회 구현을 보완한다.
