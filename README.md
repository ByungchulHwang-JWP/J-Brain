# J-Brain (사내 지식 챗봇 & 인텐트 팩토리 플랫폼)

J-Brain은 기업 내 지식 자산을 활용하여 지능형 챗봇을 손쉽게 구축하고 관리하기 위한 **사내 지식 챗봇 플랫폼**입니다.
본 저장소는 J-Brain의 프론트엔드(관리자 사이트 및 워크플로우 대시보드)와 백엔드(FastAPI 기반 Agent/RAG Core 엔진) 소스 코드를 포함하고 있습니다.

---

## 1. 프로젝트 개요

- **프로젝트명:** J-Brain (제이브레인)
- **주요 목적:**
  - 사내 문서 및 도메인 지식 기반의 RAG/GraphRAG 챗봇 구축 자동화
  - "Intent Factory" 개념을 도입하여 챗봇 인텐트 설계, 리뷰, 테스트를 시스템화
  - 역할 기반(RBAC) 접근 제어 및 Google SSO를 통한 기업용 보안 로그인 환경 제공
  - 구축 워크플로우(기획 -> 설계 -> 구현 -> 테스트) 단계별 진척 관리 대시보드 제공

## 2. 기술 스택 (Tech Stack)

### Frontend (BO & Dashboard)
- **Framework:** React 18 + Vite
- **Styling:** Vanilla CSS (Modern CSS variables)
- **Routing:** React Router v6
- **State/HTTP:** Axios, LocalStorage (JWT Token)

### Backend (API & AI Agent Core)
- **Framework:** FastAPI (Python 3.11+)
- **ORM / Database:** SQLAlchemy 2.0 / PostgreSQL 15+ (pgvector 확장 사용)
- **AI / RAG Pipeline:** 자체 구현된 GraphRAG Core, LangChain, OpenAI API
- **Auth:** OAuth 2.0 (Google SSO 연동) 및 자체 JWT 발급

### Infra & Deployment
- **Server:** Rocky Linux / Ubuntu (Dev Server: `dev.jwinpartners.com`)
- **Web Server:** Nginx (Proxy)
- **Deploy:** Shell Script & Expect 기반 자체 CI/CD 스크립트 제공

---

## 3. 주요 시스템 구성 및 기능

### 1) Auth & RBAC (인증 및 권한 관리)
- **Google SSO 로그인:** 사내 이메일(`@jwinpartners.com`) 기반의 안전한 OAuth 2.0 로그인
- **관리자 승인 대기 로직:** 최초 가입 시 `pending` 상태로 대기하며, 최고 관리자가 승인 후 접속 가능
- **동적 메뉴 시스템:** 사용자 권한(`ROLE_ADMIN`, `ROLE_EMPLOYEE` 등)에 따라 좌측 LNB 메뉴 동적 렌더링

### 2) Intent Factory (인텐트 팩토리)
챗봇의 뼈대가 되는 인텐트(의도)를 체계적으로 생산하고 관리하는 파이프라인.
- **후보군 리뷰 (Candidate Review):** AI가 미답변/오답변 로그를 분석하여 새로운 인텐트 후보를 제안
- **인텐트 등록 및 승인:** 인텐트 상세 설계 (발화 예문, 엔티티 매핑, 예상 답변)
- **액션 라우팅 (Action Router):** 특정 인텐트 인식 시 실행할 비즈니스 로직(Action) 연결

### 3) Workflow Dashboard (구축 워크플로우 대시보드)
- 프로젝트별 챗봇 구축 진행률을 6단계(기획/설계/구현/테스트 등)로 나누어 모니터링
- 단계별 필요한 산출물 가이드 및 체크리스트 제공

### 4) Knowledge Base & GraphRAG (지식 관리)
- PDF, DOCX 등 사내 문서를 업로드하고 청킹(Chunking) 및 인덱싱(Indexing) 수행
- 추출된 엔티티(Entity)와 릴레이션(Relation)을 기반으로 GraphRAG 검색 테스트 및 추적(Evidence) 기능 제공

---

## 4. 디렉토리 구조

