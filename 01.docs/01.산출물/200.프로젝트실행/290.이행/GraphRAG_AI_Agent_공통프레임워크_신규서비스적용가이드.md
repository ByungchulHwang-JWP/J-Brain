# GraphRAG AI Agent 공통 프레임워크 신규 서비스 적용 가이드

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 290.이행 |
| WBS | 9.3 신규 서비스 적용 가이드 작성 |
| 담당 | 아키텍터 / Technical Writer |
| 작성 목적 | 신규 서비스에 GraphRAG AI Agent 공통 프레임워크를 적용하기 위한 절차, 패키지 연동, Source/IndexJob/Schema/VectorStore/GraphStore/Agent Workflow 설정 방법 정의 |
| 작성일 | 2026-06-21 |

## 2. 적용 대상

본 가이드는 다음과 같은 신규 서비스에 공통 프레임워크를 적용할 때 사용한다.

| 적용 대상 | 예시 |
| --- | --- |
| 도메인 지식 검색 서비스 | 농업, 회계, 투자, 복권, 문서 검색 |
| AI 상담/추천 Agent | Sol-Bat 작물 관리 Agent, VectorMoon 분석 Agent |
| 사내 문서 RAG 서비스 | 매뉴얼, 보고서, 정책 문서 검색 |
| 관리자 기반 자료 관리 서비스 | Source 등록, 인덱싱, Preview, 검색 테스트가 필요한 서비스 |

## 3. 적용 전체 절차

```mermaid
flowchart TD
    A["1. 패키지 연동"] --> B["2. 도메인 Schema 정의"]
    B --> C["3. VectorStore 설정"]
    C --> D["4. GraphStore 설정"]
    D --> E["5. Source 등록 방식 결정"]
    E --> F["6. IndexJob 실행 흐름 연동"]
    F --> G["7. Preview/검색 테스트 연동"]
    G --> H["8. Agent Workflow 구성"]
    H --> I["9. 테스트 및 운영 점검"]
```

## 4. 패키지 연동

### 4.1 로컬 개발 연동

신규 서비스 저장소에서 공통 프레임워크를 로컬 editable 패키지로 연동한다.

```powershell
cd D:\Dev\codex\GitHub\GraphRAG-AI-Agnet
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pip install -e .
```

API 기능까지 사용할 경우 다음 optional dependency를 함께 설치한다.

```powershell
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pip install -e .[api]
```

테스트 환경에서는 다음을 사용한다.

```powershell
& 'C:\Users\offro\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m pip install -e .[test]
```

### 4.2 신규 서비스 의존성 예시

신규 서비스의 `pyproject.toml` 또는 requirements에 다음 형태로 연동한다.

```toml
[project]
dependencies = [
    "graphrag-ai-agent-common-framework>=0.1.0",
]
```

로컬 workspace 참조가 필요한 경우 개발 환경에서는 editable 설치를 사용하고, 운영 배포 전에는 별도 패키지 배포 또는 Git tag 기반 설치 방식을 확정한다.

### 4.3 주요 import 경로

| 기능 | import 경로 |
| --- | --- |
| 관리자 서비스 | `common_core.admin` |
| 문서 처리 | `common_core.ai_pipeline.document` |
| VectorStore | `common_core.ai_pipeline.vectorstores` |
| GraphRAG Core | `common_core.ai_pipeline.graphrag` |
| Agent Workflow | `common_core.agents` |
| Agent Nodes | `common_core.agents.nodes` |
| 오류 코드 | `common_core.ops` |

## 5. 신규 서비스 구조 권장안

신규 서비스는 다음 구조를 권장한다.

```text
new-service/
  pyproject.toml
  src/
    new_service/
      __init__.py
      main.py
      settings.py
      schemas/
        domain_schema.py
      graphrag/
        stores.py
        indexing.py
        retrieval.py
      agents/
        workflows.py
      admin/
        routers.py
  tests/
    test_domain_schema.py
    test_indexing_flow.py
    test_retrieval_flow.py
    test_agent_workflow.py
```

## 6. 도메인 Schema 설정

### 6.1 Schema 정의 기준

신규 서비스는 먼저 도메인 핵심 개념을 Entity와 Relation으로 정의한다.

| 항목 | 정의 내용 |
| --- | --- |
| domain | 서비스 도메인 코드. 예: `sol_bat`, `account_book`, `vector_moon` |
| entity_types | 검색/추론에 필요한 핵심 명사 개념 |
| relation_types | Entity 간 의미 관계 |
| aliases | 한글/영문/동의어/약어 |
| version | 도메인 schema 버전 |

### 6.2 Schema 정의 예시

