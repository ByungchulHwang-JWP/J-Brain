# JWP Intent Factory 관리자 IA/Menu Shell v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JWP Intent Factory를 실서비스 운영 흐름에 맞게 재구성하여, 운영자가 프로젝트 등록부터 Source 등록, Intent 관리, Pack 제작, Runtime 테스트, 운영 개선까지 순서대로 사용할 수 있는 관리자 메뉴/화면 Shell v0.1을 구축한다.

**Architecture:** 기존 J-Brain 관리자 구조를 유지하되, 메뉴 IA를 고객 프로젝트 챗봇 구축 Lifecycle 기준으로 재배치한다. 백엔드는 `/api/v1/auth/menus`가 내려주는 DB 기반 메뉴 트리를 확장하고, 프론트엔드는 해당 메뉴 URL에 대응하는 라우트와 화면 Shell을 제공한다. 기존 Source/인덱싱/Runtime 테스트 기능은 새 메뉴 체계 아래로 이동시키고, Intent/Pack/운영 분석 화면은 현재 구현된 Intent Pack Loader, Intent Matcher, Chat Runtime API를 확인할 수 있는 운영형 Shell로 시작한다.

**Tech Stack:** FastAPI, SQLAlchemy AsyncSession, PostgreSQL, React, React Router, Axios, Vite, Python unittest

---

## 1. 배경과 방향

현재 J-Brain 관리자 화면은 `대시보드`, `지식 관리`, `챗봇 관리`, `권한 관리` 중심으로 구성되어 있다. 이 구조는 기존 GraphRAG 관리자 MVP에는 적합하지만, JWP Intent Factory 실서비스 운영자가 고객 프로젝트를 구축하는 순서를 이해하기에는 부족하다.

실서비스 운영 흐름은 다음 순서로 고정한다.

```text
프로젝트 등록
-> 고객 자료 수집 및 Source 등록
-> 문서 벡터화 및 인덱싱
-> Intent / Entity / Synonym / FAQ / Action 설계
-> Pack Builder로 Intent Pack 생성
-> Pack 검증 및 버전 생성
-> Runtime 테스트
-> 고객 내부망 Runtime / Widget 적용
-> 운영 모니터링 및 미응답 분석
-> Pack 개선 및 재배포
```

따라서 v0.1에서는 전체 CRUD를 완성하기보다, 운영자가 이 흐름을 화면에서 이해하고 기존 기능으로 바로 테스트할 수 있게 메뉴와 화면 골격을 먼저 정비한다.

## 2. v0.1 메뉴 구조

다음 메뉴 구조를 System Admin 기준으로 노출한다.

```text
대시보드
- 프로젝트 진행 현황

프로젝트 준비
- 프로젝트 목록
- 프로젝트 등록
- 고객사/서비스 정보
- 메뉴/화면/API 정보 관리

지식 자료 관리
- Source 목록
- Source 등록
- 벡터화 작업 현황
- 문서 Preview
- 검색 테스트

Intent Factory
- Intent 관리
- Entity 관리
- Synonym 관리
- FAQ 관리
- Action 관리
- LLM 지원 도구

Pack 제작/배포
- Pack Builder
- Pack 검증
- Pack Repository
- 버전 관리
- 배포 패키지 생성

Runtime 테스트
- 챗봇 대화 테스트
- Intent 매칭 테스트
- Action 실행 테스트
- 고객 위젯 미리보기

운영 및 개선
- 실시간 모니터링
- 사용 통계
- 미응답 분석
- 개선 요청 관리
- Pack 개선 이력

시스템 관리
- 사용자 관리
- 권한 관리
- 감사 로그
- 시스템 설정
```

## 3. 파일 구조

### Backend

- Modify: `backend/app/api/auth.py`
  - `/api/v1/auth/menus` 계약은 유지한다.
  - 메뉴 트리 조회 결과가 새 IA를 반환할 수 있도록 seed 결과를 검증한다.

- Create: `backend/app/core/menu_seed.py`
  - System Admin 기준 기본 메뉴 정의를 코드로 관리한다.
  - `graphrag.sys_menus`, `graphrag.sys_role_menus`에 idempotent upsert를 수행한다.

- Modify: `backend/app/main.py`
  - 개발/초기 실행 환경에서 메뉴 seed를 명시적으로 호출할지 판단한다.
  - 자동 실행이 위험하면 관리용 API 또는 스크립트에서만 실행한다.

- Create: `backend/test_menu_seed.py`
  - 메뉴 seed 정의의 parent/child 관계, URL, sort_order, role mapping을 검증한다.

- Modify: `backend/test_menu_contract.py`
  - 현재 App.jsx 문자열 확인 중심 테스트를 실제 메뉴 IA 계약 검증으로 보강한다.

### Frontend

- Modify: `frontend/src/App.jsx`
  - 새 메뉴 URL에 대응하는 라우트를 추가한다.
  - 기존 `SourceList`, `SourceNew`, `IndexJobList`, `ProjectQA`, `RetrievalTest`, `Stats`, `LogList`, `UserList`, `PermissionMap`을 새 URL에도 연결한다.

- Modify: `frontend/src/components/Layout/AdminLayout.jsx`
  - 새 icon_code 매핑을 추가한다.
  - 메뉴가 많아져도 스크롤과 active 상태가 안정적으로 동작하도록 유지한다.

- Create: `frontend/src/pages/intent-factory/IntentList.jsx`
  - 현재 Intent Pack의 Intent 목록을 보여주는 v0.1 화면.

- Create: `frontend/src/pages/intent-factory/EntityList.jsx`
  - 현재 Intent Pack의 Entity/Synonym 목록을 보여주는 v0.1 화면.

- Create: `frontend/src/pages/intent-factory/FaqList.jsx`
  - 현재 Intent Pack의 FAQ 목록을 보여주는 v0.1 화면.

- Create: `frontend/src/pages/intent-factory/ActionList.jsx`
  - 현재 Intent Pack의 Action 목록과 route/api/sql 연결 정보를 보여주는 v0.1 화면.

- Create: `frontend/src/pages/intent-factory/LlmAssist.jsx`
  - 외부망 Intent 생성 지원 도구 영역을 설명하고, 현재는 Pack 개선 입력 항목을 받을 수 있는 Shell 화면.

- Create: `frontend/src/pages/packs/PackBuilder.jsx`
  - 현재 로컬 Intent Pack 요약과 구성요소 검증 상태를 보여주는 v0.1 화면.

