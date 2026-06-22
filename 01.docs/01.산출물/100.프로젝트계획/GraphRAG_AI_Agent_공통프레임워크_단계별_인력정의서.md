# GraphRAG AI Agent 공통 프레임워크 단계별 인력 정의서

## 1. 목적

본 문서는 GraphRAG AI Agent 공통 프레임워크 개발 프로젝트 수행에 필요한 역할을 정의하고, 프로젝트 단계별로 어떤 인력이 필요한지 정리하기 위한 문서이다.

기본 수행 인력인 PM, 기획자, 아키텍터, 디자이너, 개발자, 테스터 외에 GraphRAG, RAG, LLM, 데이터, 보안, 운영, 산출물 관리 관점에서 추가로 필요한 전문 인력을 정의한다.

## 2. 기본 인력 외 추가 필요 인력

| 역할 | 필요 사유 | 주요 책임 |
|---|---|---|
| Product Owner | 프레임워크의 제품 방향과 우선순위 결정 필요 | 비전 수립, 기능 우선순위, 릴리즈 범위 승인 |
| AI/ML Engineer | LLM, Embedding, GraphRAG 품질 설계 필요 | 임베딩, 검색 품질, LLM 연동, 평가 기준 수립 |
| GraphRAG Engineer | GraphRAG 파이프라인 전문 설계 필요 | Entity/Relation 추출, Graph Retrieval, Hybrid Retrieval 구현 |
| Knowledge Engineer | 도메인 지식 구조화 필요 | 온톨로지, Entity/Relation Schema, 지식 모델링 |
| Data Engineer | 문서/DB/로그 데이터 수집 및 정제 필요 | 데이터 파이프라인, 청킹, 메타데이터, 인덱싱 |
| DBA / Data Architect | pgvector, Graph Table, DB 성능 설계 필요 | ERD, 테이블 설계, 인덱스, 백업/복구, 쿼리 성능 |
| Prompt Engineer | Agent 응답 품질과 일관성 관리 필요 | 프롬프트 템플릿, 도구 호출 지침, 답변 형식 설계 |
| MLOps / LLMOps Engineer | LLM/Embedding 운영 모니터링 필요 | 모델 설정, API 비용/장애 모니터링, 평가 자동화 |
| DevOps Engineer | CI/CD, 배포, 환경 구성 필요 | GitHub Actions, 배포 스크립트, 환경변수, 릴리즈 |
| Security Engineer | API Key, 인증, 데이터 보안 검토 필요 | 보안성 검토, Secret 관리, 취약점 점검, 권한 관리 |
| Open Source Compliance 담당 | LangChain, LangGraph 등 라이선스 관리 필요 | 오픈소스 라이선스 목록, 사용권 검토, 검증 대응 |
| Technical Writer | 프레임워크 사용 가이드와 운영 문서 품질 필요 | 사용자매뉴얼, 운영자매뉴얼, API 문서 작성 |
| Configuration Manager | 산출물/소스 형상관리 기준 필요 | 브랜치, 태그, 릴리즈, 산출물 버전 관리 |
| Domain Expert | 파일럿 서비스 도메인 검증 필요 | 농업, 투자, 가계부, 로또 등 도메인 지식 검증 |
| QA Automation Engineer | 반복 테스트 자동화 필요 | 단위/통합/회귀 테스트 자동화, 테스트 데이터 관리 |
| SRE / Operations Engineer | 운영 안정성 확보 필요 | 로그, 모니터링, 장애 대응, 운영 체크리스트 |

## 3. 핵심 역할 정의

### 3.1 Product Owner

공통 프레임워크가 어떤 서비스 개발 문제를 해결해야 하는지 정의하고, 기능 우선순위를 결정한다. PM이 일정과 산출물 중심으로 관리한다면, Product Owner는 제품 가치와 릴리즈 범위를 책임진다.

### 3.2 AI/ML Engineer

LLM, Embedding, 검색 품질, 평가 지표를 담당한다. GraphRAG 검색 결과가 실제 Agent 답변 품질을 높이는지 검증하고, 모델/임베딩/검색 파라미터를 조정한다.

