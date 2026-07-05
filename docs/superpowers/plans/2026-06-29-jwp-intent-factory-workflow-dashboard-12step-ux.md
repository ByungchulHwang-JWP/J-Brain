# JWP Intent Factory Workflow Dashboard 및 12단계 구축 UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 Mock 화면 설계를 기준으로 JWP Intent Factory의 프로젝트 선택, 구축 워크플로우 대시보드, 12단계 구축 UX, 관리성 화면을 실제 상용 운영 가능한 관리자 화면으로 구현한다.

**Architecture:** 기존 DB 기반 Intent/Entity/FAQ/Action/Pack 기능은 유지하고, 그 위에 `Workflow Dashboard`와 단계별 UX를 얹는다. Runtime은 계속 검증된 파일 Pack 기반으로 동작하며, DB는 제작/관리/검증/배포 흐름의 관리 저장소 역할을 담당한다. 1차는 운영자가 작업 순서를 이해하고 기존 기능으로 이동할 수 있는 UX Shell을 완성하고, 2차는 Pack 검증/Build/배포/운영 개선 흐름을 연결하며, 3차는 승인/감사/리포트/공통 모달을 상용 운영 수준으로 보강한다.

**Tech Stack:** React, React Router, Axios, FastAPI, SQLAlchemy AsyncSession, PostgreSQL, existing Intent Factory services, existing Pack Export/Store/Validation services, local file Pack Runtime.

---

## 0. 현재 기준 정리

### 이미 구현되어 연결 가능한 영역

- Backend API
  - `backend/app/api/intent_factory.py`
  - `backend/app/api/projects.py`
  - `backend/app/api/chat_runtime.py`
  - `backend/app/api/action_route.py`
  - `backend/app/api/intent_match.py`
  - `backend/app/api/intent_packs.py`
  - `backend/app/api/dashboard.py`
- Backend Service
  - `backend/app/services/intent_factory_service.py`
  - `backend/app/services/pack_export_service.py`
  - `backend/app/services/pack_store_service.py`
  - `backend/app/services/pack_validation_service.py`
- Runtime/AI
  - `backend/app/ai/intent_pack_loader.py`
  - `backend/app/ai/intent_matcher.py`
  - `backend/app/ai/action_router.py`
  - `backend/app/ai/search_doc_action.py`
  - `backend/app/ai/project_pack_resolver.py`
- Frontend Pages
  - `frontend/src/pages/WorkflowDashboard.jsx`
  - `frontend/src/pages/ProjectList.jsx`
  - `frontend/src/pages/ProjectDetail.jsx`
  - `frontend/src/pages/SourceList.jsx`
  - `frontend/src/pages/SourceNew.jsx`
  - `frontend/src/pages/RetrievalTest.jsx`
  - `frontend/src/pages/ProjectQA.jsx`
  - `frontend/src/pages/intent-factory/IntentList.jsx`
  - `frontend/src/pages/intent-factory/IntentDetail.jsx`
  - `frontend/src/pages/intent-factory/EntityList.jsx`
  - `frontend/src/pages/intent-factory/FaqList.jsx`
  - `frontend/src/pages/intent-factory/ActionList.jsx`
  - `frontend/src/pages/packs/PackBuilder.jsx`
  - `frontend/src/pages/packs/PackValidation.jsx`
  - `frontend/src/pages/packs/PackRepository.jsx`
  - `frontend/src/pages/packs/PackDeployment.jsx`
  - `frontend/src/pages/runtime/ActionTest.jsx`
  - `frontend/src/pages/operations/UnansweredAnalysis.jsx`
  - `frontend/src/pages/operations/ImprovementRequests.jsx`
  - `frontend/src/pages/operations/PackImprovementHistory.jsx`
- Router/Menu
  - `frontend/src/App.jsx`
  - `frontend/src/components/Layout/AdminLayout.jsx`
  - `backend/seed_intent_factory_menus.py`

### Mock 기준 화면

- 프로젝트 목록/선택: `project-list-selection-v1.html`
- 구축 워크플로우 대시보드: `workflow-dashboard-v1.html`
- 1~12단계 구축 화면:
  - 기반 설정
  - 지식 준비
  - 의도 설계
  - 질문 커버리지
  - 용어 사전
  - 답변 근거
  - 실행 연결
  - Pack 품질검증
  - Runtime 시뮬레이션
  - Pack Build
  - 배포/활성화
  - 운영 분석/개선
- 관리성 화면: `admin-management-screens-v1.html`
- 공통 확인 모달: `common-confirm-modals-v1.html`

---

## 1. 개발 범위

### 1차 개발 범위: 구축 UX Shell 및 1~7단계

목표는 운영자가 프로젝트를 선택하고, 현재 단계와 다음 작업을 이해하며, 기존 구현된 Intent/FAQ/Action 기능으로 자연스럽게 이동할 수 있게 하는 것이다.

포함:

- 프로젝트 목록/선택 화면 고도화
- 구축 워크플로우 대시보드 v1
- 공통 `WorkflowStepper`
- 공통 `WorkflowStatusCard`
- 공통 `WorkflowActionBar`
- 1~7단계 화면 Shell
- 기존 화면 연결
  - 프로젝트 관리
  - Source/검색 테스트
  - Intent 관리
  - Entity/Synonym
  - FAQ/답변 근거
  - Action 관리

제외:

- Pack Build ZIP 생성 로직 신규 구현
- 다중 승인 Workflow 완성
- 운영 리포트 PDF 생성
- 권한별 세부 UI 제어 완성

### 2차 개발 범위: Pack 검증/Runtime/Build/배포/운영 개선

