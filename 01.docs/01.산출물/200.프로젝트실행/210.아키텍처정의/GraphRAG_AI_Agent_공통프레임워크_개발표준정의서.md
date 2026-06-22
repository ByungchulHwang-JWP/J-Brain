# GraphRAG AI Agent 공통 프레임워크 개발표준정의서

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 개발 프로젝트의 개발 표준과 기술 스택을 정의한다. 산출물 작성, 소스 코드 작성, 패키지 구조, 네이밍, 보안, 테스트, 형상관리, 배포 준비 기준을 명확히 하여 후속 설계, 구현, 테스트 단계의 일관성을 확보한다.

### 1.2 적용 범위

본 표준은 다음 작업에 적용한다.

- GraphRAG AI Agent 공통 프레임워크 산출물 작성
- `vm-common-core` 기반 공통 모듈 설계 및 구현
- GraphRAG, RAG, LangGraph Agent 관련 Python 코드 작성
- PostgreSQL, pgvector, Graph Tables 관련 DB 설계 및 구현
- 테스트 코드, 샘플 코드, 운영 스크립트 작성
- Git/GitHub 기반 형상관리

### 1.3 관련 산출물

| 산출물 | 경로 |
|---|---|
| 시스템아키텍처정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_시스템아키텍처정의서.md` |
| GraphRAG 아키텍처 정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_GraphRAG아키텍처정의서.md` |
| 데이터/저장소 아키텍처 정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_데이터저장소아키텍처정의서.md` |

## 2. 기술 스택 표준

### 2.1 기본 기술 스택

| 영역 | 표준 기술 | 비고 |
|---|---|---|
| Language | Python 3.10 이상 | 타입 힌트 사용 |
| API Framework | FastAPI | 서비스 연동 예제 기준 |
| Agent Workflow | LangGraph | 상태 기반 Agent Workflow |
| LLM Integration | LangChain, OpenAI API | 추상화 계층 사용 |
| Embedding | OpenAI Embedding 계열 | 모델명은 설정으로 분리 |
| ORM | SQLAlchemy 2.x | DB 공통 모듈 기준 |
| DB | PostgreSQL | 기본 관계형 저장소 |
| Vector DB | pgvector | 1차 표준 |
| Optional Vector Store | FAISS, Chroma | 로컬/실험용 |
| Scheduler | APScheduler | 배치/인덱싱 작업 |
| Test | pytest | 단위/통합 테스트 |
| Docs | Markdown, Mermaid | Git diff 관리 |
| SCM | Git, GitHub | PM 요청 시 push |

### 2.2 선택 기술 기준

| 기술 | 사용 기준 |
|---|---|
| FAISS | 로컬 파일 기반 빠른 검색 또는 offline 테스트 |
| Chroma | 개발/PoC 단계의 간단한 벡터 저장소 |
| Neo4j | PostgreSQL Graph Tables의 성능/기능 한계 발생 시 후속 검토 |
| Redis | 검색 캐시, 세션, 작업 큐가 필요할 경우 후속 검토 |
| Celery/RQ | 장시간 인덱싱 작업 비동기화가 필요할 경우 후속 검토 |

## 3. 저장소 및 폴더 표준

### 3.1 프로젝트 산출물 저장소

산출물은 `GraphRAG-AI-Agnet` 저장소에서 관리한다.

```text
GraphRAG-AI-Agnet/
  01.docs/
    01.산출물/
      100.프로젝트계획/
      200.프로젝트실행/
        210.아키텍처정의/
        220.요구정의/
        230.분석/
        240.설계/
        250.구현/
        260.테스트/
        270.이행/
      300.프로젝트종료/
      400.프로젝트관리/
```

### 3.2 공통 프레임워크 목표 폴더

구현 단계에서는 `vm-common-core`에 다음 구조를 적용한다.

```text
common_core/
  auth/
  db/
  notifier/
  scheduler/
  ai_pipeline/
    loaders/
    vectorstores/
    langgraph/
    rag/
    graphrag/