### 3.3 GraphRAG Engineer

GraphRAG Core를 설계하고 구현한다. 주요 책임은 엔티티 추출, 관계 추출, 그래프 저장, 그래프 탐색, 벡터 검색과 그래프 검색을 결합한 Hybrid Retrieval 구현이다.

### 3.4 Knowledge Engineer

도메인 지식을 그래프로 표현하기 위한 온톨로지와 스키마를 정의한다. 예를 들어 Sol-Bat에서는 농장, 작물, 병해충, 기상, 정책, 작업이 어떤 관계를 가지는지 정의한다.

### 3.5 Data Engineer

문서, DB, 로그, 외부 API 데이터를 GraphRAG에서 사용할 수 있도록 수집, 정제, 분할, 메타데이터 부여, 인덱싱하는 파이프라인을 구성한다.

### 3.6 DBA / Data Architect

PostgreSQL, pgvector, Graph Table 구조를 설계하고 성능을 관리한다. Entity/Relation/Chunk 테이블, 인덱스, 검색 쿼리, 백업/복구 정책을 담당한다.

### 3.7 Prompt Engineer

Agent의 역할, 답변 형식, 출처 표기, 도구 사용 기준, 실패 시 fallback 메시지를 설계한다. GraphRAG 검색 결과를 LLM이 안정적으로 활용하도록 프롬프트 템플릿을 관리한다.

### 3.8 MLOps / LLMOps Engineer

LLM API 사용량, 비용, 장애, 응답 시간, 품질 평가를 운영 관점에서 관리한다. Mock LLM, 평가 데이터셋, 회귀 평가 자동화도 포함한다.

### 3.9 Security Engineer

JWT, OAuth, API Key, DB 접속정보, 사용자 데이터, 문서 데이터 보안을 검토한다. 산출물과 Git 저장소에 민감정보가 포함되지 않도록 점검한다.

### 3.10 Technical Writer

프레임워크를 다른 서비스 개발자가 쉽게 사용할 수 있도록 문서화한다. 신규 Agent 생성 방법, 도메인 스키마 등록 방법, GraphRAG 파이프라인 실행 방법을 사용자 관점으로 정리한다.

## 4. 단계별 필요 인력

### 4.1 100. 프로젝트계획

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| PM | 필수 | 일정, 범위, 산출물, 의사소통 계획 수립 |
| Product Owner | 필수 | 프레임워크 목표와 우선순위 정의 |
| 기획자 | 필수 | 서비스 적용 시나리오와 요구 범위 초안 작성 |
| 아키텍터 | 필수 | 기술 방향과 구조 대안 검토 |
| AI/ML Engineer | 권장 | GraphRAG 적용 가능성과 기술 리스크 검토 |
| Security Engineer | 권장 | 보안 관리 원칙과 민감정보 관리 기준 수립 |
| Configuration Manager | 권장 | 저장소, 브랜치, 산출물 관리 기준 수립 |

주요 산출물:

- 프로젝트계획서
- WBS
- 단계별 인력 정의서
- 형상관리 기본 원칙
- 위험관리 초기 목록

### 4.2 210. 아키텍처정의

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| 아키텍터 | 필수 | 전체 시스템 아키텍처 정의 |
| GraphRAG Engineer | 필수 | GraphRAG 구성요소와 처리 흐름 설계 |
| AI/ML Engineer | 필수 | LLM, Embedding, Retrieval 구조 검토 |
| Data Engineer | 필수 | 데이터 수집/정제/인덱싱 구조 설계 |
| DBA / Data Architect | 필수 | pgvector, Graph Table, DB 구성 설계 |
| DevOps Engineer | 권장 | 개발/배포 환경 구조 설계 |
| Security Engineer | 권장 | 인증, 권한, Secret 관리 구조 검토 |
| MLOps / LLMOps Engineer | 권장 | 모델 운영, 비용, 모니터링 구조 설계 |

주요 산출물:

- 시스템아키텍처정의서
- GraphRAG 아키텍처 정의서
- 개발표준정의서
- 기술 스택 선정표