목표는 8~12단계를 실제 Pack 제작/검증/배포/운영 개선 흐름과 연결하는 것이다.

포함:

- Pack 품질검증 화면 고도화
- Runtime 시뮬레이션 화면 고도화
- Pack Build 화면 고도화
- 배포/활성화 화면 고도화
- 운영 분석/개선 화면 고도화
- 새 Draft Pack 시작 흐름
- 개선 후보와 Draft Pack 연결

### 3차 개발 범위: 관리성 화면 및 운영 안전장치

목표는 상용 운영에 필요한 통제, 감사, 리포트, 모달 정책을 완성하는 것이다.

포함:

- Pack Repository 고도화
- 승인/반려 이력 화면
- Action 실행 테스트 고도화
- 운영 리포트 화면
- 감사 로그 화면
- 공통 확인 모달
- 위험 작업 확인 문구
- 감사 로그 기록 일관화

---

## 2. 파일 구조 계획

### Frontend 생성 파일

- Create: `frontend/src/components/workflow/WorkflowStepper.jsx`
  - 1~12단계 슬라이딩 단계 네비게이션 공통 컴포넌트.
- Create: `frontend/src/components/workflow/WorkflowKpiCard.jsx`
  - 단계/대시보드 KPI 카드.
- Create: `frontend/src/components/workflow/WorkflowActionBar.jsx`
  - 하단 고정 액션 바.
- Create: `frontend/src/components/workflow/WorkflowGatePanel.jsx`
  - 완료 조건, 다음 단계 조건, 차단 요소 표시.
- Create: `frontend/src/components/common/ConfirmModal.jsx`
  - 승인/반려/Active 전환/Rollback/비활성화/새 Draft Pack 확인 모달.
- Create: `frontend/src/pages/workflow/WorkflowDashboardV2.jsx`
  - 구축 워크플로우 대시보드.
- Create: `frontend/src/pages/workflow/ProjectSelectionDashboard.jsx`
  - 프로젝트 목록/선택 화면.
- Create: `frontend/src/pages/workflow/WorkflowStagePage.jsx`
  - 단계별 공통 Shell.
- Create: `frontend/src/pages/workflow/stages/FoundationStage.jsx`
- Create: `frontend/src/pages/workflow/stages/KnowledgeStage.jsx`
- Create: `frontend/src/pages/workflow/stages/IntentDesignStage.jsx`
- Create: `frontend/src/pages/workflow/stages/QuestionCoverageStage.jsx`
- Create: `frontend/src/pages/workflow/stages/TermDictionaryStage.jsx`
- Create: `frontend/src/pages/workflow/stages/AnswerEvidenceStage.jsx`
- Create: `frontend/src/pages/workflow/stages/ActionConnectionStage.jsx`
- Create: `frontend/src/pages/workflow/stages/PackValidationStage.jsx`
- Create: `frontend/src/pages/workflow/stages/RuntimeSimulationStage.jsx`
- Create: `frontend/src/pages/workflow/stages/PackBuildStage.jsx`
- Create: `frontend/src/pages/workflow/stages/DeployActivateStage.jsx`
- Create: `frontend/src/pages/workflow/stages/OpsImprovementStage.jsx`
- Create: `frontend/src/pages/admin/ApprovalHistory.jsx`
- Create: `frontend/src/pages/admin/AuditLog.jsx`
- Create: `frontend/src/pages/admin/OpsReport.jsx`
- Create: `frontend/src/api/workflow.js`
  - Workflow API client.

### Frontend 수정 파일

- Modify: `frontend/src/App.jsx`
  - 신규 라우트 추가.
- Modify: `frontend/src/components/Layout/AdminLayout.jsx`
  - 프로젝트 선택 컨텍스트 표시 및 메뉴 활성화 기준 보강.
- Modify: `frontend/src/pages/WorkflowDashboard.jsx`
  - 기존 경로 호환을 위해 `WorkflowDashboardV2`로 연결하거나 교체.
- Modify: `frontend/src/pages/ProjectList.jsx`
  - 프로젝트 선택 화면과 역할 중복 정리.
- Modify: `frontend/src/pages/packs/PackRepository.jsx`
  - 관리성 화면 Mock 기준으로 상세/이력 액션 보강.
- Modify: `frontend/src/pages/runtime/ActionTest.jsx`
  - Action 단독 실행 진단 UI 보강.

### Backend 생성 파일

- Create: `backend/app/schemas/workflow.py`
  - Workflow summary, stage status, improvement draft payload 스키마.
- Create: `backend/app/services/workflow_service.py`
  - 단계 상태 집계, 완료 조건 계산, 다음 작업 추천.
- Create: `backend/app/api/workflow.py`
  - Workflow Dashboard API.
- Create: `backend/test_workflow_service.py`
- Create: `backend/test_workflow_api.py`

### Backend 수정 파일

- Modify: `backend/app/main.py`
  - `workflow` router 등록.
- Modify: `backend/app/core/intent_factory_schema.py`
  - 필요한 경우 workflow 상태, improvement request, audit log 확장 테이블 추가.
- Modify: `backend/app/services/pack_store_service.py`
  - 승인/반려/Active/Rollback 이벤트를 workflow summary와 감사 로그에서 조회 가능하게 정리.
- Modify: `backend/app/services/intent_factory_service.py`
  - Intent/Entity/FAQ/Action 집계 API 재사용 포인트 정리.
- Modify: `backend/seed_intent_factory_menus.py`
  - 신규 메뉴/라우트 등록.

---

## 3. Backend API 설계

### Workflow Dashboard API

