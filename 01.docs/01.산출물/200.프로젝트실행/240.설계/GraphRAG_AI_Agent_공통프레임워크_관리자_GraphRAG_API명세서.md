# GraphRAG AI Agent 공통 프레임워크 관리자 및 GraphRAG API 명세서

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크의 `240.설계` 단계 API 명세서로, 관리자 사이트와 서비스/Agent가 사용할 REST API 계약을 정의한다. Source 등록/조회/삭제, IndexJob 실행/상태조회, GraphRAG 검색 테스트, Agent 실행 API의 request/response DTO와 오류 코드를 포함한다.

### 1.2 API 설계 범위

| 구분 | API |
|---|---|
| Source 관리 | Source 등록, 목록조회, 상세조회, 수정, 삭제/비활성화, preview |
| IndexJob 관리 | 인덱싱 작업 생성, 실행, 재시도, 취소, 목록조회, 상세조회 |
| GraphRAG 검색 테스트 | 관리자 검색 테스트 실행, 결과 조회 |
| Agent 실행 | Agent 실행 요청, 실행 결과 조회 |
| 공통 | 인증/권한, 표준 응답, 오류 코드, pagination |

### 1.3 기본 URI

| 구분 | Base URI |
|---|---|
| 관리자 API | `/api/admin/graphrag` |
| Agent API | `/api/agents` |
| Health API | `/api/graphrag/health` |

### 1.4 인증 및 권한

| 역할 | 권한 |
|---|---|
| `ADMIN` | 전체 domain Source/IndexJob/검색 테스트/Agent 실행 조회 |
| `OPERATOR` | 담당 domain Source 관리, IndexJob 실행, 검색 테스트 |
| `USER` | 접근 가능한 Source 기반 GraphRAG 검색/Agent 실행 |

모든 API는 JWT Bearer Token을 기본으로 사용한다.

```http
Authorization: Bearer {access_token}
X-Tenant-Id: {tenant_id}
X-Request-Id: {request_id}
```

## 2. 공통 규격

### 2.1 표준 성공 응답

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "req-20260621-0001",
    "timestamp": "2026-06-21T09:50:00+09:00"
  }
}
```

### 2.2 표준 오류 응답

```json
{
  "success": false,
  "error": {
    "code": "GRAG-SRC-404",
    "message": "Source를 찾을 수 없습니다.",
    "detail": {
      "source_id": "6fa459ea-ee8a-3ca4-894e-db77e160355e"
    }
  },
  "meta": {
    "request_id": "req-20260621-0001",
    "timestamp": "2026-06-21T09:50:00+09:00"
  }
}
```

### 2.3 Pagination

**Request Query**

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---:|---|
| `page` | integer | 1 | 페이지 번호 |
| `size` | integer | 20 | 페이지 크기 |
| `sort` | string | `created_at,desc` | 정렬 |

**Response Meta**

```json
{
  "page": 1,
  "size": 20,
  "total_count": 103,
  "total_pages": 6
}
```

### 2.4 공통 코드

| 구분 | 코드 |
|---|---|
| Source Type | `FILE`, `URL`, `API`, `DATABASE`, `MANUAL`, `GENERATED` |
| Source Status | `REGISTERED`, `INDEXING`, `INDEXED`, `FAILED`, `DISABLED`, `DELETED` |
| IndexJob Type | `FULL_INDEX`, `REINDEX`, `PARSE_ONLY`, `EMBED_ONLY`, `GRAPH_EXTRACT_ONLY`, `DELETE_INDEX` |
| IndexJob Status | `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELED`, `RETRYING`, `PARTIAL_COMPLETED` |
| Retrieval Strategy | `VECTOR_ONLY`, `GRAPH_ONLY`, `HYBRID`, `HYBRID_RERANK` |
| Retrieval Status | `HIT`, `MISS`, `PARTIAL_HIT`, `FILTERED_OUT`, `FALLBACK_USED`, `FAILED` |
| AgentRun Status | `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELED` |

## 3. Source API

### 3.1 Source 등록

| 항목 | 내용 |
|---|---|
| Method | `POST` |
| URI | `/api/admin/graphrag/sources` |
| 권한 | `ADMIN`, `OPERATOR` |
| 설명 | 파일/URL/API/수동 입력 자료를 GraphRAG 인덱싱 대상 Source로 등록한다. |

**Request DTO**

```json
{
  "domain": "sol_bat",
  "source_type": "FILE",
  "title": "토마토 병해충 방제 지침",
  "description": "Sol-Bat 파일럿 KB 문서",
  "uri": "storage://kb/sol_bat/tomato_pest_guide.pdf",
  "scope": "TENANT",
  "owner_id": "user-001",
  "tags": ["tomato", "pest", "guide"],
  "metadata": {
    "crop_scope": "tomato",
    "region_scope": "kr",
    "source_policy_type": "official"
  },
  "auto_create_index_job": true,
  "index_options": {
    "job_type": "FULL_INDEX",
    "chunk_size": 1000,
    "chunk_overlap": 100,
    "extract_graph": true
  }
}
```

**Response DTO**

```json
{
  "success": true,
  "data": {
    "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
    "domain": "sol_bat",
    "source_type": "FILE",
    "title": "토마토 병해충 방제 지침",
    "status": "REGISTERED",
    "current_version": 1,
    "scope": "TENANT",
    "chunk_count": 0,
    "last_indexed_at": null,
    "index_job_id": "5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88"
  }
}
```

### 3.2 Source 목록조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/admin/graphrag/sources` |
| 권한 | `ADMIN`, `OPERATOR` |