- Create: `frontend/src/pages/packs/PackValidation.jsx`
  - Pack validation 질문과 기대 결과를 보여주는 v0.1 화면.

- Create: `frontend/src/pages/packs/PackRepository.jsx`
  - `/api/v1/intent-packs` 목록을 보여주는 v0.1 화면.

- Create: `frontend/src/pages/packs/PackVersions.jsx`
  - Pack version, service_id, target_environment를 표시하는 v0.1 화면.

- Create: `frontend/src/pages/packs/PackDeployment.jsx`
  - 배포 패키지 생성 흐름을 보여주는 v0.1 화면.

- Create: `frontend/src/pages/runtime/ActionTest.jsx`
  - Action Router 테스트용 Shell 화면.

- Create: `frontend/src/pages/runtime/WidgetPreview.jsx`
  - 고객 사이트 위젯 미리보기 Shell 화면.

- Create: `frontend/src/pages/operations/RealtimeMonitoring.jsx`
  - Runtime 요청 수, fallback 수, 최근 log_id를 표시할 수 있는 Shell 화면.

- Create: `frontend/src/pages/operations/UnansweredAnalysis.jsx`
  - 미응답 로그를 조회하는 v0.1 화면.

- Create: `frontend/src/pages/operations/ImprovementRequests.jsx`
  - 미응답 기반 Pack 개선 요청 목록 Shell 화면.

- Create: `frontend/src/pages/operations/PackImprovementHistory.jsx`
  - Pack 개선 이력을 표시하는 Shell 화면.

- Create: `frontend/src/components/common/ShellPage.jsx`
  - v0.1 화면에서 공통으로 사용할 제목, 설명, 상태 카드, 연결 API 표시 컴포넌트.

## 4. URL 매핑

기존 URL은 가능하면 유지하고, 새 IA URL을 함께 제공한다.

```text
/admin/dashboard

/admin/projects
/admin/projects/new
/admin/project-settings/service
/admin/project-settings/integration-map

/admin/knowledge/sources
/admin/knowledge/sources/new
/admin/knowledge/jobs
/admin/knowledge/search-test

/admin/intent-factory/intents
/admin/intent-factory/entities
/admin/intent-factory/synonyms
/admin/intent-factory/faqs
/admin/intent-factory/actions
/admin/intent-factory/llm-assist

/admin/packs/builder
/admin/packs/validation
/admin/packs/repository
/admin/packs/versions
/admin/packs/deployment

/admin/runtime/qa
/admin/runtime/intent-match
/admin/runtime/action-test
/admin/runtime/widget-preview

/admin/operations/realtime
/admin/operations/stats
/admin/operations/unanswered
/admin/operations/improvement-requests
/admin/operations/pack-history

/admin/users
/admin/permissions
/admin/logs
/admin/system/settings
```

## 5. Task 1: 메뉴 Seed 정의 추가

**Files:**
- Create: `backend/app/core/menu_seed.py`
- Test: `backend/test_menu_seed.py`

- [ ] **Step 1: 메뉴 seed 테스트 작성**

Create `backend/test_menu_seed.py` with:

```python
import unittest

from app.core.menu_seed import INTENT_FACTORY_MENU_ITEMS, build_role_menu_rows


class MenuSeedTest(unittest.TestCase):
    def test_lifecycle_menu_groups_exist_in_order(self):
        roots = [item for item in INTENT_FACTORY_MENU_ITEMS if item["parent_id"] is None]
        titles = [item["menu_name"] for item in roots]

        self.assertEqual(
            titles,
            [
                "대시보드",
                "프로젝트 준비",
                "지식 자료 관리",
                "Intent Factory",
                "Pack 제작/배포",
                "Runtime 테스트",
                "운영 및 개선",
                "시스템 관리",
            ],
        )

    def test_each_child_has_existing_parent(self):
        ids = {item["id"] for item in INTENT_FACTORY_MENU_ITEMS}
        for item in INTENT_FACTORY_MENU_ITEMS:
            parent_id = item["parent_id"]
            if parent_id is not None:
                self.assertIn(parent_id, ids)

    def test_admin_role_mapping_covers_all_menu_items(self):
        rows = build_role_menu_rows("ROLE_ADMIN")
        menu_ids = {item["id"] for item in INTENT_FACTORY_MENU_ITEMS}
        mapped_ids = {row["menu_id"] for row in rows}

        self.assertEqual(mapped_ids, menu_ids)
        self.assertTrue(all(row["can_read"] for row in rows))
        self.assertTrue(all(row["can_write"] for row in rows))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
cd backend
python -m unittest test_menu_seed.py
```

Expected:

```text
ImportError: No module named 'app.core.menu_seed'
```

- [ ] **Step 3: 메뉴 seed 최소 구현**

Create `backend/app/core/menu_seed.py` with:

