# 6단계 구축 워크플로우 UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 12단계 워크플로우를 운영자가 이해하기 쉬운 6단계 구축 워크플로우로 그룹화해 대시보드, 단계 화면, 좌측 메뉴에 적용한다.

**Architecture:** 백엔드의 12단계 저장/집계 구조는 유지하고, 프론트엔드에서 12단계를 6개 Phase로 변환한다. 각 6단계 화면은 기존 단계 컴포넌트를 탭으로 묶어 재사용하며, 메뉴는 6단계 중심으로 노출한다.

**Tech Stack:** React, React Router, Axios, FastAPI menu seed, CSS.

---

### Task 1: 6단계 Phase 모델 추가

**Files:**
- Create: `frontend/src/pages/workflow/workflowPhases.js`

- [ ] 12단계를 6단계로 묶는 `WORKFLOW_PHASES`, `buildWorkflowPhases`, `getPhaseByStageNo`를 추가한다.
- [ ] 각 Phase는 `phase`, `name`, `stageNumbers`, `tabs`, `status`, `progress`, `checks`, `next_actions`를 가진다.

### Task 2: 대시보드 6단계 전환

**Files:**
- Modify: `frontend/src/pages/workflow/WorkflowDashboardV2.jsx`

- [ ] `summary.stages`를 `buildWorkflowPhases(summary)`로 변환한다.
- [ ] 완료 단계, 현재 단계, 이슈 수, 단계 카드 목록을 6단계 기준으로 표시한다.
- [ ] 단계 카드 클릭 시 `/admin/workflow/projects/:projectId/stages/:phaseNo`로 이동한다.

### Task 3: 단계 상세 화면 6단계 전환

**Files:**
- Modify: `frontend/src/pages/workflow/WorkflowStagePage.jsx`

- [ ] URL의 `stageNo`를 6단계 Phase 번호로 해석한다.
- [ ] 6단계 Stepper를 표시한다.
- [ ] Phase 안에 포함된 기존 단계 컴포넌트를 탭으로 표시한다.
- [ ] 기존 우측 완료 조건은 Phase 합산 조건으로 표시한다.

### Task 4: 좌측 메뉴 6단계화

**Files:**
- Modify: `frontend/src/components/Layout/AdminLayout.jsx`
- Modify: `backend/app/core/menu_seed.py`

- [ ] 좌측 메뉴의 `프로젝트 선택/목록`과 12단계 메뉴를 숨기고 6단계 메뉴로 변환한다.
- [ ] 백엔드 메뉴 seed도 신규 설치/재시드 시 6단계로 생성되도록 수정한다.

### Task 5: 스타일 보강

**Files:**
- Modify: `frontend/src/index.css`

- [ ] Phase 탭, Phase 요약, 6단계 카드의 spacing을 보강한다.
- [ ] 기존 12단계 UI와 충돌하지 않게 새 클래스 중심으로 추가한다.

### Task 6: 검증

**Commands:**
- `npm run build`

- [ ] 프론트 빌드가 통과해야 한다.
- [ ] `/admin/workflow` 대시보드에서 6단계 카드가 표시되어야 한다.
- [ ] `/admin/workflow/projects/J-Brain/stages/3`에서 의도 설계 Phase 안에 Intent/질문 커버리지/용어 사전 탭이 보여야 한다.
- [ ] 좌측 메뉴에 6단계만 보여야 한다.
