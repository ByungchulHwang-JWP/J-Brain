# 관리자 사이트 화면정의서 VectorMoon UX 보완본

## 1. 보완 목적

VectorMoon 관리자 벡터화 화면의 drag & drop 업로드, 문서 목록, 청크 미리보기, 검색 테스트 흐름을 GraphRAG AI Agent 공통 프레임워크 관리자 사이트에 맞게 확장한다.

## 2. 화면 구성

| 화면 영역 | 주요 기능 | VectorMoon 반영 요소 | GraphRAG 확장 요소 |
| --- | --- | --- | --- |
| Source 등록 | 파일 선택, 텍스트 입력, Domain/Scope/Tag 입력 | drag & drop, 다중 파일 선택 | Source metadata, scope, tags, auto run |
| Source 목록 | Source 상태와 count 표시 | 문서 카드/목록 | chunk/entity/relation/evidence count, last_job_id |
| IndexJob 실행/상태 | Job 생성, 실행, 재시도, 목록 조회 | 벡터화 실행 버튼 | 10단계 타임라인, FAILED retry |
| GraphRAG Preview | Chunk/Entity/Relation/Evidence 탭 | 청크 상세 모달 | GraphRAG 인덱싱 결과 검증 |
| GraphRAG 검색 테스트 | 질의, 전략, top_k, source filter | 검색 테스트 패널 | VECTOR_ONLY/GRAPH_ONLY/HYBRID/HYBRID_RERANK |

## 3. Source 등록 화면 정의

| 항목 | 유형 | 필수 | 설명 |
| --- | --- | --- | --- |
| 파일 드롭존 | File input | 선택 | 파일명 기반 Source 등록 보조, MVP에서는 텍스트 placeholder로 처리 |
| Domain | Text | 필수 | `sol_bat`, `vector_moon`, `account_book`, `lotto`, `common` |
| Scope | Select | 필수 | GLOBAL, DOMAIN, TENANT, USER |
| Tags | Text | 선택 | 쉼표 구분 태그 |
| Name | Text | 필수 | Source명 |
| Content | Textarea | 필수 | MVP 인덱싱 대상 텍스트 |
| Source 등록 | Button | - | Source만 등록 |
| 등록 후 Job 실행 | Button | - | Source 등록, Job 생성, 실행 연속 처리 |

## 4. IndexJob 화면 정의

| 항목 | 설명 |
| --- | --- |
| Source ID | 작업 대상 Source |
| Job ID | 생성/실행/재시도 대상 Job |
| Job 생성 | PENDING 상태 Job 생성 |
| 실행 | 동기 MVP 실행 |
| 재시도 | 기존 Job의 단계 타임라인 초기화 후 재실행 |
| 단계 타임라인 | LOAD_SOURCE, PARSE_DOCUMENT, CHUNK_DOCUMENT, EMBED_CHUNK, SAVE_VECTOR, EXTRACT_ENTITY, EXTRACT_RELATION, LINK_EVIDENCE, SAVE_GRAPH, FINALIZE |

## 5. Preview 화면 정의

| 탭 | 표시 데이터 |
| --- | --- |
| Chunk | chunk_id, source_id, document_id, content, chunk_index, metadata |
| Entity | entity_id, entity_type, name, normalized_name, confidence_score |
| Relation | candidate_id, relation_type, source_entity_ref, target_entity_ref, confidence_score |
| Evidence | evidence_id, chunk_id, quote_text, confidence_score |

## 6. 검색 테스트 화면 정의

| 항목 | 설명 |
| --- | --- |
| Query | 검색 테스트 질의 |
| Strategy | HYBRID, VECTOR_ONLY, GRAPH_ONLY, HYBRID_RERANK |
| Top K | 반환 개수 |
| Source Filter | 특정 Source 기준 테스트 |
| Result | RetrievalResponse JSON, score breakdown, evidence 포함 |

## 7. 상태/오류 표시 기준

| 상태 | 표시 |
| --- | --- |
| REGISTERED | 노란색 배지 |
| INDEXED | 초록색 배지 |
| FAILED | 빨간색 배지 |
| DELETED | 목록 제외 |
| API 오류 | 결과 패널 JSON error 표시 |
