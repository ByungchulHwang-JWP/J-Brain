# JWP Intent Factory DB Core v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intent 관리 CRUD, 예시 질문, Action 연결, Source 검색 범위, JSON Pack Import 초안을 DB 기반으로 구현한다.

**Architecture:** Runtime은 기존 Pack 기반 실행 구조를 유지하고, Intent Factory 관리 화면만 DB 기반 편집 구조로 확장한다. Backend는 idempotent table creation, Pydantic schema, service, API router로 분리하고, Frontend는 Intent 목록/상세/폼/Source Scope 편집 컴포넌트로 분리한다.

**Tech Stack:** FastAPI, SQLAlchemy AsyncSession, PostgreSQL JSONB, Pydantic, React, React Router, Axios, Vite, Python unittest

---

## 1. 구현 범위

이번 구현은 C안 1차 범위만 다룬다.

포함 범위:

- Intent DB 테이블 생성
- Intent CRUD API
- Intent Example 관리
- Intent-Action 연결 관리
- SEARCH_DOC Intent Source 검색 범위 관리
- 기존 JSON Pack을 DB로 가져오는 Import 초안
- Intent 목록/상세/등록/수정 화면
- Backend unittest와 Frontend build 검증

제외 범위:

- Entity CRUD
- Synonym CRUD
- FAQ CRUD
- Action 상세 CRUD
- Pack Builder 완성
- Runtime DB 직접 연동
- Pack ZIP 배포

## 2. 파일 구조

### Backend

- Create: `backend/app/core/intent_factory_schema.py`
  - Intent Factory v0.1 테이블을 idempotent하게 생성한다.

- Create: `backend/app/schemas/intent_factory.py`
  - API request/response Pydantic 모델을 정의한다.

- Create: `backend/app/services/intent_factory_service.py`
  - DB CRUD, archive, Pack Import 변환 로직을 담당한다.

- Create: `backend/app/api/intent_factory.py`
  - `/api/v1/intent-factory/projects/{project_id}` 하위 API를 제공한다.

- Modify: `backend/app/main.py`
  - `intent_factory` router를 include한다.

- Create: `backend/test_intent_factory_schema.py`
  - DDL 문자열과 테이블 정의의 핵심 계약을 검증한다.

- Create: `backend/test_intent_factory_service.py`
  - payload 정규화, import 변환, source_scope 기본값을 검증한다.

- Create: `backend/test_intent_factory_api_contract.py`
  - API route와 response field 계약을 검증한다.

### Frontend

- Create: `frontend/src/api/intentFactory.js`
  - Intent Factory API 호출 함수를 모은다.

- Modify: `frontend/src/App.jsx`
  - `/admin/intent-factory/intents/new`, `/admin/intent-factory/intents/:intentId` 라우트를 추가한다.

- Modify: `frontend/src/pages/intent-factory/IntentList.jsx`
  - 기존 Pack 요약 Shell을 실제 Intent 목록 화면으로 교체한다.

- Create: `frontend/src/pages/intent-factory/IntentDetail.jsx`
  - Intent 등록/상세/수정 화면을 제공한다.

- Create: `frontend/src/components/intent-factory/IntentForm.jsx`
  - 기본 정보, 예시 질문, Action 연결을 편집한다.

- Create: `frontend/src/components/intent-factory/SourceScopeEditor.jsx`
  - SEARCH_DOC Intent의 Source 검색 범위를 편집한다.

## 3. API 계약

### 3.1 목록

```text
GET /api/v1/intent-factory/projects/{project_id}/intents
```

### 3.2 상세

```text
GET /api/v1/intent-factory/projects/{project_id}/intents/{intent_id}
```

### 3.3 생성

```text
POST /api/v1/intent-factory/projects/{project_id}/intents
```

### 3.4 수정

```text
PUT /api/v1/intent-factory/projects/{project_id}/intents/{intent_id}
```

### 3.5 Archive 삭제

```text
DELETE /api/v1/intent-factory/projects/{project_id}/intents/{intent_id}
```

### 3.6 Pack Import

```text
POST /api/v1/intent-factory/projects/{project_id}/import-pack
```

## 4. Task 1: DB Schema 생성

**Files:**
- Create: `backend/app/core/intent_factory_schema.py`
- Create: `backend/test_intent_factory_schema.py`

- [ ] **Step 1: schema 계약 테스트 작성**

Create `backend/test_intent_factory_schema.py`:

```python
import unittest

from app.core.intent_factory_schema import INTENT_FACTORY_TABLES, build_create_table_sql


class IntentFactorySchemaTest(unittest.TestCase):
    def test_required_tables_are_declared(self):
        self.assertEqual(
            set(INTENT_FACTORY_TABLES),
            {
                "intent_definitions",
                "intent_examples",
                "intent_action_links",
                "intent_source_scopes",
            },
        )

    def test_create_sql_contains_idempotent_table_creation(self):
        sql = build_create_table_sql()
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_definitions", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_examples", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_action_links", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_source_scopes", sql)
        self.assertIn("UNIQUE (project_id, intent_id)", sql)
        self.assertIn("JSONB", sql)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_schema.py
```

Expected:

```text
ModuleNotFoundError: No module named 'app.core.intent_factory_schema'
```