```python
from __future__ import annotations

from typing import Any


INTENT_FACTORY_MENU_ITEMS: list[dict[str, Any]] = [
    {"id": "MENU_DASHBOARD", "parent_id": None, "menu_name": "대시보드", "url": "/admin/dashboard", "sort_order": 10, "icon_code": "icon-dashboard"},
    {"id": "MENU_PROJECT_PREP", "parent_id": None, "menu_name": "프로젝트 준비", "url": None, "sort_order": 20, "icon_code": "icon-project"},
    {"id": "MENU_KNOWLEDGE", "parent_id": None, "menu_name": "지식 자료 관리", "url": None, "sort_order": 30, "icon_code": "icon-knowledge"},
    {"id": "MENU_INTENT_FACTORY", "parent_id": None, "menu_name": "Intent Factory", "url": None, "sort_order": 40, "icon_code": "icon-intent"},
    {"id": "MENU_PACK", "parent_id": None, "menu_name": "Pack 제작/배포", "url": None, "sort_order": 50, "icon_code": "icon-pack"},
    {"id": "MENU_RUNTIME", "parent_id": None, "menu_name": "Runtime 테스트", "url": None, "sort_order": 60, "icon_code": "icon-runtime"},
    {"id": "MENU_OPERATIONS", "parent_id": None, "menu_name": "운영 및 개선", "url": None, "sort_order": 70, "icon_code": "icon-operations"},
    {"id": "MENU_SYSTEM", "parent_id": None, "menu_name": "시스템 관리", "url": None, "sort_order": 80, "icon_code": "icon-settings"},

    {"id": "MENU_PROJECT_LIST", "parent_id": "MENU_PROJECT_PREP", "menu_name": "프로젝트 목록", "url": "/admin/projects", "sort_order": 21, "icon_code": None},
    {"id": "MENU_PROJECT_NEW", "parent_id": "MENU_PROJECT_PREP", "menu_name": "프로젝트 등록", "url": "/admin/projects/new", "sort_order": 22, "icon_code": None},
    {"id": "MENU_SERVICE_INFO", "parent_id": "MENU_PROJECT_PREP", "menu_name": "고객사/서비스 정보", "url": "/admin/project-settings/service", "sort_order": 23, "icon_code": None},
    {"id": "MENU_INTEGRATION_MAP", "parent_id": "MENU_PROJECT_PREP", "menu_name": "메뉴/화면/API 정보 관리", "url": "/admin/project-settings/integration-map", "sort_order": 24, "icon_code": None},

    {"id": "MENU_SOURCE_LIST", "parent_id": "MENU_KNOWLEDGE", "menu_name": "Source 목록", "url": "/admin/knowledge/sources", "sort_order": 31, "icon_code": None},
    {"id": "MENU_SOURCE_NEW", "parent_id": "MENU_KNOWLEDGE", "menu_name": "Source 등록", "url": "/admin/knowledge/sources/new", "sort_order": 32, "icon_code": None},
    {"id": "MENU_INDEX_JOBS", "parent_id": "MENU_KNOWLEDGE", "menu_name": "벡터화 작업 현황", "url": "/admin/knowledge/jobs", "sort_order": 33, "icon_code": None},
    {"id": "MENU_SEARCH_TEST", "parent_id": "MENU_KNOWLEDGE", "menu_name": "검색 테스트", "url": "/admin/knowledge/search-test", "sort_order": 34, "icon_code": None},

    {"id": "MENU_INTENTS", "parent_id": "MENU_INTENT_FACTORY", "menu_name": "Intent 관리", "url": "/admin/intent-factory/intents", "sort_order": 41, "icon_code": None},
    {"id": "MENU_ENTITIES", "parent_id": "MENU_INTENT_FACTORY", "menu_name": "Entity 관리", "url": "/admin/intent-factory/entities", "sort_order": 42, "icon_code": None},
    {"id": "MENU_SYNONYMS", "parent_id": "MENU_INTENT_FACTORY", "menu_name": "Synonym 관리", "url": "/admin/intent-factory/synonyms", "sort_order": 43, "icon_code": None},
    {"id": "MENU_FAQS", "parent_id": "MENU_INTENT_FACTORY", "menu_name": "FAQ 관리", "url": "/admin/intent-factory/faqs", "sort_order": 44, "icon_code": None},
    {"id": "MENU_ACTIONS", "parent_id": "MENU_INTENT_FACTORY", "menu_name": "Action 관리", "url": "/admin/intent-factory/actions", "sort_order": 45, "icon_code": None},
    {"id": "MENU_LLM_ASSIST", "parent_id": "MENU_INTENT_FACTORY", "menu_name": "LLM 지원 도구", "url": "/admin/intent-factory/llm-assist", "sort_order": 46, "icon_code": None},

    {"id": "MENU_PACK_BUILDER", "parent_id": "MENU_PACK", "menu_name": "Pack Builder", "url": "/admin/packs/builder", "sort_order": 51, "icon_code": None},
    {"id": "MENU_PACK_VALIDATION", "parent_id": "MENU_PACK", "menu_name": "Pack 검증", "url": "/admin/packs/validation", "sort_order": 52, "icon_code": None},
    {"id": "MENU_PACK_REPOSITORY", "parent_id": "MENU_PACK", "menu_name": "Pack Repository", "url": "/admin/packs/repository", "sort_order": 53, "icon_code": None},
    {"id": "MENU_PACK_VERSIONS", "parent_id": "MENU_PACK", "menu_name": "버전 관리", "url": "/admin/packs/versions", "sort_order": 54, "icon_code": None},
    {"id": "MENU_PACK_DEPLOYMENT", "parent_id": "MENU_PACK", "menu_name": "배포 패키지 생성", "url": "/admin/packs/deployment", "sort_order": 55, "icon_code": None},

    {"id": "MENU_RUNTIME_QA", "parent_id": "MENU_RUNTIME", "menu_name": "챗봇 대화 테스트", "url": "/admin/runtime/qa", "sort_order": 61, "icon_code": None},
    {"id": "MENU_RUNTIME_INTENT_MATCH", "parent_id": "MENU_RUNTIME", "menu_name": "Intent 매칭 테스트", "url": "/admin/runtime/intent-match", "sort_order": 62, "icon_code": None},
    {"id": "MENU_RUNTIME_ACTION_TEST", "parent_id": "MENU_RUNTIME", "menu_name": "Action 실행 테스트", "url": "/admin/runtime/action-test", "sort_order": 63, "icon_code": None},
    {"id": "MENU_RUNTIME_WIDGET_PREVIEW", "parent_id": "MENU_RUNTIME", "menu_name": "고객 위젯 미리보기", "url": "/admin/runtime/widget-preview", "sort_order": 64, "icon_code": None},

    {"id": "MENU_OPS_REALTIME", "parent_id": "MENU_OPERATIONS", "menu_name": "실시간 모니터링", "url": "/admin/operations/realtime", "sort_order": 71, "icon_code": None},
    {"id": "MENU_OPS_STATS", "parent_id": "MENU_OPERATIONS", "menu_name": "사용 통계", "url": "/admin/operations/stats", "sort_order": 72, "icon_code": None},
    {"id": "MENU_OPS_UNANSWERED", "parent_id": "MENU_OPERATIONS", "menu_name": "미응답 분석", "url": "/admin/operations/unanswered", "sort_order": 73, "icon_code": None},
    {"id": "MENU_OPS_IMPROVEMENTS", "parent_id": "MENU_OPERATIONS", "menu_name": "개선 요청 관리", "url": "/admin/operations/improvement-requests", "sort_order": 74, "icon_code": None},
    {"id": "MENU_OPS_PACK_HISTORY", "parent_id": "MENU_OPERATIONS", "menu_name": "Pack 개선 이력", "url": "/admin/operations/pack-history", "sort_order": 75, "icon_code": None},

    {"id": "MENU_USERS", "parent_id": "MENU_SYSTEM", "menu_name": "사용자 관리", "url": "/admin/users", "sort_order": 81, "icon_code": None},
    {"id": "MENU_PERMISSIONS", "parent_id": "MENU_SYSTEM", "menu_name": "권한 관리", "url": "/admin/permissions", "sort_order": 82, "icon_code": None},
    {"id": "MENU_AUDIT_LOGS", "parent_id": "MENU_SYSTEM", "menu_name": "감사 로그", "url": "/admin/logs", "sort_order": 83, "icon_code": None},
    {"id": "MENU_SYSTEM_SETTINGS", "parent_id": "MENU_SYSTEM", "menu_name": "시스템 설정", "url": "/admin/system/settings", "sort_order": 84, "icon_code": None},
]


def build_role_menu_rows(role_id: str) -> list[dict[str, Any]]:
    return [
        {
            "role_id": role_id,
            "menu_id": item["id"],
            "can_read": True,
            "can_write": True,
        }
        for item in INTENT_FACTORY_MENU_ITEMS
    ]
```