```text
J-Brain/
├── backend/                  # FastAPI 백엔드 프로젝트 루트
│   ├── app/                  # 핵심 애플리케이션 로직 (API, Auth, RAG Core)
│   ├── app_data/             # AI 인텐트 팩 및 업로드된 파일 저장소
│   ├── tests/                # 백엔드 단위/통합 테스트
│   ├── requirements.txt      # Python 패키지 의존성
│   └── main.py               # 백엔드 진입점
├── frontend/                 # React + Vite 프론트엔드 프로젝트 루트
│   ├── src/                  # 화면 컴포넌트, 페이지, 상태 관리
│   ├── index.html            # 프론트엔드 진입점
│   ├── package.json          # Node.js 패키지 의존성
│   └── vite.config.js        # Vite 빌드 및 로컬 프록시 설정
├── deploy/                   # 🚀 자동화 배포 스크립트 폴더
│   ├── deploy.sh             # 서버용 배포 스크립트 (git pull & restart)
│   ├── deploy_local.exp      # 로컬에서 원격 서버 배포 트리거 스크립트
│   └── push_to_github.sh     # 로컬 작업물을 GitHub에 자동 푸시하는 헬퍼 스크립트
├── 01.docs/                  # 산출물 및 기획/설계 문서 모음 (WBS, 아키텍처 등)
├── logs/                     # 로컬 기동 시 프로세스 로그 저장소
├── start_dev.sh              # 🚀 프론트엔드 & 백엔드 동시 기동 스크립트
├── stop.sh                   # 현재 기동 중인 프로세스 종료 스크립트
├── .env.dev                  # (중요) 서버/로컬 환경 변수 파일 (Git에서 제외됨)
└── README.md                 # 현재 파일
```

---

## 5. 로컬 개발 환경 세팅 가이드

### 1) 사전 준비 사항
- **Node.js**: v20 이상 권장
- **Python**: v3.11 이상 권장 (Mac의 경우 Homebrew를 통한 설치 권장)
- **PostgreSQL**: 사내 공용 Dev DB 접근 권한 필요

### 2) 소스 코드 클론 및 환경 변수 설정
```bash
git clone https://github.com/ByungchulHwang-JWP/J-Brain.git
cd J-Brain

# .env.dev 파일 생성 (사내 보안 가이드 또는 담당자에게 요청하여 값 기입)
# (Google OAuth Client ID, DB Connection String, JWT Secret 등이 포함됩니다.)
```

### 3) 백엔드 의존성 설치
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

### 4) 프론트엔드 의존성 설치
```bash
cd frontend
npm install
cd ..
```

### 5) 통합 서버 기동 (Local)
루트 경로에 있는 기동 스크립트를 실행하여 FO와 API 서버를 동시에 띄웁니다.
```bash
./start_dev.sh
```
- **프론트엔드 주소:** `http://localhost:5174`
- **백엔드 API Swagger:** `http://localhost:8080/docs`

> **Note:** 구글 로그인은 도메인 보안 설정이 되어 있습니다. 로컬(`localhost`) 접속 시 정상적인 테스트가 어려울 수 있으니, 로컬에서는 API 테스트 또는 Mock 로그인 기능을 활성화하여 개발하시기 바랍니다.

---

## 6. 배포 가이드 (Deployment)

J-Brain은 작업자의 편의를 위해 스크립트 기반의 빠른 CI/CD 파이프라인을 구축해 두었습니다. 모든 배포 관련 스크립트는 `deploy/` 폴더에 위치합니다.

### 시나리오 1: 로컬에서 개발 후 GitHub 업로드 및 Dev 서버 배포까지 한 번에!
로컬에서 소스 수정 후 터미널에서 다음 스크립트들을 순차적으로 실행합니다.

```bash
# 1. 로컬 변경 사항을 GitHub 원격 저장소에 Push
./deploy/push_to_github.sh

# 2. 원격 Dev 서버 접속, 소스 Pull 및 서버 재기동 자동 수행
./deploy/deploy_local.exp
```
*(실행 시 서버 비밀번호를 요구할 수 있습니다.)*

### 시나리오 2: Dev 서버 접속 후 직접 갱신하기
터미널로 Dev 서버에 직접 접속(`appuser@dev.jwinpartners.com`)해 있다면 아래 스크립트 하나로 배포가 완료됩니다.

```bash
cd /app/j-brain
./deploy/deploy.sh
```

---

## 7. 문의 및 참고 자료

- 시스템 아키텍처, ERD, WBS 등 상세 문서는 `01.docs/01.산출물_JBrain/` 경로를 참고하십시오.
- J-Brain 인텐트 등록 테스트 및 활용 시나리오는 `01.docs/01.산출물_JBrain/200.프로젝트실행/280.테스트/` 의 가이드를 숙지하시기 바랍니다.
- **이슈 등록:** GitHub Issues 탭을 활용하여 주시면 신속하게 조치하겠습니다.