```python
from common_core.ai_pipeline.graphrag.schemas import DomainSchema, EntityTypeDef, RelationTypeDef


def finance_schema() -> DomainSchema:
    return DomainSchema(
        domain="finance_advisor",
        version="1.0.0",
        entity_types=[
            EntityTypeDef(
                type="ASSET",
                description="Financial asset such as stock, bond, cash, or fund",
                aliases=["asset", "stock", "bond", "fund", "자산", "주식", "채권", "펀드"],
            ),
            EntityTypeDef(
                type="RISK",
                description="Investment or market risk",
                aliases=["risk", "volatility", "drawdown", "위험", "변동성"],
            ),
            EntityTypeDef(
                type="STRATEGY",
                description="Investment strategy or rebalancing action",
                aliases=["strategy", "rebalance", "전략", "리밸런싱"],
            ),
        ],
        relation_types=[
            RelationTypeDef(
                type="HAS_RISK_OF",
                description="Asset has a risk",
                source_types=["ASSET"],
                target_types=["RISK"],
            ),
            RelationTypeDef(
                type="MITIGATED_BY",
                description="Risk can be mitigated by strategy",
                source_types=["RISK"],
                target_types=["STRATEGY"],
            ),
        ],
    )
```

### 6.3 SchemaRegistry 등록

```python
from common_core.ai_pipeline.graphrag import SchemaRegistry
from new_service.schemas.domain_schema import finance_schema

registry = SchemaRegistry.with_defaults()
registry.register(finance_schema())

assert "finance_advisor" in registry.list_domains()
```

### 6.4 Schema 적용 체크리스트

| 점검 항목 | 확인 |
| --- | --- |
| domain 코드가 Source 등록 domain과 동일한가 |  |
| Entity alias에 한글/영문 주요 표현이 포함되었는가 |  |
| Relation source/target type이 실제 Entity와 맞는가 |  |
| 테스트 데이터에서 Entity가 1개 이상 추출되는가 |  |
| Relation과 Evidence가 Preview에서 확인되는가 |  |

## 7. VectorStore 설정

### 7.1 provider 선택 기준

| provider | 용도 | 비고 |
| --- | --- | --- |
| `in_memory` | 로컬 개발, 단위 테스트, PoC | 프로세스 종료 시 데이터 소실 |
| `faiss` | 로컬 고성능 벡터 검색 | index 파일 백업 필요 |
| `pgvector` | 운영 DB 기반 벡터 검색 | PostgreSQL/pgvector 필요 |

### 7.2 VectorStoreFactory 사용

```python
from common_core.ai_pipeline.vectorstores import VectorStoreFactory

factory = VectorStoreFactory()
vector_store = factory.get("in_memory")
```

### 7.3 신규 provider 등록

```python
from common_core.ai_pipeline.vectorstores import VectorStoreFactory

factory = VectorStoreFactory(register_defaults=True)
factory.register("custom_vector", custom_vector_store_adapter)

vector_store = factory.get("custom_vector")
```

### 7.4 환경 변수 예시

```text
VECTOR_STORE_PROVIDER=in_memory
VECTOR_COLLECTION_NAME=default
PGVECTOR_DSN=postgresql://user:***@localhost:5432/graphrag
FAISS_INDEX_PATH=D:\data\faiss\default.index
```

## 8. GraphStore 설정

### 8.1 provider 선택 기준

| provider | 용도 | 비고 |
| --- | --- | --- |
| `InMemoryGraphStore` | 로컬 개발, 테스트 | 운영 영속성 없음 |
| `PostgreSQLGraphStoreAdapter` | 운영 후보 | 현재 adapter skeleton 기준, 실제 DB 연계 확장 필요 |

### 8.2 InMemoryGraphStore 사용

```python
from common_core.ai_pipeline.graphrag import InMemoryGraphStore

graph_store = InMemoryGraphStore()
```

### 8.3 PostgreSQL GraphStore 적용 방향

운영 환경에서는 다음 정보를 기준으로 adapter를 확장한다.

| 설정 | 설명 |
| --- | --- |
| `GRAPH_STORE_PROVIDER` | `postgresql` |
| `GRAPH_STORE_DSN` | PostgreSQL 연결 문자열 |
| graph tables | Entity, Relation, Evidence, EvidenceLink table |
| 권한 필터 | tenant/user/scope 기반 Source 접근 제어 |
| 백업 | Source/Graph table dump |

## 9. Source 등록 연동

### 9.1 AdminService 직접 사용