**Query Parameters**

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `domain` | string | N | 도메인 코드 |
| `source_type` | string | N | Source 유형 |
| `status` | string | N | Source 상태 |
| `keyword` | string | N | title/description 검색 |
| `owner_id` | string | N | 소유자 |
| `page` | integer | N | 페이지 번호 |
| `size` | integer | N | 페이지 크기 |

**Response DTO**

```json
{
  "success": true,
  "data": [
    {
      "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
      "domain": "sol_bat",
      "source_type": "FILE",
      "title": "토마토 병해충 방제 지침",
      "status": "INDEXED",
      "scope": "TENANT",
      "chunk_count": 128,
      "entity_count": 42,
      "relation_count": 61,
      "last_indexed_at": "2026-06-21T09:45:00+09:00",
      "created_at": "2026-06-21T09:30:00+09:00"
    }
  ],
  "page": {
    "page": 1,
    "size": 20,
    "total_count": 1,
    "total_pages": 1
  }
}
```

### 3.3 Source 상세조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/admin/graphrag/sources/{source_id}` |
| 권한 | `ADMIN`, `OPERATOR` |

**Response DTO**

```json
{
  "success": true,
  "data": {
    "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
    "tenant_id": "tenant-001",
    "domain": "sol_bat",
    "source_type": "FILE",
    "title": "토마토 병해충 방제 지침",
    "description": "Sol-Bat 파일럿 KB 문서",
    "uri": "storage://kb/sol_bat/tomato_pest_guide.pdf",
    "owner_id": "user-001",
    "scope": "TENANT",
    "status": "INDEXED",
    "current_version": 1,
    "checksum": "sha256:...",
    "tags": ["tomato", "pest", "guide"],
    "metadata": {
      "crop_scope": "tomato",
      "region_scope": "kr"
    },
    "statistics": {
      "document_count": 1,
      "chunk_count": 128,
      "embedding_count": 128,
      "entity_count": 42,
      "relation_count": 61,
      "evidence_count": 189
    },
    "last_index_job": {
      "job_id": "5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88",
      "status": "COMPLETED",
      "started_at": "2026-06-21T09:31:00+09:00",
      "ended_at": "2026-06-21T09:45:00+09:00"
    }
  }
}
```

### 3.4 Source 수정

| 항목 | 내용 |
|---|---|
| Method | `PATCH` |
| URI | `/api/admin/graphrag/sources/{source_id}` |
| 권한 | `ADMIN`, `OPERATOR` |

**Request DTO**

```json
{
  "title": "토마토 병해충 방제 지침 v2",
  "description": "개정 지침 반영",
  "scope": "TENANT",
  "tags": ["tomato", "pest", "guide", "v2"],
  "metadata": {
    "crop_scope": "tomato",
    "source_policy_type": "official"
  }
}
```

### 3.5 Source 삭제/비활성화

| 항목 | 내용 |
|---|---|
| Method | `DELETE` |
| URI | `/api/admin/graphrag/sources/{source_id}` |
| 권한 | `ADMIN`, `OPERATOR` |

**Query Parameters**

| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `mode` | string | `DISABLE` | `DISABLE`, `SOFT_DELETE`, `HARD_DELETE` |
| `delete_vectors` | boolean | `true` | Vector Store 삭제 여부 |
| `delete_graph` | boolean | `true` | Graph Store 삭제 여부 |

