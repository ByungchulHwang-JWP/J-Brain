# GraphRAG AI Agent 공통 프레임워크 Lessons Learned

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | GraphRAG AI Agent 공통 프레임워크 개발 |
| 단계 | 300.종료 |
| WBS | 10.3 Lessons Learned 작성 |
| 담당 | PM / 전체 역할 |
| 작성 목적 | 프로젝트 수행 과정에서 확인한 잘된 점, 어려웠던 점, 개선할 점, 다음 GraphRAG AI Agent 프로젝트에 적용할 교훈 정리 |
| 작성일 | 2026-06-21 |

## 2. 종합 요약

본 프로젝트는 기존 바이브코딩 프로젝트에서 반복적으로 필요했던 RAG, GraphRAG, Agent, 관리자 자료 관리 기능을 공통 프레임워크로 정리하는 시도였다.

가장 큰 성과는 산출물 중심의 단계별 접근과 실제 소스/테스트 구현을 병행하여, 문서만 있는 계획이 아니라 `src/common_core`와 `tests`로 검증 가능한 공통 기반을 만든 점이다.

가장 큰 학습점은 GraphRAG AI Agent 프레임워크는 단순 검색 모듈이 아니라 Source 관리, 인덱싱, Schema, 저장소, Evidence, Agent Workflow, 운영/보안까지 함께 설계되어야 재사용 가능한 프레임워크가 된다는 점이다.

## 3. 잘된 점

| 영역 | 잘된 점 | 효과 |
| --- | --- | --- |
| 단계별 진행 | 계획, 아키텍처, 요구, 분석, 설계, 구현, 파일럿, 테스트, 이행, 종료 흐름으로 진행 | 산출물 누락을 줄이고 다음 작업을 명확히 관리 |
| 역할 기반 요청 | PM, 기획자, 아키텍터, 개발자, QA, DevOps 관점으로 요청을 분리 | 산출물 성격과 품질 기준이 명확해짐 |
| 공통화 대상 도출 | 기존 프로젝트의 공통 기능 후보와 RAG/Agent 구조를 분석 | 프레임워크 범위가 실사용 기반으로 정리됨 |
| 관리자 사이트 반영 | Source 등록, IndexJob, Preview, GraphRAG 검색 테스트를 포함 | GraphRAG 운영에 필요한 자료 관리 흐름을 조기에 반영 |
| Sol-Bat 파일럿 | 실제 도메인으로 Schema, 인덱싱, 검색, Agent state 연계 검증 | 공통 프레임워크 적용 가능성을 구체적으로 확인 |
| 테스트 자동화 | pytest 기준 32개 테스트 통과 | 핵심 기능 회귀 검증 기반 확보 |
| 이행 문서 | 사용자/운영자 매뉴얼, 신규 서비스 적용 가이드, 배포 체크리스트 작성 | 후속 서비스 적용과 운영 전환 준비 가능 |

## 4. 어려웠던 점

| 영역 | 어려웠던 점 | 영향 |
| --- | --- | --- |
| 범위 관리 | GraphRAG, Agent, 관리자 사이트, 저장소, 운영까지 범위가 넓음 | 단계별 우선순위와 후속 이관 기준이 중요해짐 |
| 저장소 전환 | InMemory 구현과 운영 PGVector/PostgreSQL 사이 차이가 큼 | 운영 수준 통합 테스트는 후속 과제로 남음 |
| 도메인 Schema | Sol-Bat처럼 전문 용어가 많은 도메인은 Entity/Relation/Alias 정리가 중요 | Knowledge Engineer 역할 필요성이 커짐 |
| 관리자 UI | MVP 화면과 운영 UI 사이 간극 존재 | 브라우저 E2E와 UX 고도화가 후속 과제로 남음 |
| 보안/권한 | AuthContext 중심 검증과 실제 인증/권한 모듈 연계 사이 차이 존재 | 운영 전 보안 API 테스트가 필요 |
| 테스트 환경 | 초기에는 pytest 미설치로 직접 호출 검증을 병행 | 테스트 환경 표준화 필요성이 확인됨 |
| 한글 문서/인코딩 | 터미널 출력에서 한글이 깨져 보이는 경우 발생 | UTF-8 기준 문서/출력 관리 필요 |

## 5. 개선할 점