```python
from common_core.admin import AdminService, SourceCreateRequest

service = AdminService()
source = service.create_source(
    SourceCreateRequest(
        domain="finance_advisor",
        name="portfolio-risk-guide",
        content="Stock volatility can increase portfolio risk. Rebalancing can mitigate risk.",
        tags=["guide", "risk"],
        scope="GLOBAL",
    )
)

print(source.source_id)
```

### 9.2 FastAPI Router 연동

```python
from fastapi import FastAPI

from common_core.admin.routers import create_admin_router
from common_core.admin.service import AdminService

app = FastAPI(title="New Service API")
admin_service = AdminService()
app.include_router(create_admin_router(admin_service))
```

연동 후 제공되는 주요 API는 다음과 같다.

| 기능 | Method | URI |
| --- | --- | --- |
| Source 등록 | POST | `/api/admin/sources` |
| Source 목록 조회 | GET | `/api/admin/sources` |
| Source 상세 조회 | GET | `/api/admin/sources/{source_id}` |
| Source 삭제 | DELETE | `/api/admin/sources/{source_id}` |
| Preview 조회 | GET | `/api/admin/sources/{source_id}/preview` |

### 9.3 Source 등록 시 필수 정책

| 항목 | 적용 기준 |
| --- | --- |
| domain | SchemaRegistry에 등록된 domain 사용 |
| content | 빈 문자열 금지 |
| metadata | 민감정보 저장 금지 |
| scope | `GLOBAL`, `TENANT`, `USER` 등 서비스 정책에 맞게 지정 |
| tags | 검색/운영 분류를 위해 사용 |
| auto_run_index | 운영에서는 대량 등록 시 false 후 배치 실행 권장 |

## 10. IndexJob 연동

### 10.1 IndexJob 생성 및 실행

```python
from common_core.admin import AdminService
from common_core.admin.schemas import IndexJobRequest

service = AdminService()
job = service.create_index_job(IndexJobRequest(source_id=source.source_id))
completed = service.run_index_job(job.job_id)

assert completed.status == "COMPLETED"
```

### 10.2 IndexJob 상태 확인

```python
job_detail = service.get_index_job(completed.job_id)
for step in job_detail.steps:
    print(step.step, step.status, step.message)
```

### 10.3 API 연동

| 기능 | Method | URI |
| --- | --- | --- |
| IndexJob 생성 | POST | `/api/admin/index-jobs` |
| IndexJob 실행 | POST | `/api/admin/index-jobs/{job_id}/run` |
| IndexJob 목록 조회 | GET | `/api/admin/index-jobs` |
| IndexJob 상세 조회 | GET | `/api/admin/index-jobs/{job_id}` |
| IndexJob 재실행 | POST | `/api/admin/index-jobs/{job_id}/retry` |

### 10.4 단계별 처리 결과 확인

| 단계 | 확인 항목 |
| --- | --- |
| Parse | source_type에 맞게 본문이 파싱되었는가 |
| Normalize | 제어문자/공백 정리가 되었는가 |
| Chunk | chunk_count가 1 이상인가 |
| Vector Write | VectorStore에 chunk가 저장되었는가 |
| Entity Extract | entity_count가 1 이상인가 |
| Relation Extract | relation_count가 도메인 기대값과 맞는가 |
| Evidence Link | evidence_count가 생성되었는가 |
| Finalize | Source status가 `INDEXED`로 변경되었는가 |

## 11. Preview 연동

### 11.1 Preview 조회

```python
preview = service.get_source_preview(source.source_id)

print(preview.metrics)
print(preview.chunks)
print(preview.entities)
print(preview.relations)
print(preview.evidence)
```

### 11.2 Preview 검증 기준

| 항목 | 정상 기준 |
| --- | --- |
| chunks | 원문이 검색 가능한 단위로 분할됨 |
| entities | 도메인 핵심 개념이 추출됨 |
| relations | Entity 간 관계가 추출됨 |
| evidence | Relation 또는 답변 근거가 연결됨 |
| metrics | Source 상세 count와 일관됨 |

## 12. GraphRAG 검색 연동

### 12.1 검색 테스트 실행

```python
from common_core.admin import GraphRAGSearchTestRequest

response = service.search_test(
    GraphRAGSearchTestRequest(
        domain="finance_advisor",
        query="How can rebalancing reduce portfolio risk?",
        strategy="HYBRID",
        top_k=5,
        filters={"source_id": source.source_id},
        vector_weight=0.6,
        graph_weight=0.4,
        include_evidence=True,
    )
)

print(response.status)
print(response.metrics)
```

### 12.2 검색 전략