**Response DTO**

```json
{
  "success": true,
  "data": {
    "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
    "status": "DISABLED",
    "deleted_vectors": 128,
    "deleted_graph_items": {
      "entities": 0,
      "relations": 61,
      "evidence": 189
    }
  }
}
```

### 3.6 Source Preview

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/admin/graphrag/sources/{source_id}/preview` |
| 권한 | `ADMIN`, `OPERATOR` |
| 설명 | chunk/entity/relation/evidence 미리보기를 조회한다. |

**Query Parameters**

| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `include` | string | `chunks,entities,relations,evidence` | 포함 대상 |
| `limit` | integer | 50 | 최대 개수 |

**Response DTO**

```json
{
  "success": true,
  "data": {
    "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
    "source_status": "INDEXED",
    "chunks": [
      {
        "chunk_id": "6cf8...",
        "chunk_index": 1,
        "page_no": 1,
        "section_title": "병해충 관리",
        "content": "고온다습 조건에서는 잎곰팡이병 발생 위험이 증가한다."
      }
    ],
    "entities": [
      {
        "entity_id": "91a4...",
        "entity_type": "DISEASE",
        "name": "잎곰팡이병",
        "normalized_name": "잎곰팡이병",
        "confidence_score": 0.91
      }
    ],
    "relations": [
      {
        "relation_id": "8a44...",
        "relation_type": "CAUSES",
        "source_entity": "고온다습",
        "target_entity": "잎곰팡이병",
        "confidence_score": 0.87
      }
    ],
    "evidence": [
      {
        "evidence_id": "3d25...",
        "quote_text": "고온다습 조건에서는 잎곰팡이병 발생 위험이 증가한다.",
        "target_type": "RELATION",
        "target_id": "8a44..."
      }
    ]
  }
}
```

## 4. IndexJob API

### 4.1 IndexJob 생성

| 항목 | 내용 |
|---|---|
| Method | `POST` |
| URI | `/api/admin/graphrag/index-jobs` |
| 권한 | `ADMIN`, `OPERATOR` |

**Request DTO**

```json
{
  "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
  "job_type": "FULL_INDEX",
  "options": {
    "parse": true,
    "chunk": true,
    "embed": true,
    "extract_graph": true,
    "vector_provider": "PGVECTOR",
    "chunk_size": 1000,
    "chunk_overlap": 100,
    "entity_confidence_threshold": 0.6,
    "relation_confidence_threshold": 0.6
  }
}
```

**Response DTO**

```json
{
  "success": true,
  "data": {
    "job_id": "5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88",
    "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
    "job_type": "FULL_INDEX",
    "status": "PENDING",
    "progress_rate": 0,
    "created_at": "2026-06-21T09:50:00+09:00"
  }
}
```

### 4.2 IndexJob 실행

| 항목 | 내용 |
|---|---|
| Method | `POST` |
| URI | `/api/admin/graphrag/index-jobs/{job_id}/run` |
| 권한 | `ADMIN`, `OPERATOR` |

**Request DTO**

```json
{
  "run_mode": "ASYNC",
  "notify_on_complete": true
}
```

**Response DTO**

```json
{
  "success": true,
  "data": {
    "job_id": "5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88",
    "status": "RUNNING",
    "started_at": "2026-06-21T09:51:00+09:00",
    "monitor_uri": "/api/admin/graphrag/index-jobs/5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88"
  }
}
```

### 4.3 IndexJob 상태조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/admin/graphrag/index-jobs/{job_id}` |
| 권한 | `ADMIN`, `OPERATOR` |

**Response DTO**

```json
{
  "success": true,
  "data": {
    "job_id": "5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88",
    "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
    "job_type": "FULL_INDEX",
    "status": "RUNNING",
    "progress_rate": 65,
    "retry_count": 0,
    "started_at": "2026-06-21T09:51:00+09:00",
    "ended_at": null,
    "steps": [
      {
        "step_type": "PARSE_DOCUMENT",
        "status": "COMPLETED",
        "input_count": 1,
        "output_count": 1,
        "started_at": "2026-06-21T09:51:00+09:00",
        "ended_at": "2026-06-21T09:51:10+09:00"
      },
      {
        "step_type": "EXTRACT_RELATION",
        "status": "RUNNING",
        "input_count": 128,
        "output_count": 52,
        "started_at": "2026-06-21T09:53:00+09:00",
        "ended_at": null
      }
    ],
    "statistics": {
      "document_count": 1,
      "chunk_count": 128,
      "entity_count": 42,
      "relation_count": 52,
      "evidence_count": 140,
      "warning_count": 3
    }
  }
}
```

