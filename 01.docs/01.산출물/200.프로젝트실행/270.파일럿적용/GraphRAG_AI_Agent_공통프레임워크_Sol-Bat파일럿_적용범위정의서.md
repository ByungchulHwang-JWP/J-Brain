# GraphRAG AI Agent 공통 프레임워크 Sol-Bat 파일럿 적용 범위 정의서

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 270.파일럿 적용 |
| WBS | 7.1 Sol-Bat 적용 범위 선정 |
| 담당 | PM / Product Owner |
| 대상 프로젝트 | `Sol-Bat` |
| 작성 목적 | GraphRAG AI Agent 공통 프레임워크를 Sol-Bat에 1차 파일럿으로 적용하기 위한 대상 기능, 시나리오, 데이터, 성공 기준을 확정 |
| 작성일 | 2026-06-21 |

## 2. 파일럿 추진 목적

Sol-Bat은 AI 농사 코치 서비스로, 날씨/토양/병해충 데이터와 농업 지식베이스를 결합하여 농가에 맞춤형 조언을 제공한다. 현재 Sol-Bat에는 RAG 기반 지식 검색, 문서 업로드, 농업 데이터 연계, LangGraph 기반 Agent 흐름이 이미 존재한다.

이번 파일럿은 Sol-Bat의 기존 RAG 기능을 전면 교체하는 것이 아니라, GraphRAG 공통 프레임워크의 핵심 기능을 제한된 범위에 적용하여 다음을 검증하는 것을 목적으로 한다.

- Source 등록 및 IndexJob 실행 흐름이 실제 Sol-Bat 농업 문서에 적용 가능한지 확인
- 농업 도메인 Entity/Relation/Evidence 추출 구조가 실효성 있는지 확인
- 기존 Sol-Bat RAG 검색을 GraphRAG Hybrid Retrieval로 확장할 수 있는지 확인
- Agent 답변에 근거 문서, Entity, Relation, Evidence를 연결할 수 있는지 확인

## 3. Sol-Bat 현행 구조 요약

| 구분 | 현행 파일/기능 | 설명 |
| --- | --- | --- |
| RAG Manager | `Sol-Bat/src/rag/rag_manager.py` | PGVector 기반 지식 검색, 문서 추가, 청크 조회, 삭제 |
| 문서 Parser | `Sol-Bat/src/rag/parsers.py` | HWP, Excel 등 일부 문서 파서 |
| 문서 Ingest | `Sol-Bat/src/rag/ingest.py` | `doc` 폴더 문서 인덱싱 |
| Agent Node | `Sol-Bat/src/nodes.py` | `retrieve_knowledge`, `farm_agent_node`를 통한 RAG 기반 조언 생성 |
| KB Upload API | `Sol-Bat/app/api.py` `/kb/upload` | 파일 업로드, 파싱, 청킹, 벡터 저장, KB metadata 저장 |
| KB Documents API | `Sol-Bat/app/api.py` `/kb/documents` | 접근 가능한 지식 문서 목록 조회 |
| KB Chunks API | `Sol-Bat/app/api.py` `/kb/documents/{doc_id}/chunks` | 문서별 청크 조회 |
| Chat API | `Sol-Bat/app/api.py` | 사용자 질문에 RAG 지식베이스 내용 추가 |
| 외부 연계 | KMA, Soil/Nongsaro, NPMS | 날씨, 토양, 병해충 데이터 연계 |

## 4. 파일럿 적용 범위

### 4.1 적용 대상 기능

| 범위 ID | 적용 기능 | 적용 수준 | 설명 |
| --- | --- | --- | --- |
| PILOT-FN-01 | Source 등록 | 적용 | Sol-Bat 농업 문서를 GraphRAG Source로 등록 |
| PILOT-FN-02 | IndexJob 실행 | 적용 | 문서 파싱, 청킹, 벡터 저장, Entity/Relation/Evidence 추출 |
| PILOT-FN-03 | Source Preview | 적용 | Chunk, Entity, Relation, Evidence 결과 확인 |
| PILOT-FN-04 | Hybrid Retrieval | 적용 | Sol-Bat 질의에 Vector + Graph 검색 결과 결합 |
| PILOT-FN-05 | Agent 검색 노드 연계 | 적용 | `retrieve_knowledge` 흐름에 GraphRAG 검색 결과를 연결하는 PoC |
| PILOT-FN-06 | 관리자 사이트 검증 | 적용 | 관리자 MVP에서 Source 등록, IndexJob, Preview, 검색 테스트 수행 |
| PILOT-FN-07 | 기존 KB 업로드 API 완전 대체 | 제외 | 1차 파일럿에서는 병행 적용, 전면 대체는 후속 과제 |
| PILOT-FN-08 | 운영 DB/Queue 완전 전환 | 제외 | InMemory/Adapter 기반 검증 후 후속 전환 |
| PILOT-FN-09 | 외부 API 실시간 품질 검증 | 제외 | KMA/NPMS/토양 API 자체 검증은 Sol-Bat 기존 범위로 유지 |