```http
GET /api/v1/workflow/projects
GET /api/v1/workflow/projects/{project_id}/summary
GET /api/v1/workflow/projects/{project_id}/stages
GET /api/v1/workflow/projects/{project_id}/next-actions
POST /api/v1/workflow/projects/{project_id}/draft-packs
POST /api/v1/workflow/projects/{project_id}/stage-events
```

### 응답 예시

```json
{
  "project_id": "J-Brain",
  "project_name": "J-Brain",
  "active_pack_version": "v0.1.0",
  "draft_pack_version": "v0.2.0",
  "current_stage": 7,
  "overall_progress": 58,
  "blocked_count": 2,
  "next_action": {
    "type": "OPEN_STAGE",
    "stage": 7,
    "title": "미연결 Intent 4개를 먼저 정리하세요",
    "target_url": "/admin/workflow/projects/J-Brain/stages/7"
  }
}
```

### Stage Status 모델

```json
{
  "stage": 7,
  "stage_key": "action_connection",
  "name": "실행 연결",
  "status": "in_progress",
  "progress": 78,
  "can_enter": true,
  "locked_reason": null,
  "checks": [
    {
      "key": "unlinked_intents",
      "label": "미연결 Intent 정리",
      "status": "warning",
      "count": 4
    }
  ]
}
```

---

## 4. 단계별 완료 조건

| 단계 | 완료 조건 | 기존 연결 |
|---|---|---|
| 1 기반 설정 | 프로젝트명, 상태, 담당자, 목표 일정 저장 | `projects.py`, `ProjectDetail.jsx` |
| 2 지식 준비 | Source 1건 이상, 벡터화 완료 Source, 검색 테스트 통과 | `SourceList.jsx`, `RetrievalTest.jsx` |
| 3 의도 설계 | 대표 Intent 등록, Action 유형 초안 지정 | `IntentList.jsx`, `IntentDetail.jsx` |
| 4 질문 커버리지 | Intent별 예문 최소 수 충족 | `IntentDetail.jsx`, `intent_factory_service.py` |
| 5 용어 사전 | Entity/Synonym 등록, 중복 검토 | `EntityList.jsx` |
| 6 답변 근거 | FAQ 확정, Source 근거 연결 | `FaqList.jsx`, `search_doc_action.py` |
| 7 실행 연결 | Intent별 Action 연결, 실행 테스트 통과 | `ActionList.jsx`, `ActionTest.jsx` |
| 8 Pack 품질검증 | 필수 검증 질문 Pass | `PackValidation.jsx`, `pack_validation_service.py` |
| 9 Runtime 시뮬레이션 | 대표 질문 Runtime QA 통과 | `ProjectQA.jsx`, `chat_runtime.py` |
| 10 Pack Build | Export 전 검증 Pass, ZIP 생성 | `PackBuilder.jsx`, `pack_export_service.py` |
| 11 배포/활성화 | Import 검증, 승인, Active 전환 | `PackDeployment.jsx`, `pack_store_service.py` |
| 12 운영 분석/개선 | 개선 후보 분류, Draft Pack 생성 가능 | `UnansweredAnalysis.jsx`, `ImprovementRequests.jsx` |

---

## 5. Task Plan

### Task 1: Workflow API 스키마와 서비스 뼈대

**Files:**
- Create: `backend/app/schemas/workflow.py`
- Create: `backend/app/services/workflow_service.py`
- Create: `backend/test_workflow_service.py`

- [ ] **Step 1: Workflow 서비스 테스트 작성**

```python
# backend/test_workflow_service.py
import pytest

from app.services.workflow_service import calculate_stage_summary


def test_calculate_stage_summary_marks_action_connection_in_progress():
    summary = calculate_stage_summary(
        {
            "project_id": "J-Brain",
            "source_count": 8,
            "vectorized_source_count": 6,
            "intent_count": 18,
            "intent_example_count": 42,
            "entity_count": 12,
            "synonym_count": 46,
            "confirmed_faq_count": 18,
            "action_count": 14,
            "target_action_count": 18,
            "pack_validation_passed": False,
        }
    )

    assert summary["current_stage"] == 7
    assert summary["overall_progress"] == 58
    stage7 = next(stage for stage in summary["stages"] if stage["stage"] == 7)
    assert stage7["status"] == "in_progress"
    assert stage7["progress"] == 78
    assert stage7["checks"][0]["key"] == "unlinked_intents"
    assert stage7["checks"][0]["count"] == 4
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
cd backend
python3 -m pytest test_workflow_service.py -v
```

Expected:

```text
ModuleNotFoundError: No module named 'app.services.workflow_service'
```

- [ ] **Step 3: 서비스 최소 구현**