### 4.4 IndexJob 목록조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/admin/graphrag/index-jobs` |
| 권한 | `ADMIN`, `OPERATOR` |

**Query Parameters**

| 이름 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `source_id` | uuid | N | Source ID |
| `domain` | string | N | 도메인 |
| `status` | string | N | 작업 상태 |
| `job_type` | string | N | 작업 유형 |
| `from` | datetime | N | 시작일 |
| `to` | datetime | N | 종료일 |

### 4.5 IndexJob 재시도/취소

| Method | URI | 설명 |
|---|---|---|
| `POST` | `/api/admin/graphrag/index-jobs/{job_id}/retry` | 실패 작업 재시도 |
| `POST` | `/api/admin/graphrag/index-jobs/{job_id}/cancel` | 실행 대기/실행 중 작업 취소 |

**Retry Response DTO**

```json
{
  "success": true,
  "data": {
    "job_id": "5d9d71b5-37cb-4f04-9d63-bad2ed1c9b88",
    "status": "RETRYING",
    "retry_count": 1
  }
}
```

## 5. GraphRAG 검색 테스트 API

### 5.1 검색 테스트 실행

| 항목 | 내용 |
|---|---|
| Method | `POST` |
| URI | `/api/admin/graphrag/retrieval-tests` |
| 권한 | `ADMIN`, `OPERATOR` |
| 설명 | 관리자 화면에서 GraphRAG 검색 결과와 근거를 검증한다. |

**Request DTO**

```json
{
  "domain": "sol_bat",
  "query": "토마토 잎곰팡이병 위험 조건과 권장 작업은?",
  "strategy": "HYBRID",
  "top_k": 5,
  "max_graph_depth": 2,
  "filters": {
    "source_ids": ["0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15"],
    "entity_types": ["CROP", "DISEASE", "ACTION"],
    "scope": "TENANT"
  },
  "include_context": true,
  "include_evidence": true
}
```

**Response DTO**

```json
{
  "success": true,
  "data": {
    "retrieval_run_id": "1f7b7f72-1e5b-4f96-9b8d-7ee46d5871f4",
    "status": "HIT",
    "domain": "sol_bat",
    "query": "토마토 잎곰팡이병 위험 조건과 권장 작업은?",
    "strategy": "HYBRID",
    "results": [
      {
        "rank": 1,
        "result_type": "CHUNK",
        "chunk_id": "6cf8...",
        "entity_id": null,
        "relation_id": "8a44...",
        "evidence_ids": ["3d25..."],
        "text": "고온다습 조건에서는 잎곰팡이병 발생 위험이 증가한다.",
        "score": 0.8912,
        "vector_score": 0.88,
        "graph_score": 0.92,
        "evidence_score": 0.9,
        "metadata": {
          "source_title": "토마토 병해충 방제 지침",
          "page_no": 1
        }
      }
    ],
    "context": "[질문]\\n토마토 잎곰팡이병 위험 조건과 권장 작업은?...",
    "evidence": [
      {
        "evidence_id": "3d25...",
        "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15",
        "chunk_id": "6cf8...",
        "quote_text": "고온다습 조건에서는 잎곰팡이병 발생 위험이 증가한다.",
        "confidence_score": 0.9
      }
    ],
    "metrics": {
      "latency_ms": 842,
      "vector_result_count": 5,
      "graph_result_count": 9,
      "filtered_result_count": 0
    }
  }
}
```

### 5.2 검색 테스트 결과 조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/admin/graphrag/retrieval-tests/{retrieval_run_id}` |
| 권한 | `ADMIN`, `OPERATOR` |

## 6. Agent 실행 API

### 6.1 Agent 실행

| 항목 | 내용 |
|---|---|
| Method | `POST` |
| URI | `/api/agents/{agent_id}/runs` |
| 권한 | `ADMIN`, `OPERATOR`, `USER` |
| 설명 | GraphRAG 검색 노드를 포함한 Agent workflow를 실행한다. |

**Request DTO**