### 4.2 적용 대상 코드 후보

| 후보 | 적용 방향 |
| --- | --- |
| `src/rag/rag_manager.py` | 기존 `search` 결과와 GraphRAG HybridRetriever 결과 비교 |
| `src/nodes.py` `retrieve_knowledge` | GraphRAG 검색 노드 연계 후보 |
| `app/api.py` `/kb/upload` | Source 등록/IndexJob API로 전환 가능한 대상 |
| `app/api.py` `/kb/documents`, `/kb/documents/{doc_id}/chunks` | Source 목록/Preview API와 매핑 |
| `doc/*`, `test.txt`, `test.pdf`, `valid_test.pdf` | 파일럿 샘플 데이터 후보 |

## 5. 대상 데이터

### 5.1 1차 파일럿 데이터

| 데이터 ID | 데이터 | 유형 | 용도 | 우선순위 |
| --- | --- | --- | --- | --- |
| DATA-01 | `Sol-Bat/doc/귀농 정착 지원을 위한 AI 농사코치 서비스 구축_프롬프트.txt` | TXT | 농사 코치 서비스 지식/요구 맥락 검증 | P1 |
| DATA-02 | `Sol-Bat/test.txt` | TXT | 최소 인덱싱/검색 smoke test | P1 |
| DATA-03 | `Sol-Bat/test.pdf` 또는 `Sol-Bat/valid_test.pdf` | PDF | PDF 파싱/Chunk Preview 검증 | P1 |
| DATA-04 | `Sol-Bat/doc/ai_농사코치_최신_figma_실전_ui_시안.md` | Markdown | UI/서비스 설명 문서 검색 검증 | P2 |
| DATA-05 | `Sol-Bat/doc/npms_api_manual/*` | HWP/XLSX/PPTX/API sample | 병해충 도메인 확장 검증 | P2 |
| DATA-06 | 주간농사정보 PDF 다운로드 결과 | PDF | 실제 농업 정보 데이터 검증 | P2 |

### 5.2 데이터 범위 제한

1차 파일럿에서는 대용량 전체 `doc` 폴더를 한 번에 인덱싱하지 않는다. 우선 P1 데이터 3건으로 Source 등록, IndexJob, Preview, Hybrid Retrieval 흐름을 검증한 뒤 P2 데이터로 확장한다.

## 6. 파일럿 시나리오

### 6.1 관리자 기반 인덱싱 시나리오

| 시나리오 ID | 시나리오 | 절차 | 기대 결과 |
| --- | --- | --- | --- |
| SCN-01 | TXT Source 등록 | 관리자 MVP에서 `test.txt` 또는 농사코치 프롬프트 문서 등록 | Source 상태 REGISTERED |
| SCN-02 | IndexJob 실행 | 등록된 Source로 IndexJob 생성/실행 | COMPLETED, chunk/entity/relation/evidence count 생성 |
| SCN-03 | Preview 확인 | Source Preview 조회 | Chunk, Entity, Relation, Evidence 탭에서 결과 확인 |
| SCN-04 | Hybrid 검색 테스트 | "토마토 병해충 예방", "습도 높을 때 방제", "토양 pH 관리" 질의 실행 | HYBRID 검색 결과와 Evidence 반환 |

### 6.2 Sol-Bat RAG 비교 시나리오

| 시나리오 ID | 시나리오 | 절차 | 기대 결과 |
| --- | --- | --- | --- |
| SCN-05 | 기존 RAG 검색 비교 | `rag_manager.search`와 GraphRAG HybridRetriever에 동일 질의 입력 | 기존 결과 대비 출처/근거 구조가 더 명확 |
| SCN-06 | Source filter 검증 | 특정 Source ID로 검색 필터 적용 | 선택한 문서 범위의 결과만 반환 |
| SCN-07 | 공용/개인 지식 범위 검토 | PUBLIC/GLOBAL, PRIVATE/USER 범위 매핑 | 접근 범위 설계 보완점 도출 |

### 6.3 Agent 연계 시나리오

| 시나리오 ID | 시나리오 | 절차 | 기대 결과 |
| --- | --- | --- | --- |
| SCN-08 | `retrieve_knowledge` 연계 PoC | Sol-Bat Agent 상태의 작물, 지역, 생육단계, 위험요소로 GraphRAG 검색 질의 생성 | Agent context에 GraphRAG 검색 결과 포함 |
| SCN-09 | 근거 기반 조언 검증 | Agent 답변에 Evidence quote와 Source metadata 연결 | 답변 근거 확인 가능 |
| SCN-10 | 실패 시 fallback | GraphRAG 검색 실패 또는 결과 없음 | 기존 RAG 또는 기본 규칙 기반 조언으로 fallback |

## 7. 성공 기준

### 7.1 기능 성공 기준

