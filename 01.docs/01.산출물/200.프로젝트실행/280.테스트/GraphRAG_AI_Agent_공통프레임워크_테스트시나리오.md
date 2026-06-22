# GraphRAG AI Agent 공통 프레임워크 테스트시나리오

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 280.테스트 |
| WBS | 8.2 테스트시나리오 작성 |
| 담당 | QA / QA Automation Engineer |
| 작성 목적 | GraphRAG Core, 관리자 사이트, Sol-Bat 파일럿, Source/IndexJob/Preview/Hybrid Retrieval, Agent 연계, 보안/권한/오류/성능/품질 검증을 위한 테스트 케이스 정의 |
| 작성일 | 2026-06-21 |

## 2. 테스트시나리오 작성 기준

본 문서는 280.테스트 단계의 테스트계획서를 기준으로 실제 검증 가능한 테스트 시나리오와 테스트 케이스를 정의한다.

테스트 케이스는 다음 기준으로 작성한다.

- 기능 단위 테스트, 통합 테스트, 화면/API 테스트, 파일럿 검증 테스트를 구분한다.
- Source 등록부터 IndexJob 실행, Preview 확인, Hybrid Retrieval, Agent 연계까지 주요 업무 흐름을 end-to-end 관점으로 검증한다.
- GraphRAG Core는 Entity, Relation, Evidence, GraphStore, HybridRetriever, ContextAssembler 처리 결과의 정확성을 검증한다.
- 관리자 사이트는 VectorMoon 관리자 UX 반영 기준과 GraphRAG 관리 기능이 사용 가능한 수준인지 검증한다.
- Sol-Bat 파일럿은 정의된 P1 데이터 3건과 도메인 스키마 기준으로 성공 기준 충족 여부를 검증한다.
- 보안/권한/오류/성능/품질은 공통 프레임워크로 재사용 가능한 기준을 우선 검증한다.

## 3. 테스트 환경 및 공통 전제

| 구분 | 내용 |
| --- | --- |
| 대상 저장소 | `D:\Dev\codex\GitHub\GraphRAG-AI-Agnet` |
| 참조 프로젝트 | `vm-common-core`, `Sol-Bat`, `VectorMoon`, `accountBook`, `lotto` |
| 파일럿 대상 | `D:\Dev\codex\GitHub\Sol-Bat` |
| 테스트 데이터 | Sol-Bat P1 샘플 데이터 3건, 일반 문서 샘플, 오류 입력 샘플 |
| 기본 저장소 | InMemoryVectorStore, InMemoryGraphStore |
| 확장 저장소 | FAISS Adapter 골격, PGVector Adapter 골격, PostgreSQL GraphStoreAdapter 골격 |
| 관리자 UI | `src/common_core/admin/web/admin_mvp.html` |
| 주요 검증 명령 | `python -m compileall src tests`, pytest 설치 시 `python -m pytest` |

## 4. 테스트 데이터

| 데이터 ID | 데이터 | 목적 |
| --- | --- | --- |
| TD-SB-001 | 토마토 잎곰팡이병 예방 및 방제 가이드 | 작물, 병해충, 증상, 관리작업, 농자재 Entity 추출 검증 |
| TD-SB-002 | 고추 탄저병 발생 위험 및 환경 조건 안내 | 환경조건, 발생위험, 예방 Relation 검증 |
| TD-SB-003 | 배추 생육단계별 관리작업 및 병해충 대응 안내 | 생육단계, 적용시기, 처방 Relation 검증 |
| TD-GEN-001 | 일반 영문/한글 혼합 문서 | Parser, Chunker, TextNormalizer 기본 처리 검증 |
| TD-ERR-001 | 빈 content Source | 필수값 오류 처리 검증 |
| TD-ERR-002 | 존재하지 않는 Source ID / Job ID | not_found 오류 처리 검증 |
| TD-SEC-001 | viewer 권한 사용자 | 등록/삭제/실행 제한 검증 |
| TD-SEC-002 | admin 권한 사용자 | Source/IndexJob 관리 권한 검증 |

## 5. 테스트 케이스 요약