### 4.3 220. 요구정의

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| 기획자 | 필수 | 기능/비기능 요구사항 정리 |
| Product Owner | 필수 | 요구사항 우선순위 승인 |
| PM | 필수 | 요구사항 범위 통제 |
| 아키텍터 | 필수 | 요구사항 실현 가능성 검토 |
| AI/ML Engineer | 필수 | AI 품질 요구사항 정의 |
| Knowledge Engineer | 필수 | 도메인 지식 구조화 요구사항 정의 |
| Security Engineer | 권장 | 보안 요구사항 정의 |
| QA | 권장 | 테스트 가능한 요구사항 기준 검토 |

주요 산출물:

- 요구사항정의서
- 요구사항추적표
- 유스케이스 목록
- 액터목록

### 4.4 230. 분석

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| 아키텍터 | 필수 | 기존 프로젝트 공통 구조 분석 |
| 개발자 | 필수 | 기존 코드 분석 및 공통화 후보 식별 |
| GraphRAG Engineer | 필수 | GraphRAG 적용 대상 분석 |
| Knowledge Engineer | 필수 | Entity/Relation 후보 도출 |
| Data Engineer | 필수 | 데이터 소스, 문서 구조, 메타데이터 분석 |
| DBA / Data Architect | 권장 | 논리 데이터 모델 분석 |
| Domain Expert | 권장 | 도메인 지식 검증 |
| Open Source Compliance 담당 | 권장 | 사용 라이브러리와 라이선스 현황 분석 |

주요 산출물:

- 기존 프로젝트 공통기능 분석서
- 도메인정의서
- 단어_용어정의서
- 논리 ERD
- 시스템 인터페이스 목록
- SW 라이선스 검토 초안

### 4.5 240. 설계

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| 아키텍터 | 필수 | 상세 설계 총괄 |
| GraphRAG Engineer | 필수 | GraphRAG Core 상세 설계 |
| AI/ML Engineer | 필수 | 검색 품질, 평가 방식, LLM 연동 설계 |
| Knowledge Engineer | 필수 | Entity/Relation Schema 상세 설계 |
| Data Engineer | 필수 | 인덱싱 파이프라인 상세 설계 |
| DBA / Data Architect | 필수 | 물리 ERD, 테이블 정의, 인덱스 설계 |
| Prompt Engineer | 필수 | 프롬프트 템플릿과 답변 형식 설계 |
| DevOps Engineer | 권장 | CI/CD, 환경 구성 설계 |
| Security Engineer | 권장 | 보안 설계 검토 |
| QA Automation Engineer | 권장 | 테스트 자동화 설계 |

주요 산출물:

- 상세설계서
- 설계 클래스 다이어그램
- 설계 시퀀스 다이어그램
- 시스템인터페이스정의서
- 물리 ERD
- 테이블정의서
- 프로그램목록
- API 명세서
- Prompt 설계서

### 4.6 250. 구현

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| 개발자 | 필수 | 공통 프레임워크 구현 |
| GraphRAG Engineer | 필수 | GraphRAG Core 구현 |
| AI/ML Engineer | 필수 | LLM, Embedding, Retrieval 구현 및 튜닝 |
| Data Engineer | 필수 | 문서 처리, 청킹, 인덱싱 구현 |
| DBA / Data Architect | 권장 | DB 생성 스크립트, 성능 쿼리 검토 |
| Prompt Engineer | 권장 | Agent 프롬프트 구현 |
| DevOps Engineer | 권장 | CI, 테스트 실행, 배포 스크립트 구성 |
| Security Engineer | 권장 | Secure Coding 및 Secret 노출 점검 |
| Configuration Manager | 권장 | 브랜치, 커밋, 릴리즈 관리 |

주요 산출물:

- 소스코드
- 구현결과서
- SW라이선스목록
- 단위 테스트 시나리오

### 4.7 260. 테스트

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| 테스터 / QA | 필수 | 테스트 수행 및 결함 관리 |
| QA Automation Engineer | 필수 | 자동화 테스트 구성 |
| AI/ML Engineer | 필수 | GraphRAG 검색 품질 평가 |
| GraphRAG Engineer | 필수 | Retrieval 오류 분석 및 개선 |
| 개발자 | 필수 | 결함 수정 |
| Security Engineer | 권장 | 보안 점검 |
| MLOps / LLMOps Engineer | 권장 | LLM 비용, 응답시간, 장애 테스트 |
| Domain Expert | 권장 | 파일럿 답변 품질 검증 |