```python
# backend/app/services/workflow_service.py
from __future__ import annotations


STAGE_NAMES = {
    1: "기반 설정",
    2: "지식 준비",
    3: "의도 설계",
    4: "질문 커버리지",
    5: "용어 사전",
    6: "답변 근거",
    7: "실행 연결",
    8: "Pack 품질검증",
    9: "Runtime 시뮬레이션",
    10: "Pack Build",
    11: "배포/활성화",
    12: "운영 분석/개선",
}


def calculate_stage_summary(metrics: dict) -> dict:
    target_actions = max(int(metrics.get("target_action_count", 0)), 1)
    action_count = int(metrics.get("action_count", 0))
    unlinked_actions = max(target_actions - action_count, 0)
    action_progress = min(round((action_count / target_actions) * 100), 100)

    completed_until = 6 if unlinked_actions else 7
    current_stage = 7 if unlinked_actions else 8

    stages = []
    for stage in range(1, 13):
      if stage <= completed_until:
          status = "done"
          progress = 100
      elif stage == current_stage:
          status = "in_progress"
          progress = action_progress if stage == 7 else 0
      else:
          status = "locked"
          progress = 0

      checks = []
      if stage == 7:
          checks.append(
              {
                  "key": "unlinked_intents",
                  "label": "미연결 Intent 정리",
                  "status": "warning" if unlinked_actions else "done",
                  "count": unlinked_actions,
              }
          )

      stages.append(
          {
              "stage": stage,
              "name": STAGE_NAMES[stage],
              "status": status,
              "progress": progress,
              "can_enter": status in {"done", "in_progress"},
              "locked_reason": None if status in {"done", "in_progress"} else "이전 단계 완료가 필요합니다.",
              "checks": checks,
          }
      )

    return {
        "project_id": metrics.get("project_id", ""),
        "current_stage": current_stage,
        "overall_progress": 58 if current_stage == 7 else round((completed_until / 12) * 100),
        "blocked_count": unlinked_actions,
        "stages": stages,
        "next_action": {
            "type": "OPEN_STAGE",
            "stage": current_stage,
            "title": "미연결 Intent를 먼저 정리하세요" if unlinked_actions else "Pack 품질검증을 시작하세요",
        },
    }
```

- [ ] **Step 4: 테스트 통과 확인**

Run:

```bash
cd backend
python3 -m pytest test_workflow_service.py -v
```

Expected:

```text
1 passed
```

### Task 2: Workflow API 추가

**Files:**
- Create: `backend/app/api/workflow.py`
- Modify: `backend/app/main.py`
- Test: `backend/test_workflow_api.py`

- [ ] **Step 1: API 계약 테스트 작성**

```python
# backend/test_workflow_api.py
from fastapi.testclient import TestClient

from app.main import app


def test_workflow_summary_mock_contract():
    client = TestClient(app)
    response = client.get("/api/v1/workflow/projects/J-Brain/summary")

    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == "J-Brain"
    assert data["current_stage"] >= 1
    assert len(data["stages"]) == 12
    assert "next_action" in data
```

- [ ] **Step 2: API 라우터 구현**

```python
# backend/app/api/workflow.py
from fastapi import APIRouter

from app.services.workflow_service import calculate_stage_summary

router = APIRouter()


@router.get("/projects/{project_id}/summary")
async def get_workflow_summary(project_id: str) -> dict:
    metrics = {
        "project_id": project_id,
        "source_count": 8,
        "vectorized_source_count": 6,
        "intent_count": 18,
        "intent_example_count": 42,
        "entity_count": 12,
        "synonym_count": 46,
        "confirmed_faq_count": 18,
        "action_count": 14,
        "target_action_count": 18,
        "pack_validation_passed": False,
    }
    return calculate_stage_summary(metrics)
```

- [ ] **Step 3: main router 등록**

```python
# backend/app/main.py
from app.api import workflow

app.include_router(
    workflow.router,
    prefix="/api/v1/workflow",
    tags=["workflow"],
)
```

- [ ] **Step 4: 테스트 실행**

Run:

```bash
cd backend
python3 -m pytest test_workflow_service.py test_workflow_api.py -v
```

Expected:

```text
2 passed
```

### Task 3: Frontend Workflow 공통 컴포넌트

**Files:**
- Create: `frontend/src/components/workflow/WorkflowStepper.jsx`
- Create: `frontend/src/components/workflow/WorkflowKpiCard.jsx`
- Create: `frontend/src/components/workflow/WorkflowActionBar.jsx`
- Create: `frontend/src/components/workflow/WorkflowGatePanel.jsx`

- [ ] **Step 1: `WorkflowStepper` 작성**

```jsx
// frontend/src/components/workflow/WorkflowStepper.jsx
import React from 'react';

const statusLabel = {
  done: '완료',
  in_progress: '진행 중',
  locked: '잠금',
  waiting: '대기',
};

const WorkflowStepper = ({ stages = [], currentStage, onStageClick }) => {
  return (
    <section className="workflow-stepper">
      <button className="workflow-arrow" type="button" aria-label="이전 단계">&lt;</button>
      <div className="workflow-track">
        {stages.map((stage) => (
          <button
            key={stage.stage}
            type="button"
            className={`workflow-stage-card ${stage.status} ${stage.stage === currentStage ? 'current' : ''}`}
            onClick={() => stage.can_enter && onStageClick?.(stage)}
            disabled={!stage.can_enter}
            title={stage.locked_reason || stage.name}
          >
            <span className="workflow-stage-no">{String(stage.stage).padStart(2, '0')}</span>
            <strong>{stage.name}</strong>
            <small>{statusLabel[stage.status] || stage.status}</small>
          </button>
        ))}
      </div>
      <button className="workflow-arrow" type="button" aria-label="다음 단계">&gt;</button>
    </section>
  );
};

export default WorkflowStepper;
```

- [ ] **Step 2: `WorkflowKpiCard` 작성**

```jsx
// frontend/src/components/workflow/WorkflowKpiCard.jsx
import React from 'react';

const WorkflowKpiCard = ({ label, value, sub }) => (
  <div className="workflow-kpi-card">
    <div className="workflow-kpi-label">{label}</div>
    <div className="workflow-kpi-value">{value}</div>
    {sub && <div className="workflow-kpi-sub">{sub}</div>}
  </div>
);

export default WorkflowKpiCard;
```

- [ ] **Step 3: `WorkflowActionBar` 작성**

```jsx
// frontend/src/components/workflow/WorkflowActionBar.jsx
import React from 'react';

const WorkflowActionBar = ({ note, children }) => (
  <section className="workflow-action-bar">
    <div className="workflow-action-note">{note}</div>
    <div className="workflow-action-buttons">{children}</div>
  </section>
);

export default WorkflowActionBar;
```