- [ ] **Step 3: schema 모듈 구현**

Create `backend/app/core/intent_factory_schema.py`:

```python
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


INTENT_FACTORY_TABLES = [
    "intent_definitions",
    "intent_examples",
    "intent_action_links",
    "intent_source_scopes",
]


def build_create_table_sql() -> str:
    return """
    CREATE TABLE IF NOT EXISTS graphrag.intent_definitions (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        intent_name VARCHAR(240) NOT NULL,
        description TEXT,
        category VARCHAR(60) NOT NULL,
        action_id VARCHAR(160),
        status VARCHAR(40) NOT NULL DEFAULT 'draft',
        priority INTEGER NOT NULL DEFAULT 100,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_examples (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        example_text TEXT NOT NULL,
        normalized_text TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id, example_text)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_action_links (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        action_id VARCHAR(160) NOT NULL,
        action_type VARCHAR(60) NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id, action_id)
    );

    CREATE TABLE IF NOT EXISTS graphrag.intent_source_scopes (
        id BIGSERIAL PRIMARY KEY,
        project_id VARCHAR(120) NOT NULL,
        intent_id VARCHAR(160) NOT NULL,
        source_category VARCHAR(120),
        source_status VARCHAR(40) NOT NULL DEFAULT 'completed',
        document_types JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        top_k INTEGER NOT NULL DEFAULT 5,
        score_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.650,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (project_id, intent_id)
    );

    CREATE INDEX IF NOT EXISTS idx_intent_definitions_project_status
        ON graphrag.intent_definitions(project_id, status);

    CREATE INDEX IF NOT EXISTS idx_intent_examples_project_intent
        ON graphrag.intent_examples(project_id, intent_id);

    CREATE INDEX IF NOT EXISTS idx_intent_source_scopes_project_intent
        ON graphrag.intent_source_scopes(project_id, intent_id);
    """


async def ensure_intent_factory_schema(db: AsyncSession) -> dict[str, int]:
    statements = [stmt.strip() for stmt in build_create_table_sql().split(";") if stmt.strip()]
    for statement in statements:
        await db.execute(text(statement))
    await db.commit()
    return {"tables": len(INTENT_FACTORY_TABLES), "statements": len(statements)}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_schema.py
```

Expected:

```text
OK
```

- [ ] **Step 5: 커밋**

```bash
git add backend/app/core/intent_factory_schema.py backend/test_intent_factory_schema.py
git commit -m "feat: add intent factory db schema"
```

## 5. Task 2: API Schema와 Service 구현

**Files:**
- Create: `backend/app/schemas/intent_factory.py`
- Create: `backend/app/services/intent_factory_service.py`
- Create: `backend/test_intent_factory_service.py`

- [ ] **Step 1: service 테스트 작성**

Create `backend/test_intent_factory_service.py`:

```python
import unittest

from app.services.intent_factory_service import (
    build_default_source_scope,
    normalize_example_text,
    pack_intent_to_record,
)


class IntentFactoryServiceTest(unittest.TestCase):
    def test_normalize_example_text_collapses_spacing_and_lowercases(self):
        self.assertEqual(normalize_example_text("  Scope   1 기준 알려줘  "), "scope 1 기준 알려줘")

    def test_default_source_scope_for_search_doc(self):
        scope = build_default_source_scope("J-Brain", "INT-DOC", "SEARCH_DOC")
        self.assertEqual(scope["project_id"], "J-Brain")
        self.assertEqual(scope["intent_id"], "INT-DOC")
        self.assertEqual(scope["source_category"], "J-Brain")
        self.assertEqual(scope["source_status"], "completed")
        self.assertEqual(scope["document_types"], [])
        self.assertEqual(scope["tags"], [])
        self.assertEqual(scope["top_k"], 5)
        self.assertEqual(scope["score_threshold"], 0.65)

    def test_default_source_scope_not_created_for_navigation(self):
        self.assertIsNone(build_default_source_scope("J-Brain", "INT-NAV", "NAVIGATION"))

    def test_pack_intent_to_record_maps_required_fields(self):
        item = {
            "intent_id": "INT-JB-NAV-DASHBOARD",
            "intent_name": "운영 현황 화면 이동",
            "description": "운영 현황으로 이동한다.",
            "category": "NAVIGATION",
            "action_id": "ACT-JB-NAV-DASHBOARD",
        }
        record = pack_intent_to_record("J-Brain", item)
        self.assertEqual(record["project_id"], "J-Brain")
        self.assertEqual(record["intent_id"], "INT-JB-NAV-DASHBOARD")
        self.assertEqual(record["intent_name"], "운영 현황 화면 이동")
        self.assertEqual(record["status"], "active")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_service.py
```

Expected:

```text
ModuleNotFoundError: No module named 'app.services'
```

- [ ] **Step 3: Pydantic schema 작성**

Create `backend/app/schemas/intent_factory.py`:

```python
from pydantic import BaseModel, Field


class SourceScopePayload(BaseModel):
    source_category: str | None = None
    source_status: str = "completed"
    document_types: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    top_k: int = 5
    score_threshold: float = 0.65


class IntentPayload(BaseModel):
    intent_id: str
    intent_name: str
    description: str | None = None
    category: str
    action_id: str | None = None
    status: str = "draft"
    priority: int = 100
    examples: list[str] = Field(default_factory=list)
    source_scope: SourceScopePayload | None = None


class IntentUpdatePayload(BaseModel):
    intent_name: str
    description: str | None = None
    category: str
    action_id: str | None = None
    status: str = "draft"
    priority: int = 100
    examples: list[str] = Field(default_factory=list)
    source_scope: SourceScopePayload | None = None


class ImportPackPayload(BaseModel):
    pack_id: str
    pack_version: str | None = None
    overwrite: bool = False
```

- [ ] **Step 4: service helper 구현**

Create directory and file `backend/app/services/intent_factory_service.py`:

```python
import re
from typing import Any


SEARCH_DOC_CATEGORIES = {"SEARCH_DOC", "DOCUMENT", "FAQ"}


def normalize_example_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip()).lower()


def pack_intent_to_record(project_id: str, intent: dict[str, Any]) -> dict[str, Any]:
    return {
        "project_id": project_id,
        "intent_id": intent["intent_id"],
        "intent_name": intent.get("intent_name") or intent["intent_id"],
        "description": intent.get("description"),
        "category": intent.get("category", "GUIDE"),
        "action_id": intent.get("action_id"),
        "status": "active",
        "priority": int(intent.get("priority", 100)),
    }


def build_default_source_scope(
    project_id: str,
    intent_id: str,
    category: str,
) -> dict[str, Any] | None:
    if category not in SEARCH_DOC_CATEGORIES:
        return None
    return {
        "project_id": project_id,
        "intent_id": intent_id,
        "source_category": project_id,
        "source_status": "completed",
        "document_types": [],
        "tags": [],
        "top_k": 5,
        "score_threshold": 0.65,
    }
```

- [ ] **Step 5: 서비스 테스트 통과**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_service.py
```

Expected:

```text
OK
```

- [ ] **Step 6: 커밋**

```bash
git add backend/app/schemas/intent_factory.py backend/app/services/intent_factory_service.py backend/test_intent_factory_service.py
git commit -m "feat: add intent factory service contracts"
```

## 6. Task 3: Backend CRUD API 구현

**Files:**
- Modify: `backend/app/services/intent_factory_service.py`
- Create: `backend/app/api/intent_factory.py`
- Modify: `backend/app/main.py`
- Create: `backend/test_intent_factory_api_contract.py`

- [ ] **Step 1: API route 계약 테스트 작성**

Create `backend/test_intent_factory_api_contract.py`:

```python
import unittest
from pathlib import Path


API_FILE = Path(__file__).resolve().parent / "app" / "api" / "intent_factory.py"
MAIN_FILE = Path(__file__).resolve().parent / "app" / "main.py"


class IntentFactoryApiContractTest(unittest.TestCase):
    def test_intent_factory_router_file_declares_required_routes(self):
        source = API_FILE.read_text(encoding="utf-8")
        self.assertIn('@router.get("/projects/{project_id}/intents")', source)
        self.assertIn('@router.get("/projects/{project_id}/intents/{intent_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/intents")', source)
        self.assertIn('@router.put("/projects/{project_id}/intents/{intent_id}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/intents/{intent_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/import-pack")', source)

    def test_main_includes_intent_factory_router(self):
        source = MAIN_FILE.read_text(encoding="utf-8")
        self.assertIn("intent_factory", source)
        self.assertIn('prefix=f"{settings.API_V1_STR}/intent-factory"', source)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_api_contract.py
```

Expected:

```text
FileNotFoundError
```

- [ ] **Step 3: service CRUD 함수 추가**

Append to `backend/app/services/intent_factory_service.py`:

```python
import json
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.schemas.intent_factory import IntentPayload, IntentUpdatePayload


def _scope_to_db(scope: dict[str, Any] | None) -> dict[str, Any] | None:
    if scope is None:
        return None
    return {
        **scope,
        "document_types": json.dumps(scope.get("document_types", []), ensure_ascii=False),
        "tags": json.dumps(scope.get("tags", []), ensure_ascii=False),
    }


async def list_intents(db: AsyncSession, project_id: str) -> dict[str, Any]:
    result = await db.execute(
        text(
            """
            SELECT
                d.intent_id,
                d.intent_name,
                d.category,
                d.action_id,
                d.status,
                COUNT(e.id) AS example_count,
                CASE WHEN s.id IS NULL THEN false ELSE true END AS has_source_scope
            FROM graphrag.intent_definitions d
            LEFT JOIN graphrag.intent_examples e
                ON e.project_id = d.project_id
               AND e.intent_id = d.intent_id
               AND e.is_active = true
            LEFT JOIN graphrag.intent_source_scopes s
                ON s.project_id = d.project_id
               AND s.intent_id = d.intent_id
            WHERE d.project_id = :project_id
              AND d.status != 'archived'
            GROUP BY d.intent_id, d.intent_name, d.category, d.action_id, d.status, s.id
            ORDER BY d.priority ASC, d.intent_id ASC
            """
        ),
        {"project_id": project_id},
    )
    items = [dict(row._mapping) for row in result.fetchall()]
    return {"project_id": project_id, "items": items}