- [ ] **Step 4: 테스트 통과 확인**

Run:

```bash
cd backend
python -m unittest test_menu_seed.py
```

Expected:

```text
OK
```

- [ ] **Step 5: 커밋**

```bash
git add backend/app/core/menu_seed.py backend/test_menu_seed.py
git commit -m "feat: define intent factory lifecycle menu seed"
```

## 6. Task 2: 메뉴 DB 반영 경로 추가

**Files:**
- Modify: `backend/app/core/menu_seed.py`
- Test: `backend/test_menu_seed.py`

- [ ] **Step 1: upsert SQL 생성 테스트 추가**

Append to `backend/test_menu_seed.py`:

```python
    def test_menu_seed_contains_urls_for_leaf_items(self):
        for item in INTENT_FACTORY_MENU_ITEMS:
            has_children = any(child["parent_id"] == item["id"] for child in INTENT_FACTORY_MENU_ITEMS)
            if not has_children:
                self.assertIsInstance(item["url"], str)
                self.assertTrue(item["url"].startswith("/admin/"))
```

- [ ] **Step 2: 테스트 실행**

Run:

```bash
cd backend
python -m unittest test_menu_seed.py
```

Expected:

```text
OK
```

- [ ] **Step 3: DB upsert 함수 추가**

Append to `backend/app/core/menu_seed.py`:

```python
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def seed_intent_factory_menus(db: AsyncSession, role_id: str = "ROLE_ADMIN") -> dict[str, int]:
    for item in INTENT_FACTORY_MENU_ITEMS:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.sys_menus
                    (id, parent_id, menu_name, url, sort_order, icon_code, is_active)
                VALUES
                    (:id, :parent_id, :menu_name, :url, :sort_order, :icon_code, true)
                ON CONFLICT (id) DO UPDATE SET
                    parent_id = EXCLUDED.parent_id,
                    menu_name = EXCLUDED.menu_name,
                    url = EXCLUDED.url,
                    sort_order = EXCLUDED.sort_order,
                    icon_code = EXCLUDED.icon_code,
                    is_active = true
                """
            ),
            item,
        )

    for row in build_role_menu_rows(role_id):
        await db.execute(
            text(
                """
                INSERT INTO graphrag.sys_role_menus
                    (role_id, menu_id, can_read, can_write)
                VALUES
                    (:role_id, :menu_id, :can_read, :can_write)
                ON CONFLICT (role_id, menu_id) DO UPDATE SET
                    can_read = EXCLUDED.can_read,
                    can_write = EXCLUDED.can_write
                """
            ),
            row,
        )

    await db.commit()
    return {
        "menus": len(INTENT_FACTORY_MENU_ITEMS),
        "role_menus": len(INTENT_FACTORY_MENU_ITEMS),
    }
```

- [ ] **Step 4: 단위 테스트 재실행**

Run:

```bash
cd backend
python -m unittest test_menu_seed.py
```

Expected:

```text
OK
```

- [ ] **Step 5: 커밋**

```bash
git add backend/app/core/menu_seed.py backend/test_menu_seed.py
git commit -m "feat: add intent factory menu seed upsert"
```

## 7. Task 3: 메뉴 계약 테스트 보강

**Files:**
- Modify: `backend/test_menu_contract.py`

- [ ] **Step 1: 라우트 계약 테스트 작성**

Replace `backend/test_menu_contract.py` with:

```python
import unittest
from pathlib import Path

from app.core.menu_seed import INTENT_FACTORY_MENU_ITEMS


APP_JSX = Path(__file__).resolve().parents[1] / "frontend" / "src" / "App.jsx"


class MenuContractTest(unittest.TestCase):
    def test_leaf_menu_routes_are_registered_in_react_router(self):
        source = APP_JSX.read_text(encoding="utf-8")
        leaf_urls = [
            item["url"]
            for item in INTENT_FACTORY_MENU_ITEMS
            if item["url"] and not any(child["parent_id"] == item["id"] for child in INTENT_FACTORY_MENU_ITEMS)
        ]

        missing = []
        for url in leaf_urls:
            route_path = url.replace("/admin/", "")
            if f'path="{route_path}"' not in source:
                missing.append(url)

        self.assertEqual(missing, [])

    def test_runtime_routes_keep_existing_project_qa_contract(self):
        source = APP_JSX.read_text(encoding="utf-8")
        self.assertIn('path="runtime/qa" element={<ProjectQA />}', source)
        self.assertIn('path="runtime/intent-match" element={<RetrievalTest />}', source)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
cd backend
python -m unittest test_menu_contract.py
```

Expected:

```text
FAIL
```

The missing route list should include new IA URLs such as `/admin/intent-factory/intents`.

- [ ] **Step 3: 커밋하지 않고 다음 Task에서 라우트 구현**

이 Task는 실패하는 계약 테스트를 먼저 만드는 단계다. 구현은 Task 4에서 수행한다.