| 영역 | 테스트 케이스 수 | 주요 검증 내용 |
| --- | ---: | --- |
| GraphRAG Core | 10 | Entity/Relation/Evidence/GraphStore/ContextAssembler |
| RAG Core / Source / IndexJob | 8 | 문서 파싱, 정규화, 청킹, 메타데이터, IndexJob |
| Vector Store / Hybrid Retrieval | 8 | add/search/delete, score 병합, evidence 포함 |
| 관리자 사이트/API | 10 | Source 관리, Preview, IndexJob 모니터링, 검색 테스트 |
| Agent 연계 | 5 | WorkflowFactory, RetrieveNode, AnswerNode, structured output |
| Sol-Bat 파일럿 | 6 | 도메인 스키마, 샘플 인덱싱, 검색 성공 기준 |
| 보안/권한/오류 | 8 | 인증, 권한, scope, 오류 응답 |
| 성능/품질 | 7 | 응답시간, 재시도, 로깅, 품질 기준 |
| 합계 | 62 | 전체 검증 범위 |

## 6. GraphRAG Core 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-GR-001 | EntityExtractor 기본 Entity 추출 | Sol-Bat schema 등록 | TD-SB-001 문서를 EntityExtractor에 입력 | 작물, 병해충, 증상, 관리작업 Entity가 추출된다 | P1 |
| TC-GR-002 | EntityResolver 정규화 | 동일 의미 Entity 후보 존재 | `토마토`, `tomato`, `토마토 작물` 입력 | 동일 canonical entity로 정규화된다 | P1 |
| TC-GR-003 | RelationExtractor Relation 추출 | Entity 추출 완료 | TD-SB-002 문서를 RelationExtractor에 입력 | 발생위험, 예방 Relation이 생성된다 | P1 |
| TC-GR-004 | EvidenceLinker Evidence 연결 | chunk와 relation 존재 | relation별 evidence linking 실행 | Relation과 Chunk/Evidence가 연결된다 | P1 |
| TC-GR-005 | GraphStore entity upsert | InMemoryGraphStore 준비 | 동일 Entity를 2회 upsert | 중복 생성 없이 갱신된다 | P1 |
| TC-GR-006 | GraphStore relation upsert | Entity 2개 존재 | Relation upsert 실행 | source/target/type이 유지되고 조회 가능하다 | P1 |
| TC-GR-007 | GraphStore traverse | Entity/Relation 그래프 존재 | 특정 Entity 기준 traverse 실행 | 연결 Entity, Relation, Evidence가 반환된다 | P1 |
| TC-GR-008 | GraphStore delete | Entity/Relation 존재 | Entity 삭제 실행 | 관련 Relation/Evidence 연결이 정리된다 | P2 |
| TC-GR-009 | ContextAssembler context 구성 | vector result와 graph result 존재 | context assemble 실행 | answer context에 chunk, evidence, citation이 포함된다 | P1 |
| TC-GR-010 | GraphRAGRetrieveNode 상태 반영 | workflow state 존재 | retrieve node 실행 | state에 retrieval_results, context, evidence가 저장된다 | P1 |

## 7. RAG Core / Source / IndexJob 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-RAG-001 | DocumentPipeline 정상 처리 | TD-GEN-001 준비 | Source content를 pipeline에 입력 | Document, Chunk, Metadata가 생성된다 | P1 |
| TC-RAG-002 | ParserRegistry provider 선택 | parser 등록 | content type별 parser 조회 | 등록된 parser가 반환된다 | P1 |
| TC-RAG-003 | TextNormalizer 한글/영문 정규화 | 혼합 텍스트 준비 | normalizer 실행 | 공백, 특수문자, 대소문자 정책이 적용된다 | P2 |
| TC-RAG-004 | Chunker chunk 생성 | 긴 본문 준비 | chunker 실행 | chunk size와 overlap 기준으로 분할된다 | P1 |
| TC-RAG-005 | MetadataEnricher 메타데이터 보강 | Source metadata 준비 | enrich 실행 | source_id, document_id, domain, created_at이 포함된다 | P1 |
| TC-RAG-006 | Source 등록 후 IndexJob 생성 | 관리자 API 준비 | Source 등록 후 IndexJob 실행 | IndexJob 상태가 QUEUED 또는 RUNNING으로 생성된다 | P1 |
| TC-RAG-007 | IndexJob 완료 상태 전이 | IndexJob 실행 중 | indexing 완료까지 상태 조회 | COMPLETED 상태와 처리 건수가 반환된다 | P1 |
| TC-RAG-008 | IndexJob 실패 상태 처리 | 오류 데이터 TD-ERR-001 준비 | 빈 content로 indexing 실행 | FAILED 상태와 오류 코드가 기록된다 | P1 |