```

### 3.3 산출물 파일명 표준

산출물 파일명은 다음 규칙을 따른다.

```text
GraphRAG_AI_Agent_공통프레임워크_{산출물명}.md
```

예:

```text
GraphRAG_AI_Agent_공통프레임워크_시스템아키텍처정의서.md
GraphRAG_AI_Agent_공통프레임워크_요구사항정의서.md
```

## 4. Python 코딩 표준

### 4.1 기본 규칙

| 항목 | 표준 |
|---|---|
| 인코딩 | UTF-8 |
| 들여쓰기 | Space 4칸 |
| 라인 길이 | 100~120자 권장 |
| 타입 힌트 | public 함수/메서드 필수 |
| Docstring | public class/function 필수 |
| 예외 처리 | 광범위한 `except Exception` 사용 시 로그와 fallback 명시 |
| 전역 상태 | 가능한 최소화, 설정 객체 또는 factory 사용 |

### 4.2 네이밍 규칙

| 대상 | 규칙 | 예 |
|---|---|---|
| 패키지/모듈 | snake_case | `hybrid_retriever.py` |
| 클래스 | PascalCase | `HybridRetriever` |
| 함수/메서드 | snake_case | `retrieve_context()` |
| 변수 | snake_case | `entity_type` |
| 상수 | UPPER_SNAKE_CASE | `DEFAULT_TOP_K` |
| DB 테이블 | snake_case plural | `graphrag_entities` |
| Entity Type | UPPER_SNAKE_CASE | `CROP`, `DISEASE` |
| Relation Type | UPPER_SNAKE_CASE 동사형 | `AFFECTS`, `RECOMMENDS` |

### 4.3 Import 규칙

Import 순서는 다음을 따른다.

1. Python 표준 라이브러리
2. 외부 패키지
3. 프로젝트 내부 모듈

예:

```python
from typing import Any, Optional

from pydantic import BaseModel
from sqlalchemy.orm import Session

