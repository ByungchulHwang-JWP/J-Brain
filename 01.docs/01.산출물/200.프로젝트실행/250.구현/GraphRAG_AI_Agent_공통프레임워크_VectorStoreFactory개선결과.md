# GraphRAG AI Agent 공통 프레임워크 VectorStoreFactory 개선 결과

## 1. 문서 개요

본 문서는 `250.구현` 단계의 `6.3 VectorStoreFactory 개선` 결과를 정리한다. RAG Core가 생성한 `ChunkInput`을 벡터 저장소에 등록, 검색, 삭제, 미리보기할 수 있도록 공통 Adapter 계약을 구체화하고, 테스트 가능한 `InMemoryVectorStore`와 FAISS/PGVector Adapter 골격을 구성하였다.

## 2. 구현 범위

| 구성요소 | 파일 | 구현 내용 |
|---|---|---|
| VectorStore 계약 | `base.py` | `VectorWriteOptions`, `VectorSearchRequest`, `VectorSearchResult`, `ChunkQuery`, `ProviderHealth` |
| InMemoryVectorStore | `in_memory.py` | dependency-free lexical similarity 기반 add/search/delete/get_chunks |
| FAISS Adapter 골격 | `faiss_adapter.py` | provider boundary, health check, NotImplemented provider methods |
| PGVector Adapter 골격 | `pgvector_adapter.py` | provider boundary, health check, NotImplemented provider methods |
| VectorStoreFactory | `factory.py` | default provider registry, override/unregister, provider health check |
| 테스트 | `tests/test_vectorstores.py` | add/search/delete, get_chunks, provider registry 테스트 |

## 3. 패키지 구조

```text
src/common_core/ai_pipeline/vectorstores/
  __init__.py
  base.py
  factory.py
  in_memory.py
  faiss_adapter.py
  pgvector_adapter.py
```

## 4. Provider Registry

`VectorStoreFactory`는 기본적으로 아래 provider를 등록한다.

| Provider | 상태 | 용도 |
|---|---|---|
| `in_memory` | 구현 완료 | 단위 테스트, 로컬 개발, 관리자 검색 테스트 MVP |
| `faiss` | 골격 | 로컬 파일 기반 Vector Store 후속 구현 |
| `pgvector` | 골격 | PostgreSQL/pgvector 기반 운영 provider 후속 구현 |

## 5. InMemoryVectorStore 동작

| 기능 | 동작 |
|---|---|
| `add_chunks` | collection별 chunk upsert |
| `search` | query/chunk token frequency cosine similarity |
| `delete_by_source` | 모든 collection에서 source 기준 삭제 |
| `get_chunks` | source 기준 chunk preview |
| `health_check` | collection/chunk count 반환 |

## 6. 후속 구현 대상

| 항목 | 후속 작업 |
|---|---|
| 실제 embedding provider 연동 | OpenAI/LangChain embedding adapter |
| FAISS persistence | local index 저장/로드, metadata sidecar |
| PGVector persistence | SQLAlchemy/pgvector table 연동 |
| 권한 필터 | tenant/user/scope 기반 metadata filter 강화 |
| 검색 품질 | lexical baseline을 embedding similarity로 대체 |

## 7. 테스트 결과

| 테스트 | 결과 |
|---|---|
| InMemory add/search/delete | 통과 |
| InMemory get_chunks filter | 통과 |
| Factory default provider registry | 통과 |
| Factory provider override/unregister | 통과 |
| `compileall` 문법 검증 | 통과 |

## 8. 다음 작업

다음 작업은 WBS 기준 `6.4 Graph Store 구현`이다.

권장 요청 형식:

```text
[Backend Engineer/Data Engineer] 250.구현 단계의 Graph Store를 구현해 주세요. InMemoryGraphStore 개선, PostgreSQL GraphStoreAdapter 골격, entity/relation/evidence upsert/find/traverse/delete 테스트를 포함해 주세요.
```

## 9. 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-21 | VectorStoreFactory 및 provider adapter 개선 | Backend Engineer/Data Engineer |