## 8. Vector Store / Hybrid Retrieval 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-VR-001 | InMemoryVectorStore add | embedding 샘플 준비 | vector add 실행 | vector id와 metadata가 저장된다 | P1 |
| TC-VR-002 | InMemoryVectorStore search | vector 저장 완료 | 질의어로 search 실행 | 유사도 기준 결과가 반환된다 | P1 |
| TC-VR-003 | InMemoryVectorStore delete | vector 저장 완료 | vector delete 실행 | 삭제 후 검색 결과에서 제외된다 | P1 |
| TC-VR-004 | VectorStoreFactory provider registry | provider 등록 | provider name으로 store 생성 | 지정 provider store instance가 생성된다 | P1 |
| TC-VR-005 | FAISS Adapter 골격 생성 | adapter class 존재 | factory에서 FAISS provider 요청 | 미구현 기능은 명확한 오류 또는 stub 응답을 반환한다 | P2 |
| TC-VR-006 | PGVector Adapter 골격 생성 | adapter class 존재 | factory에서 PGVector provider 요청 | 설정 누락 시 명확한 오류를 반환한다 | P2 |
| TC-VR-007 | HybridRetriever vector+graph 결합 | vector/graph 데이터 존재 | Sol-Bat 질의로 hybrid search 실행 | vector score와 graph score가 병합된 결과가 반환된다 | P1 |
| TC-VR-008 | RetrievalRun 결과 기록 | retrieval 실행 | run/result 기록 확인 | query, strategy, elapsed_ms, result_count가 저장된다 | P1 |

## 9. 관리자 사이트/API 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-ADM-001 | Source 목록 조회 | Source 1건 이상 존재 | Source 목록 화면/API 호출 | 목록, 상태, 등록일, domain이 표시된다 | P1 |
| TC-ADM-002 | Source 등록 | admin 권한 | title, domain, content 입력 후 등록 | Source가 생성되고 목록에 표시된다 | P1 |
| TC-ADM-003 | Source 상세 조회 | Source 존재 | 상세 화면 진입 | 원문, metadata, indexing 상태가 표시된다 | P1 |
| TC-ADM-004 | Source Preview | indexing 완료 Source 존재 | Preview 탭 조회 | Chunk, Entity, Relation, Evidence preview가 표시된다 | P1 |
| TC-ADM-005 | Source 삭제 | admin 권한, Source 존재 | 삭제 실행 | Source와 관련 검색 대상 데이터가 삭제 또는 비활성화된다 | P2 |
| TC-ADM-006 | IndexJob 실행 | Source 존재 | IndexJob 실행 버튼 클릭/API 호출 | Job이 생성되고 상태가 표시된다 | P1 |
| TC-ADM-007 | IndexJob 상태 모니터링 | Job 실행 중 | 상태 조회 반복 | QUEUED/RUNNING/COMPLETED/FAILED 상태가 정상 표시된다 | P1 |
| TC-ADM-008 | IndexJob 실패 상세 | 실패 Job 존재 | 실패 상세 조회 | error_code, message, failed_step이 표시된다 | P1 |
| TC-ADM-009 | GraphRAG 검색 테스트 | indexing 완료 | 질의어 입력 후 검색 | 검색 결과, score, evidence, citation이 표시된다 | P1 |
| TC-ADM-010 | VectorMoon UX 기준 확인 | 관리자 화면 준비 | 목록/상세/모니터링 화면 확인 | 검색, 필터, 상태 배지, 액션 버튼 흐름이 일관된다 | P2 |

## 10. Agent 연계 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-AGT-001 | WorkflowDefinition 로딩 | workflow 정의 존재 | WorkflowFactory로 workflow 생성 | 정의된 node와 edge가 구성된다 | P1 |
| TC-AGT-002 | GraphRAGRetrieveNode 연계 | indexed data 존재 | agent state로 retrieve node 실행 | state에 context/evidence가 포함된다 | P1 |
| TC-AGT-003 | LLM Answer Node 골격 실행 | retrieve 결과 존재 | answer node 실행 | context 기반 answer placeholder 또는 stub 응답이 생성된다 | P2 |
| TC-AGT-004 | Structured Output Node 실행 | answer 결과 존재 | structured output node 실행 | 지정 schema 형식의 output이 반환된다 | P2 |
| TC-AGT-005 | AgentRun 결과 기록 | workflow 실행 | AgentRun 조회 | input, state, output, status, elapsed_ms가 기록된다 | P1 |