| 개선 항목 | 개선 방향 | 적용 시점 |
| --- | --- | --- |
| 초기 환경 표준화 | Python, pytest, dependency 설치 스크립트 제공 | 프로젝트 착수 직후 |
| CI 구성 | compileall, pytest, lint, 문서 링크 검증 자동화 | 구현 초기 |
| 운영 저장소 조기 검증 | PGVector/PostgreSQL GraphStore 통합 환경을 테스트 단계 전에 준비 | 설계~구현 중반 |
| 관리자 E2E | Playwright 기반 Source/IndexJob/Preview/Search 테스트 자동화 | 관리자 MVP 완성 직후 |
| 보안 테스트 | 실제 token/role/scope 기반 API 테스트 케이스 작성 | API 구현 직후 |
| 성능 기준 | Source 크기별 IndexJob/Retrieval 목표 시간 정의 | 테스트계획 단계 |
| 도메인 데이터셋 | P1/P2/P3 테스트 데이터셋을 초기에 분리 관리 | 파일럿 착수 전 |
| 문서 현행화 | 각 단계 완료 시 이전 문서의 "다음 작업" 문구 업데이트 | 단계 종료 시 |

## 6. 역할별 Lessons Learned

### 6.1 PM 관점

| 구분 | 내용 |
| --- | --- |
| 잘된 점 | WBS 기반으로 다음 작업을 계속 명확히 하여 프로젝트 흐름이 끊기지 않았다. |
| 어려웠던 점 | 구현/파일럿/테스트/이행 산출물이 빠르게 늘어나면서 현행 상태 관리가 중요해졌다. |
| 개선할 점 | 각 단계 종료 시 WBS, Gantt, 산출물 목록을 동시에 업데이트하는 운영 규칙을 표준화한다. |
| 다음 적용 교훈 | GraphRAG 프로젝트는 실험과 산출물 관리가 함께 진행되어야 하므로, PM은 후속 이관 항목과 완료 기준을 더 자주 확정해야 한다. |

### 6.2 기획자 관점

| 구분 | 내용 |
| --- | --- |
| 잘된 점 | Source, Document, Chunk, Entity, Relation, Evidence, Agent 등 핵심 용어를 정의해 공통 언어를 만들었다. |
| 어려웠던 점 | 관리자 사이트 기능이 단순 CRUD가 아니라 인덱싱/Preview/검색 품질 검토까지 포함해 복잡했다. |
| 개선할 점 | 관리자 사용자 여정을 Source 등록부터 Agent 실행까지 더 세밀한 화면 흐름으로 초기에 정리한다. |
| 다음 적용 교훈 | GraphRAG 관리자 기능은 "자료 관리"와 "AI 품질 검토"가 결합된 업무로 정의해야 한다. |

### 6.3 아키텍터 관점

| 구분 | 내용 |
| --- | --- |
| 잘된 점 | RAG Core, GraphRAG Core, VectorStore, GraphStore, Agent Workflow의 모듈 경계를 분리했다. |
| 어려웠던 점 | InMemory PoC와 운영 저장소 사이의 구조적 차이를 모두 설계에 반영해야 했다. |
| 개선할 점 | 초기부터 provider별 운영 아키텍처와 fallback 정책을 더 구체화한다. |
| 다음 적용 교훈 | GraphRAG 프레임워크는 SchemaRegistry, Evidence trace, Store adapter, Agent state 계약이 핵심 아키텍처 자산이다. |

### 6.4 개발자 관점

| 구분 | 내용 |
| --- | --- |
| 잘된 점 | RAG Core, VectorStore, GraphStore, Extractor, Retriever, Agent Workflow를 테스트 가능한 Python 모듈로 구성했다. |
| 어려웠던 점 | MVP 구현과 운영 확장성을 동시에 고려해야 해 adapter skeleton과 실제 구현 범위를 나눠야 했다. |
| 개선할 점 | provider adapter별 contract test를 더 일찍 작성하고, 실제 DB 연동 fixture를 준비한다. |
| 다음 적용 교훈 | AI Agent 공통 프레임워크는 작은 단위의 순수 함수/클래스와 통합 flow 테스트가 함께 있어야 유지보수가 쉽다. |

### 6.5 QA 관점

| 구분 | 내용 |
| --- | --- |
| 잘된 점 | 테스트계획, 테스트시나리오, 자동화 구조, 결함관리, 결과 확정까지 테스트 산출물을 단계적으로 작성했다. |
| 어려웠던 점 | 실제 브라우저 E2E, 성능, 실제 저장소, 보안 API 테스트는 환경 의존성이 커서 후속 과제로 분리했다. |
| 개선할 점 | 테스트 환경 표준화와 CI 연계를 초기 구현 단계부터 적용한다. |
| 다음 적용 교훈 | GraphRAG 품질은 단순 PASS/FAIL뿐 아니라 Evidence coverage, citation, 검색 의도 일치까지 평가해야 한다. |

### 6.6 DevOps 관점

