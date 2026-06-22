# GraphRAG AI Agent 공통 프레임워크 Sol-Bat 파일럿 동작 확인 및 결과서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 270.파일럿 적용 |
| WBS | 7.5 파일럿 동작 확인 및 결과 정리 |
| 담당 | QA / Domain Expert |
| 대상 프로젝트 | Sol-Bat |
| 작성 목적 | Sol-Bat 파일럿 적용 범위, 도메인 스키마, GraphRAG 검색 노드, 데이터 인덱싱 결과를 종합 검토하고 성공 기준 충족 여부와 보완사항을 정리 |
| 작성일 | 2026-06-21 |

## 2. 검토 대상 산출물

| WBS | 산출물 | 검토 결과 |
| --- | --- | --- |
| 7.1 | Sol-Bat 파일럿 적용 범위 정의서 | 검토 완료 |
| 7.2 | Sol-Bat 파일럿 도메인 스키마 정의서 | 검토 완료 |
| 7.3 | Sol-Bat 파일럿 GraphRAG 검색 노드 적용 결과서 | 검토 완료 |
| 7.4 | Sol-Bat 파일럿 데이터 인덱싱 결과서 | 검토 완료 |

## 3. 파일럿 범위 확인

| 범위 | 계획 | 결과 | 판정 |
| --- | --- | --- | --- |
| Source 등록 | P1 데이터 3건 등록 | 3건 등록 성공 | 통과 |
| IndexJob 실행 | 각 Source 인덱싱 | 3건 `COMPLETED` | 통과 |
| Preview | Chunk/Entity/Relation/Evidence 확인 | 3건 Preview 확인 | 통과 |
| Hybrid Retrieval | Vector + Graph 검색 | 3건 `HIT` | 통과 |
| Agent 연계 PoC | Sol-Bat state를 GraphRAG context로 변환 | `retrieve_knowledge_with_graphrag` PoC 구성 및 검증 | 통과 |
| 기존 Sol-Bat RAG 완전 대체 | 제외 | 병행 검증 유지 | 계획 부합 |
| 운영 DB/Queue 전환 | 제외 | InMemory 기반 PoC 유지 | 계획 부합 |

## 4. 도메인 스키마 검토

### 4.1 Entity Type

| Entity Type | 한글명 | 판정 |
| --- | --- | --- |
| `CROP` | 작물 | 적합 |
| `PEST_DISEASE` | 병해충 | 적합 |
| `SYMPTOM` | 증상 | 적합 |
| `ENVIRONMENT_CONDITION` | 환경조건 | 적합 |
| `MANAGEMENT_ACTION` | 관리작업 | 적합 |
| `AGRI_MATERIAL` | 농자재 | 적합 |
| `REGION` | 지역 | 적합 |
| `GROWTH_STAGE` | 생육단계 | 적합 |

### 4.2 Relation Type

| Relation Type | 한글명 | 판정 |
| --- | --- | --- |
| `HAS_RISK_OF` | 발생위험 | 적합 |
| `PREVENTS` | 예방 | 적합 |
| `TREATS` | 처방 | 적합 |
| `AFFECTS` | 영향 | 적합 |
| `APPLIES_AT` | 적용시기 | 적합 |

### 4.3 도메인 전문가 검토 의견

- Sol-Bat 1차 파일럿 목적에는 현재 8개 Entity와 5개 Relation 구성이 충분하다.
- 병해충 도메인을 운영 수준으로 확장할 경우 `PEST_DISEASE`를 병, 해충, 생리장해로 세분화하는 방안을 검토한다.
- `ENVIRONMENT_CONDITION`은 현재 기상/토양 조건을 함께 담고 있으나, 운영 단계에서는 `WEATHER_CONDITION`, `SOIL_CONDITION` 분리도 고려할 수 있다.
- 농자재 처방은 안전성과 법적 책임 이슈가 있으므로 운영 답변에서는 “근거 제시 및 전문가 확인 권고” 문구가 필요하다.

## 5. GraphRAG 검색 노드 PoC 검토

