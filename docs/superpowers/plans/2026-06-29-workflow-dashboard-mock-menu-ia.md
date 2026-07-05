# Workflow Dashboard Mock Layout 및 좌측 메뉴 IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mock `workflow-dashboard-v1.html`의 High-end 구축 워크플로우 대시보드 구성과 작업 순서형 좌측 메뉴를 실제 관리자 화면에 반영한다.

**Architecture:** `/admin/workflow`는 기본 프로젝트의 워크플로우 대시보드로 진입하고, 프로젝트 선택은 `/admin/workflow/projects`로 분리한다. 좌측 메뉴는 기능별 나열보다 구축 흐름을 먼저 보여주며, 기존 Intent/Source/FAQ/Action/Pack 화면은 관리 기능 영역으로 재배치한다.

**Tech Stack:** React, React Router, Axios, FastAPI menu seed, existing CSS variables, Vite.

---

### Task 1: Workflow 기본 진입 라우트

**Files:**
- Create: `frontend/src/pages/workflow/WorkflowEntry.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] `/admin/workflow` 접속 시 프로젝트 목록을 조회한다.
- [ ] 프로젝트가 있으면 첫 프로젝트의 `/admin/workflow/projects/:projectId`로 이동한다.
- [ ] 프로젝트가 없거나 조회 실패 시 `/admin/workflow/projects` 선택 화면으로 이동한다.

### Task 2: Mock Dashboard 레이아웃 적용

**Files:**
- Modify: `frontend/src/pages/workflow/WorkflowDashboardV2.jsx`
- Modify: `frontend/src/index.css`

- [ ] Mock의 상단 Topbar, Hero, AI 추천 다음 작업 카드, 12단계 카드 그리드, 현재 단계 체크, 프로젝트 상태, 최근 작업 이력, 리스크 카드, 하단 Action Bar 구조를 React 데이터 기반으로 재구성한다.
- [ ] 단계 카드 클릭 시 `/admin/workflow/projects/:projectId/stages/:stageNo`로 이동한다.
- [ ] 기존 `summary.stages`, `summary.metrics`, `summary.next_action` 데이터를 사용한다.

### Task 3: 좌측 메뉴 IA 정리

**Files:**
- Modify: `backend/app/core/menu_seed.py`
- Modify: `frontend/src/components/Layout/AdminLayout.jsx`

- [ ] 최상단에 `구축 워크플로우` 그룹을 배치한다.
- [ ] `워크플로우 대시보드`, `프로젝트 선택/목록`, `1~12단계` 메뉴를 추가한다.
- [ ] 기존 기능 메뉴는 `관리 기능`, `운영/분석`, `시스템 관리` 중심으로 재배치한다.
- [ ] 프로젝트 의존 URL은 현재 선택 프로젝트를 기준으로 보정한다.

### Task 4: 검증

**Files:**
- Test: `backend/test_menu_seed.py`
- Test: `frontend` build

- [ ] `python3 -m pytest test_menu_seed.py test_workflow_service.py test_workflow_api.py -v` 실행
- [ ] `npm run build` 실행
- [ ] 메뉴 seed 실행 후 좌측 메뉴가 새 IA로 노출되는지 확인
- [ ] `/admin/workflow`, `/admin/workflow/projects`, `/admin/workflow/projects/J-Brain` 확인

### Self-Review

- Mock 구성의 핵심 영역을 모두 React 화면에 대응시킨다.
- 등록/상세/수정 화면은 좌측 메뉴에 넣지 않고 각 관리 화면의 액션으로 유지한다.
- 외부 LLM/API 호출은 추가하지 않는다.