| 구분 | 내용 |
| --- | --- |
| 잘된 점 | 운영자매뉴얼과 배포/운영 체크리스트를 통해 환경 변수, 로그, 백업/복구, 롤백 기준을 정리했다. |
| 어려웠던 점 | 현재 구현이 InMemory 중심이라 운영 저장소, 모니터링, 백업 자동화는 후속 구성이 필요하다. |
| 개선할 점 | Docker/CI/CD/환경 변수 템플릿/health check를 공통 프레임워크에 기본 제공한다. |
| 다음 적용 교훈 | GraphRAG 운영은 API health만으로 충분하지 않고 IndexJob, VectorStore, GraphStore, Retrieval 품질 지표가 함께 모니터링되어야 한다. |

## 7. 다음 GraphRAG AI Agent 프로젝트 적용 교훈

| 교훈 ID | 교훈 | 적용 방안 |
| --- | --- | --- |
| LL-001 | 도메인 Schema가 GraphRAG 품질의 출발점이다 | 프로젝트 초기에 Knowledge Engineer와 Entity/Relation/Alias 워크숍 수행 |
| LL-002 | Source 관리 기능은 선택이 아니라 필수다 | 관리자 사이트 범위에 Source/IndexJob/Preview/SearchTest를 기본 포함 |
| LL-003 | Evidence trace가 없으면 Agent 신뢰성이 낮아진다 | Chunk, Evidence, Citation을 모든 검색/Agent 결과에 포함 |
| LL-004 | InMemory PoC와 운영 저장소는 별도 검증이 필요하다 | PGVector/PostgreSQL 통합 테스트를 독립 마일스톤으로 관리 |
| LL-005 | 테스트는 기능뿐 아니라 품질 기준까지 포함해야 한다 | HIT, Evidence coverage, Citation, Hallucination risk 기준 정의 |
| LL-006 | Agent Workflow는 검색 node와 답변 node를 분리해야 한다 | GraphRAGRetrieveNode, AnswerNode, StructuredOutputNode 구조 유지 |
| LL-007 | 운영 준비는 구현 후반이 아니라 설계부터 시작해야 한다 | 로그, 보안, 백업, 롤백 기준을 설계 산출물에 포함 |
| LL-008 | 산출물과 소스가 함께 진화해야 한다 | 구현 변경 시 관련 설계/테스트/운영 문서 영향도 점검 |

## 8. 프로젝트 자산화 항목

| 자산 | 재사용 가치 |
| --- | --- |
| `src/common_core/ai_pipeline/document` | 신규 서비스 Source 인덱싱 공통 기반 |
| `src/common_core/ai_pipeline/graphrag` | Entity/Relation/Evidence/Hybrid Retrieval 공통 기반 |
| `src/common_core/ai_pipeline/vectorstores` | VectorStore provider 확장 기반 |
| `src/common_core/agents` | GraphRAG Agent Workflow 공통 기반 |
| `src/common_core/admin` | 관리자 Source/IndexJob/Preview/Search MVP 기반 |
| `tests` | 공통 프레임워크 회귀 테스트 기반 |
| `290.이행` 산출물 | 신규 서비스 적용 및 운영 전환 가이드 |

## 9. 후속 프로젝트 권고

| 우선순위 | 권고 사항 | 기대 효과 |
| --- | --- | --- |
| P1 | PGVector/PostgreSQL 실제 저장소 통합 | 운영 적용 가능성 강화 |
| P1 | 관리자 브라우저 E2E 자동화 | UI 회귀 리스크 감소 |
| P1 | 실제 인증/권한 API 테스트 | 데이터 노출 리스크 감소 |
| P2 | 성능 테스트 및 기준 수립 | 대량 Source 적용 준비 |
| P2 | Agent 실행 관리자 화면 추가 | 운영자/기획자 검증 편의 개선 |
| P2 | 신규 도메인 샘플 1개 추가 적용 | 프레임워크 범용성 검증 |

## 10. 결론

이번 프로젝트는 GraphRAG AI Agent 공통 프레임워크의 핵심 구조를 문서, 소스, 테스트, 파일럿, 이행 산출물로 연결한 점에서 의미가 있다.

다음 프로젝트에서는 운영 저장소, 보안, E2E, 성능을 더 앞단에서 준비하면 PoC 수준을 넘어 실제 서비스 적용까지 더 빠르게 이동할 수 있다.

## 11. 다음 작업

다음 작업은 WBS 기준 `10.4 릴리즈 태그 및 버전 정리`이다.

권장 요청 문구는 다음과 같다.

```text
[Configuration Manager/DevOps] 300.종료 단계의 릴리즈 태그 및 버전 정리 문서를 작성해 주세요. 현재 버전, 릴리즈 범위, 포함 산출물, 포함 소스, 테스트 결과, GitHub 태그/릴리즈 권고안을 포함해 주세요.
```