| 전략 | 용도 |
| --- | --- |
| `VECTOR_ONLY` | 의미 유사도 중심 검색 |
| `GRAPH_ONLY` | Entity/Relation 기반 탐색 |
| `HYBRID` | Vector + Graph + Evidence 결합 검색 |

### 12.3 검색 품질 확인

| 항목 | 확인 기준 |
| --- | --- |
| status | 대표 질의에서 `HIT` 반환 |
| result_count | top_k 이하의 결과 반환 |
| evidence | 답변 근거로 사용할 수 있는 문장 포함 |
| citation | source_id, chunk_id 추적 가능 |
| score | vector/graph/evidence score가 결합됨 |

## 13. Agent Workflow 설정

### 13.1 기본 구성요소

| 구성요소 | 역할 |
| --- | --- |
| `WorkflowFactory` | node registry와 workflow build |
| `WorkflowDefinition` | node 순서, edge, 종료 노드 정의 |
| `GraphRAGRetrieveNode` | Agent state에서 query를 읽고 GraphRAG 검색 결과를 주입 |
| `LLMAnswerNode` | 검색 context 기반 답변 생성 |
| `StructuredOutputNode` | 최종 응답을 구조화 |

### 13.2 Workflow 구성 예시

```python
import asyncio

from common_core.agents import WorkflowDefinition, WorkflowFactory
from common_core.agents.nodes import GraphRAGRetrieveNode, LLMAnswerNode, StructuredOutputNode

factory = WorkflowFactory()
factory.register_node(
    "retrieve",
    GraphRAGRetrieveNode(retriever=retriever, default_domain="finance_advisor"),
)
factory.register_node(
    "answer",
    LLMAnswerNode(
        answer_provider=lambda query, context, state: f"answer: {query}\n\n{context}"
    ),
)
factory.register_node("format", StructuredOutputNode())

workflow = factory.build(
    WorkflowDefinition(
        name="finance_advisor_agent",
        nodes=["retrieve", "answer", "format"],
        edges=[("retrieve", "answer"), ("answer", "format")],
        finish_nodes=["format"],
    )
)

result = asyncio.run(
    workflow.run(
        {
            "query": "How should I manage portfolio volatility?",
            "retrieval_options": {
                "strategy": "HYBRID",
                "top_k": 5,
            },
            "roles": ["ADMIN"],
        }
    )
)
```

### 13.3 Agent 실행 확인

```python
assert result.status == "COMPLETED"
assert result.state["retrieval"]["status"] == "HIT"
assert "result" in result.state
```

### 13.4 Agent API 연계 방향

설계 기준 Agent API는 다음을 사용한다.

| 기능 | Method | URI |
| --- | --- | --- |
| Agent 실행 | POST | `/api/agents/{agent_id}/runs` |
| Agent 실행 결과 조회 | GET | `/api/agents/{agent_id}/runs/{agent_run_id}` |

신규 서비스에서 Agent API를 제공하려면 다음 구현이 필요하다.

| 구현 항목 | 설명 |
| --- | --- |
| Agent registry | `agent_id`별 workflow 매핑 |
| AgentRun 저장소 | 실행 입력/상태/출력 저장 |
| RetrievalRun 연결 | GraphRAG 검색 이력과 AgentRun 연결 |
| 권한 필터 | 사용자별 Source 접근 범위 적용 |
| 오류 응답 | `GRAG-AGT-*` 표준 오류 코드 적용 |

## 14. FastAPI 통합 예시

```python
from fastapi import FastAPI

from common_core.admin.routers import create_admin_router
from common_core.admin.service import AdminService


def create_app() -> FastAPI:
    app = FastAPI(title="New GraphRAG Service")
    admin_service = AdminService()
    app.include_router(create_admin_router(admin_service))
    return app


app = create_app()
```

실행 예시는 다음과 같다.

```powershell
uvicorn new_service.main:app --host 0.0.0.0 --port 8000
```

## 15. 환경 변수 예시

```text
APP_ENV=dev
LOG_LEVEL=INFO
ADMIN_API_BASE_URL=http://localhost:8000/api/admin
DEFAULT_DOMAIN=finance_advisor

VECTOR_STORE_PROVIDER=in_memory
VECTOR_COLLECTION_NAME=default
PGVECTOR_DSN=postgresql://user:***@localhost:5432/graphrag

GRAPH_STORE_PROVIDER=in_memory
GRAPH_STORE_DSN=postgresql://user:***@localhost:5432/graphrag

DEFAULT_RETRIEVAL_STRATEGY=HYBRID
INDEX_JOB_TIMEOUT_SEC=600
```

## 16. 신규 서비스 테스트 절차

### 16.1 필수 테스트