from common_core.ai_pipeline.graphrag.schema import GraphEntity
```

### 4.4 설정 관리

- 환경변수는 직접 여러 위치에서 읽지 않고 설정 객체 또는 factory에서 읽는다.
- `.env`는 로컬 개발용으로만 사용한다.
- `.env.example`에는 샘플 값만 기록한다.
- 운영 Secret은 코드와 산출물에 기록하지 않는다.

## 5. GraphRAG 개발 표준

### 5.1 공통 인터페이스 우선

GraphRAG 구성요소는 구현체보다 인터페이스를 먼저 정의한다.

| 인터페이스 | 책임 |
|---|---|
| `BaseVectorStore` | 벡터 저장/검색 추상화 |
| `BaseGraphStore` | Entity/Relation 저장/탐색 추상화 |
| `BaseEntityExtractor` | Entity 추출 추상화 |
| `BaseRelationExtractor` | Relation 추출 추상화 |
| `BaseHybridRetriever` | Vector + Graph 검색 추상화 |

### 5.2 Entity/Relation 처리 표준

- Entity는 반드시 `domain`, `entity_type`, `name`, `normalized_name`을 가진다.
- Relation은 반드시 `source_entity_id`, `target_entity_id`, `relation_type`을 가진다.
- 자동 추출 Entity/Relation은 `confidence`를 가진다.
- 가능한 모든 Relation은 Evidence와 연결한다.
- 도메인 스키마에 없는 Entity/Relation Type은 저장하지 않는다.

### 5.3 Hybrid Retrieval 표준

Hybrid Retrieval은 다음 단계를 따른다.

1. Query 정규화
2. Query Entity 후보 탐지
3. Vector Search
4. Entity Linking
5. Graph Traversal
6. Evidence Reranking
7. Context Assembly
8. Agent 답변 생성

검색 가중치는 도메인별 설정으로 분리한다.

## 6. DB 개발 표준

### 6.1 테이블 설계 규칙

| 항목 | 표준 |
|---|---|
| PK | UUID 권장 |
| 생성일 | `created_at` |
| 수정일 | `updated_at` |
| JSON 확장 필드 | `metadata` |
| 삭제 | 초기에는 hard delete보다 soft delete 우선 검토 |
| 인덱스 | 검색 조건 기준 명시 |
| FK | 가능한 명시하되 대량 삭제 정책 검토 |

### 6.2 공통 컬럼

GraphRAG 관련 주요 테이블은 다음 공통 컬럼을 우선 검토한다.

```text
id
domain
tenant_id
user_id
scope
metadata
created_at
updated_at
```

### 6.3 Migration 표준

- DB 변경은 migration 스크립트로 관리한다.
- 수동 SQL 변경은 산출물 또는 변경 이력에 기록한다.
- 테이블/컬럼 변경 시 테이블정의서와 요구사항추적표 영향도를 검토한다.

## 7. API 개발 표준

### 7.1 API 응답 형식

FastAPI 예제 또는 서비스 연동 API는 다음 응답 구조를 권장한다.

```json
{
  "success": true,
  "data": {},
  "message": "ok",
  "error": null
}
```

### 7.2 오류 응답

```json
{
  "success": false,
  "data": null,
  "message": "처리 실패",
  "error": {
    "code": "GRAPHRAG_RETRIEVAL_FAILED",
    "detail": "검색 처리 중 오류가 발생했습니다."
  }
}
```

### 7.3 API 보안

- 인증이 필요한 API는 JWT Bearer 인증을 사용한다.
- 관리자 API는 Role 기반 접근 제어를 적용한다.
- 검색 API는 `domain`, `scope`, `tenant_id`, `user_id` 필터를 적용한다.
- 요청/응답 로그에 Secret 또는 개인정보를 남기지 않는다.

## 8. Prompt 개발 표준

### 8.1 Prompt 구성 원칙

| 항목 | 기준 |
|---|---|
| 역할 | Agent의 역할을 명확히 정의 |
| 컨텍스트 | 검색 근거와 사용자 질문을 분리 |
| 답변 형식 | JSON 또는 Markdown 등 형식을 명시 |
| 근거 제한 | 제공된 근거 안에서 답변하도록 지시 |
| 불확실성 | 근거 부족 시 모른다고 답하도록 지시 |
| 출처 | 답변에 출처를 포함하도록 지시 |

### 8.2 Prompt Template 관리

- 프롬프트는 코드에 긴 문자열로 흩어두지 않는다.
- 도메인별 프롬프트를 템플릿으로 분리한다.
- 프롬프트 변경 시 테스트 질문으로 회귀 검증한다.

## 8.1 관리자 사이트 개발 표준

관리자 사이트는 벡터화 대상 자료를 관리하고 인덱싱 작업을 운영하기 위한 화면/API이다. 프론트엔드 구현 기술은 후속 설계에서 확정하되, 다음 표준을 우선 적용한다.

### 8.1.1 관리자 화면 기준

| 화면 | 주요 기능 |
|---|---|
| 자료 목록 | 자료명, domain, source_type, scope, status, 최근 인덱싱 결과 조회 |
| 자료 등록 | 파일/URL/DB/API/text 자료 등록, 메타데이터 입력 |
| 자료 상세 | 원문 정보, chunk, entity, relation, evidence 미리보기 |
| 인덱싱 작업 | 벡터화 실행, 재시도, 재인덱싱, 실패 사유 확인 |
| 검색 테스트 | 관리자 질의로 vector/graph/hybrid 검색 결과 검증 |
| 설정 | domain schema, embedding model, chunking option 관리 |

### 8.1.2 관리자 API 기준

관리자 API는 `/admin` 또는 `/api/admin` prefix를 사용한다.

| API | 설명 |
|---|---|
| `GET /admin/sources` | 자료 목록 조회 |
| `POST /admin/sources` | 자료 등록 |
| `GET /admin/sources/{source_id}` | 자료 상세 조회 |
| `PATCH /admin/sources/{source_id}` | 자료 메타데이터 수정 |
| `POST /admin/sources/{source_id}/index` | 인덱싱 실행 |
| `POST /admin/sources/{source_id}/reindex` | 재인덱싱 실행 |
| `DELETE /admin/sources/{source_id}` | 자료 삭제 또는 비활성화 |
| `GET /admin/index-jobs` | 인덱싱 작업 목록 조회 |
| `POST /admin/search-test` | 검색 테스트 실행 |

### 8.1.3 관리자 권한 기준

- 관리자 사이트는 관리자 권한 사용자만 접근 가능해야 한다.
- 자료 등록/삭제/재인덱싱은 audit log를 남긴다.
- private 자료는 `scope`, `tenant_id`, `user_id`를 명시해야 한다.
- 업로드 파일은 확장자, 크기, MIME type을 검증한다.
- 자료 미리보기에는 민감정보 마스킹 정책을 적용한다.

## 9. 테스트 표준

### 9.1 테스트 유형

| 테스트 | 대상 |
|---|---|
| 단위 테스트 | Parser, Chunker, Extractor, Retriever |
| 통합 테스트 | Vector Store + Graph Store + Retriever |
| Agent 테스트 | LangGraph Workflow |
| 품질 테스트 | 검색 품질, Grounding, 출처 일치 |
| 보안 테스트 | 권한 필터, Secret 노출 여부 |
| 회귀 테스트 | 프롬프트/검색 변경 전후 비교 |

### 9.2 테스트 파일 네이밍

```text
tests/
  test_graphrag_schema.py
  test_graph_store.py
  test_hybrid_retriever.py
  test_indexing_pipeline.py
  test_agent_workflow.py