## 11. Sol-Bat 파일럿 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-SB-001 | Sol-Bat 도메인 스키마 등록 | SchemaRegistry 준비 | `sol_bat` schema 조회 | 작물, 병해충, 증상, 환경조건, 관리작업, 농자재, 지역, 생육단계 Entity가 포함된다 | P1 |
| TC-SB-002 | Sol-Bat Relation schema 확인 | SchemaRegistry 준비 | `sol_bat` relation type 조회 | 발생위험, 예방, 처방, 영향, 적용시기 Relation이 포함된다 | P1 |
| TC-SB-003 | P1 데이터 3건 Source 등록 | TD-SB-001~003 준비 | 샘플 Source 등록 | 3건 모두 등록되고 domain이 `sol_bat`으로 설정된다 | P1 |
| TC-SB-004 | P1 데이터 IndexJob 실행 | Source 3건 등록 | 각 Source indexing 실행 | 3건 모두 COMPLETED 상태가 된다 | P1 |
| TC-SB-005 | Sol-Bat Preview 검증 | indexing 완료 | Preview 조회 | Chunk/Entity/Relation/Evidence가 각 Source별 표시된다 | P1 |
| TC-SB-006 | Sol-Bat Hybrid 검색 성공 기준 | indexing 완료 | 병해충 예방/처방 질의 실행 | 3개 대표 질의 중 2개 이상 HIT, evidence coverage 70% 이상 | P1 |

## 12. 보안/권한/오류 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-SEC-001 | 미인증 요청 차단 | 인증 토큰 없음 | Source 등록 API 호출 | 401 Unauthorized가 반환된다 | P1 |
| TC-SEC-002 | viewer 등록 제한 | viewer 권한 | Source 등록 API 호출 | 403 Forbidden이 반환된다 | P1 |
| TC-SEC-003 | admin 등록 허용 | admin 권한 | Source 등록 API 호출 | Source가 생성된다 | P1 |
| TC-SEC-004 | scope 기반 Source 조회 | tenant/user scope 분리 | 다른 scope Source 조회 | 접근 불가 또는 빈 결과가 반환된다 | P1 |
| TC-SEC-005 | 잘못된 Source ID 조회 | TD-ERR-002 준비 | 존재하지 않는 Source 조회 | 404 not_found 오류가 반환된다 | P1 |
| TC-SEC-006 | 잘못된 retrieval strategy | strategy 오류 입력 | 검색 API 호출 | 400 validation_error가 반환된다 | P1 |
| TC-SEC-007 | 삭제 Source 검색 제한 | Source 삭제 완료 | 삭제 Source 기준 검색 | 검색 결과에서 제외된다 | P2 |
| TC-SEC-008 | 오류 응답 표준 형식 | 오류 케이스 발생 | response body 확인 | code, message, trace_id 또는 request_id가 포함된다 | P1 |

## 13. 성능/운영/품질 테스트 케이스

| TC ID | 테스트명 | 사전조건 | 절차 | 기대결과 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| TC-NFR-001 | Source indexing 처리 시간 | P1 데이터 준비 | 3건 indexing 실행 | 각 Source가 기준 시간 내 완료된다 | P2 |
| TC-NFR-002 | Hybrid Retrieval 응답 시간 | indexing 완료 | 대표 질의 10회 실행 | 평균 응답 시간이 기준 내 유지된다 | P2 |
| TC-NFR-003 | Preview 응답 시간 | indexing 완료 | Preview API 10회 호출 | 평균 응답 시간이 기준 내 유지된다 | P2 |
| TC-NFR-004 | 중복 IndexJob 방지 | 동일 Source job 실행 중 | 추가 job 실행 요청 | 중복 실행 방지 또는 명확한 정책 응답 | P1 |
| TC-NFR-005 | 로그/추적성 확인 | API 호출 | 로그 또는 run 기록 확인 | source_id, job_id, run_id, status가 추적된다 | P1 |
| TC-NFR-006 | 검색 품질 기준 | Sol-Bat 대표 질의 준비 | 질의별 결과 평가 | 상위 결과가 도메인 의도와 일치한다 | P1 |
| TC-NFR-007 | 근거 기반 답변 품질 | Agent 연계 준비 | Agent 질의 실행 | 답변에 evidence/citation이 포함되고 근거 없는 단정이 없다 | P1 |

## 14. End-to-End 시나리오

### 14.1 Source 등록부터 GraphRAG 검색까지

