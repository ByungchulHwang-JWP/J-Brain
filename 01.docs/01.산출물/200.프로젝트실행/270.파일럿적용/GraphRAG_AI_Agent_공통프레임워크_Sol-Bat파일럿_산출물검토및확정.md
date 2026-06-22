# GraphRAG AI Agent 공통 프레임워크 Sol-Bat 파일럿 산출물 검토 및 확정

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 270.파일럿 적용 |
| WBS | 7.1~7.5 파일럿 적용 단계 산출물 검토 및 확정 |
| 담당 | PM |
| 검토 목적 | Sol-Bat 파일럿 적용 단계의 산출물, PoC 소스, 검증 결과를 종합 검토하고 다음 테스트 단계 진입 여부를 확정 |
| 작성일 | 2026-06-21 |

## 2. 검토 대상 산출물

| WBS | 산출물 | 파일 | 검토 결과 |
| --- | --- | --- | --- |
| 7.1 | Sol-Bat 파일럿 적용 범위 정의서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_적용범위정의서.md` | 승인 |
| 7.2 | Sol-Bat 파일럿 도메인 스키마 정의서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_도메인스키마정의서.md` | 승인 |
| 7.3 | Sol-Bat 파일럿 GraphRAG 검색 노드 적용 결과서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_GraphRAG검색노드적용결과서.md` | 승인 |
| 7.4 | Sol-Bat 파일럿 데이터 인덱싱 결과서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_데이터인덱싱결과서.md` | 승인 |
| 7.5 | Sol-Bat 파일럿 동작 확인 및 결과서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_동작확인및결과서.md` | 승인 |

## 3. PoC 소스 검토

| 구분 | 파일 | 검토 결과 |
| --- | --- | --- |
| Sol-Bat 파일럿 Runtime | `src/common_core/pilots/sol_bat.py` | 승인 |
| P1 데이터 인덱싱 Runner | `src/common_core/pilots/sol_bat_data_indexing.py` | 승인 |
| Sol-Bat 스키마 | `src/common_core/ai_pipeline/graphrag/schema_registry.py` | 승인 |
| Relation keyword rule | `src/common_core/ai_pipeline/graphrag/relation_extractor.py` | 승인 |
| 한글 검색 토큰화 | `src/common_core/ai_pipeline/vectorstores/in_memory.py` | 승인 |
| 파일럿 테스트 | `tests/test_sol_bat_pilot.py`, `tests/test_extractors.py` | 승인 |

## 4. 파일럿 성공 기준 검토

| 성공 기준 | 결과 | 판정 |
| --- | --- | --- |
| P1 데이터 3건 Source 등록 | 3건 등록 성공 | 충족 |
| IndexJob 완료 | 3건 `COMPLETED` | 충족 |
| Chunk Preview 조회 | 3건 조회 성공 | 충족 |
| Entity/Relation/Evidence 추출 | DATA-01에서 Entity 53, Relation 102, Evidence 4 생성 | 충족 |
| HYBRID 검색 | 3건 모두 `HIT` | 충족 |
| Agent 연계 PoC | `retrieve_knowledge_with_graphrag` adapter 구성 및 검증 | 충족 |
| 기존 Sol-Bat 기능 영향 최소화 | 원본 Sol-Bat 직접 변경 없이 공통 프레임워크 PoC로 병행 검증 | 충족 |

## 5. 검증 결과

| 검증 항목 | 결과 |
| --- | --- |
| `python -m compileall src tests` | 통과 |
| `python -m common_core.pilots.sol_bat_data_indexing` | P1 3건 인덱싱 및 검색 HIT 확인 |
| `test_sol_bat_pilot` 직접 호출 | 통과 |
| `test_extractors` 직접 호출 | 통과 |
| `git diff --check` | 통과 |

참고: 현재 로컬 런타임에 `pytest`가 설치되어 있지 않아 `pytest` 명령 전체 실행은 수행하지 못했다. 대신 관련 테스트 함수 직접 호출과 컴파일 검증으로 대체하였다.

## 6. 결함 및 보완사항

| ID | 보완사항 | 우선순위 | 후속 단계 |
| --- | --- | --- | --- |
| PILOT-DEF-01 | Source별 Evidence 조회 필터 보완 | P1 | 8.0 테스트 또는 후속 구현 |
| PILOT-DEF-02 | 실제 농업 TXT/PDF 데이터 확대 | P1 | 8.0 테스트 데이터 보강 |
| PILOT-DEF-03 | PGVector/GraphStore adapter 통합 검증 | P1 | 8.0 통합 테스트 |
| PILOT-DEF-04 | 농자재/방제 답변 안전 문구와 출처 표시 정책 정의 | P1 | 8.0 품질/도메인 검증 |
| PILOT-DEF-05 | Sol-Bat 원본 `retrieve_knowledge` feature flag 병행 연계 | P2 | 후속 구현 |
| PILOT-DEF-06 | `valid_test.pdf` 경고 없는 실제 PDF 샘플 확보 | P2 | 테스트 데이터 정비 |

## 7. PM 확정 의견

Sol-Bat 파일럿 적용 단계는 계획한 7.1~7.5 산출물과 PoC 검증을 모두 완료하였다. GraphRAG 공통 프레임워크의 Source 등록, IndexJob, Preview, Hybrid Retrieval, Agent 연계 adapter가 Sol-Bat 도메인에 적용 가능함을 확인하였다.

다만 본 파일럿은 InMemory 기반 PoC이며 운영 DB/Queue/PGVector/GraphStore adapter에 대한 통합 검증은 아직 남아 있다. 따라서 파일럿 단계는 완료로 확정하되, 운영 적용 전 보완사항을 8.0 테스트 단계의 주요 검증 항목으로 이관한다.

## 8. 다음 단계 진입 기준

| 기준 | 결과 |
| --- | --- |
| 파일럿 범위 확정 | 완료 |
| 도메인 스키마 정의 | 완료 |
| GraphRAG 검색 노드 PoC | 완료 |
| P1 데이터 인덱싱 | 완료 |
| 파일럿 동작 확인 | 완료 |
| 테스트 단계 진입 | 가능 |

## 9. 다음 작업

다음 작업은 WBS 기준 `8.1 테스트계획서 작성`이다.

권장 요청 문구:

```text
[QA] 280.테스트 단계의 테스트계획서를 작성해 주세요. GraphRAG Core, 관리자 사이트, Sol-Bat 파일럿, Source/IndexJob/Preview/Hybrid Retrieval, Agent 연계, 보안/권한/오류/성능/품질 검증 범위를 포함해 주세요.
```