```json
{
  "domain": "sol_bat",
  "workflow_id": "solbat_farm_coach_v1",
  "input_text": "토마토 하우스가 고온다습한데 병해충 위험과 조치가 궁금합니다.",
  "input": {
    "farm_id": "farm-001",
    "crop": "tomato",
    "region": "kr",
    "observations": {
      "temperature": 31.2,
      "humidity": 88
    }
  },
  "retrieval_options": {
    "strategy": "HYBRID",
    "top_k": 5,
    "max_graph_depth": 2,
    "include_evidence": true
  },
  "stream": false
}
```

**Response DTO**

```json
{
  "success": true,
  "data": {
    "agent_run_id": "99ccf13f-3ff4-4e50-8f90-aec4e3e4df42",
    "agent_id": "solbat_farm_coach",
    "workflow_id": "solbat_farm_coach_v1",
    "status": "SUCCEEDED",
    "final_output": "고온다습 조건에서는 잎곰팡이병 위험이 증가하므로 환기와 예방 방제를 우선 검토하세요.",
    "output": {
      "risk_level": "HIGH",
      "recommended_actions": ["환기 강화", "예방 방제", "습도 모니터링"],
      "citations": ["E1", "E2"]
    },
    "retrieval": {
      "retrieval_run_id": "1f7b7f72-1e5b-4f96-9b8d-7ee46d5871f4",
      "status": "HIT",
      "result_count": 5
    },
    "evidence": [
      {
        "citation_id": "E1",
        "evidence_id": "3d25...",
        "quote_text": "고온다습 조건에서는 잎곰팡이병 발생 위험이 증가한다.",
        "source_id": "0d2e8d3e-9d54-4b16-9f21-d6d8e60fdb15"
      }
    ],
    "metrics": {
      "latency_ms": 3120,
      "prompt_tokens": 2480,
      "completion_tokens": 410
    }
  }
}
```

### 6.2 Agent 실행 결과 조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URI | `/api/agents/{agent_id}/runs/{agent_run_id}` |
| 권한 | `ADMIN`, `OPERATOR`, 실행자 본인 |

**Response DTO**

```json
{
  "success": true,
  "data": {
    "agent_run_id": "99ccf13f-3ff4-4e50-8f90-aec4e3e4df42",
    "domain": "sol_bat",
    "agent_id": "solbat_farm_coach",
    "workflow_id": "solbat_farm_coach_v1",
    "requester_id": "user-001",
    "status": "SUCCEEDED",
    "input_text": "토마토 하우스가 고온다습한데 병해충 위험과 조치가 궁금합니다.",
    "final_output": "고온다습 조건에서는 잎곰팡이병 위험이 증가하므로...",
    "retrieval_runs": [
      {
        "retrieval_run_id": "1f7b7f72-1e5b-4f96-9b8d-7ee46d5871f4",
        "strategy": "HYBRID",
        "status": "HIT",
        "result_count": 5
      }
    ],
    "started_at": "2026-06-21T10:00:00+09:00",
    "ended_at": "2026-06-21T10:00:03+09:00"
  }
}
```

## 7. 오류 코드

### 7.1 Source 오류

| 오류 코드 | HTTP | 설명 |
|---|---:|---|
| `GRAG-SRC-001` | 400 | Source 요청값 검증 실패 |
| `GRAG-SRC-002` | 400 | 지원하지 않는 source_type |
| `GRAG-SRC-003` | 400 | Source URI 접근 실패 |
| `GRAG-SRC-404` | 404 | Source 없음 |
| `GRAG-SRC-409` | 409 | 중복 Source |
| `GRAG-SRC-423` | 423 | 인덱싱 중이라 수정/삭제 불가 |

### 7.2 IndexJob 오류

| 오류 코드 | HTTP | 설명 |
|---|---:|---|
| `GRAG-JOB-001` | 400 | IndexJob 실행 조건 미충족 |
| `GRAG-JOB-002` | 400 | 지원하지 않는 job_type |
| `GRAG-JOB-404` | 404 | IndexJob 없음 |
| `GRAG-JOB-409` | 409 | 동일 Source 인덱싱 중복 실행 |
| `GRAG-JOB-423` | 423 | 취소/재시도 불가 상태 |
| `GRAG-JOB-500` | 500 | IndexJob 실행 실패 |

### 7.3 GraphRAG 검색 오류