| 단계 | 수행 내용 | 기대결과 |
| --- | --- | --- |
| 1 | 관리자 사이트에서 Sol-Bat Source 등록 | Source ID 생성 |
| 2 | IndexJob 실행 | Job 상태가 RUNNING으로 변경 |
| 3 | IndexJob 상태 모니터링 | COMPLETED 상태 도달 |
| 4 | Source Preview 확인 | Chunk/Entity/Relation/Evidence 표시 |
| 5 | GraphRAG 검색 테스트 실행 | Hybrid 검색 결과와 evidence 표시 |
| 6 | Agent 실행 | 검색 context 기반 답변 생성 |

### 14.2 실패 Source 처리

| 단계 | 수행 내용 | 기대결과 |
| --- | --- | --- |
| 1 | 빈 content Source 등록 또는 indexing 실행 | validation_error 또는 IndexJob FAILED |
| 2 | 실패 Job 상세 조회 | failed_step, error_code, message 표시 |
| 3 | content 수정 후 재실행 | IndexJob 재실행 가능 |
| 4 | 재실행 완료 | COMPLETED 상태 도달 |

### 14.3 권한별 관리자 기능 접근

| 단계 | 수행 내용 | 기대결과 |
| --- | --- | --- |
| 1 | viewer 권한으로 Source 목록 조회 | 조회 가능 |
| 2 | viewer 권한으로 Source 등록 | 403 Forbidden |
| 3 | admin 권한으로 Source 등록 | 등록 성공 |
| 4 | 다른 scope Source 조회 | 접근 제한 |

## 15. 자동화 대상

| 자동화 우선순위 | 대상 | 자동화 방식 |
| --- | --- | --- |
| 1 | GraphRAG Core 단위 테스트 | pytest 기반 unit test |
| 1 | VectorStore/GraphStore add/search/delete | pytest 기반 unit/integration test |
| 1 | HybridRetriever / ContextAssembler | pytest 기반 integration test |
| 1 | Source/IndexJob API | FastAPI TestClient 기반 API test |
| 2 | 관리자 사이트 주요 화면 흐름 | Playwright 또는 브라우저 기반 E2E test |
| 2 | Sol-Bat 파일럿 회귀 테스트 | fixture 기반 pilot regression test |
| 3 | 성능 측정 | 반복 호출 스크립트 및 결과 리포트 |

## 16. 테스트 결과 기록 양식

| TC ID | 수행일 | 수행자 | 결과 | 결함 ID | 비고 |
| --- | --- | --- | --- | --- | --- |
| TC-GR-001 |  |  | PASS / FAIL / BLOCKED |  |  |
| TC-RAG-001 |  |  | PASS / FAIL / BLOCKED |  |  |
| TC-ADM-001 |  |  | PASS / FAIL / BLOCKED |  |  |
| TC-SB-001 |  |  | PASS / FAIL / BLOCKED |  |  |

## 17. 결함 등급 기준

| 등급 | 기준 | 예시 |
| --- | --- | --- |
| Critical | 핵심 흐름 전체 차단 | Source 등록 불가, IndexJob 전체 실패, 검색 불가 |
| Major | 주요 기능 일부 실패 | Evidence 누락, 권한 우회, Agent context 누락 |
| Minor | 보조 기능 또는 표시 오류 | 상태 배지 오표시, 메시지 문구 오류 |
| Trivial | 사용성 개선 또는 문서 보완 | 라벨 정렬, 도움말 문구 개선 |

## 18. 완료 기준

280.테스트 단계의 테스트시나리오 작성 완료 기준은 다음과 같다.

- GraphRAG Core, 관리자 사이트, Sol-Bat 파일럿, Source/IndexJob/Preview/Hybrid Retrieval, Agent 연계 테스트 케이스가 정의되어야 한다.
- 보안/권한/오류/성능/품질 검증 항목이 별도 테스트 케이스로 분리되어야 한다.
- End-to-End 업무 흐름과 실패 흐름이 포함되어야 한다.
- 자동화 우선순위와 결과 기록 양식이 포함되어야 한다.
- 다음 단계인 테스트 수행 및 결함 관리에 사용할 수 있는 수준의 식별자와 기대결과가 정의되어야 한다.

## 19. 다음 작업

테스트시나리오 작성 이후 다음 작업은 테스트 자동화 및 수행 준비이다.

권장 요청 문구는 다음과 같다.

```text
[QA/QA Automation Engineer] 280.테스트 단계의 테스트 자동화 기본 구조와 테스트 수행 결과서를 작성해 주세요. GraphRAG Core, VectorStore/GraphStore, HybridRetriever, Sol-Bat 파일럿 회귀 테스트를 포함해 주세요.
```