| 항목 | 결과 | 판정 |
| --- | --- | --- |
| `SchemaRegistry` Sol-Bat 스키마 보완 | `1.1.0-pilot` 반영 | 통과 |
| `RelationExtractor` keyword rule 보완 | 5개 Relation Type 기준 반영 | 통과 |
| 한글 검색 토큰화 | `InMemoryVectorStore` 토큰화 보완 | 통과 |
| 샘플 Source 인덱싱 | 토마토/고추 샘플 2건 | 통과 |
| HybridRetriever 검색 | HYBRID 검색 `HIT` | 통과 |
| Agent state adapter | `build_sol_bat_retrieval_query`, `retrieve_knowledge_with_graphrag` 구성 | 통과 |
| 테스트 | 직접 호출 검증 통과 | 통과 |

## 6. 데이터 인덱싱 결과 검토

| 데이터 ID | 파일 | IndexJob | Chunk | Entity | Relation | Evidence | Hybrid 검색 | 판정 |
| --- | --- | --- | ---:| ---:| ---:| ---:| --- | --- |
| DATA-01 | 농사코치 프롬프트 TXT | COMPLETED | 4 | 53 | 102 | 4 | HIT | 통과 |
| DATA-02 | `test.txt` | COMPLETED | 1 | 0 | 0 | 1 | HIT | 통과 |
| DATA-03 | `valid_test.pdf` | COMPLETED | 1 | 0 | 0 | 1 | HIT | 통과 |

DATA-01은 실제 도메인 검증 데이터로 적합하며, Entity/Relation/Evidence가 충분히 생성되었다. DATA-02와 DATA-03은 도메인 의미 검증보다는 TXT/PDF 파이프라인 smoke data로 적합하다.

## 7. 성공 기준 충족 여부

| 성공 기준 | 목표 | 결과 | 판정 |
| --- | --- | --- | --- |
| SUC-01 | P1 데이터 3건 이상 Source 등록 | 3건 등록 | 충족 |
| SUC-02 | 각 Source IndexJob COMPLETED | 3건 COMPLETED | 충족 |
| SUC-03 | Source별 Chunk Preview 조회 | 3건 조회 | 충족 |
| SUC-04 | Entity/Relation/Evidence 중 최소 1개 이상 추출 | DATA-01 Entity/Relation/Evidence 추출, DATA-02/03 Evidence 추출 | 충족 |
| SUC-05 | HYBRID 검색 HIT 또는 PARTIAL_HIT | 3건 HIT | 충족 |
| SUC-06 | 검색 결과에 source_id, chunk_id, score, evidence 중 2개 이상 포함 | 검색 결과 metadata/score 확인 | 충족 |
| SUC-07 | 기존 RAG 대비 GraphRAG 구조 검토 | 병행 검증 방향 및 adapter 정의 | 부분 충족 |
| SUC-08 | Agent 연계 PoC에서 GraphRAG context state 반영 | PoC adapter 검증 | 충족 |

## 8. 결함 및 보완사항

| ID | 구분 | 내용 | 영향 | 권고 조치 | 우선순위 |
| --- | --- | --- | --- | --- | --- |
| DEF-01 | 데이터 | `test.pdf`는 53 bytes로 PDF 검증에 부적합 | PDF 테스트 신뢰도 저하 | `valid_test.pdf` 또는 실제 농업 PDF로 대체 유지 | P1 |
| DEF-02 | 데이터 | DATA-02/03은 도메인 용어가 없어 Entity/Relation 검증 불가 | 도메인 품질 검증 제한 | P2 데이터로 실제 농업 TXT/PDF 추가 | P1 |
| DEF-03 | 검색 | InMemoryGraphStore Evidence count가 Source별보다 크게 보일 수 있음 | 운영 결과 해석 혼선 | source filter 기반 Evidence 조회 보완 | P1 |
| DEF-04 | 실행환경 | PowerShell inline script에서 한글 질의가 `???`로 전달될 수 있음 | 수동 검증 재현성 저하 | UTF-8 파일 기반 실행 모듈 사용 유지 | P2 |
| DEF-05 | 운영구조 | PoC는 InMemory 기반이며 Supabase/PGVector 연동 미검증 | 운영 전환 리스크 | PGVector/GraphStore adapter 기반 통합 테스트 추가 | P1 |
| DEF-06 | 도메인 | 농자재/방제 처방은 안전성·책임 이슈 존재 | 서비스 품질/법적 리스크 | 답변 안전 문구, 전문가 확인, 출처 표시 정책 추가 | P1 |
| DEF-07 | Agent | Sol-Bat 원본 `src/nodes.py`에는 아직 직접 반영하지 않음 | 실제 서비스 미연동 | 병행 모드 feature flag로 단계적 연결 | P2 |

