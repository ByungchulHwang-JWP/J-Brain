# GraphRAG AI Agent 공통 프레임워크 Sol-Bat 파일럿 데이터 인덱싱 결과서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 270.파일럿 적용 |
| WBS | 7.4 파일럿 데이터 인덱싱 |
| 담당 | Data Engineer / GraphRAG Engineer |
| 대상 프로젝트 | Sol-Bat |
| 작성 목적 | Sol-Bat P1 파일럿 데이터 3건에 대해 Source 등록, IndexJob 실행, Chunk/Entity/Relation/Evidence Preview, Hybrid 검색 결과를 정리 |
| 작성일 | 2026-06-21 |

## 2. 인덱싱 실행 개요

| 항목 | 내용 |
| --- | --- |
| 실행 방식 | GraphRAG 공통 프레임워크 `AdminService` 기반 InMemory 인덱싱 |
| 실행 모듈 | `src/common_core/pilots/sol_bat_data_indexing.py` |
| Vector Store | `InMemoryVectorStore` |
| Graph Store | `InMemoryGraphStore` |
| Parser | TXT 직접 읽기, PDF는 `pypdf` 추출 텍스트 사용 |
| 검색 전략 | `HYBRID` |
| Source Scope | `GLOBAL` |

실행 명령:

```powershell
$env:PYTHONPATH='D:\Dev\codex\GitHub\GraphRAG-AI-Agnet\src'
python -m common_core.pilots.sol_bat_data_indexing
```

## 3. P1 대상 데이터

| 데이터 ID | 파일 | 유형 | 크기 | 비고 |
| --- | --- | --- | ---:| --- |
| DATA-01 | `Sol-Bat/doc/귀농 정착 지원을 위한 AI 농사코치 서비스 구축_프롬프트.txt` | TXT | 5,636 bytes | 농사코치 서비스 요구/지식 문맥 |
| DATA-02 | `Sol-Bat/test.txt` | TXT | 11 bytes | 최소 텍스트 smoke data |
| DATA-03 | `Sol-Bat/valid_test.pdf` | PDF | 1,418 bytes | PDF 추출 smoke data |

참고: `Sol-Bat/test.pdf`는 53 bytes로 실제 PDF 파싱 검증에 부적합하여 `valid_test.pdf`를 P1 PDF 데이터로 사용하였다.

## 4. Source 등록 및 IndexJob 실행 결과

| 데이터 ID | Source 등록 | IndexJob 상태 | Source 상태 | 문서 수 | Chunk 수 | Entity 수 | Relation 수 | Evidence 수 |
| --- | --- | --- | --- | ---:| ---:| ---:| ---:| ---:|
| DATA-01 | 성공 | COMPLETED | INDEXED | 1 | 4 | 53 | 102 | 4 |
| DATA-02 | 성공 | COMPLETED | INDEXED | 1 | 1 | 0 | 0 | 1 |
| DATA-03 | 성공 | COMPLETED | INDEXED | 1 | 1 | 0 | 0 | 1 |

## 5. Preview 결과

| 데이터 ID | Chunk Preview | Entity Preview | Relation Preview | Evidence Preview | 해석 |
| --- | ---:| ---:| ---:| ---:| --- |
| DATA-01 | 4 | 20 | 20 | 4 | 농업 도메인 용어가 포함되어 Entity/Relation/Evidence 추출 가능 |
| DATA-02 | 1 | 0 | 0 | 1 | `Hello world` smoke data로 Chunk/Evidence만 확인 |
| DATA-03 | 1 | 0 | 0 | 1 | PDF 추출 smoke data로 Chunk/Evidence만 확인 |

DATA-01은 작물, 병해충, 토양, 관리 등 도메인 용어를 포함하여 GraphRAG 구조화 결과가 생성되었다. DATA-02/03은 도메인 용어가 없는 최소 데이터이므로 Entity/Relation이 없는 것이 정상이다.

## 6. Hybrid 검색 결과

| 데이터 ID | 검색 질의 | 검색 상태 | 결과 수 | Vector 결과 | Graph Relation | Evidence | 대표 결과 |
| --- | --- | --- | ---:| ---:| ---:| ---:| --- |
| DATA-01 | 작물 병해충 토양 관리 농사코치 | HIT | 5 | 3 | 25 | 3 | `CROP:작물 HAS_RISK_OF PEST_DISEASE:병해충` |
| DATA-02 | Hello world | HIT | 1 | 1 | 0 | 5 | `Hello world` Chunk |
| DATA-03 | Hello World | HIT | 1 | 1 | 0 | 6 | `Hello World` Chunk |