| 오류 코드 | HTTP | 설명 |
|---|---:|---|
| `GRAG-RET-001` | 400 | 검색 query 없음 |
| `GRAG-RET-002` | 400 | 지원하지 않는 retrieval strategy |
| `GRAG-RET-404` | 404 | 검색 결과 없음 |
| `GRAG-RET-500` | 500 | Retriever 실행 실패 |
| `GRAG-VEC-001` | 500 | Vector Store 검색 실패 |
| `GRAG-GPH-001` | 500 | Graph Store 조회 실패 |
| `GRAG-GPH-002` | 500 | Graph traversal 실패 |

### 7.4 Agent 오류

| 오류 코드 | HTTP | 설명 |
|---|---:|---|
| `GRAG-AGT-001` | 400 | Agent 실행 요청값 검증 실패 |
| `GRAG-AGT-404` | 404 | Agent 또는 Workflow 없음 |
| `GRAG-AGT-409` | 409 | Agent 실행 중복 또는 상태 충돌 |
| `GRAG-AGT-500` | 500 | Agent 실행 실패 |
| `GRAG-LLM-001` | 502 | LLM 호출/응답 파싱 실패 |

### 7.5 인증/권한 오류

| 오류 코드 | HTTP | 설명 |
|---|---:|---|
| `GRAG-AUTH-401` | 401 | 인증 필요 |
| `GRAG-AUTH-403` | 403 | 접근 권한 없음 |
| `GRAG-AUTH-404` | 404 | 권한 범위 내 리소스 없음 |

## 8. API-모듈 매핑

| API | 주요 모듈 | 주요 테이블 |
|---|---|---|
| Source 등록 | `SourceManager` | `graphrag_sources` |
| Source preview | `SourceManager`, `GraphStoreAdapter` | `graphrag_chunks`, `graphrag_entities`, `graphrag_relations`, `graphrag_evidence` |
| IndexJob 생성/실행 | `IndexJobManager`, `DocumentPipeline` | `graphrag_sources`, `graphrag_documents`, `graphrag_chunks`, `graphrag_embedding_refs` |
| 검색 테스트 | `HybridRetriever`, `ContextAssembler` | `graphrag_retrieval_runs`, `graphrag_retrieval_results` |
| Agent 실행 | `AgentRuntime`, `GraphRAGRetrieveNode` | `graphrag_agent_runs`, `graphrag_retrieval_runs` |

## 9. 보안 및 감사

| 항목 | 정책 |
|---|---|
| Source 조회 | tenant_id, owner_id, scope 기준 필터 |
| Evidence 조회 | Source 권한 상속 |
| 관리자 API | ADMIN/OPERATOR 권한 필수 |
| Agent 실행 조회 | 실행자 본인 또는 관리자만 가능 |
| 감사 로그 | Source 변경, IndexJob 실행/취소/재시도, 검색 테스트, Agent 실행 기록 |
| 민감정보 | `input_text`, `final_output`, `quote_text`는 masking 정책 적용 가능 |

## 10. 후속 작업

| 순서 | 역할 | 작업 | 산출물 |
|---:|---|---|---|
| 1 | 기획자/디자이너 | 관리자 사이트 화면정의 | Source 목록/상세, IndexJob 모니터링, 검색 테스트 화면 |
| 2 | Backend Engineer | OpenAPI YAML 작성 | API 명세 자동화 산출물 |
| 3 | QA | API 테스트 시나리오 작성 | 정상/오류/권한/경계값 테스트 케이스 |
| 4 | PM | 설계 산출물 검토 및 확정 | 240.설계 산출물 검토 및 확정 문서 |

### 10.1 다음 요청 권고

```text
[기획자/디자이너] 240.설계 단계의 관리자 사이트 화면정의서를 작성해 주세요. Source 목록/등록/상세/Preview, IndexJob 실행/상태 모니터링, GraphRAG 검색 테스트 화면을 포함해 주세요.
```

## 11. 승인 및 변경 이력

### 11.1 승인 기록

| 구분 | 역할 | 승인 여부 | 일자 | 비고 |
|---|---|---|---|---|
| 작성 | 아키텍터/Backend Engineer | 작성 완료 | 2026-06-21 | 초안 |
| 검토 | PM | 검토 필요 | - | WBS 및 산출물 추적 |
| 검토 | GraphRAG Engineer | 검토 필요 | - | GraphRAG 검색/Agent 연계 |
| 검토 | Data Architect | 검토 필요 | - | 테이블/DTO 정합성 |
| 승인 | Product Owner | 승인 필요 | - | MVP 범위 확인 |

### 11.2 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-21 | 관리자 및 GraphRAG API 명세서 최초 작성 | 아키텍터/Backend Engineer |
