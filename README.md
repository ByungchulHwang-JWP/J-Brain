<div align="center">
  <br />
  <img src="https://img.shields.io/badge/J--Brain-Platform-blue?style=for-the-badge&logo=ai" alt="J-Brain Logo" />
  <h1>J-Brain: 공통 챗봇 플랫폼 & Intent Pack 모델</h1>
  <p>
    <strong>고객 내부망(폐쇄망) 환경에서도 자연어 기반의 안전하고 강력한 업무 UX를 제공합니다.</strong>
  </p>
</div>

<br/>

> **"생성형 LLM의 환각과 보안 리스크 없이, 내부망에서 가장 확실한 엔터프라이즈 챗봇을 구축합니다."**

J-Brain은 기업 데이터 외부 유출 위험 없이, **사전 승인된 Intent와 Action 기반**으로 동작하는 경량화된 엔터프라이즈 챗봇 플랫폼입니다. JWP의 외부 Intent Factory에서 AI(LLM)의 도움을 받아 똑똑하게 Intent Pack을 구축하고, 완성된 검증 패키지만 고객 내부망(폐쇄망)으로 안전하게 반입하여 챗봇을 구동하는 **투-트랙 아키텍처**를 제공합니다.

---

## 1. 🚨 Background & Problem (도입 배경)

기존 생성형 AI 기반의 챗봇 도입 시, 엔터프라이즈(특히 내부망/폐쇄망) 고객들은 다음과 같은 허들에 부딪힙니다.

- **보안 및 규제:** 고객 데이터 외부 반출은 보안 심사 통과가 불가능하며 리스크가 큽니다.
- **인프라 비용:** On-premise로 대형 LLM을 직접 구축하고 운영하는 것은 막대한 GPU 비용과 전문성을 요구합니다.
- **환각(Hallucination):** 생성형 LLM 특유의 환각으로 인한 오탐(오답) 리스크는 신뢰할 수 있는 기업용 서비스에 치명적입니다.
- **중복 투자:** 서비스마다 챗봇을 개별적으로 구축하고 유지보수해야 하므로 확장성이 극히 낮습니다.

**👉 J-Brain의 해결책:**
생성형 LLM 중심이 아닌, **경량 NLU + Action 기반 접근**과 **공통화된 Intent Pack 운영 모델**을 통해 보안·비용·통제력을 동시에 확보합니다.

---

## 2. 💡 Core Value & Solution

J-Brain은 **공통 챗봇 엔진**과 프로젝트별 도메인 지식인 **Intent Pack**을 분리하여 재사용 가능하고 안전한 챗봇 생태계를 구축합니다.

| 구분 | 기존 LLM 챗봇 / 일반 방식 | 🚀 **J-Brain Intent Pack Platform** |
| :--- | :--- | :--- |
| **아키텍처** | 외부 LLM / API 의존 | **경량 NLU + Intent 매칭 엔진** |
| **배포 환경** | 클라우드 중심 | **폐쇄망(내부망) Pack 반입 및 배포** |
| **응답 방식** | 생성형 답변 중심 | **정형 Action + 근거(Evidence) 기반 응답** |
| **실행 연계** | 업무 실행 연계 제한 | **SQL / API / Route(화면 이동) 직접 연결** |
| **보안/통제** | 환각 및 데이터 반출 우려 | **사전 승인형 운영 통제 (리스크 제로)** |
| **운영 속도** | 대규모 모델 운영 비용 부담 | **일반 CPU 기반의 초경량 운영** |
| **품질 관리** | 수동 운영 및 테스트 | **Intent Factory를 통한 자동 후보 추출 및 검증** |

---

## 3. 🏗️ Architecture (시스템 아키텍처)

J-Brain은 안전성을 위해 외부망의 **Intent Factory**와 고객 내부망의 **챗봇 런타임 엔진**으로 완벽히 분리되어 동작합니다.

### 🏭 외부망 (JWP-Intent Factory)
챗봇의 두뇌가 될 지식(Intent)을 기획하고 생산하는 환경입니다.
1. **LLM 기반 설계:** 외부 LLM(GPT 등)을 활용하여 사용자의 발화 의도(Intent)와 핵심 개체(Entity)를 빠르고 풍부하게 설계합니다.
2. **Pack Build:** 버전 관리, 승인, 변경 이력(Diff) 비교를 거쳐 암호화된 배포 패키지(`Service-Pack-v1.0.0.zip`)를 생성합니다.

### 🏢 고객 내부망 (폐쇄망 런타임)
외부에서 생성된 패키지를 반입하여 안전하게 챗봇을 서비스하는 환경입니다.
1. **Pack Importer:** 외부망에서 들여온 Intent Pack을 검증 및 적재합니다.
2. **챗봇 엔진 (경량 NLU):** 사용자 입력 수신 ➡️ 의도 매칭(Intent Matcher) ➡️ 개체 추출(Entity Extractor) ➡️ 신뢰도 산정(Confidence Scoring)
3. **Action 실행 모듈:** 승인된 내부 API 호출, 정형 데이터베이스(SQL) 조회, 내부 문서(FAQ/매뉴얼) 검색, 지정된 업무 화면(URL) 이동 등을 완벽하게 통제된 상태로 수행합니다.