## 7. DATA-01 상세 결과

DATA-01은 Sol-Bat 파일럿의 실질적인 도메인 검증 데이터로 사용 가능하다.

| 항목 | 결과 |
| --- | --- |
| Chunk 수 | 4 |
| Entity 수 | 53 |
| Relation 수 | 102 |
| Evidence 수 | 4 |
| Hybrid 검색 상태 | HIT |
| 대표 Relation | `HAS_RISK_OF`, `AFFECTS` |
| 대표 Entity | `CROP:작물`, `PEST_DISEASE:병해충`, `ENVIRONMENT_CONDITION:pH`, `MANAGEMENT_ACTION:관리` |

대표 검색 결과:

| Rank | Type | Score | Relation |
| ---:| --- | ---:| --- |
| 1 | RELATION | 0.285 | `CROP:작물 HAS_RISK_OF PEST_DISEASE:병` |
| 2 | RELATION | 0.285 | `CROP:작물 HAS_RISK_OF PEST_DISEASE:병해충` |
| 3 | RELATION | 0.285 | `CROP:작물 HAS_RISK_OF PEST_DISEASE:해충` |

## 8. 실행 중 확인 사항

| 항목 | 내용 | 조치 |
| --- | --- | --- |
| 한글 inline script 질의 | PowerShell 파이프 방식에서 한글 질의가 `???`로 전달되는 현상 확인 | 실행 모듈 파일에 UTF-8 문자열을 저장하여 재현성 확보 |
| PDF warning | `valid_test.pdf` 처리 시 `incorrect startxref pointer`, `parsing for Object Streams` 경고 출력 | 텍스트 추출은 성공, 운영 PDF 검증 시 정식 PDF 샘플 필요 |
| DATA-02/03 Entity 없음 | 도메인 용어가 없는 smoke data | 정상 결과로 판정 |
| Evidence count가 검색별 누적처럼 보임 | InMemoryGraphStore에 이전 Source Evidence가 남아 검색 Evidence count가 Source별보다 크게 보일 수 있음 | 운영 adapter에서 source filter 기반 Evidence 조회 보완 필요 |

## 9. 성공 기준 충족 여부

| 성공 기준 | 결과 | 판정 |
| --- | --- | --- |
| P1 데이터 3건 Source 등록 | 3건 성공 | 충족 |
| 각 Source IndexJob COMPLETED | 3건 COMPLETED | 충족 |
| Chunk Preview 조회 | 3건 조회 | 충족 |
| Entity/Relation/Evidence 추출 | DATA-01에서 Entity/Relation/Evidence 추출, DATA-02/03 Evidence 생성 | 충족 |
| HYBRID 검색 HIT/PARTIAL_HIT | 3건 HIT | 충족 |
| Source metadata 유지 | source_key, file_path, file_type, pilot_stage 유지 | 충족 |

## 10. 산출물 및 소스

| 구분 | 파일 |
| --- | --- |
| 실행 모듈 | `src/common_core/pilots/sol_bat_data_indexing.py` |
| 적용 범위 정의서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_적용범위정의서.md` |
| 도메인 스키마 정의서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_도메인스키마정의서.md` |
| 검색 노드 적용 결과서 | `GraphRAG_AI_Agent_공통프레임워크_Sol-Bat파일럿_GraphRAG검색노드적용결과서.md` |
| 데이터 인덱싱 결과서 | 본 문서 |

## 11. 결론

Sol-Bat P1 파일럿 데이터 3건은 GraphRAG 공통 프레임워크의 Source 등록, IndexJob 실행, Preview, Hybrid 검색 흐름으로 인덱싱 및 검증되었다.

DATA-01은 농업 도메인 지식 검증 데이터로 적합하며 Entity/Relation/Evidence가 정상 생성되었다. DATA-02/03은 도메인 의미 검증보다는 TXT/PDF smoke data로 유지하는 것이 적절하다.

## 12. 다음 작업

다음 작업은 WBS 기준 `7.5 파일럿 동작 확인 및 결과 정리`이다.

권장 요청 문구:

```text
[QA/Domain Expert] 270.파일럿 적용 단계의 Sol-Bat 파일럿 동작 확인 및 결과서를 작성해 주세요. 파일럿 적용 범위, 도메인 스키마, GraphRAG 검색 노드, 데이터 인덱싱 결과를 종합하고 성공 기준 충족 여부, 결함/보완사항, 다음 단계 권고안을 포함해 주세요.
```