```

### 9.3 테스트 데이터 기준

- 민감정보가 없는 샘플 문서를 사용한다.
- 도메인별 최소 테스트 질문을 정의한다.
- 기대 Entity, Relation, Source를 명시한다.
- LLM 호출 테스트는 Mock 또는 제한된 샘플로 수행한다.

## 10. 로깅 및 오류 처리 표준

### 10.1 로그 레벨

| 레벨 | 사용 기준 |
|---|---|
| DEBUG | 개발 중 상세 정보 |
| INFO | 정상 주요 흐름 |
| WARNING | fallback, 일부 실패 |
| ERROR | 요청 실패, 작업 실패 |
| CRITICAL | 서비스 중단 수준 오류 |

### 10.2 로그 금지 항목

다음 항목은 로그에 남기지 않는다.

- API Key
- DB Password
- JWT Token
- Telegram Bot Token
- Gmail App Password
- 개인정보 원문

### 10.3 오류 코드 예시

| 코드 | 의미 |
|---|---|
| `GRAPHRAG_INDEX_FAILED` | 인덱싱 실패 |
| `GRAPHRAG_ENTITY_EXTRACTION_FAILED` | Entity 추출 실패 |
| `GRAPHRAG_RELATION_EXTRACTION_FAILED` | Relation 추출 실패 |
| `GRAPHRAG_RETRIEVAL_FAILED` | 검색 실패 |
| `AGENT_WORKFLOW_FAILED` | Agent Workflow 실패 |
| `VECTOR_STORE_UNAVAILABLE` | Vector Store 사용 불가 |
| `GRAPH_STORE_UNAVAILABLE` | Graph Store 사용 불가 |

## 11. 보안 개발 표준

### 11.1 Secret 관리

- Secret은 `.env`, 환경변수, Secret Manager를 통해 주입한다.
- `.env`는 Git에 커밋하지 않는다.
- `.env.example`에는 placeholder만 기록한다.
- 산출물에 실제 Secret 값을 기록하지 않는다.

### 11.2 인증/인가

- JWT 기본 Secret 사용을 금지한다.
- 운영 환경에서 개발용 인증 우회를 금지한다.
- 사용자별 private 지식 검색 시 권한 필터를 필수 적용한다.

### 11.3 안전하지 않은 기능

| 기능 | 표준 |
|---|---|
| FAISS 역직렬화 | 기본 비활성화, 신뢰 저장소에만 허용 |
| LLM prompt logging | 민감정보 마스킹 후 저장 |
| 파일 업로드 | 확장자, 크기, MIME type 검증 |
| SQL 실행 | ORM 또는 parameterized query 사용 |

## 12. 형상관리 표준

### 12.1 Git 운영 원칙

- 로컬 작업 후 PM 요청 시점에만 GitHub push를 수행한다.
- 작업 전 `git status`로 변경 상태를 확인한다.
- 사용자 또는 타 작업자의 변경을 임의로 되돌리지 않는다.
- 산출물과 소스 변경은 목적별로 커밋을 분리한다.

### 12.2 브랜치 전략

| 브랜치 | 용도 |
|---|---|
| `main` | 안정 버전 |
| `develop` | 통합 개발 |
| `feature/graphrag-core` | GraphRAG Core 개발 |
| `feature/rag-core` | RAG Core 개발 |
| `feature/agent-core` | Agent Core 개발 |
| `pilot/sol-bat` | Sol-Bat 파일럿 |

### 12.3 커밋 메시지 표준

```text
docs: 산출물 작성/수정
feat: 기능 추가
fix: 오류 수정
refactor: 구조 개선
test: 테스트 추가/수정
chore: 설정/빌드/기타 작업
```

예:

```text
docs: add GraphRAG architecture definition
feat: add graph store interface
test: add hybrid retriever tests
```

## 13. 문서 작성 표준

### 13.1 Markdown 기준

- 제목은 `#`, `##`, `###` 계층을 사용한다.
- 표는 GitHub Markdown 형식을 사용한다.
- 복잡한 구조는 Mermaid 다이어그램을 사용한다.
- 코드/경로/환경변수는 backtick으로 표기한다.
- 민감정보는 예시에도 실제 값처럼 보이지 않게 작성한다.

