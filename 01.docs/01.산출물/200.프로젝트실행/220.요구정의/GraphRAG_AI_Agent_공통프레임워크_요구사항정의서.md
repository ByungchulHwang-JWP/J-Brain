# GraphRAG AI Agent 공통 프레임워크 요구사항정의서

## 1. 문서 개요

### 1.1 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 개발 프로젝트의 기능 요구사항과 비기능 요구사항을 정의한다. 관리자 사이트, 자료 인덱싱, GraphRAG 검색, Agent 실행, 보안, 운영, 품질 요구사항을 명확히 하여 후속 분석, 설계, 구현, 테스트 단계의 기준으로 사용한다.

### 1.2 적용 범위

본 문서는 다음 범위에 적용한다.

- 관리자 사이트(Admin Portal)
- 벡터화 대상 자료 등록 및 관리
- 자료 인덱싱 파이프라인
- GraphRAG 검색 및 Hybrid Retrieval
- AI Agent 실행 및 근거 기반 답변
- 도메인 스키마 관리
- 보안, 운영, 모니터링, 품질 검증
- 서비스 프로젝트 연동

### 1.3 관련 산출물

| 산출물 | 경로 |
|---|---|
| WBS | `01.docs/01.산출물/100.프로젝트계획/GraphRAG_AI_Agent_공통프레임워크_WBS.md` |
| 시스템아키텍처정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_시스템아키텍처정의서.md` |
| GraphRAG 아키텍처 정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_GraphRAG아키텍처정의서.md` |
| 데이터/저장소 아키텍처 정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_데이터저장소아키텍처정의서.md` |
| 개발표준정의서 | `01.docs/01.산출물/200.프로젝트실행/210.아키텍처정의/GraphRAG_AI_Agent_공통프레임워크_개발표준정의서.md` |
| 액터목록 및 유스케이스목록 | `01.docs/01.산출물/200.프로젝트실행/220.요구정의/GraphRAG_AI_Agent_공통프레임워크_액터목록_유스케이스목록.md` |

## 2. 요구사항 정의 기준

### 2.1 요구사항 분류

| 분류 | ID Prefix | 설명 |
|---|---|---|
| 관리자 인증/권한 | FR-ADM-AUTH | 관리자 사이트 인증 및 권한 |
| 관리자 자료 관리 | FR-ADM-SRC | 벡터화 대상 자료 등록, 조회, 수정, 삭제 |
| 관리자 검색 테스트 | FR-ADM-TEST | 관리자 검색 테스트 및 결과 검증 |
| 자료 인덱싱 | FR-IDX | 자료 로드, 파싱, chunking, embedding, graph extraction |
| GraphRAG 검색 | FR-SRCH | Vector Search, Graph Traversal, Hybrid Retrieval |
| Agent 실행 | FR-AGT | Agent Workflow, 답변 생성, 출처 제공 |
| 도메인 스키마 | FR-DOM | Entity/Relation Schema 관리 |
| 운영/모니터링 | FR-OPS | 로그, 지표, 작업 상태, 알림 |
| 개발자 연동 | FR-DEV | 공통 프레임워크 API/설정/확장 |
| 보안 | NFR-SEC | 인증, 인가, 민감정보, 접근제어 |
| 성능 | NFR-PERF | 응답 시간, 처리량, 대용량 처리 |
| 신뢰성 | NFR-REL | 실패 처리, 재시도, 복구 |
| 확장성/유지보수성 | NFR-MNT | 모듈화, 설정화, 교체 가능성 |
| 품질/검증 | NFR-QA | 검색 품질, 답변 근거, 테스트 |
| AI 품질 | AIR | GraphRAG 및 LLM 응답 품질 |

### 2.2 우선순위 기준

| 우선순위 | 기준 |
|---|---|
| High | MVP 또는 파일럿 검증에 반드시 필요한 요구사항 |
| Medium | 1차 구현 이후 고도화 또는 운영 편의성 확보에 필요한 요구사항 |
| Low | 후속 확장 또는 선택 적용 가능한 요구사항 |

### 2.3 상태 기준

| 상태 | 설명 |
|---|---|
| 정의 | 요구사항 초안 작성 완료 |
| 검토중 | PM, 아키텍터, 도메인 전문가 검토 필요 |
| 확정 | 이해관계자 승인 완료 |
| 변경 | 범위 또는 내용 변경 발생 |
| 보류 | 후속 의사결정 필요 |

## 3. 요구사항 개요

### 3.1 기능 요구사항 요약

| 영역 | 요구사항 수 | 주요 내용 |
|---|---:|---|
| 관리자 인증/권한 | 3 | 로그인, Role 기반 접근, 감사 로그 |
| 관리자 자료 관리 | 10 | 자료 등록, 조회, 수정, 검증, 삭제, 비활성화 |
| 관리자 검색 테스트 | 3 | 검색 테스트 실행, 결과 확인, 재처리 판단 |
| 자료 인덱싱 | 11 | 로드, 파싱, chunking, embedding, entity/relation 추출 |
| GraphRAG 검색 | 7 | 질의 분석, vector search, graph traversal, reranking |
| Agent 실행 | 6 | Workflow 실행, 근거 답변, 출처, fallback |
| 도메인 스키마 | 5 | domain, entity, relation, schema validation |
| 운영/모니터링 | 5 | 지표, 로그, 작업 이력, 알림 |
| 개발자 연동 | 4 | 설정, API, Adapter, 서비스 연동 |

### 3.2 비기능 및 AI 품질 요구사항 요약

| 영역 | 요구사항 수 | 주요 내용 |
|---|---:|---|
| 보안 | 8 | Secret 보호, 권한 필터, 민감정보 마스킹 |
| 성능 | 5 | 검색 응답, 인덱싱 처리, 대량 자료 대응 |
| 신뢰성 | 5 | 재시도, 실패 기록, fallback |
| 확장성/유지보수성 | 5 | 저장소 교체, 도메인 확장, 설정화 |
| 품질/검증 | 5 | 테스트, 추적성, 검증 기준 |
| AI 품질 | 7 | Grounding, 출처, 품질 지표, 평가 데이터 |

## 4. 기능 요구사항

### 4.1 관리자 인증/권한 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-ADM-AUTH-001 | 관리자 로그인 | 관리자 사이트는 인증된 사용자만 접근할 수 있어야 한다. | High | UC-ADM-001 | 미인증 사용자가 관리자 화면/API 접근 시 차단된다. |
| FR-ADM-AUTH-002 | 관리자 Role 확인 | 자료 등록, 삭제, 인덱싱 실행 등 관리자 기능은 Role 기반 권한을 확인해야 한다. | High | UC-SEC-001 | 권한 없는 사용자의 요청이 거부되고 보안 로그가 기록된다. |
| FR-ADM-AUTH-003 | 관리자 작업 감사 로그 | 자료 등록, 수정, 삭제, 인덱싱 실행, 재시도 작업은 audit log를 남겨야 한다. | High | UC-ADM-003, UC-ADM-013 | 누가, 언제, 어떤 자료에 어떤 작업을 수행했는지 조회 가능하다. |

### 4.2 관리자 자료 관리 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-ADM-SRC-001 | 자료 목록 조회 | 관리자는 등록된 벡터화 대상 자료 목록을 조회할 수 있어야 한다. | High | UC-ADM-002 | 자료명, domain, source_type, scope, status, 최근 작업 상태가 표시된다. |
| FR-ADM-SRC-002 | 자료 조건 검색 | 자료 목록은 domain, source_type, scope, status, tag, 기간으로 필터링할 수 있어야 한다. | Medium | UC-ADM-002 | 조건 입력 시 대상 자료만 조회된다. |
| FR-ADM-SRC-003 | 자료 등록 | 관리자는 파일, URL, DB, API, text 유형의 자료를 등록할 수 있어야 한다. | High | UC-ADM-003 | 정상 자료 등록 시 source_id가 생성되고 `REGISTERED` 상태가 저장된다. |
| FR-ADM-SRC-004 | 자료 메타데이터 입력 | 자료 등록 시 domain, source_type, scope, tags, 설명 등 필수 메타데이터를 입력해야 한다. | High | UC-ADM-003 | 필수값 누락 시 저장되지 않고 오류 메시지가 표시된다. |
| FR-ADM-SRC-005 | 자료 형식 검증 | 시스템은 등록 자료의 파일 크기, 확장자, MIME type, URL 형식, 접근 가능 여부를 검증해야 한다. | High | UC-ADM-006 | 허용되지 않은 자료는 등록 또는 인덱싱이 차단된다. |
| FR-ADM-SRC-006 | 자료 중복 확인 | 시스템은 `content_hash` 또는 `source_uri` 기준으로 중복 자료를 탐지해야 한다. | Medium | UC-ADM-003 | 동일 자료 등록 시 중복 안내 또는 버전 등록 선택이 가능하다. |
| FR-ADM-SRC-007 | 자료 상세 조회 | 관리자는 자료 상세에서 원문 정보, chunk, entity, relation, evidence를 확인할 수 있어야 한다. | High | UC-ADM-005 | 인덱싱된 자료의 주요 지식 요소가 화면에 표시된다. |
| FR-ADM-SRC-008 | 자료 메타데이터 수정 | 관리자는 등록 자료의 설명, tags, scope 등 허용된 메타데이터를 수정할 수 있어야 한다. | High | UC-ADM-004 | 수정 이력이 audit log에 남고 검색 필터에 반영된다. |
| FR-ADM-SRC-009 | 자료 비활성화 | 관리자는 특정 자료를 검색 대상에서 제외할 수 있어야 한다. | Medium | UC-ADM-012 | 비활성화 자료는 검색 결과에 포함되지 않는다. |
| FR-ADM-SRC-010 | 자료 삭제 | 관리자는 자료를 삭제 또는 soft delete 처리할 수 있어야 한다. | Medium | UC-ADM-013 | 삭제 자료와 연결된 vector/graph 데이터 처리 정책이 적용된다. |

### 4.3 관리자 검색 테스트 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-ADM-TEST-001 | 검색 테스트 실행 | 관리자는 관리자 사이트에서 테스트 질의를 입력하여 검색 결과를 확인할 수 있어야 한다. | High | UC-ADM-014 | 테스트 질의 입력 시 검색 결과가 반환된다. |
| FR-ADM-TEST-002 | 검색 방식 선택 | 검색 테스트는 vector, graph, hybrid 방식을 선택할 수 있어야 한다. | Medium | UC-ADM-014 | 선택한 검색 방식별 결과 차이를 확인할 수 있다. |
| FR-ADM-TEST-003 | 검색 결과 근거 표시 | 검색 테스트 결과에는 score, source, chunk, entity, relation, evidence가 표시되어야 한다. | High | UC-ADM-014 | 관리자가 검색 품질과 재인덱싱 필요 여부를 판단할 수 있다. |

### 4.4 자료 인덱싱 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-IDX-001 | 인덱싱 작업 생성 | 벡터화 또는 그래프화 실행 시 `graphrag_index_jobs`에 작업 이력이 생성되어야 한다. | High | UC-ADM-007, UC-IDX-010 | 작업 생성 시 job_id와 `PENDING` 상태가 저장된다. |
| FR-IDX-002 | 자료 로드 | 시스템은 등록된 source_type에 따라 원문 자료를 로드할 수 있어야 한다. | High | UC-IDX-001 | 파일, URL, text 자료에 대한 로드 결과가 확인된다. |
| FR-IDX-003 | 자료 파싱 | 시스템은 PDF, DOCX, CSV, Markdown, text 등 지원 형식을 text로 변환해야 한다. | High | UC-IDX-002 | 지원 형식별 샘플 자료가 text로 변환된다. |
| FR-IDX-004 | Chunk 생성 | 시스템은 원문을 설정된 chunk size와 overlap 기준으로 분할해야 한다. | High | UC-IDX-003 | chunk 수, source, page/position metadata가 기록된다. |
| FR-IDX-005 | Embedding 생성 | 시스템은 chunk별 embedding을 생성해야 한다. | High | UC-IDX-004 | chunk별 embedding 생성 성공/실패가 기록된다. |
| FR-IDX-006 | Vector Store 저장 | 시스템은 chunk와 embedding을 Vector Store에 저장해야 한다. | High | UC-IDX-005 | 저장된 chunk가 vector search로 조회된다. |
| FR-IDX-007 | Entity 추출 | 시스템은 chunk에서 도메인 스키마 기반 Entity 후보를 추출해야 한다. | High | UC-IDX-006 | Entity type, name, confidence가 저장된다. |
| FR-IDX-008 | Relation 추출 | 시스템은 추출된 Entity 간 Relation 후보를 추출해야 한다. | High | UC-IDX-007 | source_entity, target_entity, relation_type, confidence가 저장된다. |
| FR-IDX-009 | Evidence 연결 | 시스템은 chunk와 Entity/Relation의 근거 연결을 저장해야 한다. | High | UC-IDX-009 | Entity/Relation 상세에서 근거 chunk를 확인할 수 있다. |
| FR-IDX-010 | 작업 상태 갱신 | 인덱싱 작업은 PENDING, RUNNING, SUCCESS, FAILED, CANCELED 상태를 관리해야 한다. | High | UC-ADM-009 | 작업 진행에 따라 상태와 시간 정보가 갱신된다. |
| FR-IDX-011 | 실패 작업 재시도 | 실패한 작업은 오류 원인을 확인한 뒤 재시도할 수 있어야 한다. | High | UC-ADM-010 | 재시도 시 새 작업 이력이 생성되거나 기존 작업의 retry_count가 증가한다. |

### 4.5 GraphRAG 검색 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-SRCH-001 | 질의 정규화 | 시스템은 사용자 질문을 검색 가능한 형태로 정규화해야 한다. | High | UC-SRCH-002 | 입력 질문에서 핵심 키워드와 domain이 추출된다. |
| FR-SRCH-002 | Query Entity 탐지 | 시스템은 질문 내 Entity 후보를 탐지해야 한다. | Medium | UC-SRCH-002 | 질문에 포함된 주요 Entity가 검색 로그에 기록된다. |
| FR-SRCH-003 | Vector Search | 시스템은 질문 embedding을 기준으로 유사 chunk를 검색해야 한다. | High | UC-SRCH-003 | top_k chunk와 score가 반환된다. |
| FR-SRCH-004 | Graph Traversal | 시스템은 질문 또는 검색 chunk와 연결된 Entity/Relation을 탐색해야 한다. | High | UC-SRCH-004 | 관련 subgraph와 evidence가 반환된다. |
| FR-SRCH-005 | Hybrid Retrieval | 시스템은 vector 결과와 graph 결과를 통합하고 재정렬해야 한다. | High | UC-SRCH-005 | 최종 결과에 통합 score와 근거 유형이 포함된다. |
| FR-SRCH-006 | 권한 필터 검색 | 검색 시 domain, scope, tenant_id, user_id 필터를 적용해야 한다. | High | UC-SEC-002 | 권한 없는 자료가 검색 결과에 포함되지 않는다. |
| FR-SRCH-007 | 검색 결과 없음 처리 | 검색 결과가 부족한 경우 근거 부족 상태를 반환해야 한다. | High | UC-SRCH-009 | 근거 부족 질의에 대해 임의 답변 생성이 제한된다. |

### 4.6 Agent 실행 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-AGT-001 | Agent Workflow 실행 | 서비스 프로젝트는 공통 Agent Workflow 또는 GraphRAG 검색 노드를 실행할 수 있어야 한다. | High | UC-DOM-006, UC-SRCH-001 | 샘플 질의가 LangGraph Workflow를 통해 처리된다. |
| FR-AGT-002 | Context Assembly | Agent는 검색 결과를 LLM 입력용 grounded context로 구성해야 한다. | High | UC-SRCH-006 | context에 chunk, entity, relation, evidence가 포함된다. |
| FR-AGT-003 | 근거 기반 답변 생성 | Agent는 검색 근거를 기반으로 답변을 생성해야 한다. | High | UC-SRCH-007 | 답변 내용이 evidence와 연결된다. |
| FR-AGT-004 | 출처 제공 | Agent 답변은 source, 문서명, chunk 또는 evidence 정보를 포함해야 한다. | High | UC-SRCH-008 | 답변 결과에 출처 목록이 표시된다. |
| FR-AGT-005 | Fallback 응답 | Vector Store, Graph Store, LLM 장애 또는 검색 결과 부족 시 fallback 응답을 제공해야 한다. | High | UC-SRCH-009 | 장애 상황별 fallback 메시지 또는 부분 검색 결과가 반환된다. |
| FR-AGT-006 | Agent 실행 이력 저장 | Agent 실행 요청, workflow step, 검색 결과 요약, 오류 정보는 실행 이력으로 저장되어야 한다. | Medium | UC-OPS-002 | `agent_runs`, `agent_run_steps`에서 실행 이력을 조회할 수 있다. |

### 4.7 도메인 스키마 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-DOM-001 | 도메인 등록 | 서비스별 domain을 등록하고 구분할 수 있어야 한다. | High | UC-DOM-001 | `solbat`, `vectormoon` 등 domain별 설정이 분리된다. |
| FR-DOM-002 | Entity Type 정의 | 도메인별 Entity Type을 정의할 수 있어야 한다. | High | UC-DOM-002 | 정의되지 않은 Entity Type 저장이 차단된다. |
| FR-DOM-003 | Relation Type 정의 | 도메인별 Relation Type과 방향성을 정의할 수 있어야 한다. | High | UC-DOM-003 | 정의되지 않은 Relation Type 저장이 차단된다. |
| FR-DOM-004 | 도메인 스키마 검증 | Entity/Relation Schema의 이름, 방향성, 중복 여부를 검증해야 한다. | High | UC-DOM-004 | 잘못된 스키마 등록 시 오류가 반환된다. |
| FR-DOM-005 | 도메인별 검색 설정 | 도메인별 top_k, graph depth, score weight, prompt template을 설정할 수 있어야 한다. | Medium | UC-DOM-006 | 도메인 설정 변경 시 검색 결과 또는 Agent prompt에 반영된다. |

### 4.8 운영/모니터링 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-OPS-001 | 인덱싱 작업 이력 조회 | 운영자는 인덱싱 작업의 시작/종료 시간, 상태, 처리 건수, 오류를 조회할 수 있어야 한다. | High | UC-ADM-016 | 작업 이력 목록과 상세가 조회된다. |
| FR-OPS-002 | 운영 지표 수집 | 시스템은 인덱싱 성공률, 검색 지연, LLM 호출량, 오류 수를 수집해야 한다. | Medium | UC-OPS-001 | 운영 지표가 로그 또는 DB에서 조회된다. |
| FR-OPS-003 | 오류 로그 조회 | 운영자 또는 개발자는 인덱싱 실패, 검색 실패, Agent 실패 로그를 확인할 수 있어야 한다. | Medium | UC-OPS-002 | 오류 코드, 메시지, job_id/run_id가 기록된다. |
| FR-OPS-004 | 작업 알림 | 인덱싱 실패 또는 장시간 실행 작업 발생 시 알림을 발송할 수 있어야 한다. | Low | UC-OPS-003 | 알림 설정 시 지정 채널로 실패 알림이 발송된다. |
| FR-OPS-005 | 검색/Agent 실행 로그 | 검색 요청과 Agent 실행은 domain, latency, result_count, error 여부를 로그로 남겨야 한다. | Medium | UC-OPS-002 | 검색 및 Agent 실행 이력이 추적 가능하다. |

### 4.9 개발자 연동 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| FR-DEV-001 | 공통 설정 제공 | 서비스 프로젝트는 공통 설정 파일 또는 설정 객체로 GraphRAG 기능을 사용할 수 있어야 한다. | High | UC-DOM-005 | 샘플 서비스에서 설정만으로 common_core 기능을 호출한다. |
| FR-DEV-002 | Store Adapter 제공 | Vector Store와 Graph Store는 Adapter 방식으로 교체 가능해야 한다. | High | UC-IDX-005, UC-SRCH-005 | pgvector 외 저장소 구현체 추가가 가능하다. |
| FR-DEV-003 | Agent Node 제공 | 서비스 프로젝트는 공통 GraphRAG Agent Node를 workflow에 연결할 수 있어야 한다. | High | UC-DOM-006 | LangGraph 샘플 workflow에서 노드가 실행된다. |
| FR-DEV-004 | 예제 코드 제공 | 프레임워크 사용 예제와 Sol-Bat 파일럿 연동 예제를 제공해야 한다. | Medium | UC-DOM-005 | 개발자가 예제로 인덱싱과 검색을 재현할 수 있다. |

## 5. 비기능 요구사항

### 5.1 보안 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| NFR-SEC-001 | Secret 보호 | API Key, DB Password, JWT Secret, Token은 코드와 산출물에 포함하지 않아야 한다. | High | UC-SEC-003 | 저장소 검색 시 Secret 패턴이 발견되지 않는다. |
| NFR-SEC-002 | 관리자 API 인증 | 관리자 API는 인증 토큰 없이는 호출할 수 없어야 한다. | High | UC-SEC-001 | 미인증 요청이 401 또는 동등한 오류로 차단된다. |
| NFR-SEC-003 | Role 기반 인가 | 관리자 작업은 권한별로 조회, 등록, 수정, 삭제, 실행 범위를 구분해야 한다. | High | UC-SEC-001 | 권한 없는 작업 요청이 차단된다. |
| NFR-SEC-004 | 자료 접근 범위 제한 | private 자료는 scope, tenant_id, user_id 기준으로 접근이 제한되어야 한다. | High | UC-SEC-002 | 다른 사용자 또는 tenant 자료가 검색되지 않는다. |
| NFR-SEC-005 | 민감정보 마스킹 | 원문 미리보기, 로그, 검색 결과에는 민감정보 마스킹 정책을 적용해야 한다. | High | UC-SEC-003 | 마스킹 대상 문자열이 그대로 노출되지 않는다. |
| NFR-SEC-006 | 감사 로그 무결성 | 감사 로그는 임의 수정 또는 삭제를 제한해야 한다. | Medium | UC-ADM-013 | 관리자 주요 작업 이력이 보존된다. |
| NFR-SEC-007 | 파일 업로드 보안 | 업로드 파일은 확장자, MIME type, 크기, 악성 스크립트 포함 여부를 검증해야 한다. | High | UC-ADM-006 | 허용되지 않은 파일 업로드가 차단된다. |
| NFR-SEC-008 | LLM Prompt 보호 | LLM 요청 로그에는 민감정보와 Secret을 포함하지 않아야 한다. | High | UC-SRCH-007 | prompt logging 시 민감정보가 마스킹된다. |

### 5.2 성능 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| NFR-PERF-001 | 검색 응답 시간 측정 | GraphRAG 검색 응답 시간은 로그 또는 지표로 측정 가능해야 한다. | High | UC-SRCH-005 | 검색 요청별 latency가 기록된다. |
| NFR-PERF-002 | 관리자 목록 응답 | 자료 목록과 작업 목록은 페이징을 지원해야 한다. | High | UC-ADM-002, UC-ADM-009 | 대량 데이터에서도 페이지 단위 조회가 가능하다. |
| NFR-PERF-003 | 인덱싱 비동기 처리 | 장시간 인덱싱 작업은 사용자 요청 흐름과 분리하여 처리할 수 있어야 한다. | Medium | UC-ADM-007 | 작업 생성 후 상태 조회로 진행 상황을 확인한다. |
| NFR-PERF-004 | 검색 범위 제한 | 검색 시 domain, scope, top_k, graph depth를 제한할 수 있어야 한다. | High | UC-SRCH-005 | 설정값에 따라 검색 범위가 제한된다. |
| NFR-PERF-005 | 대용량 자료 처리 | 대용량 자료는 chunk 단위로 처리하고 실패 지점을 추적할 수 있어야 한다. | Medium | UC-IDX-003~UC-IDX-010 | 일부 chunk 실패 시 실패 위치와 사유가 확인된다. |

### 5.3 신뢰성 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| NFR-REL-001 | 작업 실패 기록 | 인덱싱 실패 시 실패 단계, 오류 코드, 오류 메시지를 저장해야 한다. | High | UC-ADM-009 | 실패 작업 상세에서 원인을 확인할 수 있다. |
| NFR-REL-002 | 재시도 정책 | Embedding API, LLM API, 저장소 일시 장애에 대한 재시도 정책을 제공해야 한다. | Medium | UC-ADM-010 | 재시도 횟수와 최종 실패 여부가 기록된다. |
| NFR-REL-003 | Partial Failure 처리 | 인덱싱 일부 단계 실패 시 전체 실패 또는 부분 성공 정책을 명확히 적용해야 한다. | Medium | UC-IDX-004~UC-IDX-009 | 실패 chunk와 성공 chunk가 구분된다. |
| NFR-REL-004 | 검색 Fallback | Graph Store 장애 시 Vector Search만 수행하거나 적절한 오류를 반환해야 한다. | High | UC-SRCH-007, UC-SRCH-009 | Graph 장애 상황에서 fallback 결과가 반환된다. |
| NFR-REL-005 | 중복 실행 방지 | 동일 source에 대한 중복 인덱싱 작업 실행을 제어해야 한다. | Medium | UC-ADM-007 | 동일 자료 RUNNING 작업이 중복 생성되지 않는다. |

### 5.4 확장성 및 유지보수성 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| NFR-MNT-001 | 저장소 추상화 | Vector Store와 Graph Store는 인터페이스와 구현체를 분리해야 한다. | High | UC-IDX-005, UC-SRCH-005 | 구현체 교체 시 상위 로직 변경이 최소화된다. |
| NFR-MNT-002 | 도메인 확장성 | 신규 서비스는 domain schema와 설정 추가만으로 GraphRAG를 사용할 수 있어야 한다. | High | UC-DOM-001~UC-DOM-006 | 신규 domain 샘플이 별도 core 수정 없이 동작한다. |
| NFR-MNT-003 | 설정 외부화 | 모델명, top_k, chunk size, graph depth, score weight는 설정으로 분리해야 한다. | High | UC-DOM-005 | 설정 변경으로 검색 동작이 조정된다. |
| NFR-MNT-004 | 모듈 책임 분리 | SourceManager, IndexJobManager, Retriever, Agent Node는 책임을 분리해야 한다. | High | UC-ADM-003, UC-ADM-007, UC-SRCH-005 | 설계 산출물에서 모듈 책임이 명확히 정의된다. |
| NFR-MNT-005 | 문서화 | 공통 프레임워크 사용법, 설정법, 확장법을 문서로 제공해야 한다. | Medium | UC-DOM-005 | 개발자 가이드 또는 README에서 절차를 확인할 수 있다. |

### 5.5 품질 및 검증 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| NFR-QA-001 | 요구사항 추적성 | 요구사항은 유스케이스, 설계, 테스트와 추적 가능해야 한다. | High | UC-QA-001 | 요구사항추적표에서 UC와 테스트 케이스 연결이 가능하다. |
| NFR-QA-002 | 단위 테스트 | Parser, Chunker, Extractor, Retriever 등 핵심 모듈은 단위 테스트를 제공해야 한다. | High | UC-QA-003 | pytest 등으로 테스트 실행 결과를 확인한다. |
| NFR-QA-003 | 통합 테스트 | Indexing Pipeline, Vector Store, Graph Store, Agent Workflow 통합 테스트를 제공해야 한다. | High | UC-QA-003 | 샘플 자료 기준 end-to-end 처리 결과가 검증된다. |
| NFR-QA-004 | 관리자 기능 테스트 | 자료 등록, 벡터화 실행, 작업 상태 조회, 검색 테스트 기능은 테스트 시나리오를 제공해야 한다. | High | UC-ADM-003, UC-ADM-007, UC-ADM-009 | 테스트시나리오에서 정상/예외 흐름이 검증된다. |
| NFR-QA-005 | 회귀 테스트 | prompt, retrieval weight, model 변경 시 검색/답변 품질 회귀 테스트를 수행해야 한다. | Medium | UC-QA-003 | 변경 전후 품질 지표 비교 결과가 기록된다. |

## 6. AI 품질 요구사항

| 요구사항 ID | 요구사항명 | 설명 | 우선순위 | 관련 UC | 검증 기준 |
|---|---|---|---|---|---|
| AIR-001 | 근거 기반 답변 | Agent 답변은 검색된 chunk, entity, relation, evidence에 근거해야 한다. | High | UC-SRCH-007, UC-QA-002 | 답변 문장과 evidence 연결이 확인된다. |
| AIR-002 | 출처 표시 | 답변에는 사용된 자료 출처를 포함해야 한다. | High | UC-SRCH-008 | 답변 결과에 source 목록이 포함된다. |
| AIR-003 | 근거 부족 시 제한 | 근거가 부족한 질문에는 추정 답변 대신 근거 부족을 명시해야 한다. | High | UC-SRCH-009 | 테스트 질문에서 임의 답변이 생성되지 않는다. |
| AIR-004 | 검색 품질 지표 | Recall@K, Precision@K, Entity Match Rate, Relation Hit Rate를 측정할 수 있어야 한다. | Medium | UC-QA-001 | 테스트 데이터셋 기준 품질 지표가 산출된다. |
| AIR-005 | GraphRAG 품질 평가 | Vector only 검색과 Hybrid Retrieval 결과를 비교 평가할 수 있어야 한다. | Medium | UC-ADM-014, UC-QA-001 | 동일 질의에 대한 검색 결과 차이가 비교된다. |
| AIR-006 | Entity/Relation 신뢰도 | 자동 추출된 Entity/Relation은 confidence를 가져야 한다. | High | UC-IDX-006, UC-IDX-007 | 추출 결과에 confidence 값이 저장된다. |
| AIR-007 | 도메인 스키마 준수 | 답변 근거로 사용하는 Entity/Relation은 도메인 스키마를 준수해야 한다. | High | UC-DOM-004, UC-SRCH-004 | 미등록 schema 요소가 답변 근거로 사용되지 않는다. |

## 7. 요구사항 우선순위 및 MVP 범위

### 7.1 MVP 필수 요구사항

| 영역 | 요구사항 ID |
|---|---|
| 관리자 사이트 | FR-ADM-AUTH-001, FR-ADM-AUTH-002, FR-ADM-SRC-001, FR-ADM-SRC-003, FR-ADM-SRC-004, FR-ADM-SRC-005, FR-ADM-SRC-007, FR-ADM-TEST-001, FR-ADM-TEST-003 |
| 자료 인덱싱 | FR-IDX-001, FR-IDX-002, FR-IDX-003, FR-IDX-004, FR-IDX-005, FR-IDX-006, FR-IDX-007, FR-IDX-008, FR-IDX-009, FR-IDX-010 |
| GraphRAG 검색 | FR-SRCH-001, FR-SRCH-003, FR-SRCH-004, FR-SRCH-005, FR-SRCH-006, FR-SRCH-007 |
| Agent 실행 | FR-AGT-001, FR-AGT-002, FR-AGT-003, FR-AGT-004, FR-AGT-005 |
| 도메인 스키마 | FR-DOM-001, FR-DOM-002, FR-DOM-003, FR-DOM-004 |
| 보안/품질 | NFR-SEC-001, NFR-SEC-002, NFR-SEC-003, NFR-SEC-004, NFR-SEC-005, NFR-QA-001, AIR-001, AIR-002, AIR-003 |

### 7.2 후속 고도화 요구사항

| 영역 | 요구사항 ID |
|---|---|
| 관리자 편의 기능 | FR-ADM-SRC-002, FR-ADM-SRC-006, FR-ADM-SRC-009, FR-ADM-SRC-010, FR-ADM-TEST-002 |
| 운영 자동화 | FR-OPS-002, FR-OPS-003, FR-OPS-004, FR-OPS-005 |
| 개발자 생산성 | FR-DEV-004, NFR-MNT-005 |
| AI 품질 고도화 | AIR-004, AIR-005 |

## 8. 요구사항 추적 매트릭스 초안

| UC ID | 관련 요구사항 |
|---|---|
| UC-ADM-001 | FR-ADM-AUTH-001, FR-ADM-AUTH-002, NFR-SEC-002 |
| UC-ADM-002 | FR-ADM-SRC-001, FR-ADM-SRC-002, NFR-PERF-002 |
| UC-ADM-003 | FR-ADM-SRC-003, FR-ADM-SRC-004, FR-ADM-SRC-006, FR-ADM-AUTH-003 |
| UC-ADM-006 | FR-ADM-SRC-005, NFR-SEC-007 |
| UC-ADM-007 | FR-IDX-001, FR-IDX-002, FR-IDX-003, FR-IDX-004, FR-IDX-005, FR-IDX-006, NFR-PERF-003 |
| UC-ADM-009 | FR-IDX-010, FR-OPS-001, NFR-REL-001 |
| UC-ADM-010 | FR-IDX-011, NFR-REL-002 |
| UC-ADM-014 | FR-ADM-TEST-001, FR-ADM-TEST-002, FR-ADM-TEST-003, AIR-005 |
| UC-IDX-006 | FR-IDX-007, AIR-006 |
| UC-IDX-007 | FR-IDX-008, AIR-006 |
| UC-IDX-009 | FR-IDX-009, AIR-001 |
| UC-SRCH-003 | FR-SRCH-003, NFR-PERF-004 |
| UC-SRCH-004 | FR-SRCH-004, AIR-007 |
| UC-SRCH-005 | FR-SRCH-005, NFR-MNT-001 |
| UC-SRCH-007 | FR-AGT-003, AIR-001 |
| UC-SRCH-008 | FR-AGT-004, AIR-002 |
| UC-SRCH-009 | FR-SRCH-007, FR-AGT-005, AIR-003 |
| UC-DOM-001~UC-DOM-004 | FR-DOM-001, FR-DOM-002, FR-DOM-003, FR-DOM-004 |
| UC-SEC-001 | FR-ADM-AUTH-002, NFR-SEC-002, NFR-SEC-003 |
| UC-SEC-002 | FR-SRCH-006, NFR-SEC-004 |
| UC-SEC-003 | NFR-SEC-001, NFR-SEC-005, NFR-SEC-008 |
| UC-QA-001~UC-QA-003 | NFR-QA-001, NFR-QA-002, NFR-QA-003, NFR-QA-004, NFR-QA-005 |

## 9. 요구사항 검토 필요 사항

| 검토 ID | 항목 | 검토 내용 | 담당 후보 | 상태 |
|---|---|---|---|---|
| REV-REQ-001 | 관리자 사이트 기술 스택 | FastAPI Admin, React, Next.js 등 화면 기술 선택 필요 | 아키텍터, 개발자 | 검토중 |
| REV-REQ-002 | 파일 저장소 방식 | 로컬 파일, DB, Object Storage 중 1차 저장 방식 결정 필요 | Data Engineer, Architect | 검토중 |
| REV-REQ-003 | 비동기 작업 처리 | APScheduler, FastAPI Background Task, Celery/RQ 도입 시점 결정 필요 | Architect, DevOps | 검토중 |
| REV-REQ-004 | 수동 보정 범위 | Entity/Relation 수동 수정 기능을 MVP에 포함할지 결정 필요 | PM, 도메인 전문가 | 검토중 |
| REV-REQ-005 | 삭제 정책 | soft delete, hard delete, vector/graph cascade 정책 결정 필요 | PM, Security Engineer, DBA | 검토중 |
| REV-REQ-006 | AI 품질 목표치 | Recall@K, Precision@K 등 1차 목표 수치 확정 필요 | AI/ML Engineer, QA | 검토중 |

## 10. 승인 및 변경 이력

### 10.1 승인 기록

| 구분 | 역할 | 승인 여부 | 일자 | 비고 |
|---|---|---|---|---|
| 작성 | 기획자 | 작성 완료 | 2026-06-20 | 초안 |
| 검토 | PM | 승인 필요 | - | 사용자 확인 필요 |
| 검토 | 아키텍터 | 승인 필요 | - | 설계 영향도 검토 필요 |
| 검토 | GraphRAG Engineer | 승인 필요 | - | AI/검색 요구사항 검토 필요 |
| 검토 | Security Engineer | 승인 필요 | - | 보안 요구사항 검토 필요 |
| 승인 | Product Owner | 승인 필요 | - | 사용자 확인 필요 |

### 10.2 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| v0.1 | 2026-06-20 | 요구사항정의서 최초 작성 | 기획자 |