- [ ] **Step 4: `WorkflowGatePanel` 작성**

```jsx
// frontend/src/components/workflow/WorkflowGatePanel.jsx
import React from 'react';

const WorkflowGatePanel = ({ title = '완료 조건', checks = [] }) => (
  <aside className="workflow-gate-panel">
    <h3>{title}</h3>
    <div className="workflow-check-list">
      {checks.map((check) => (
        <div className="workflow-check" key={check.key || check.label}>
          <span className={`workflow-dot ${check.status}`}>{check.status === 'done' ? '✓' : '!'}</span>
          <span>{check.label}</span>
          <strong>{check.count ?? check.status}</strong>
        </div>
      ))}
    </div>
  </aside>
);

export default WorkflowGatePanel;
```

- [ ] **Step 5: Frontend build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

### Task 4: 프로젝트 목록/선택 화면

**Files:**
- Create: `frontend/src/pages/workflow/ProjectSelectionDashboard.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: 페이지 작성**

```jsx
// frontend/src/pages/workflow/ProjectSelectionDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const projects = [
  {
    id: 'J-Brain',
    name: 'J-Brain',
    description: '폐쇄망 Runtime Pack 기반 공통 챗봇 플랫폼',
    status: '구축 중',
    stage: '7. 실행 연결',
    draftPack: 'v0.2.0',
    activePack: 'v0.1.0',
    progress: 58,
  },
  {
    id: 'KT-NetZero',
    name: 'KT NetZero',
    description: '탄소중립 플랫폼 FAQ/문서 검색 챗봇',
    status: '운영 중',
    stage: '12. 운영 분석',
    draftPack: 'v1.3.0',
    activePack: 'v1.2.0',
    progress: 100,
  },
];