async def get_intent_detail(db: AsyncSession, project_id: str, intent_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            """
            SELECT intent_id, intent_name, description, category, action_id, status, priority
            FROM graphrag.intent_definitions
            WHERE project_id = :project_id
              AND intent_id = :intent_id
              AND status != 'archived'
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    row = result.fetchone()
    if not row:
        return None
    detail = dict(row._mapping)

    examples = await db.execute(
        text(
            """
            SELECT example_text
            FROM graphrag.intent_examples
            WHERE project_id = :project_id
              AND intent_id = :intent_id
              AND is_active = true
            ORDER BY id ASC
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    detail["examples"] = [item.example_text for item in examples.fetchall()]

    scope = await db.execute(
        text(
            """
            SELECT source_category, source_status, document_types, tags, top_k, score_threshold
            FROM graphrag.intent_source_scopes
            WHERE project_id = :project_id
              AND intent_id = :intent_id
            """
        ),
        {"project_id": project_id, "intent_id": intent_id},
    )
    scope_row = scope.fetchone()
    detail["source_scope"] = dict(scope_row._mapping) if scope_row else None
    return detail
```

- [ ] **Step 4: create/update/archive/import 함수 추가**

Append to `backend/app/services/intent_factory_service.py`:

```python
async def save_intent(
    db: AsyncSession,
    project_id: str,
    payload: IntentPayload | IntentUpdatePayload,
    intent_id: str | None = None,
) -> dict[str, Any]:
    resolved_intent_id = intent_id or payload.intent_id
    await db.execute(
        text(
            """
            INSERT INTO graphrag.intent_definitions
                (project_id, intent_id, intent_name, description, category, action_id, status, priority, updated_at)
            VALUES
                (:project_id, :intent_id, :intent_name, :description, :category, :action_id, :status, :priority, NOW())
            ON CONFLICT (project_id, intent_id) DO UPDATE SET
                intent_name = EXCLUDED.intent_name,
                description = EXCLUDED.description,
                category = EXCLUDED.category,
                action_id = EXCLUDED.action_id,
                status = EXCLUDED.status,
                priority = EXCLUDED.priority,
                updated_at = NOW()
            """
        ),
        {
            "project_id": project_id,
            "intent_id": resolved_intent_id,
            "intent_name": payload.intent_name,
            "description": payload.description,
            "category": payload.category,
            "action_id": payload.action_id,
            "status": payload.status,
            "priority": payload.priority,
        },
    )

    await db.execute(
        text("UPDATE graphrag.intent_examples SET is_active = false, updated_at = NOW() WHERE project_id = :project_id AND intent_id = :intent_id"),
        {"project_id": project_id, "intent_id": resolved_intent_id},
    )
    for example in payload.examples:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_examples
                    (project_id, intent_id, example_text, normalized_text, is_active, updated_at)
                VALUES
                    (:project_id, :intent_id, :example_text, :normalized_text, true, NOW())
                ON CONFLICT (project_id, intent_id, example_text) DO UPDATE SET
                    normalized_text = EXCLUDED.normalized_text,
                    is_active = true,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "intent_id": resolved_intent_id,
                "example_text": example,
                "normalized_text": normalize_example_text(example),
            },
        )

    if payload.action_id:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_action_links
                    (project_id, intent_id, action_id, action_type, is_primary, updated_at)
                VALUES
                    (:project_id, :intent_id, :action_id, :action_type, true, NOW())
                ON CONFLICT (project_id, intent_id, action_id) DO UPDATE SET
                    action_type = EXCLUDED.action_type,
                    is_primary = true,
                    updated_at = NOW()
                """
            ),
            {
                "project_id": project_id,
                "intent_id": resolved_intent_id,
                "action_id": payload.action_id,
                "action_type": payload.category,
            },
        )

    if payload.source_scope:
        scope = _scope_to_db({"project_id": project_id, "intent_id": resolved_intent_id, **payload.source_scope.model_dump()})
        await db.execute(
            text(
                """
                INSERT INTO graphrag.intent_source_scopes
                    (project_id, intent_id, source_category, source_status, document_types, tags, top_k, score_threshold, updated_at)
                VALUES
                    (:project_id, :intent_id, :source_category, :source_status, CAST(:document_types AS jsonb), CAST(:tags AS jsonb), :top_k, :score_threshold, NOW())
                ON CONFLICT (project_id, intent_id) DO UPDATE SET
                    source_category = EXCLUDED.source_category,
                    source_status = EXCLUDED.source_status,
                    document_types = EXCLUDED.document_types,
                    tags = EXCLUDED.tags,
                    top_k = EXCLUDED.top_k,
                    score_threshold = EXCLUDED.score_threshold,
                    updated_at = NOW()
                """
            ),
            scope,
        )

    await db.commit()
    detail = await get_intent_detail(db, project_id, resolved_intent_id)
    return detail or {"intent_id": resolved_intent_id}


async def archive_intent(db: AsyncSession, project_id: str, intent_id: str) -> dict[str, str]:
    await db.execute(
        text("UPDATE graphrag.intent_definitions SET status = 'archived', updated_at = NOW() WHERE project_id = :project_id AND intent_id = :intent_id"),
        {"project_id": project_id, "intent_id": intent_id},
    )
    await db.commit()
    return {"project_id": project_id, "intent_id": intent_id, "status": "archived"}
```

- [ ] **Step 5: API router 작성**

Create `backend/app/api/intent_factory.py`:

```python
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPackLoader
from app.core.intent_factory_schema import ensure_intent_factory_schema
from app.db.session import get_db
from app.schemas.intent_factory import ImportPackPayload, IntentPayload, IntentUpdatePayload
from app.services.intent_factory_service import archive_intent, get_intent_detail, list_intents, save_intent


router = APIRouter()


def _default_pack_root() -> Path:
    return (
        Path(__file__).resolve().parents[3]
        / "01.docs"
        / "01.산출물_JBrain"
        / "200.프로젝트실행"
        / "250.구현"
        / "intent-packs"
    )


@router.get("/projects/{project_id}/intents")
async def api_list_intents(project_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await list_intents(db, project_id)


@router.get("/projects/{project_id}/intents/{intent_id}")
async def api_get_intent(project_id: str, intent_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    detail = await get_intent_detail(db, project_id, intent_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Intent를 찾을 수 없습니다.")
    return detail


@router.post("/projects/{project_id}/intents")
async def api_create_intent(project_id: str, payload: IntentPayload, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_intent(db, project_id, payload)


@router.put("/projects/{project_id}/intents/{intent_id}")
async def api_update_intent(project_id: str, intent_id: str, payload: IntentUpdatePayload, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    await ensure_intent_factory_schema(db)
    return await save_intent(db, project_id, payload, intent_id)


@router.delete("/projects/{project_id}/intents/{intent_id}")
async def api_archive_intent(project_id: str, intent_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    await ensure_intent_factory_schema(db)
    return await archive_intent(db, project_id, intent_id)


@router.post("/projects/{project_id}/import-pack")
async def api_import_pack(
    project_id: str,
    payload: ImportPackPayload,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    from app.services.intent_factory_service import import_pack_to_db

    await ensure_intent_factory_schema(db)
    loader = IntentPackLoader(_default_pack_root())
    pack = loader.load_pack(payload.pack_id, payload.pack_version)
    return await import_pack_to_db(db, project_id, pack, payload.overwrite)
```

- [ ] **Step 6: import_pack_to_db 구현**

Append to `backend/app/services/intent_factory_service.py`:

```python
async def import_pack_to_db(
    db: AsyncSession,
    project_id: str,
    pack: Any,
    overwrite: bool = False,
) -> dict[str, Any]:
    imported = 0
    skipped = 0
    examples_by_intent: dict[str, list[str]] = {}
    for example in pack.nlu["intent_examples"]:
        examples_by_intent.setdefault(example["intent_id"], []).append(example["example"])

    for intent in pack.nlu["intents"]:
        existing = await get_intent_detail(db, project_id, intent["intent_id"])
        if existing and not overwrite:
            skipped += 1
            continue

        record = pack_intent_to_record(project_id, intent)
        scope = build_default_source_scope(project_id, record["intent_id"], record["category"])
        payload = IntentPayload(
            intent_id=record["intent_id"],
            intent_name=record["intent_name"],
            description=record["description"],
            category=record["category"],
            action_id=record["action_id"],
            status=record["status"],
            priority=record["priority"],
            examples=examples_by_intent.get(record["intent_id"], []),
            source_scope=scope,
        )
        await save_intent(db, project_id, payload)
        imported += 1

    return {
        "project_id": project_id,
        "pack_id": pack.manifest.get("pack_id") or pack.profile.get("pack_id"),
        "imported": imported,
        "skipped": skipped,
    }
```

- [ ] **Step 7: main.py router 등록**

Modify `backend/app/main.py` import and router include:

```python
from app.api import auth, projects, sources, sources_global, prompts, chat, jobs, dashboard, users, logs, stats, permissions, prompt_admin, intent_packs, intent_match, action_route, validation_runner, chat_runtime, intent_factory
```

Add:

```python
app.include_router(intent_factory.router, prefix=f"{settings.API_V1_STR}/intent-factory", tags=["intent_factory"])
```

- [ ] **Step 8: API 계약 테스트 통과**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_api_contract.py
```

Expected:

```text
OK
```

- [ ] **Step 9: 커밋**

```bash
git add backend/app/services/intent_factory_service.py backend/app/api/intent_factory.py backend/app/main.py backend/test_intent_factory_api_contract.py
git commit -m "feat: add intent factory crud api"
```

## 7. Task 4: Frontend API Client와 라우트 추가

**Files:**
- Create: `frontend/src/api/intentFactory.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: API client 작성**

Create `frontend/src/api/intentFactory.js`:

```javascript
import axios from 'axios';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ai_access_token')}`,
});

export const listIntents = async (projectId) => {
  const res = await axios.get(`/api/v1/intent-factory/projects/${projectId}/intents`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const getIntent = async (projectId, intentId) => {
  const res = await axios.get(`/api/v1/intent-factory/projects/${projectId}/intents/${intentId}`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const createIntent = async (projectId, payload) => {
  const res = await axios.post(`/api/v1/intent-factory/projects/${projectId}/intents`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

export const updateIntent = async (projectId, intentId, payload) => {
  const res = await axios.put(`/api/v1/intent-factory/projects/${projectId}/intents/${intentId}`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};

export const archiveIntent = async (projectId, intentId) => {
  const res = await axios.delete(`/api/v1/intent-factory/projects/${projectId}/intents/${intentId}`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const importPack = async (projectId, payload) => {
  const res = await axios.post(`/api/v1/intent-factory/projects/${projectId}/import-pack`, payload, {
    headers: authHeaders(),
  });
  return res.data;
};
```

- [ ] **Step 2: App.jsx 라우트 추가**

Add import:

```javascript
import IntentDetail from './pages/intent-factory/IntentDetail';
```

Add routes near Intent Factory routes:

```jsx
<Route path="intent-factory/intents/new" element={<IntentDetail mode="new" />} />
<Route path="intent-factory/intents/:intentId" element={<IntentDetail mode="edit" />} />
```

- [ ] **Step 3: Frontend build 확인**

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
git add frontend/src/api/intentFactory.js frontend/src/App.jsx
git commit -m "feat: add intent factory frontend routes"
```

## 8. Task 5: Intent 목록 화면 구현

**Files:**
- Modify: `frontend/src/pages/intent-factory/IntentList.jsx`

- [ ] **Step 1: IntentList 교체**

Replace `frontend/src/pages/intent-factory/IntentList.jsx` with:

```jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ShellPage from '../../components/common/ShellPage';
import useProjects from '../../hooks/useProjects';
import { importPack, listIntents } from '../../api/intentFactory';

const DEFAULT_IMPORT_PACK = {
  pack_id: 'netzero-intent-pack-v0.1.0',
  pack_version: '0.1.0',
  overwrite: false,
};

const IntentList = () => {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState('');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const fetchItems = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await listIntents(projectId);
      setItems(data.items || []);
    } catch (error) {
      console.error('Intent 목록 조회 실패:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [projectId]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.intent_id} ${item.intent_name} ${item.action_id || ''}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesCategory = category === '전체' || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, category]);

  const handleImport = async () => {
    if (!projectId) return;
    const result = await importPack(projectId, DEFAULT_IMPORT_PACK);
    alert(`Import 완료: ${result.imported}건, 건너뜀: ${result.skipped}건`);
    fetchItems();
  };

  return (
    <ShellPage
      title="Intent 관리"
      eyebrow="Intent Factory"
      description="DB 기반으로 Intent, 예시 질문, Action 연결, Source 검색 범위를 관리합니다."
      statusItems={[
        { label: '프로젝트', value: projectId || '-' },
        { label: 'Intent 수', value: items.length },
        { label: '검색 결과', value: filteredItems.length },
      ]}
    >
      <div className="filter-bar">
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name || project.id}</option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>전체</option>
          <option>NAVIGATION</option>
          <option>SEARCH_DOC</option>
          <option>QUERY</option>
          <option>GUIDE</option>
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Intent ID, 이름, Action 검색" />
        <button className="btn-secondary" onClick={handleImport}>Pack Import</button>
        <button className="btn-primary" onClick={() => navigate('/admin/intent-factory/intents/new')}>Intent 등록</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Intent ID</th>
            <th>Intent 이름</th>
            <th>Category</th>
            <th>Action ID</th>
            <th>예시 질문</th>
            <th>Source Scope</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>로딩 중...</td></tr>
          ) : filteredItems.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>등록된 Intent가 없습니다.</td></tr>
          ) : filteredItems.map((item) => (
            <tr key={item.intent_id}>
              <td>{item.intent_id}</td>
              <td>{item.intent_name}</td>
              <td>{item.category}</td>
              <td>{item.action_id || '-'}</td>
              <td>{item.example_count}</td>
              <td>{item.has_source_scope ? '설정됨' : '-'}</td>
              <td>{item.status}</td>
              <td>
                <button className="btn-table" onClick={() => navigate(`/admin/intent-factory/intents/${item.intent_id}?projectId=${projectId}`)}>상세</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ShellPage>
  );
};

export default IntentList;
```

- [ ] **Step 2: build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/pages/intent-factory/IntentList.jsx
git commit -m "feat: implement intent list screen"
```

## 9. Task 6: Intent 상세/폼/Source Scope 화면 구현

**Files:**
- Create: `frontend/src/components/intent-factory/SourceScopeEditor.jsx`
- Create: `frontend/src/components/intent-factory/IntentForm.jsx`
- Create: `frontend/src/pages/intent-factory/IntentDetail.jsx`

- [ ] **Step 1: SourceScopeEditor 작성**

Create `frontend/src/components/intent-factory/SourceScopeEditor.jsx`:

```jsx
const csvToArray = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

const SourceScopeEditor = ({ category, value, onChange }) => {
  const disabled = category !== 'SEARCH_DOC';
  const scope = value || {
    source_category: '',
    source_status: 'completed',
    document_types: [],
    tags: [],
    top_k: 5,
    score_threshold: 0.65,
  };

  const update = (patch) => onChange({ ...scope, ...patch });

  if (disabled) {
    return (
      <div style={{ color: 'var(--color-text-sub)' }}>
        Source 검색 범위는 SEARCH_DOC Intent에서만 사용합니다.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <label>
        Source Category
        <input value={scope.source_category || ''} onChange={(event) => update({ source_category: event.target.value })} />
      </label>
      <label>
        Source Status
        <input value={scope.source_status || 'completed'} onChange={(event) => update({ source_status: event.target.value })} />
      </label>
      <label>
        문서 유형
        <input value={(scope.document_types || []).join(', ')} onChange={(event) => update({ document_types: csvToArray(event.target.value) })} />
      </label>
      <label>
        Tags
        <input value={(scope.tags || []).join(', ')} onChange={(event) => update({ tags: csvToArray(event.target.value) })} />
      </label>
      <label>
        Top K
        <input type="number" min="1" max="20" value={scope.top_k || 5} onChange={(event) => update({ top_k: Number(event.target.value) })} />
      </label>
      <label>
        Score Threshold
        <input type="number" min="0" max="1" step="0.01" value={scope.score_threshold ?? 0.65} onChange={(event) => update({ score_threshold: Number(event.target.value) })} />
      </label>
    </div>
  );
};

export default SourceScopeEditor;
```

- [ ] **Step 2: IntentForm 작성**

Create `frontend/src/components/intent-factory/IntentForm.jsx`:

```jsx
import SourceScopeEditor from './SourceScopeEditor';

const IntentForm = ({ value, onChange, onSubmit, onArchive, mode }) => {
  const form = value;
  const setField = (field, nextValue) => onChange({ ...form, [field]: nextValue });
  const setExamplesText = (text) => setField('examples', text.split('\n').map((item) => item.trim()).filter(Boolean));

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} style={{ display: 'grid', gap: '16px' }}>
      <label>
        Intent ID
        <input value={form.intent_id} disabled={mode === 'edit'} onChange={(event) => setField('intent_id', event.target.value)} />
      </label>
      <label>
        Intent 이름
        <input value={form.intent_name} onChange={(event) => setField('intent_name', event.target.value)} />
      </label>
      <label>
        설명
        <textarea value={form.description || ''} onChange={(event) => setField('description', event.target.value)} />
      </label>
      <label>
        Category
        <select value={form.category} onChange={(event) => setField('category', event.target.value)}>
          <option>NAVIGATION</option>
          <option>SEARCH_DOC</option>
          <option>QUERY</option>
          <option>GUIDE</option>
        </select>
      </label>
      <label>
        Action ID
        <input value={form.action_id || ''} onChange={(event) => setField('action_id', event.target.value)} />
      </label>
      <label>
        예시 질문
        <textarea value={(form.examples || []).join('\n')} onChange={(event) => setExamplesText(event.target.value)} />
      </label>
      <div>
        <h3 style={{ marginTop: 0 }}>Source 검색 범위</h3>
        <SourceScopeEditor category={form.category} value={form.source_scope} onChange={(scope) => setField('source_scope', scope)} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-primary" type="submit">저장</button>
        {mode === 'edit' && <button className="btn-secondary" type="button" onClick={onArchive}>비활성화</button>}
      </div>
    </form>
  );
};

export default IntentForm;
```

- [ ] **Step 3: IntentDetail 작성**

Create `frontend/src/pages/intent-factory/IntentDetail.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ShellPage from '../../components/common/ShellPage';
import IntentForm from '../../components/intent-factory/IntentForm';
import useProjects from '../../hooks/useProjects';
import { archiveIntent, createIntent, getIntent, updateIntent } from '../../api/intentFactory';

const emptyIntent = {
  intent_id: '',
  intent_name: '',
  description: '',
  category: 'GUIDE',
  action_id: '',
  status: 'draft',
  priority: 100,
  examples: [],
  source_scope: null,
};

const IntentDetail = ({ mode = 'edit' }) => {
  const navigate = useNavigate();
  const { intentId } = useParams();
  const [searchParams] = useSearchParams();
  const { projects } = useProjects();
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '');
  const [form, setForm] = useState(emptyIntent);

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  useEffect(() => {
    if (mode !== 'edit' || !projectId || !intentId) return;
    getIntent(projectId, intentId).then((data) => setForm({ ...emptyIntent, ...data })).catch(() => setForm(emptyIntent));
  }, [mode, projectId, intentId]);

  const handleSubmit = async () => {
    if (mode === 'new') {
      await createIntent(projectId, form);
    } else {
      await updateIntent(projectId, intentId, form);
    }
    navigate('/admin/intent-factory/intents');
  };

  const handleArchive = async () => {
    if (!window.confirm('이 Intent를 비활성화하시겠습니까?')) return;
    await archiveIntent(projectId, intentId);
    navigate('/admin/intent-factory/intents');
  };

  return (
    <ShellPage
      title={mode === 'new' ? 'Intent 등록' : 'Intent 상세'}
      eyebrow="Intent Factory"
      description="Intent 기본 정보, 예시 질문, Action 연결, Source 검색 범위를 관리합니다."
      statusItems={[
        { label: '프로젝트', value: projectId || '-' },
        { label: '모드', value: mode === 'new' ? '등록' : '수정' },
      ]}
    >
      <div style={{ marginBottom: '16px' }}>
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name || project.id}</option>
          ))}
        </select>
      </div>
      <IntentForm value={form} onChange={setForm} onSubmit={handleSubmit} onArchive={handleArchive} mode={mode} />
    </ShellPage>
  );
};

export default IntentDetail;
```

- [ ] **Step 4: build 확인**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/intent-factory frontend/src/pages/intent-factory/IntentDetail.jsx
git commit -m "feat: add intent detail editor"
```

## 10. Task 7: 실제 DB/API/화면 검증

**Files:**
- Verify only

- [ ] **Step 1: Backend 전체 관련 테스트**

Run:

```bash
cd backend
python3 -m unittest test_intent_factory_schema.py test_intent_factory_service.py test_intent_factory_api_contract.py test_menu_contract.py test_intent_pack_loader.py test_intent_matcher.py test_chat_runtime.py
```

Expected:

```text
OK
```

- [ ] **Step 2: Frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected:

```text
built in
```

- [ ] **Step 3: Backend 실행**

Run:

```bash
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8080
```

Expected:

```text
Uvicorn running on http://127.0.0.1:8080
```

- [ ] **Step 4: API 수동 검증**

Login:

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/auth/login/mock \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin"}'
```

Import:

```bash
curl -s -X POST http://127.0.0.1:8080/api/v1/intent-factory/projects/J-Brain/import-pack \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"pack_id":"netzero-intent-pack-v0.1.0","pack_version":"0.1.0","overwrite":false}'
```

List:

```bash
curl -s http://127.0.0.1:8080/api/v1/intent-factory/projects/J-Brain/intents \
  -H 'Authorization: Bearer <TOKEN>'
```

Expected:

```text
items 배열이 반환되고, 각 item에 intent_id, intent_name, category, action_id, example_count, has_source_scope, status가 포함된다.
```

- [ ] **Step 5: 화면 수동 검증**

Open:

```text
http://127.0.0.1:5173/admin/intent-factory/intents
```

Verify:

```text
Intent 목록 화면이 표시된다.
Pack Import 버튼을 누르면 Intent가 DB로 import된다.
Intent 등록 버튼으로 신규 등록 화면에 진입한다.
상세 버튼으로 Intent 상세/수정 화면에 진입한다.
SEARCH_DOC category 선택 시 Source 검색 범위 편집 영역이 활성화된다.
NAVIGATION category 선택 시 Source 검색 범위 안내만 표시된다.
```

## 11. Task 8: 다음 작업 프롬프트 문서화

**Files:**
- Create: `docs/superpowers/plans/2026-06-26-intent-factory-db-core-v0.1-next-prompt.md`

- [ ] **Step 1: 다음 구현 프롬프트 작성**

Create `docs/superpowers/plans/2026-06-26-intent-factory-db-core-v0.1-next-prompt.md`:

````markdown
# 다음 작업 프롬프트: Intent Factory DB Core v0.1 구현

```text
$superpowers:subagent-driven-development

docs/superpowers/plans/2026-06-26-intent-factory-db-core-v0.1.md 계획서를 기준으로 JWP Intent Factory DB Core v0.1 구현을 진행해 주세요.

중요 원칙:
1. Runtime은 기존 Pack 기반 실행 구조를 유지합니다.
2. 이번 단계는 관리 DB와 화면 CRUD를 만드는 단계입니다.
3. Entity/Synonym/FAQ/Action 상세 CRUD와 Pack Builder 완성은 제외합니다.
4. 기존 사용자 변경사항을 되돌리지 않습니다.
5. DB 테이블 생성은 idempotent하게 구현합니다.

완료 기준:
- Intent 목록/상세/등록/수정/archive API가 동작합니다.
- Intent Example이 저장/조회됩니다.
- Intent와 Action 연결이 저장/조회됩니다.
- SEARCH_DOC Intent의 Source 검색 범위가 저장/조회됩니다.
- JSON Pack Import 초안이 동작합니다.
- /admin/intent-factory/intents 화면에서 목록과 상세/등록 화면을 테스트할 수 있습니다.
- backend unittest와 frontend build가 통과합니다.

완료 후:
- 화면 테스트 방법을 한글로 안내해 주세요.
- 다음 단계인 Entity/Synonym/FAQ CRUD 또는 Pack Builder v0.1 중 추천 경로를 제시해 주세요.
```
````

- [ ] **Step 2: 커밋**

```bash
git add docs/superpowers/plans/2026-06-26-intent-factory-db-core-v0.1-next-prompt.md
git commit -m "docs: add next prompt for intent factory db core"
```

## 12. 자체 검토

- Spec coverage: 설계서의 DB 모델, API, 화면, Import, 테스트 요구사항을 Task 1~8에 모두 연결했다.
- Scope check: Entity/Synonym/FAQ/Action 상세 CRUD, Pack Builder 완성, Runtime DB 직접 연동은 제외 범위로 유지했다.
- Type consistency: `intent_id`, `project_id`, `category`, `action_id`, `source_scope` 이름을 Backend/Frontend 전반에서 동일하게 사용한다.
- Runtime safety: 기존 `IntentPackLoader`, `IntentMatcher`, `chat_runtime` 경로는 이번 구현에서 실행 데이터로 변경하지 않는다.

## 13. 실행 핸드오프

이 계획을 구현할 때는 `superpowers:subagent-driven-development`를 사용한다.

추천 실행 방식:

```text
Task 1: DB Schema
Task 2: Schema/Service helpers
Task 3: Backend CRUD API
Task 4: Frontend API client/routes
Task 5: Intent list screen
Task 6: Intent detail/editor
Task 7: Verification
Task 8: Next prompt
```
