# 관리자 사이트 후속 범위 확정서

## 1. 확정 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 250.구현 후속 보완 |
| 담당 | PM |
| 기준 | VectorMoon 관리자/벡터화 관리 UI 및 기능 검토 |
| 확정일 | 2026-06-21 |

## 2. 범위 확정 원칙

- VectorMoon의 사용성 패턴은 재사용하되, 데이터/API 모델은 GraphRAG 공통 프레임워크의 Source, IndexJob, Preview, RetrievalTest 기준으로 확장한다.
- Sol-Bat 파일럿 전에 운영자가 자료 등록, 인덱싱 실행, 결과 검증, 검색 테스트를 한 화면에서 수행할 수 있는 수준까지 보완한다.
- P1은 이번 후속 작업에서 구현/문서화하고, P2는 설계와 일부 골격을 반영하며, P3는 차기 개선 과제로 관리한다.

## 3. P1/P2/P3 범위

| 우선순위 | 범위 | 확정 내용 | 완료 기준 |
| --- | --- | --- | --- |
| P1 | Source 관리 | drag & drop UI, Domain/Scope/Tag, Source 목록, 최근 Job 상태, count 표시 | 관리자 화면과 API DTO 반영 |
| P1 | IndexJob 관리 | 작업 생성, 실행, 상태 조회, 10단계 타임라인 | 서비스/라우터/테스트 반영 |
| P1 | Chunk Preview | source_id 기준 Chunk Preview 조회 | Preview API와 화면 탭 반영 |
| P1 | Hybrid 검색 테스트 | HYBRID/VECTOR_ONLY/GRAPH_ONLY/HYBRID_RERANK 선택, top_k, source filter | 검색 테스트 UI/API DTO 반영 |
| P2 | Entity/Relation/Evidence Preview | Preview 응답과 화면 탭 제공 | InMemoryGraphStore 기반 조회 반영 |
| P2 | 실패/재시도 | Job retry API와 화면 버튼 제공 | retry_index_job 구현 |
| P2 | API/OpenAPI 보완 | 후속 API 명세와 YAML 보완본 작성 | 보완 산출물 작성 |
| P3 | 전략별 비교 실행 | 동일 질의로 여러 검색 전략 결과 비교 | 차기 개선 과제로 관리 |
| P3 | 감사 로그/권한 상세화 | 역할별 권한, 감사 로그 상세 설계 | 260.테스트/270.이행 전 보완 |

## 4. 이번 작업 확정 범위

| 구분 | 확정 |
| --- | --- |
| 문서 | 후속 범위 확정서, 화면정의 보완본, API 명세 보완본, OpenAPI 보완본, 컴포넌트 설계 보완본, 테스트 시나리오/결과, 완료 검토서 |
| 소스 | `common_core.admin` 스키마/서비스/라우터, `admin_mvp.html`, 관리자 MVP 테스트 |
| WBS | `6.10 관리자 사이트 VectorMoon UX 반영 및 GraphRAG 관리 기능 보완` 완료 반영 |
| GitHub | 작업 완료 후 commit/push 수행 |

## 5. 파일럿 진입 영향

관리자 사이트 후속 보완 완료 후 Sol-Bat 파일럿은 다음 기준으로 진입한다.

- Source 등록과 IndexJob 실행이 관리자 MVP에서 동작한다.
- Chunk/Entity/Relation/Evidence Preview가 최소 InMemory 기준으로 조회된다.
- Hybrid Retrieval 검색 테스트가 관리자 화면에서 수행된다.
- 테스트 시나리오와 수동 검증 결과가 산출물로 남는다.