---

## 4. 🛠️ Tech Stack (기술 스택)

최신 기술 트렌드를 반영하면서도 엔터프라이즈 환경에서의 높은 성능과 안정성을 보장합니다.

| 계층 | 기술 스택 | 도입 사유 (Why?) |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | SPA 기반 관리자 UI, HMR 지원으로 빠른 생산성 및 부드러운 UX 제공 |
| **Backend API** | FastAPI (Python 3.11+) | 자동 OpenAPI 문서 제공, 타입 안전성 보장, 고성능 비동기 I/O (async) 지원 |
| **ORM / DB** | SQLAlchemy 2.0 + PostgreSQL | 비동기 DB 접근 및 강력한 RDBMS 제공 |
| **Vector DB** | **pgvector** 확장 | 기존 관계형 데이터와 벡터 임베딩 데이터를 단일 DB에서 통합 관리하여 운영 편의성 극대화 |
| **AI / ML 파이프라인** | LangChain + LangGraph | GraphRAG 파이프라인 표준화, 상태 기반(Stateful) Agent Workflow 구성에 최적화 |
| **그래프 시각화** | react-force-graph-2d | Entity/Relation 등 복잡한 지식 네트워크를 사용자에게 직관적이고 인터랙티브하게 표시 |
| **인증 시스템** | JWT (HS256) | 서버 세션 스토리지 부담이 없는 무상태(Stateless) 토큰 기반 인증 제공 |

---

## 5. 🎬 Demo Scenario (Intent Factory 6단계 워크플로우)

챗봇 구축부터 라이브 서비스 배포까지, J-Brain 대시보드에서 제공하는 체계적인 6단계 파이프라인입니다.

1. **프로젝트 생성:** J-Brain 신규 프로젝트 생성 및 기본 Pack 초안 준비
2. **지식 자료 등록:** 사내 규정, 매뉴얼 등 원본 문서 업로드 ➡️ Source 분류 및 검색 최적화(Chunking, GraphRAG)
3. **의도(Intent) 설계:** 자동 추출된 Intent, Entity, Synonym 후보군을 검토하여 챗봇의 핵심 인지 능력 확정
4. **FAQ & Action 연결:** 사용자 의도에 매핑될 구체적인 행동 정의 (답변 근거 마련, 사내 API 호출, 특정 화면으로 라우팅 등)
5. **Pack 검증 / 빌드:** 품질 및 승인 체계를 거친 후 실서버에 배포할 Intent Pack 빌드 파일 생성
6. **Runtime 시뮬레이션:** 사용자 질문 입력부터 Intent 매칭, 실제 Action 응답까지 실시간 검증 후 즉시 라이브 서비스 반영

<br/>
<br/>

---

<details>
<summary><b>🧑‍💻 (For Developers) 로컬 개발 및 배포 가이드 </b> <i>(클릭하여 펼치기)</i></summary>

### 1) 사전 준비 사항
- **Node.js**: v20 이상 권장
- **Python**: v3.11 이상 권장 (Mac의 경우 Homebrew를 통한 설치 권장)
- **PostgreSQL**: 사내 공용 Dev DB 접근 권한 필요

### 2) 소스 코드 클론 및 패키지 설치
```bash
git clone https://github.com/ByungchulHwang-JWP/J-Brain.git
cd J-Brain

# 백엔드 설치
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 프론트엔드 설치
cd frontend
npm install
cd ..
```

### 3) 로컬 서버 기동
루트 경로에 있는 통합 스크립트를 실행합니다.
```bash
./start_dev.sh
```
- **프론트엔드 (대시보드):** `http://localhost:5174`
- **백엔드 (API & Swagger):** `http://localhost:8080/docs`

> **Note:** 구글 로그인은 사내 이메일 도메인으로 제한되어 있습니다. 로컬 테스트 시에는 `.env.dev`의 Mock 설정을 켜서 우회 로그인으로 개발을 진행해 주세요.

### 4) 손쉬운 자동화 배포 파이프라인
Dev 서버(`dev.jwinpartners.com`)로 배포할 때, 번거로운 과정 없이 아래 스크립트로 한 번에 배포 가능합니다.

```bash
# 1. 로컬의 변경 사항을 GitHub 원격 저장소에 자동 Push
./deploy/push_to_github.sh

# 2. 내 컴퓨터에서 원격 Dev 서버로 SSH 접속 후 최신 소스 반영 및 서버 재기동 지시
./deploy/deploy_local.exp
```
</details>

<br/>
<div align="center">
  <sub>Copyright © JWINPARTNERS. All rights reserved.</sub>
</div>