## 8. Task 4: Frontend 라우트와 공통 ShellPage 추가

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Layout/AdminLayout.jsx`
- Create: `frontend/src/components/common/ShellPage.jsx`

- [ ] **Step 1: ShellPage 생성**

Create `frontend/src/components/common/ShellPage.jsx` with:

```jsx
const ShellPage = ({ title, eyebrow, description, statusItems = [], children }) => {
  return (
    <div className="inner">
      <div className="breadcrumb">
        <span>{eyebrow || 'JWP Intent Factory'}</span> {'>'} <span>{title}</span>
      </div>

      <div className="page-header" style={{ padding: '12px 0 20px', margin: 0 }}>
        <h2 style={{ fontWeight: 600 }}>{title}</h2>
        {description && (
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-sub)', fontSize: '14px' }}>
            {description}
          </p>
        )}
      </div>

      {statusItems.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          {statusItems.map((item) => (
            <div className="stat-card" key={item.label}>
              <div className="stat-card-label">{item.label}</div>
              <div className="stat-card-value">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="table-area" style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  );
};

export default ShellPage;
```

- [ ] **Step 2: AdminLayout icon 매핑 추가**

Modify `frontend/src/components/Layout/AdminLayout.jsx` menuIcons:

```jsx
  const menuIcons = {
    'icon-dashboard': '📊',
    'icon-project': '🧭',
    'icon-knowledge': '📚',
    'icon-intent': '🧠',
    'icon-pack': '📦',
    'icon-runtime': '💬',
    'icon-operations': '📈',
    'icon-folder': '📁',
    'icon-chat': '💬',
    'icon-settings': '⚙️',
  };
```

- [ ] **Step 3: App.jsx에 라우트 추가**

Add imports to `frontend/src/App.jsx`:

```jsx
import ShellPage from './components/common/ShellPage';
import IntentList from './pages/intent-factory/IntentList';
import EntityList from './pages/intent-factory/EntityList';
import FaqList from './pages/intent-factory/FaqList';
import ActionList from './pages/intent-factory/ActionList';
import LlmAssist from './pages/intent-factory/LlmAssist';
import PackBuilder from './pages/packs/PackBuilder';
import PackValidation from './pages/packs/PackValidation';
import PackRepository from './pages/packs/PackRepository';
import PackVersions from './pages/packs/PackVersions';
import PackDeployment from './pages/packs/PackDeployment';
import ActionTest from './pages/runtime/ActionTest';
import WidgetPreview from './pages/runtime/WidgetPreview';
import RealtimeMonitoring from './pages/operations/RealtimeMonitoring';
import UnansweredAnalysis from './pages/operations/UnansweredAnalysis';
import ImprovementRequests from './pages/operations/ImprovementRequests';
import PackImprovementHistory from './pages/operations/PackImprovementHistory';
```

Add route aliases inside `/admin` route:

```jsx
        <Route path="projects/new" element={<ShellPage title="프로젝트 등록" eyebrow="프로젝트 준비" description="신규 고객 프로젝트와 서비스 식별자를 등록하는 화면입니다." />} />
        <Route path="project-settings/service" element={<ShellPage title="고객사/서비스 정보" eyebrow="프로젝트 준비" description="고객사, 서비스, 폐쇄망 배포 환경 정보를 관리하는 화면입니다." />} />
        <Route path="project-settings/integration-map" element={<ShellPage title="메뉴/화면/API 정보 관리" eyebrow="프로젝트 준비" description="챗봇 Action과 연결할 고객 시스템 메뉴, 화면, API 정보를 관리하는 화면입니다." />} />

        <Route path="knowledge/sources" element={<SourceList />} />
        <Route path="knowledge/sources/new" element={<SourceNew />} />
        <Route path="knowledge/jobs" element={<IndexJobList />} />
        <Route path="knowledge/search-test" element={<RetrievalTest />} />

        <Route path="intent-factory/intents" element={<IntentList />} />
        <Route path="intent-factory/entities" element={<EntityList />} />
        <Route path="intent-factory/synonyms" element={<EntityList mode="synonyms" />} />
        <Route path="intent-factory/faqs" element={<FaqList />} />
        <Route path="intent-factory/actions" element={<ActionList />} />
        <Route path="intent-factory/llm-assist" element={<LlmAssist />} />

        <Route path="packs/builder" element={<PackBuilder />} />
        <Route path="packs/validation" element={<PackValidation />} />
        <Route path="packs/repository" element={<PackRepository />} />
        <Route path="packs/versions" element={<PackVersions />} />
        <Route path="packs/deployment" element={<PackDeployment />} />

        <Route path="runtime/qa" element={<ProjectQA />} />
        <Route path="runtime/intent-match" element={<RetrievalTest />} />
        <Route path="runtime/action-test" element={<ActionTest />} />
        <Route path="runtime/widget-preview" element={<WidgetPreview />} />

        <Route path="operations/realtime" element={<RealtimeMonitoring />} />
        <Route path="operations/stats" element={<Stats />} />
        <Route path="operations/unanswered" element={<UnansweredAnalysis />} />
        <Route path="operations/improvement-requests" element={<ImprovementRequests />} />
        <Route path="operations/pack-history" element={<PackImprovementHistory />} />
        <Route path="system/settings" element={<ShellPage title="시스템 설정" eyebrow="시스템 관리" description="플랫폼 공통 설정을 관리하는 화면입니다." />} />
```

- [ ] **Step 4: 계약 테스트 재실행**

Run:

```bash
cd backend
python -m unittest test_menu_contract.py
```

Expected:

```text
OK
```

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/App.jsx frontend/src/components/Layout/AdminLayout.jsx frontend/src/components/common/ShellPage.jsx backend/test_menu_contract.py
git commit -m "feat: add lifecycle admin routes and shell page"
```

## 9. Task 5: Intent Factory v0.1 화면 추가

**Files:**
- Create: `frontend/src/pages/intent-factory/IntentList.jsx`
- Create: `frontend/src/pages/intent-factory/EntityList.jsx`
- Create: `frontend/src/pages/intent-factory/FaqList.jsx`
- Create: `frontend/src/pages/intent-factory/ActionList.jsx`
- Create: `frontend/src/pages/intent-factory/LlmAssist.jsx`

- [ ] **Step 1: IntentList 구현**

Create `frontend/src/pages/intent-factory/IntentList.jsx`:

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import ShellPage from '../../components/common/ShellPage';

const IntentList = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('ai_access_token');
    axios.get('/api/v1/intent-packs/netzero-intent-pack-v0.1.0', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setSummary(res.data)).catch(() => setSummary(null));
  }, []);

  return (
    <ShellPage
      title="Intent 관리"
      eyebrow="Intent Factory"
      description="사용자 질문의 업무 의도를 정의하고 Action과 연결하는 관리 화면입니다."
      statusItems={[
        { label: 'Pack ID', value: summary?.pack_id || '-' },
        { label: 'Intent 수', value: summary?.counts?.intents ?? '-' },
        { label: 'Action 수', value: summary?.counts?.actions ?? '-' },
        { label: '검증 상태', value: summary?.validation?.valid ? '정상' : '-' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 현재 로컬 Intent Pack의 요약을 표시합니다. 다음 단계에서 Intent 목록, 예시 질문, Entity, Action 연결 편집 기능을 추가합니다.
      </p>
    </ShellPage>
  );
};

export default IntentList;
```

- [ ] **Step 2: EntityList 구현**

Create `frontend/src/pages/intent-factory/EntityList.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const EntityList = ({ mode = 'entities' }) => {
  const isSynonym = mode === 'synonyms';
  return (
    <ShellPage
      title={isSynonym ? 'Synonym 관리' : 'Entity 관리'}
      eyebrow="Intent Factory"
      description={isSynonym ? '동의어와 표현 확장 사전을 관리합니다.' : 'Intent 매칭과 Action 실행에 필요한 업무 개체를 관리합니다.'}
      statusItems={[
        { label: '관리 대상', value: isSynonym ? '동의어/표현' : '업무 Entity' },
        { label: '연결 영역', value: 'Intent Matcher' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 Entity/Synonym 관리 메뉴 진입점과 역할을 제공합니다. 다음 단계에서 Pack JSON 기반 목록 조회와 편집 기능을 연결합니다.
      </p>
    </ShellPage>
  );
};

export default EntityList;
```

- [ ] **Step 3: FaqList 구현**

Create `frontend/src/pages/intent-factory/FaqList.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const FaqList = () => {
  return (
    <ShellPage
      title="FAQ 관리"
      eyebrow="Intent Factory"
      description="자주 묻는 질문과 승인된 답변을 관리하고 SEARCH_DOC Action과 연결합니다."
      statusItems={[
        { label: '주요 Action', value: 'SEARCH_DOC' },
        { label: '연결 지식', value: 'Source/FAQ' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 FAQ 관리 메뉴와 역할을 제공합니다. 다음 단계에서 Pack FAQ 목록 조회, Source 연결, 답변 정책 편집 기능을 추가합니다.
      </p>
    </ShellPage>
  );
};

export default FaqList;
```

- [ ] **Step 4: ActionList 구현**

Create `frontend/src/pages/intent-factory/ActionList.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const ActionList = () => {
  return (
    <ShellPage
      title="Action 관리"
      eyebrow="Intent Factory"
      description="Intent가 실행할 화면 이동, 문서 검색, 정형 조회, 안내 Action을 관리합니다."
      statusItems={[
        { label: 'Action 유형', value: 'NAVIGATE / SEARCH_DOC / QUERY / GUIDE' },
        { label: '실행 제어', value: 'Whitelist 기반' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        v0.1에서는 Action 관리 메뉴와 실행 유형을 표시합니다. 다음 단계에서 action_registry, screen_routes, api_mappings, sql_templates 조회를 연결합니다.
      </p>
    </ShellPage>
  );
};

export default ActionList;
```

- [ ] **Step 5: LlmAssist 구현**

Create `frontend/src/pages/intent-factory/LlmAssist.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const LlmAssist = () => {
  return (
    <ShellPage
      title="LLM 지원 도구"
      eyebrow="Intent Factory"
      description="외부망에서 Intent/Entity/FAQ 후보를 생성하고 전문가 검수로 확정하는 지원 도구입니다."
      statusItems={[
        { label: '운영 위치', value: '자사 외부망' },
        { label: '고객망 반입', value: '검증된 Pack만 반입' },
      ]}
    >
      <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
        고객 내부망 Runtime은 LLM/API 없이 동작합니다. 이 화면은 외부망 Intent Factory에서 후보 생성과 검수 흐름을 관리하기 위한 진입점입니다.
      </p>
    </ShellPage>
  );
};

export default LlmAssist;
```

- [ ] **Step 6: 빌드 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 7: 커밋**

```bash
git add frontend/src/pages/intent-factory
git commit -m "feat: add intent factory shell pages"
```

## 10. Task 6: Pack 제작/배포 v0.1 화면 추가

**Files:**
- Create: `frontend/src/pages/packs/PackBuilder.jsx`
- Create: `frontend/src/pages/packs/PackValidation.jsx`
- Create: `frontend/src/pages/packs/PackRepository.jsx`
- Create: `frontend/src/pages/packs/PackVersions.jsx`
- Create: `frontend/src/pages/packs/PackDeployment.jsx`

- [ ] **Step 1: PackRepository 구현**

Create `frontend/src/pages/packs/PackRepository.jsx`:

```jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import ShellPage from '../../components/common/ShellPage';

const PackRepository = () => {
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('ai_access_token');
    axios.get('/api/v1/intent-packs', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => setPacks(res.data || [])).catch(() => setPacks([]));
  }, []);

  return (
    <ShellPage
      title="Pack Repository"
      eyebrow="Pack 제작/배포"
      description="검증된 Intent Pack과 버전을 관리합니다."
      statusItems={[
        { label: '등록 Pack', value: packs.length },
        { label: '저장 방식', value: 'Local Pack Repository' },
      ]}
    >
      <table>
        <thead>
          <tr>
            <th>Pack ID</th>
            <th>Version</th>
            <th>Service</th>
            <th>Path</th>
          </tr>
        </thead>
        <tbody>
          {packs.map((pack) => (
            <tr key={`${pack.pack_id}-${pack.pack_version}`}>
              <td>{pack.pack_id}</td>
              <td>{pack.pack_version}</td>
              <td>{pack.service_name || pack.service_id}</td>
              <td>{pack.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ShellPage>
  );
};

export default PackRepository;
```

- [ ] **Step 2: 나머지 Pack 화면 구현**

Create `frontend/src/pages/packs/PackBuilder.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const PackBuilder = () => (
  <ShellPage
    title="Pack Builder"
    eyebrow="Pack 제작/배포"
    description="Intent, Entity, FAQ, Action, Source 검색 정책을 배포 가능한 Pack으로 구성합니다."
    statusItems={[
      { label: '입력', value: 'Intent/Entity/Action/FAQ' },
      { label: '출력', value: 'Intent Pack' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 Pack 구성 흐름을 표시합니다. 다음 단계에서 Pack 구성요소 선택, 검증, manifest 생성 기능을 연결합니다.
    </p>
  </ShellPage>
);

export default PackBuilder;
```

Create `frontend/src/pages/packs/PackValidation.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const PackValidation = () => (
  <ShellPage
    title="Pack 검증"
    eyebrow="Pack 제작/배포"
    description="검증 질문, 기대 Intent, 기대 Action 기준으로 Pack 품질을 확인합니다."
    statusItems={[
      { label: '검증 기준', value: 'Validation Questions' },
      { label: '결과', value: 'Pass/Fail' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      현재 Intent Matcher 테스트 결과를 Pack 검증 결과로 확장하는 화면입니다.
    </p>
  </ShellPage>
);

export default PackValidation;
```

Create `frontend/src/pages/packs/PackVersions.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const PackVersions = () => (
  <ShellPage
    title="버전 관리"
    eyebrow="Pack 제작/배포"
    description="Pack 버전, 변경 이력, 배포 상태를 관리합니다."
    statusItems={[
      { label: '버전 정책', value: 'Semantic Version' },
      { label: '변경 이력', value: 'Pack 단위 관리' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 버전 관리 진입점을 제공합니다. 다음 단계에서 version_info와 changelog를 연결합니다.
    </p>
  </ShellPage>
);

export default PackVersions;
```

Create `frontend/src/pages/packs/PackDeployment.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const PackDeployment = () => (
  <ShellPage
    title="배포 패키지 생성"
    eyebrow="Pack 제작/배포"
    description="고객 내부망 반입을 위한 Service-Pack ZIP을 생성하고 배포 이력을 관리합니다."
    statusItems={[
      { label: '배포 단위', value: 'Service-Pack ZIP' },
      { label: '전송 방식', value: '보안 승인 반입' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 배포 패키지 생성 흐름을 표시합니다. 다음 단계에서 ZIP 생성과 checksum 검증 기능을 연결합니다.
    </p>
  </ShellPage>
);

export default PackDeployment;
```

- [ ] **Step 3: 빌드 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/pages/packs
git commit -m "feat: add pack management shell pages"
```

## 11. Task 7: Runtime/운영 개선 v0.1 화면 추가

**Files:**
- Create: `frontend/src/pages/runtime/ActionTest.jsx`
- Create: `frontend/src/pages/runtime/WidgetPreview.jsx`
- Create: `frontend/src/pages/operations/RealtimeMonitoring.jsx`
- Create: `frontend/src/pages/operations/UnansweredAnalysis.jsx`
- Create: `frontend/src/pages/operations/ImprovementRequests.jsx`
- Create: `frontend/src/pages/operations/PackImprovementHistory.jsx`

- [ ] **Step 1: Runtime 화면 구현**

Create `frontend/src/pages/runtime/ActionTest.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const ActionTest = () => (
  <ShellPage
    title="Action 실행 테스트"
    eyebrow="Runtime 테스트"
    description="Intent 매칭 후 Action Router가 어떤 실행 카드를 반환하는지 확인합니다."
    statusItems={[
      { label: '지원 Action', value: 'NAVIGATE / SEARCH_DOC / QUERY / GUIDE' },
      { label: '실행 방식', value: 'Whitelist' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 Action 테스트 진입점을 제공합니다. 현재는 챗봇 대화 테스트와 Intent 매칭 테스트에서 Action 결과를 확인합니다.
    </p>
  </ShellPage>
);

export default ActionTest;
```

Create `frontend/src/pages/runtime/WidgetPreview.jsx`:

```jsx
import ProjectQA from '../ProjectQA';

const WidgetPreview = () => {
  return <ProjectQA />;
};

export default WidgetPreview;
```

- [ ] **Step 2: 운영 개선 화면 구현**

Create `frontend/src/pages/operations/RealtimeMonitoring.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const RealtimeMonitoring = () => (
  <ShellPage
    title="실시간 모니터링"
    eyebrow="운영 및 개선"
    description="Runtime 요청, Intent 매칭, fallback 발생 현황을 운영자가 확인하는 화면입니다."
    statusItems={[
      { label: 'Runtime', value: '동작 확인 필요' },
      { label: 'Fallback', value: '미응답 분석 연계' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 모니터링 진입점을 제공합니다. 다음 단계에서 runtime log와 unanswered log 집계를 연결합니다.
    </p>
  </ShellPage>
);

export default RealtimeMonitoring;
```

Create `frontend/src/pages/operations/UnansweredAnalysis.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const UnansweredAnalysis = () => (
  <ShellPage
    title="미응답 분석"
    eyebrow="운영 및 개선"
    description="낮은 신뢰도 또는 fallback 질문을 분석하여 Intent 개선 후보로 전환합니다."
    statusItems={[
      { label: '분석 대상', value: 'Fallback / Very Low' },
      { label: '개선 연결', value: 'Intent 후보 생성' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 미응답 분석 진입점을 제공합니다. 다음 단계에서 unanswered_questions.jsonl 조회 API와 목록 화면을 연결합니다.
    </p>
  </ShellPage>
);

export default UnansweredAnalysis;
```

Create `frontend/src/pages/operations/ImprovementRequests.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const ImprovementRequests = () => (
  <ShellPage
    title="개선 요청 관리"
    eyebrow="운영 및 개선"
    description="미응답 분석 결과를 Pack 개선 요청으로 등록하고 처리 상태를 관리합니다."
    statusItems={[
      { label: '입력', value: '미응답 질문' },
      { label: '출력', value: 'Pack 개선 요청' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      개선 요청은 고객 데이터 원문을 외부망으로 반출하지 않고, 승인된 비식별 정보만 Pack 개선 흐름에 전달하는 정책을 따릅니다.
    </p>
  </ShellPage>
);

export default ImprovementRequests;
```

Create `frontend/src/pages/operations/PackImprovementHistory.jsx`:

```jsx
import ShellPage from '../../components/common/ShellPage';

const PackImprovementHistory = () => (
  <ShellPage
    title="Pack 개선 이력"
    eyebrow="운영 및 개선"
    description="운영 피드백이 어떤 Pack 버전에 반영되었는지 추적합니다."
    statusItems={[
      { label: '추적 단위', value: 'Pack Version' },
      { label: '검증', value: '회귀 테스트' },
    ]}
  >
    <p style={{ margin: 0, color: 'var(--color-text-sub)' }}>
      v0.1에서는 개선 이력 진입점을 제공합니다. 다음 단계에서 Pack version changelog와 검증 결과를 연결합니다.
    </p>
  </ShellPage>
);

export default PackImprovementHistory;
```

- [ ] **Step 3: 빌드 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/pages/runtime frontend/src/pages/operations
git commit -m "feat: add runtime and operations shell pages"
```

## 12. Task 8: 메뉴 seed 실행 및 API 검증

**Files:**
- Create: `backend/seed_intent_factory_menus.py`

- [ ] **Step 1: seed 실행 스크립트 생성**

Create `backend/seed_intent_factory_menus.py`:

```python
import asyncio

from app.core.menu_seed import seed_intent_factory_menus
from app.db.session import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await seed_intent_factory_menus(db, "ROLE_ADMIN")
        print(result)


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: seed 실행**

Run:

```bash
cd backend
python seed_intent_factory_menus.py
```

Expected:

```text
{'menus': 42, 'role_menus': 42}
```

The exact count must match `len(INTENT_FACTORY_MENU_ITEMS)` after implementation. If the count differs because menu items were intentionally added or removed, update the expected count in this plan execution note and keep the test expectation based on `len(INTENT_FACTORY_MENU_ITEMS)`.

- [ ] **Step 3: 메뉴 API 수동 검증**

Run backend and frontend if they are not running:

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
```

```bash
cd frontend
npm run dev
```

Login and call menu API:

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login/mock \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin"}'
```

Use the returned token:

```bash
curl -s http://127.0.0.1:8080/api/v1/auth/menus \
  -H 'Authorization: Bearer <TOKEN>'
```

Expected menu group titles:

```text
대시보드
프로젝트 준비
지식 자료 관리
Intent Factory
Pack 제작/배포
Runtime 테스트
운영 및 개선
시스템 관리
```

- [ ] **Step 4: 커밋**

```bash
git add backend/seed_intent_factory_menus.py
git commit -m "chore: add intent factory menu seed script"
```

## 13. Task 9: 전체 검증

**Files:**
- Verify only

- [ ] **Step 1: Backend 관련 테스트 실행**

Run:

```bash
cd backend
python -m unittest test_menu_seed.py test_menu_contract.py test_intent_pack_loader.py test_intent_matcher.py test_project_pack_resolver.py test_chat_runtime.py test_unanswered_logger.py
```

Expected:

```text
OK
```

- [ ] **Step 2: Frontend build 실행**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 3: 브라우저 수동 확인**

Open:

```text
http://127.0.0.1:5173/admin/dashboard
```

Verify:

```text
좌측 메뉴에 프로젝트 준비, 지식 자료 관리, Intent Factory, Pack 제작/배포, Runtime 테스트, 운영 및 개선, 시스템 관리가 표시된다.
지식 자료 관리 > Source 목록으로 이동하면 기존 Source 목록 화면이 열린다.
Runtime 테스트 > 챗봇 대화 테스트로 이동하면 기존 Runtime 연동 QA 화면이 열린다.
Pack 제작/배포 > Pack Repository로 이동하면 등록된 Intent Pack 목록이 표시된다.
Intent Factory > Intent 관리로 이동하면 현재 Pack 요약이 표시된다.
```

- [ ] **Step 4: 최종 커밋 상태 확인**

Run:

```bash
git status --short
git log --oneline -5
```

Expected:

```text
작업 대상 파일 외 의도하지 않은 변경이 없어야 한다.
최근 커밋에 menu seed, lifecycle routes, shell pages 관련 커밋이 보여야 한다.
```

## 14. 제외 범위

v0.1에서는 다음 기능을 만들지 않는다.

- Intent/Entity/FAQ/Action의 완전한 CRUD
- Pack ZIP 생성 실제 파일 패키징
- 고객 내부망 Import UI
- 실제 고객 DB SQL 실행
- 실제 고객 API 호출
- LDAP/SSO 연동
- 운영 통계 대시보드 고도화
- 외부망/내부망 반입 반출 승인 워크플로우 자동화

단, 각 화면은 다음 단계에서 해당 기능을 연결할 수 있도록 메뉴, 라우트, 설명, 현재 사용 가능한 API 연결 지점을 제공한다.

## 15. 자체 검토

- Spec coverage: 프로젝트 Lifecycle 메뉴, 기존 Source/Runtime 기능 재배치, Intent Factory/Pack/운영 개선 Shell, 메뉴 API/권한 seed, 테스트 계획을 모두 Task에 반영했다.
- Placeholder scan: 미정 표현이나 비어 있는 구현 지시를 사용하지 않았다. v0.1 제외 범위는 명시적으로 제외했다.
- Type consistency: 메뉴 seed의 `id`, `parent_id`, `menu_name`, `url`, `sort_order`, `icon_code`는 `/api/v1/auth/menus` 조회 컬럼과 일치한다.
- Scope check: 이번 계획은 IA/Menu Shell v0.1로 제한한다. Source 고도화, Intent CRUD, Pack Builder 실구현은 다음 계획으로 분리한다.

## 16. 다음 작업 프롬프트

```text
$superpowers:subagent-driven-development

docs/superpowers/plans/2026-06-26-jwp-intent-factory-admin-ia-menu-shell.md 계획서를 기준으로 JWP Intent Factory 관리자 IA/Menu Shell v0.1 구현을 진행해 주세요.

중요 방향:
1. 대표님 보고용 데모가 아니라 실제 서비스 운영 흐름 기준으로 구현합니다.
2. 메뉴는 고객 프로젝트 챗봇 구축 Lifecycle이 드러나야 합니다.
3. 기존 Source 관리, 인덱싱 작업, 챗봇 대화 테스트 기능은 새 메뉴 체계 아래로 재배치합니다.
4. Intent Factory, Pack 제작/배포, Runtime 테스트, 운영 및 개선 메뉴와 v0.1 Shell 화면을 추가합니다.
5. 메뉴는 프론트 하드코딩이 아니라 backend `/api/v1/auth/menus`에서 내려오는 DB 메뉴/권한 구조와 일치해야 합니다.
6. 기존 사용자 변경사항은 되돌리지 말고, 필요한 파일만 최소 범위로 수정합니다.

구현 순서:
1. backend 메뉴 seed 정의 및 테스트
2. 메뉴 계약 테스트 보강
3. frontend 라우트와 ShellPage 추가
4. Intent Factory Shell 화면 추가
5. Pack 제작/배포 Shell 화면 추가
6. Runtime/운영 개선 Shell 화면 추가
7. 메뉴 seed 실행 스크립트 추가
8. backend unittest와 frontend build 검증
9. 브라우저에서 메뉴 표시와 주요 화면 이동 확인

완료 기준:
- 좌측 메뉴에 프로젝트 준비, 지식 자료 관리, Intent Factory, Pack 제작/배포, Runtime 테스트, 운영 및 개선, 시스템 관리가 표시됩니다.
- Source 목록은 지식 자료 관리 하위에서 접근됩니다.
- AI 챗봇 대화 테스트는 Runtime 테스트 하위에서 접근됩니다.
- Intent 관리, Pack Repository, 미응답 분석 메뉴가 화면으로 이동됩니다.
- backend 관련 테스트가 통과합니다.
- frontend `npm run build`가 통과합니다.

완료 후:
- 화면 테스트 방법을 한글로 안내해 주세요.
- 다음 단계인 Intent 관리 CRUD / Source 연계 상세 계획 프롬프트를 작성해 주세요.
```