주요 산출물:

- 테스트계획서
- 테스트시나리오
- 테스트결과서
- 결함 및 조치결과 보고서
- AI 품질 평가 결과서

### 4.8 270. 이행

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| DevOps Engineer | 필수 | 배포 및 환경 구성 |
| SRE / Operations Engineer | 필수 | 운영 모니터링, 장애 대응 기준 수립 |
| Technical Writer | 필수 | 사용자/운영자 매뉴얼 작성 |
| 개발자 | 필수 | 설치, 실행, 샘플 코드 정리 |
| Security Engineer | 권장 | 운영 보안 체크리스트 검토 |
| MLOps / LLMOps Engineer | 권장 | LLM 운영 모니터링 체계 정리 |
| PM | 필수 | 이행 준비상태 점검 |

주요 산출물:

- 사용자매뉴얼
- 운영자매뉴얼
- 적용가이드
- 이행점검 체크리스트

### 4.9 300. 프로젝트종료

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| PM | 필수 | 완료보고 및 Lessons Learned 정리 |
| Product Owner | 필수 | 최종 산출물 승인 |
| 아키텍터 | 권장 | 기술 성과와 후속 과제 정리 |
| QA | 권장 | 품질 결과 정리 |
| Configuration Manager | 권장 | 최종 릴리즈 태그 및 산출물 정리 |
| Technical Writer | 권장 | 문서 최종본 정리 |

주요 산출물:

- 프로젝트완료보고서
- 이행점검체크리스트
- Lessons Learned

### 4.10 400. 프로젝트관리

| 필요 인력 | 투입 수준 | 주요 역할 |
|---|---|---|
| PM | 필수 | 이슈, 위험, 일정, 의사소통 관리 |
| Configuration Manager | 필수 | 형상관리, 릴리즈, 산출물 버전 관리 |
| QA | 필수 | 품질보증 체크리스트 관리 |
| Security Engineer | 권장 | 보안 이슈 관리 |
| Open Source Compliance 담당 | 권장 | 라이선스 및 오픈소스 검증 관리 |
| DevOps Engineer | 권장 | 빌드/배포 이슈 관리 |

주요 산출물:

- 이슈_위험관리대장
- 결함관리대장
- 형상관리계획서
- 품질보증체크리스트
- 동료검토결과서

## 5. 단계별 투입 매트릭스

| 역할 | 계획 | 아키텍처 | 요구 | 분석 | 설계 | 구현 | 테스트 | 이행 | 종료 | 관리 |
|---|---|---|---|---|---|---|---|---|---|---|
| PM | 주 | 참 | 주 | 참 | 참 | 참 | 참 | 주 | 주 | 주 |
| Product Owner | 주 | 참 | 주 | 참 | 참 | 참 | 참 | 참 | 주 | 참 |
| 기획자 | 주 | 참 | 주 | 참 | 참 | 참 | 참 | 참 | 참 | 참 |
| 아키텍터 | 주 | 주 | 주 | 주 | 주 | 참 | 참 | 참 | 참 | 참 |
| 디자이너 | 참 | 참 | 참 | 참 | 참 | - | 참 | 참 | - | - |
| 개발자 | 참 | 참 | 참 | 주 | 주 | 주 | 주 | 주 | 참 | 참 |
| 테스터 / QA | 참 | 참 | 참 | 참 | 참 | 참 | 주 | 참 | 주 | 주 |
| AI/ML Engineer | 참 | 주 | 주 | 참 | 주 | 주 | 주 | 참 | 참 | 참 |
| GraphRAG Engineer | 참 | 주 | 참 | 주 | 주 | 주 | 주 | 참 | 참 | 참 |
| Knowledge Engineer | - | 참 | 주 | 주 | 주 | 참 | 참 | 참 | 참 | - |
| Data Engineer | - | 주 | 참 | 주 | 주 | 주 | 참 | 참 | - | 참 |
| DBA / Data Architect | - | 주 | 참 | 참 | 주 | 참 | 참 | 참 | - | 참 |
| Prompt Engineer | - | 참 | 참 | 참 | 주 | 참 | 참 | 참 | - | - |
| DevOps Engineer | 참 | 참 | - | - | 참 | 참 | 참 | 주 | 참 | 참 |
| MLOps / LLMOps Engineer | - | 참 | 참 | - | 참 | 참 | 참 | 참 | 참 | 참 |
| Security Engineer | 참 | 참 | 참 | 참 | 참 | 참 | 참 | 참 | 참 | 참 |
| Open Source Compliance 담당 | - | - | - | 참 | 참 | 참 | 참 | 참 | 참 | 참 |
| Technical Writer | - | - | 참 | 참 | 참 | 참 | 참 | 주 | 참 | - |
| Configuration Manager | 참 | 참 | - | - | 참 | 참 | 참 | 참 | 참 | 주 |
| Domain Expert | - | - | 참 | 참 | 참 | 참 | 참 | 참 | 참 | - |
| SRE / Operations Engineer | - | 참 | - | - | 참 | 참 | 참 | 주 | 참 | 참 |