const ProjectSelectionDashboard = () => {
  const navigate = useNavigate();

  const selectProject = (projectId) => {
    localStorage.setItem('jbrain_current_project_id', projectId);
    navigate(`/admin/workflow/projects/${projectId}`);
  };

  return (
    <div className="inner workflow-page">
      <div className="workflow-page-header">
        <div>
          <div className="workflow-eyebrow">프로젝트 준비 &gt; 프로젝트 관리</div>
          <h1>프로젝트 목록/선택</h1>
        </div>
        <button className="primary-btn" onClick={() => navigate('/admin/projects/new')}>새 프로젝트 등록</button>
      </div>
      <div className="workflow-project-grid">
        {projects.map((project) => (
          <section className="workflow-project-card" key={project.id}>
            <div className="workflow-project-card-head">
              <div>
                <h2>{project.name}</h2>
                <p>{project.description}</p>
              </div>
              <span className="status-chip">{project.status}</span>
            </div>
            <div className="workflow-project-meta">
              <div><small>현재 단계</small><strong>{project.stage}</strong></div>
              <div><small>Draft Pack</small><strong>{project.draftPack}</strong></div>
              <div><small>Active Pack</small><strong>{project.activePack}</strong></div>
            </div>
            <div className="workflow-progress"><span style={{ width: `${project.progress}%` }} /></div>
            <div className="workflow-project-actions">
              <button onClick={() => navigate(`/admin/projects/${project.id}`)}>설정</button>
              <button className="primary-btn" onClick={() => selectProject(project.id)}>선택</button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ProjectSelectionDashboard;
```

- [ ] **Step 2: 라우트 추가**

```jsx
// frontend/src/App.jsx
import ProjectSelectionDashboard from './pages/workflow/ProjectSelectionDashboard';

<Route path="workflow/projects" element={<ProjectSelectionDashboard />} />
```

- [ ] **Step 3: Build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

### Task 5: 구축 워크플로우 대시보드

**Files:**
- Create: `frontend/src/api/workflow.js`
- Create: `frontend/src/pages/workflow/WorkflowDashboardV2.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/WorkflowDashboard.jsx`

- [ ] **Step 1: API client 작성**

```js
// frontend/src/api/workflow.js
import axios from 'axios';

export const getWorkflowSummary = async (projectId) => {
  const response = await axios.get(`/api/v1/workflow/projects/${projectId}/summary`);
  return response.data;
};
```

- [ ] **Step 2: 대시보드 페이지 작성**

```jsx
// frontend/src/pages/workflow/WorkflowDashboardV2.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWorkflowSummary } from '../../api/workflow';
import WorkflowStepper from '../../components/workflow/WorkflowStepper';
import WorkflowKpiCard from '../../components/workflow/WorkflowKpiCard';
import WorkflowGatePanel from '../../components/workflow/WorkflowGatePanel';
import WorkflowActionBar from '../../components/workflow/WorkflowActionBar';

const WorkflowDashboardV2 = () => {
  const navigate = useNavigate();
  const { projectId = localStorage.getItem('jbrain_current_project_id') || 'J-Brain' } = useParams();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getWorkflowSummary(projectId).then(setSummary);
  }, [projectId]);

  if (!summary) return <div className="inner">워크플로우 정보를 불러오는 중입니다.</div>;

  const currentStage = summary.stages.find((stage) => stage.stage === summary.current_stage);

  return (
    <div className="inner workflow-page">
      <div className="workflow-page-header">
        <div>
          <div className="workflow-eyebrow">대시보드 &gt; 구축 워크플로우</div>
          <h1>구축 워크플로우 대시보드</h1>
        </div>
        <button onClick={() => navigate('/admin/workflow/projects')}>프로젝트 변경</button>
      </div>
      <WorkflowStepper
        stages={summary.stages}
        currentStage={summary.current_stage}
        onStageClick={(stage) => navigate(`/admin/workflow/projects/${projectId}/stages/${stage.stage}`)}
      />
      <div className="workflow-kpi-grid">
        <WorkflowKpiCard label="전체 진행률" value={`${summary.overall_progress}%`} sub="12단계 기준" />
        <WorkflowKpiCard label="현재 단계" value={`${summary.current_stage}단계`} sub={currentStage?.name} />
        <WorkflowKpiCard label="차단 요소" value={`${summary.blocked_count}건`} sub="다음 단계 이동 조건" />
        <WorkflowKpiCard label="다음 작업" value="Action" sub={summary.next_action.title} />
      </div>
      <div className="workflow-dashboard-grid">
        <section className="workflow-stage-grid">
          {summary.stages.map((stage) => (
            <button
              key={stage.stage}
              className={`workflow-stage-tile ${stage.status}`}
              onClick={() => stage.can_enter && navigate(`/admin/workflow/projects/${projectId}/stages/${stage.stage}`)}
              disabled={!stage.can_enter}
            >
              <span>{String(stage.stage).padStart(2, '0')}</span>
              <strong>{stage.name}</strong>
              <small>{stage.progress}%</small>
            </button>
          ))}
        </section>
        <WorkflowGatePanel title="현재 단계 체크" checks={currentStage?.checks || []} />
      </div>
      <WorkflowActionBar note={summary.next_action.title}>
        <button>진행 리포트</button>
        <button className="primary-btn" onClick={() => navigate(`/admin/workflow/projects/${projectId}/stages/${summary.current_stage}`)}>
          현재 단계 열기
        </button>
      </WorkflowActionBar>
    </div>
  );
};

export default WorkflowDashboardV2;
```

- [ ] **Step 3: 기존 WorkflowDashboard 연결**

```jsx
// frontend/src/pages/WorkflowDashboard.jsx
export { default } from './workflow/WorkflowDashboardV2';
```

- [ ] **Step 4: 라우트 추가**

```jsx
// frontend/src/App.jsx
import WorkflowDashboardV2 from './pages/workflow/WorkflowDashboardV2';

<Route path="workflow/projects/:projectId" element={<WorkflowDashboardV2 />} />
```

- [ ] **Step 5: Backend + Frontend 확인**

Run:

```bash
cd backend
python3 -m pytest test_workflow_service.py test_workflow_api.py -v
cd ../frontend
npm run build
```

Expected:

```text
2 passed
built in
```

### Task 6: 1~7단계 Stage Shell

**Files:**
- Create: `frontend/src/pages/workflow/WorkflowStagePage.jsx`
- Create: `frontend/src/pages/workflow/stages/*.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: 단계 페이지 라우터 작성**

```jsx
// frontend/src/pages/workflow/WorkflowStagePage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import FoundationStage from './stages/FoundationStage';
import KnowledgeStage from './stages/KnowledgeStage';
import IntentDesignStage from './stages/IntentDesignStage';
import QuestionCoverageStage from './stages/QuestionCoverageStage';
import TermDictionaryStage from './stages/TermDictionaryStage';
import AnswerEvidenceStage from './stages/AnswerEvidenceStage';
import ActionConnectionStage from './stages/ActionConnectionStage';

const stageComponents = {
  1: FoundationStage,
  2: KnowledgeStage,
  3: IntentDesignStage,
  4: QuestionCoverageStage,
  5: TermDictionaryStage,
  6: AnswerEvidenceStage,
  7: ActionConnectionStage,
};

const WorkflowStagePage = () => {
  const { stageNo } = useParams();
  const StageComponent = stageComponents[Number(stageNo)] || ActionConnectionStage;
  return <StageComponent />;
};

export default WorkflowStagePage;
```

- [ ] **Step 2: 7단계 우선 구현**

```jsx
// frontend/src/pages/workflow/stages/ActionConnectionStage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowActionBar from '../../../components/workflow/WorkflowActionBar';

const ActionConnectionStage = () => {
  const navigate = useNavigate();

  return (
    <div className="inner workflow-page">
      <div className="workflow-page-header">
        <div>
          <div className="workflow-eyebrow">7단계 실행 연결</div>
          <h1>Intent 실행 연결</h1>
        </div>
      </div>
      <div className="workflow-two-column">
        <section className="workflow-card">
          <h2>Intent와 Action 연결</h2>
          <p>Intent가 Runtime에서 실행할 Action 유형과 검색/화면/API 범위를 설정합니다.</p>
          <div className="workflow-action-type-grid">
            <button className="selected">SEARCH_DOC</button>
            <button>NAVIGATE</button>
            <button>API_CALL</button>
            <button>QUERY_EXECUTE</button>
          </div>
          <label>Action ID</label>
          <input value="action.search.pack_export_knowledge" disabled readOnly />
          <small>Action ID는 시스템이 자동 생성합니다.</small>
          <label>Action 이름</label>
          <input defaultValue="Pack Export 지식 검색" />
        </section>
        <aside className="workflow-card">
          <h2>완료 조건</h2>
          <p>미연결 Intent 4개와 권한 조건 5개를 정리해야 합니다.</p>
        </aside>
      </div>
      <WorkflowActionBar note="미연결 Intent 4개를 정리하면 Pack 품질검증 단계로 이동할 수 있습니다.">
        <button>임시 저장</button>
        <button className="primary-btn">Action 연결 저장</button>
        <button onClick={() => navigate('/admin/packs/validation')}>Pack 품질검증 열기</button>
      </WorkflowActionBar>
    </div>
  );
};

export default ActionConnectionStage;
```

- [ ] **Step 3: 1~6단계는 기존 화면 연결 중심 Shell로 구현**

각 단계 파일은 다음 기준으로 최소 구현한다.

```jsx
// 예: frontend/src/pages/workflow/stages/KnowledgeStage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const KnowledgeStage = () => {
  const navigate = useNavigate();
  return (
    <div className="inner workflow-page">
      <div className="workflow-page-header">
        <div>
          <div className="workflow-eyebrow">2단계 지식 준비</div>
          <h1>Source 수집 및 벡터화 준비</h1>
        </div>
      </div>
      <div className="workflow-card-grid">
        <button onClick={() => navigate('/admin/knowledge/sources/new')}>문서 업로드</button>
        <button onClick={() => navigate('/admin/intent-factory/faqs')}>FAQ 원천/후보 관리</button>
        <button onClick={() => navigate('/admin/knowledge/search-test')}>검색 테스트</button>
      </div>
    </div>
  );
};

export default KnowledgeStage;
```

- [ ] **Step 4: 라우트 추가**

```jsx
// frontend/src/App.jsx
import WorkflowStagePage from './pages/workflow/WorkflowStagePage';

<Route path="workflow/projects/:projectId/stages/:stageNo" element={<WorkflowStagePage />} />
```

- [ ] **Step 5: Build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

### Task 7: 8~12단계 기존 기능 연결

**Files:**
- Create:
  - `frontend/src/pages/workflow/stages/PackValidationStage.jsx`
  - `frontend/src/pages/workflow/stages/RuntimeSimulationStage.jsx`
  - `frontend/src/pages/workflow/stages/PackBuildStage.jsx`
  - `frontend/src/pages/workflow/stages/DeployActivateStage.jsx`
  - `frontend/src/pages/workflow/stages/OpsImprovementStage.jsx`
- Modify: `frontend/src/pages/workflow/WorkflowStagePage.jsx`

- [ ] **Step 1: Stage map 확장**

```jsx
// frontend/src/pages/workflow/WorkflowStagePage.jsx
import PackValidationStage from './stages/PackValidationStage';
import RuntimeSimulationStage from './stages/RuntimeSimulationStage';
import PackBuildStage from './stages/PackBuildStage';
import DeployActivateStage from './stages/DeployActivateStage';
import OpsImprovementStage from './stages/OpsImprovementStage';

const stageComponents = {
  1: FoundationStage,
  2: KnowledgeStage,
  3: IntentDesignStage,
  4: QuestionCoverageStage,
  5: TermDictionaryStage,
  6: AnswerEvidenceStage,
  7: ActionConnectionStage,
  8: PackValidationStage,
  9: RuntimeSimulationStage,
  10: PackBuildStage,
  11: DeployActivateStage,
  12: OpsImprovementStage,
};
```

- [ ] **Step 2: 8단계 Pack 검증 연결**

```jsx
// frontend/src/pages/workflow/stages/PackValidationStage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PackValidationStage = () => {
  const navigate = useNavigate();
  return (
    <div className="inner workflow-page">
      <div className="workflow-page-header">
        <div>
          <div className="workflow-eyebrow">8단계 Pack 품질검증</div>
          <h1>검증 질문 기반 품질 게이트</h1>
        </div>
      </div>
      <div className="workflow-card">
        <p>검증 질문, 기대 Intent, 기대 Action, 최소 Confidence를 기준으로 Pack 품질을 확인합니다.</p>
        <button className="primary-btn" onClick={() => navigate('/admin/packs/validation')}>Pack 검증 화면 열기</button>
      </div>
    </div>
  );
};

export default PackValidationStage;
```

- [ ] **Step 3: 9~12단계도 기존 화면 연결**

연결 기준:

- 9 Runtime 시뮬레이션 → `/admin/runtime/qa`
- 10 Pack Build → `/admin/packs/builder`
- 11 배포/활성화 → `/admin/packs/deployment`
- 12 운영 분석/개선 → `/admin/operations/unanswered`, `/admin/operations/improvement-requests`

- [ ] **Step 4: Build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

### Task 8: 공통 확인 모달

**Files:**
- Create: `frontend/src/components/common/ConfirmModal.jsx`
- Modify:
  - `frontend/src/pages/packs/PackDeployment.jsx`
  - `frontend/src/pages/packs/PackRepository.jsx`
  - `frontend/src/pages/operations/ImprovementRequests.jsx`

- [ ] **Step 1: ConfirmModal 작성**

```jsx
// frontend/src/components/common/ConfirmModal.jsx
import React from 'react';

const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  children,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirm-modal-head">
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <div className="confirm-modal-body">{children}</div>
        <div className="confirm-modal-actions">
          <button onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'danger-btn' : 'primary-btn'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmModal;
```

- [ ] **Step 2: 새 Draft Pack 시작 모달 연결**

```jsx
// 사용 예: ImprovementRequests.jsx
<ConfirmModal
  open={draftModalOpen}
  title="새 Draft Pack을 시작하시겠습니까?"
  description="현재 Active Pack을 기준으로 개선 작업용 Draft Pack을 생성합니다."
  confirmLabel="Draft 생성"
  onCancel={() => setDraftModalOpen(false)}
  onConfirm={createDraftPack}
>
  <div className="confirm-summary">
    <div>기준 Pack: J-Brain v0.2.0 Active</div>
    <div>새 Draft: J-Brain v0.3.0 Draft</div>
    <div>포함 개선 후보: 12건</div>
  </div>
</ConfirmModal>
```

- [ ] **Step 3: Build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

### Task 9: 메뉴/라우팅 정리

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `backend/seed_intent_factory_menus.py`

- [ ] **Step 1: 라우트 목록 확정**

추가/정리할 라우트:

```text
/admin/workflow/projects
/admin/workflow/projects/:projectId
/admin/workflow/projects/:projectId/stages/:stageNo
/admin/admin/approval-history
/admin/admin/audit-log
/admin/operations/reports
```

- [ ] **Step 2: 메뉴 Seed 업데이트**

메뉴 구조:

```text
대시보드
- 운영 현황
- 구축 워크플로우

프로젝트 준비
- 프로젝트 관리
- 지식 준비
- Source 관리
- 검색 테스트

Intent Factory
- Intent 관리
- 질문패턴 관리
- Entity/Synonym 관리
- FAQ 관리
- 답변 근거 관리
- Action 관리

Pack 제작/배포
- Pack Builder
- Pack 검증
- Pack Repository
- 배포/활성화
- 승인/반려 이력

Runtime 테스트
- Runtime QA
- Action 실행 테스트

운영 및 분석
- 사용 로그 조회
- 미응답 질문 분석
- 개선 후보 관리
- 운영 리포트

시스템 관리
- 감사 로그
```

- [ ] **Step 3: 메뉴 Seed 실행**

Run:

```bash
cd backend
python3 seed_intent_factory_menus.py
```

Expected:

```text
Intent Factory 메뉴 seed 완료
```

### Task 10: 문서/WBS 반영

**Files:**
- Modify: `01.docs/01.산출물_JBrain/100.프로젝트계획/...`
- Create: `docs/superpowers/plans/2026-06-29-jwp-intent-factory-workflow-dashboard-12step-ux-next-prompt.md`

- [ ] **Step 1: WBS에 개발 단위 반영**

반영 항목:

- 1차: Workflow UX Shell
- 2차: Pack/Runtime/배포/운영 개선
- 3차: 관리성 화면/모달/감사/리포트

- [ ] **Step 2: 다음 실행 프롬프트 작성**

```markdown
$superpowers:subagent-driven-development

docs/superpowers/plans/2026-06-29-jwp-intent-factory-workflow-dashboard-12step-ux.md 계획서를 기준으로
1차 개발 범위인 프로젝트 목록/선택, 구축 워크플로우 대시보드, Workflow 공통 컴포넌트,
1~7단계 UX Shell 구현을 진행해 주세요.

수용 기준:
- backend workflow 서비스/API 테스트 통과
- frontend npm run build 통과
- /admin/workflow/projects
- /admin/workflow/projects/:projectId
- /admin/workflow/projects/:projectId/stages/:stageNo
  경로가 정상 렌더링되어야 합니다.
- 기존 Intent/Entity/FAQ/Action/Pack 기능은 깨지지 않아야 합니다.
```

---

## 6. 테스트 기준

### Backend

```bash
cd backend
python3 -m pytest \
  test_workflow_service.py \
  test_workflow_api.py \
  test_intent_factory_service.py \
  test_pack_export_service.py \
  test_pack_store_service.py \
  test_pack_validation_service.py \
  test_chat_runtime.py \
  -v
```

성공 기준:

```text
모든 테스트 PASS
```

### Frontend

```bash
cd frontend
npm run build
```

성공 기준:

```text
built in
```

### 화면 테스트

확인 경로:

```text
/admin/workflow/projects
/admin/workflow/projects/J-Brain
/admin/workflow/projects/J-Brain/stages/1
/admin/workflow/projects/J-Brain/stages/7
/admin/packs/validation
/admin/runtime/qa
/admin/packs/builder
/admin/packs/deployment
/admin/operations/unanswered
```

확인 항목:

- 프로젝트 선택 후 현재 프로젝트 기준이 유지된다.
- 구축 워크플로우 대시보드에서 현재 단계와 다음 작업이 표시된다.
- 완료 단계는 클릭 이동 가능하다.
- 잠금 단계는 이동 불가 사유가 표시된다.
- 1~7단계 Shell에서 기존 관리 화면으로 이동할 수 있다.
- Action ID는 운영자 입력값이 아니라 자동 생성/읽기 전용으로 표시된다.
- 새 Draft Pack 시작, Active 전환, Rollback은 확인 모달을 거친다.

---

## 7. 리스크 및 대응

- 리스크: 12단계를 한 번에 완성하려 하면 범위가 과도해진다.
  - 대응: 1차는 Workflow Shell과 기존 기능 연결 중심으로 완료한다.
- 리스크: 단계 완료 조건이 실제 데이터와 맞지 않을 수 있다.
  - 대응: `workflow_service.py`에서 계산 로직을 독립시켜 테스트로 고정한다.
- 리스크: 기존 메뉴와 신규 워크플로우 메뉴가 중복될 수 있다.
  - 대응: 좌측 메뉴는 주요 영역 중심, 등록/수정은 화면 내부 버튼으로 제한한다.
- 리스크: Runtime이 DB를 직접 읽는 구조로 오해될 수 있다.
  - 대응: Runtime은 계속 파일 Pack 기반으로 유지하고, DB는 Build/관리용으로만 사용한다.

---

## 8. Self-Review

- Spec coverage: Mock으로 정의한 프로젝트 목록/선택, 워크플로우 대시보드, 1~12단계, 관리성 화면, 공통 모달을 모두 Task에 매핑했다.
- Placeholder scan: `TBD`, `TODO`, `나중에 구현` 표현을 사용하지 않았다.
- Type consistency: Backend 응답 필드 `current_stage`, `overall_progress`, `stages`, `next_action`과 Frontend 사용 필드를 일치시켰다.
- Scope control: 1차는 UX Shell과 기존 기능 연결, 2차는 Pack/Runtime/운영 개선, 3차는 관리성 화면으로 분리했다.