| 기준 ID | 성공 기준 | 측정 방법 |
| --- | --- | --- |
| SUC-01 | P1 데이터 3건 이상 Source 등록 성공 | Source 목록 확인 |
| SUC-02 | 각 Source의 IndexJob COMPLETED | IndexJob 상태 및 단계 타임라인 확인 |
| SUC-03 | Source별 Chunk Preview 조회 가능 | Preview API/관리자 화면 확인 |
| SUC-04 | Entity/Relation/Evidence 중 최소 1개 이상 추출 | Preview metrics 확인 |
| SUC-05 | HYBRID 검색 테스트가 HIT 또는 PARTIAL_HIT 반환 | RetrievalResponse status 확인 |
| SUC-06 | 검색 결과에 source_id, chunk_id, score, evidence 중 2개 이상 포함 | Retrieval result 확인 |
| SUC-07 | Sol-Bat 기존 RAG 검색과 GraphRAG 검색 결과 비교표 작성 | 파일럿 적용 결과서 |
| SUC-08 | Agent 연계 PoC에서 GraphRAG context가 state에 반영 | `retrieve_knowledge` PoC 결과 확인 |

### 7.2 품질 성공 기준

| 기준 ID | 성공 기준 | 목표 |
| --- | --- | --- |
| Q-SUC-01 | 검색 질의 5건 중 3건 이상 관련 문맥 반환 | 60% 이상 |
| Q-SUC-02 | 근거 문서/청크를 운영자가 확인 가능 | 100% |
| Q-SUC-03 | 인덱싱 실패 시 실패 단계와 오류 메시지 확인 가능 | 100% |
| Q-SUC-04 | 기존 Sol-Bat 기능을 중단하지 않고 병행 검증 가능 | 100% |

## 8. 제외 범위

| 제외 항목 | 제외 사유 | 후속 단계 |
| --- | --- | --- |
| Sol-Bat 전체 RAG 기능 완전 교체 | 1차 파일럿 리스크가 큼 | 7.5 결과 검토 후 결정 |
| 운영 Supabase/PGVector 데이터 이관 | 데이터 손상 위험 | 백업/이관 계획 수립 후 수행 |
| 전체 문서 대량 인덱싱 | 파서/토큰/성능 검증 전 과도함 | P1 성공 후 P2 확장 |
| 실시간 외부 API 품질 평가 | GraphRAG 파일럿의 직접 목적 아님 | 별도 연계 테스트 |
| UI 전체 개편 | 파일럿은 검색/인덱싱 검증 중심 | 관리자/서비스 UX 개선 단계 |

## 9. 역할 및 책임

| 역할 | 책임 |
| --- | --- |
| PM/Product Owner | 파일럿 범위 승인, 성공 기준 확정 |
| Domain Expert | 농업 질의/정답 후보 검토 |
| Knowledge Engineer | Sol-Bat Entity/Relation 후보 정의 |
| GraphRAG Engineer | GraphRAG 검색/Agent 연계 설계 |
| Backend Engineer | Sol-Bat API/RAG 연계 PoC 구현 |
| Data Engineer | 파일럿 데이터 등록/인덱싱 수행 |
| QA | 파일럿 시나리오 검증 및 결과 정리 |

## 10. 파일럿 산출물

| WBS | 산출물 | 저장 위치 |
| --- | --- | --- |
| 7.1 | Sol-Bat 파일럿 적용 범위 정의서 | `270.파일럿적용` |
| 7.2 | Sol-Bat 도메인 스키마 정의서 | `270.파일럿적용` |
| 7.3 | GraphRAG 검색 노드 적용 결과서 | `270.파일럿적용` |
| 7.4 | 파일럿 데이터 인덱싱 결과서 | `270.파일럿적용` |
| 7.5 | Sol-Bat 파일럿 적용 결과서 | `270.파일럿적용` |

## 11. 의사결정 사항

| 항목 | 결정 |
| --- | --- |
| 1차 파일럿 대상 | Sol-Bat |
| 적용 방식 | 기존 Sol-Bat RAG와 GraphRAG 공통 프레임워크 병행 검증 |
| 1차 데이터 | TXT/PDF 중심 P1 데이터 3건 |
| 주요 검증 흐름 | Source 등록 → IndexJob 실행 → Preview 확인 → Hybrid 검색 테스트 → Agent 연계 PoC |
| 성공 기준 | P1 데이터 인덱싱 성공, Hybrid 검색 HIT/PARTIAL_HIT, Evidence 기반 결과 확인 |

## 12. 다음 작업

다음 작업은 WBS 기준 `7.2 Sol-Bat 도메인 스키마 정의`이다.

권장 요청 문구:

```text
[Knowledge Engineer/GraphRAG Engineer] 270.파일럿 적용 단계의 Sol-Bat 도메인 스키마 정의서를 작성해 주세요. 작물, 병해충, 증상, 환경조건, 관리작업, 농자재, 지역, 생육단계 Entity와 발생위험, 예방, 처방, 영향, 적용시기 Relation을 포함해 주세요.
```