범례:

- 주: 해당 단계의 핵심 수행 인력
- 참: 검토 또는 부분 투입 인력
- -: 일반적으로 투입 불필요

## 6. 최소 수행 조직안

소규모 프로젝트 또는 1인/소수 인력으로 수행할 경우 다음과 같이 역할을 겸임할 수 있다.

| 겸임 그룹 | 포함 역할 |
|---|---|
| 프로젝트 리딩 | PM, Product Owner, 기획자 |
| 기술 리딩 | 아키텍터, GraphRAG Engineer, AI/ML Engineer |
| 구현 | 개발자, Data Engineer, Prompt Engineer |
| 품질/운영 | 테스터, QA Automation Engineer, DevOps Engineer |
| 관리/문서 | Configuration Manager, Technical Writer, Open Source Compliance 담당 |

단, Security Engineer 역할은 겸임하더라도 별도 체크리스트 기반으로 독립 점검을 수행하는 것이 바람직하다.

## 7. 본 프로젝트 권장 투입안

본 프로젝트는 공통 프레임워크 개발 성격이므로 다음 인력을 우선 확보하는 것이 적절하다.

| 우선순위 | 역할 | 사유 |
|---:|---|---|
| 1 | 아키텍터 | 공통 프레임워크 구조 결정이 프로젝트 성패에 직접 영향 |
| 2 | GraphRAG Engineer | GraphRAG Core가 본 프로젝트의 핵심 산출물 |
| 3 | AI/ML Engineer | LLM, Embedding, Retrieval 품질 확보 필요 |
| 4 | Data Engineer | 문서/지식 인덱싱 파이프라인이 필수 |
| 5 | DBA / Data Architect | pgvector 및 Graph Table 구조 설계 필요 |
| 6 | Prompt Engineer | Agent 응답 품질과 사용성 확보 필요 |
| 7 | Security Engineer | API Key, 인증, 문서 데이터 보안 필요 |
| 8 | Technical Writer | 프레임워크 확산을 위한 사용 가이드 필요 |

## 8. 결론

GraphRAG AI Agent 공통 프레임워크 프로젝트는 일반 웹서비스 개발보다 AI, 데이터, 지식 모델링, 운영 품질의 비중이 높다. 따라서 PM, 기획자, 아키텍터, 디자이너, 개발자, 테스터 외에 GraphRAG Engineer, AI/ML Engineer, Knowledge Engineer, Data Engineer, DBA/Data Architect, Prompt Engineer, MLOps/LLMOps Engineer, Security Engineer, Technical Writer 역할이 추가로 필요하다.

특히 1차 파일럿 대상이 `Sol-Bat`인 경우 농업 도메인 지식을 검증할 Domain Expert를 분석, 설계, 테스트 단계에 투입하는 것이 GraphRAG 답변 품질 확보에 유리하다.