| 테스트 | 확인 내용 |
| --- | --- |
| Schema 테스트 | domain, entity_types, relation_types 등록 확인 |
| Source 등록 테스트 | SourceCreateRequest로 Source 생성 |
| IndexJob 테스트 | run_index_job 후 `COMPLETED` 확인 |
| Preview 테스트 | chunks/entities/relations/evidence 확인 |
| Retrieval 테스트 | 대표 질의에서 `HIT` 확인 |
| Agent 테스트 | workflow 실행 후 `COMPLETED` 확인 |
| 권한 테스트 | role/scope별 허용/차단 확인 |

### 16.2 pytest 예시

```python
from common_core.admin import AdminService, GraphRAGSearchTestRequest, SourceCreateRequest
from common_core.admin.schemas import IndexJobRequest


def test_new_service_index_and_search_flow():
    service = AdminService()
    source = service.create_source(
        SourceCreateRequest(
            domain="finance_advisor",
            name="risk-guide",
            content="Portfolio volatility is a risk. Rebalancing can mitigate risk.",
        )
    )

    job = service.create_index_job(IndexJobRequest(source_id=source.source_id))
    completed = service.run_index_job(job.job_id)

    search = service.search_test(
        GraphRAGSearchTestRequest(
            domain="finance_advisor",
            query="portfolio risk mitigation",
            strategy="HYBRID",
            filters={"source_id": source.source_id},
        )
    )

    assert completed.status == "COMPLETED"
    assert search.status == "HIT"
```

## 17. 적용 체크리스트

| 단계 | 점검 항목 | 확인 |
| --- | --- | --- |
| 패키지 | 공통 프레임워크 설치 완료 |  |
| Schema | 신규 domain schema 등록 |  |
| Source | Source 등록 API 또는 서비스 연동 |  |
| IndexJob | IndexJob 생성/실행/상태 조회 연동 |  |
| VectorStore | provider 선택 및 health check |  |
| GraphStore | provider 선택 및 entity/relation/evidence 조회 |  |
| Preview | Chunk/Entity/Relation/Evidence 확인 |  |
| Retrieval | HYBRID 검색 대표 질의 HIT |  |
| Agent | WorkflowDefinition 구성 및 실행 |  |
| 권한 | role/scope/tenant 필터 정책 반영 |  |
| 운영 | 로그, 백업, 장애 대응 절차 반영 |  |
| 테스트 | pytest 회귀 테스트 작성 및 PASS |  |

## 18. 적용 시 주의사항

| 주의사항 | 설명 |
| --- | --- |
| domain 불일치 | Source domain과 SchemaRegistry domain이 다르면 Entity/Relation 추출 품질이 떨어진다 |
| alias 부족 | 도메인 용어, 약어, 한글/영문 표현을 충분히 등록해야 한다 |
| InMemory 운영 사용 | InMemory 저장소는 운영 영속성이 없으므로 운영에는 부적합하다 |
| 민감정보 저장 | Source content/metadata에 API Key, token, password를 넣지 않는다 |
| Agent hallucination | Agent 응답은 Evidence/Citation 기반으로 표시해야 한다 |
| 삭제 정책 | Source 삭제 시 VectorStore/GraphStore 데이터 정합성 정책을 명확히 한다 |
| 성능 기준 | 대량 Source 적용 전 IndexJob/Retrieval 성능 기준을 정의한다 |

## 19. 단계별 산출물 반영

신규 서비스 적용 시 다음 산출물을 서비스별로 작성하거나 기존 산출물에 부록으로 추가한다.

| 산출물 | 작성 내용 |
| --- | --- |
| 도메인 Schema 정의서 | Entity/Relation/Alias/Version |
| Source/IndexJob 연동 설계 | 등록, 인덱싱, 상태 모니터링 흐름 |
| 저장소 설정서 | VectorStore/GraphStore provider와 운영 설정 |
| Agent Workflow 정의서 | node, edge, input/output, error handling |
| 테스트 시나리오 | Source -> IndexJob -> Preview -> Retrieval -> Agent |
| 운영 점검표 | 로그, 백업, 장애 대응, 보안 점검 |

## 20. 다음 작업

신규 서비스 적용 가이드 작성 이후 다음 작업은 WBS 기준 `9.4 배포 및 운영 체크리스트 작성`이다.

권장 요청 문구는 다음과 같다.

```text
[DevOps/PM] 290.이행 단계의 배포 및 운영 체크리스트를 작성해 주세요. 배포 전 점검, 환경 변수, 테스트 수행, DB/VectorStore/GraphStore 확인, 보안 점검, 롤백 기준, 운영 인수인계 항목을 포함해 주세요.
```