### 13.2 산출물 승인 기록

모든 주요 산출물 하단에는 승인 및 변경 이력을 포함한다.

```text
승인 기록
변경 이력
```

## 14. 품질 게이트

### 14.1 단계별 품질 기준

| 단계 | 품질 게이트 |
|---|---|
| 아키텍처정의 | 핵심 구성요소, 저장소, 보안, 운영 기준 정의 |
| 요구정의 | 요구사항 ID, 우선순위, 검증 기준 포함 |
| 분석 | 기존 프로젝트 공통 기능 분석 근거 포함 |
| 설계 | 클래스, 시퀀스, DB, API 상세 포함 |
| 구현 | 테스트 가능한 구조, Secret 미포함 |
| 테스트 | 요구사항 추적 가능한 테스트 결과 |
| 이행 | 설치/운영/장애 대응 절차 포함 |

### 14.2 코드 품질 기준

- public API에는 타입 힌트를 포함한다.
- 예외 발생 시 사용자에게 노출 가능한 메시지와 내부 로그를 분리한다.
- 공통 모듈은 서비스 프로젝트에 강하게 결합하지 않는다.
- 도메인 의존 코드는 Domain Schema 또는 Adapter로 분리한다.

## 15. 후속 상세화 과제

| 과제 | 후속 산출물 |
|---|---|
| Python 패키지 상세 규칙 | 상세설계서 |
| DB Migration 규칙 | 물리 ERD, 테이블정의서 |
| 테스트 케이스 상세 | 테스트시나리오 |
| 배포 및 운영 절차 | 운영자매뉴얼 |
| 오픈소스 라이선스 목록 | SW라이선스목록 |

## 16. 승인 및 변경 이력

### 16.1 승인 기록

| 구분 | 역할 | 승인 여부 | 일자 | 비고 |
|---|---|---|---|---|
| 작성 | 아키텍터 | 작성 완료 | 2026-06-20 | 초안 |
| 검토 | DevOps / Security Engineer | 승인 필요 | - | 사용자 확인 필요 |
| 승인 | PM | 승인 필요 | - | 사용자 확인 필요 |

### 16.2 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-20 | 최초 작성 | 아키텍터 |