## 9. 품질 판단

| 품질 항목 | 판단 | 근거 |
| --- | --- | --- |
| 기능 적합성 | 적합 | Source 등록, IndexJob, Preview, Hybrid 검색, Agent PoC 모두 동작 |
| 도메인 적합성 | 조건부 적합 | DATA-01은 적합, DATA-02/03은 smoke data 수준 |
| 검색 품질 | 조건부 적합 | HYBRID HIT 확인, 실제 농업 질의 세트 확대 필요 |
| 운영성 | 보완 필요 | InMemory 기반으로 운영 DB/Queue 검증 전 |
| 추적성 | 적합 | Source metadata, score, relation, evidence 확인 가능 |
| 안전성 | 보완 필요 | 농자재/방제 처방의 안전 문구와 검증 정책 필요 |

## 10. 최종 판정

| 항목 | 판정 |
| --- | --- |
| 파일럿 1차 성공 기준 | 충족 |
| 운영 적용 가능 여부 | 조건부 가능 |
| 다음 단계 진입 여부 | 가능 |
| 전제 조건 | 운영 DB/VectorStore/GraphStore adapter 검증, 실제 농업 PDF/TXT 데이터 확장, Agent 병행 연계 설계 |

QA/Domain Expert 최종 의견:

Sol-Bat 파일럿은 GraphRAG 공통 프레임워크의 핵심 흐름을 검증하는 1차 목적을 달성하였다. 특히 DATA-01에서 Entity/Relation/Evidence가 생성되고 HYBRID 검색이 HIT로 확인되어, 기존 RAG를 GraphRAG 구조로 확장할 가능성이 확인되었다.

다만 운영 적용 전에는 실제 농업 문서 데이터 확대, Source별 Evidence 필터링 보완, PGVector/GraphStore adapter 검증, Sol-Bat 원본 Agent node와의 병행 연계가 필요하다. 따라서 파일럿은 “성공, 단 운영 적용 전 보완 필요”로 판정한다.

## 11. 다음 단계 권고안

### 11.1 단기 권고

| 우선순위 | 권고안 | 담당 |
| --- | --- | --- |
| P1 | Source별 Evidence 조회 필터 보완 | GraphRAG Engineer |
| P1 | 실제 농업 TXT/PDF 5건 이상으로 P2 인덱싱 확장 | Data Engineer |
| P1 | PGVector/GraphStore adapter 기준 통합 검증 | Backend Engineer / Data Engineer |
| P1 | 농자재/방제 답변 안전 문구와 출처 표시 정책 정의 | Domain Expert / 기획자 |
| P2 | Sol-Bat `retrieve_knowledge`에 feature flag 기반 GraphRAG 병행 연계 | Backend Engineer |
| P2 | 기존 Sol-Bat RAG와 GraphRAG 검색 품질 비교표 작성 | QA / GraphRAG Engineer |

### 11.2 다음 WBS 권고

7.0 파일럿 적용 단계는 7.1~7.5 산출물 작성 및 PoC 검증이 완료되었으므로, 다음 PM 작업에서 WBS를 갱신하고 GitHub에 반영하는 것을 권장한다.

권장 요청 문구:

```text
[PM] 270.파일럿 적용 단계 산출물 검토 및 확정 문서를 작성하고 WBS에 7.1~7.5 완료 상태를 반영해 주세요. 그리고 현재까지 작업한 파일을 GitHub에 업데이트해 주세요.
```
