# GraphRAG AI Agent 공통 프레임워크 프로젝트 패키지 구조 및 초기 소스 구성

## 1. 문서 개요

본 문서는 `250.구현` 단계의 첫 번째 작업인 `6.1 프로젝트 패키지 구조 정리` 결과를 정리한다. 설계 단계 산출물의 공통 모듈 구조를 기준으로, 이후 `RAG Core`, `VectorStoreFactory`, `Graph Store`, `Entity/Relation Extractor`, `Hybrid Retriever`, `Agent Workflow` 구현이 이어질 수 있도록 초기 소스 골격을 구성하였다.

## 2. 적용 원칙

| 구분 | 적용 내용 |
|---|---|
| 언어 | Python 3.10 이상 |
| 패키지 구조 | `src/common_core` 기반 패키지 |
| 모델 | Pydantic v2 기반 DTO/Schema |
| 외부 의존성 | 초기 골격은 `pydantic` 중심으로 최소화 |
| 확장 방식 | Adapter, Registry, Protocol 기반 확장 |
| 검증 | `pytest` 기반 단위 테스트 골격 구성 |

## 3. 최상위 구조

```text
GraphRAG-AI-Agnet/
  pyproject.toml
  src/
    common_core/
      ai_pipeline/
        graphrag/
        vectorstores/
      agents/
        nodes/
      ops/
  tests/
  01.docs/
    01.산출물/
      200.프로젝트실행/
        250.구현/
```

## 4. 패키지 구성

| 패키지 | 주요 파일 | 역할 |
|---|---|---|
| `common_core.ai_pipeline.graphrag` | `schemas.py`, `schema_registry.py` | GraphRAG 공통 DTO, 도메인 스키마 Registry |
| `common_core.ai_pipeline.graphrag` | `entity_extractor.py` | Entity 추출 인터페이스 및 rule 기반 초기 구현 |
| `common_core.ai_pipeline.graphrag` | `relation_extractor.py` | Relation 추출 인터페이스 및 schema 기반 초기 구현 |
| `common_core.ai_pipeline.graphrag` | `evidence_linker.py` | Evidence 및 EvidenceLink 생성 |
| `common_core.ai_pipeline.graphrag` | `graph_store.py` | GraphStoreAdapter Protocol 및 InMemory 구현 |
| `common_core.ai_pipeline.graphrag` | `hybrid_retriever.py` | Vector/Graph 검색 결과 결합 |
| `common_core.ai_pipeline.graphrag` | `context_assembler.py` | Agent/LLM 전달 context 및 citation 구성 |
| `common_core.ai_pipeline.vectorstores` | `base.py`, `factory.py` | VectorStoreAdapter Protocol 및 Registry 기반 Factory |
| `common_core.agents` | `base_state.py`, `workflow_factory.py` | Agent 상태 및 workflow node registry |
| `common_core.agents.nodes` | `graphrag_retrieve_node.py` | LangGraph 호환 GraphRAG 검색 Node |
| `common_core.ops` | `error_codes.py` | 공통 오류 코드 |

## 5. 초기 구현 범위

### 5.1 포함

| WBS | 구현 내용 |
|---|---|
| 6.1 | 프로젝트 패키지 구조 정리 |
| 6.1 | `pyproject.toml` 기반 패키징 준비 |
| 6.1 | GraphRAG 공통 DTO 및 DomainSchema 구성 |
| 6.1 | Sol-Bat 1차 도메인 schema registry 구성 |
| 6.1 | VectorStore, GraphStore Adapter 계약 정의 |
| 6.1 | HybridRetriever, ContextAssembler, GraphRAGRetrieveNode 초기 골격 |
| 6.1 | 테스트 골격 구성 |

### 5.2 제외

| 제외 항목 | 후속 WBS |
|---|---|
| 실제 문서 파서/Chunker 구현 | 6.2 RAG Core 구현 |
| PGVector/FAISS 실제 Provider 구현 | 6.3 VectorStoreFactory 개선 |
| PostgreSQL Graph Store 구현 | 6.4 Graph Store 구현 |
| LLM 기반 Entity/Relation 추출 | 6.5 Entity/Relation Extractor 구현 |
| 고급 rerank 및 graph scoring | 6.6 Hybrid Retriever 구현 |
| LangGraph 실제 graph build | 6.7 Agent Workflow Factory 구현 |
| 관리자 사이트 화면/API 구현 | 6.8 관리자 사이트 MVP 구현 |

## 6. 초기 테스트

| 테스트 파일 | 검증 내용 |
|---|---|
| `tests/test_graphrag_schemas.py` | 기본 Sol-Bat schema registry 및 DTO 기본값 |
| `tests/test_context_assembler.py` | Evidence 기반 citation context 생성 |
| `tests/test_graphrag_retrieve_node.py` | GraphRAGRetrieveNode가 검색 결과를 Agent State에 주입하는지 검증 |

## 7. 다음 작업

다음 작업은 WBS 기준 `6.2 RAG Core 구현`이다.

권장 요청 형식:

```text
[Backend Engineer/AI Engineer] 250.구현 단계의 RAG Core를 구현해 주세요. DocumentPipeline, ParserRegistry, Chunker, MetadataEnricher, TextNormalizer의 기본 구현과 테스트를 포함해 주세요.
```

## 8. 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-21 | 프로젝트 패키지 구조 및 초기 소스 구성 | 아키텍터/Backend Engineer |

