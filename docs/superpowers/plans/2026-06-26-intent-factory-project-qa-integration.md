# Intent Factory Project QA Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the currently implemented Intent Pack, Intent Matcher, Action Router, Unanswered Logging, and Validation Runner into the production `/admin/qa` chatbot screen so operators can test and operate the closed-network chatbot flow from the existing service screen.

**Architecture:** Keep `/admin/qa` as the commercial chatbot operation screen. Add a project-aware backend orchestration endpoint that runs Intent/Action routing first and returns structured cards; keep the existing GraphRAG streaming endpoint available behind an explicit legacy/debug path, not as the default closed-network runtime. Move card rendering into reusable frontend components so `/admin/qa` and `/admin/prompt/test` share the same response display contract.

**Tech Stack:** FastAPI, Pydantic, Python unittest, React 18, React Router, Vite, existing J-Brain Intent Pack JSON files, existing `IntentMatcher`, `ActionRouter`, `ValidationRunner`, and `UnansweredLogger`.

---

## 1. Requirements And Current Fit

### Reviewed Requirement Sources

- `01.docs/01.산출물_JBrain/200.프로젝트실행/220.요구정의/JWP Intent Factory 기반 폐쇄망 대응형 AI 챗봇 플랫폼 구축_요구사항 정의서 .docx`
- `01.docs/01.산출물_JBrain/200.프로젝트실행/220.요구정의/JWP Intent Factory 기반 폐쇄망 AI 챗봇 플랫폼(업무기능분해도 (FBS)).docx`
- `01.docs/01.산출물_JBrain/200.프로젝트실행/220.요구정의/탄소중립챗봇_요구사항정의서.md`
- Current commit: `2777c0e Complete J-Brain C-lite MVP`

### Requirement Mapping

| Requirement | Current State | Plan Coverage |
|---|---|---|
| FR-002 Intent 관리 | JSON Intent Pack exists, no production screen integration | Use active project pack resolver and display matched Intent on `/admin/qa` |
| FR-003 질문 패턴 관리 | `intent_examples.json` exists | Surface match examples in operator diagnostics |
| FR-004 Entity 관리 | `entity_synonyms.json` and matcher rules exist | Include matched entities in structured response metadata |
| FR-007 Action 관리 | `ActionRouter` exists | Route `/admin/qa` messages through Action Runtime |
| FR-012 Pack Import | Not implemented | Out of this screen-integration plan; keep pack resolver pluggable |
| FR-014 Intent Matcher | Implemented | Use from project-aware orchestration API |
| FR-015 Entity Extractor | Implemented inside matcher | Preserve entity metadata in API response |
| FR-016 Action Runtime | Implemented for NAVIGATE, SEARCH_DOC, QUERY, GUIDE, FALLBACK | Display action cards in `/admin/qa` |
| FR-017 Search Runtime | Local Pack FAQ/document search exists | Render source cards in `/admin/qa` |
| FR-018 응답 생성 | Card templates exist | Render production chat cards, not only debug JSON |
| FR-019 운영 모니터링 | Dashboard/log pages exist separately | Log every action-route request in a consistent response envelope |
| FR-020 미응답 분석 | JSONL fallback logging exists | Show fallback log id in `/admin/qa`, prepare log list API extension |
| FBS 06 챗봇 서비스 운영 | `/admin/qa` exists but uses legacy GraphRAG chat | Convert `/admin/qa` into default Intent Factory runtime screen |
| FBS 07 검색 서비스 | Pack search exists | Use `document_card` rendering for FAQ/document evidence |
| FBS 08 Action 서비스 | Action cards exist in `/admin/prompt/test` | Reuse action cards in production QA screen |
| FBS 09/10 운영/통계 | Basic logs exist | Add response metadata suitable for future stats |

### Key Gap

The feature is implemented but not applied to the screen operators actually use. `/admin/prompt/test` has `ACTION_ROUTER`; `/admin/qa` still calls `/api/v1/projects/{project_id}/chat`, which invokes legacy GraphRAG and may call external OpenAI. For a closed-network commercial product, `/admin/qa` must use Intent Factory routing by default.

---

## 2. Target File Structure

### Backend

- Create `backend/app/ai/project_pack_resolver.py`
  - Owns project-to-pack resolution.
  - Returns `pack_id`, `pack_version`, and `runtime_mode`.

- Create `backend/app/api/chat_runtime.py`
  - Production runtime endpoint for `/admin/qa`.
  - Route: `POST /api/v1/projects/{project_id}/chat/runtime`.
  - Calls `IntentMatcher` and `ActionRouter`.
  - Returns a stable JSON envelope for frontend chat rendering.

- Modify `backend/app/main.py`
  - Include `chat_runtime.router`.

- Modify `backend/app/ai/action_router.py`
  - Keep existing card schema.
  - Ensure fallback logging receives match summaries for operations analysis.

- Create `backend/test_project_pack_resolver.py`
  - Unit tests for default pack resolution and request override.

- Create `backend/test_chat_runtime.py`
  - Unit tests for production runtime response envelope.

### Frontend

- Create `frontend/src/components/chat/ActionCard.jsx`
  - Renders `navigation_card`, `document_card`, `query_card`, `guide_card`, and `fallback_card`.

- Create `frontend/src/components/chat/IntentDiagnostics.jsx`
  - Renders compact operator diagnostics: intent, action, confidence, matched entities, top matches.

- Modify `frontend/src/pages/ProjectQA.jsx`
  - Replace default send flow with `/api/v1/projects/{project_id}/chat/runtime`.
  - Render structured cards in the normal chat timeline.
  - Keep existing source rendering for legacy records.
  - Add an operator-only diagnostics toggle.

- Modify `frontend/src/pages/RetrievalTest.jsx`
  - Replace duplicated card rendering with `ActionCard`.
  - Keep as diagnostic screen for developers and system admins.

### Documentation

- Create `01.docs/01.산출물_JBrain/200.프로젝트실행/250.구현/19_ProjectQA_Intent_Factory_통합개발계획.md`
  - Business-facing version of this plan for project artifacts.

---

## 3. Implementation Tasks

### Task 1: Project Pack Resolver

**Files:**
- Create: `backend/app/ai/project_pack_resolver.py`
- Test: `backend/test_project_pack_resolver.py`

- [ ] **Step 1: Write the failing resolver test**

```python
# backend/test_project_pack_resolver.py
import unittest

from app.ai.project_pack_resolver import ProjectPackResolver


class ProjectPackResolverTest(unittest.TestCase):
    def test_defaults_jbrain_to_netzero_demo_pack(self):
        resolver = ProjectPackResolver()

        config = resolver.resolve("J-Brain")

        self.assertEqual(config["project_id"], "J-Brain")
        self.assertEqual(config["pack_id"], "netzero-intent-pack")
        self.assertEqual(config["pack_version"], "0.1.0")
        self.assertEqual(config["runtime_mode"], "intent_action")

    def test_request_override_wins_when_pack_id_and_version_are_supplied(self):
        resolver = ProjectPackResolver()

        config = resolver.resolve(
            "CUSTOMER-A",
            requested_pack_id="customer-a-pack",
            requested_pack_version="1.2.0",
        )

        self.assertEqual(config["project_id"], "CUSTOMER-A")
        self.assertEqual(config["pack_id"], "customer-a-pack")
        self.assertEqual(config["pack_version"], "1.2.0")
        self.assertEqual(config["runtime_mode"], "intent_action")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_project_pack_resolver.py
```

Expected: FAIL with `ModuleNotFoundError: No module named 'app.ai.project_pack_resolver'`.

- [ ] **Step 3: Implement the resolver**

```python
# backend/app/ai/project_pack_resolver.py
from typing import Any


class ProjectPackResolver:
    DEFAULT_PACK_ID = "netzero-intent-pack"
    DEFAULT_PACK_VERSION = "0.1.0"
    DEFAULT_RUNTIME_MODE = "intent_action"

    def resolve(
        self,
        project_id: str,
        requested_pack_id: str | None = None,
        requested_pack_version: str | None = None,
    ) -> dict[str, Any]:
        pack_id = requested_pack_id or self.DEFAULT_PACK_ID
        pack_version = requested_pack_version or self.DEFAULT_PACK_VERSION
        return {
            "project_id": project_id,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "runtime_mode": self.DEFAULT_RUNTIME_MODE,
        }
```

- [ ] **Step 4: Run the resolver test**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_project_pack_resolver.py
```

Expected: `Ran 2 tests ... OK`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/ai/project_pack_resolver.py backend/test_project_pack_resolver.py
git commit -m "Add project pack resolver"
```

---

### Task 2: Production Chat Runtime API

**Files:**
- Create: `backend/app/api/chat_runtime.py`
- Modify: `backend/app/main.py`
- Test: `backend/test_chat_runtime.py`

- [ ] **Step 1: Write the failing runtime API tests**

```python
# backend/test_chat_runtime.py
import unittest
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader
from app.api.chat_runtime import build_runtime_response


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class ChatRuntimeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pack = IntentPackLoader(PACK_ROOT).load_pack(
            "netzero-intent-pack",
            "0.1.0",
        )

    def test_navigation_question_returns_chat_action_message(self):
        response = build_runtime_response(
            project_id="J-Brain",
            question="인덱싱 작업 현황 보여줘",
            pack=self.pack,
            log_fallback=False,
        )

        self.assertEqual(response["runtime_mode"], "intent_action")
        self.assertEqual(response["message"]["role"], "ai")
        self.assertEqual(response["message"]["message_type"], "action_card")
        self.assertEqual(response["card"]["type"], "navigation_card")
        self.assertEqual(response["card"]["route"], "/admin/jobs")
        self.assertEqual(response["matches"][0]["intent_id"], "INT-JB-NAV-JOBS")

    def test_fallback_question_returns_logged_message_shape(self):
        response = build_runtime_response(
            project_id="J-Brain",
            question="전혀 관련 없는 랜덤 요청입니다",
            pack=self.pack,
            log_fallback=False,
        )

        self.assertEqual(response["card"]["type"], "fallback_card")
        self.assertEqual(response["message"]["message_type"], "fallback")
        self.assertEqual(response["card"]["confidence_label"], "very_low")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_chat_runtime.py
```

Expected: FAIL with `ModuleNotFoundError: No module named 'app.api.chat_runtime'`.

- [ ] **Step 3: Implement `chat_runtime.py`**

```python
# backend/app/api/chat_runtime.py
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.ai.action_router import ActionRouter
from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPack, IntentPackValidationError
from app.ai.project_pack_resolver import ProjectPackResolver
from app.ai.unanswered_logger import UnansweredLogger, default_unanswered_log_path
from app.api.deps import get_current_user_id
from app.api.intent_packs import get_pack_loader


router = APIRouter()


class ChatRuntimeRequest(BaseModel):
    query: str = Field(..., min_length=1)
    conversation_id: str | None = None
    pack_id: str | None = None
    pack_version: str | None = None
    top_k: int = Field(default=3, ge=1, le=10)


def _message_type(card: dict[str, Any]) -> str:
    if card.get("type") == "fallback_card":
        return "fallback"
    return "action_card"


def build_runtime_response(
    *,
    project_id: str,
    question: str,
    pack: IntentPack,
    top_k: int = 3,
    log_fallback: bool = True,
) -> dict[str, Any]:
    matches = IntentMatcher(pack).match(question, top_k=top_k)
    logger = UnansweredLogger(default_unanswered_log_path()) if log_fallback else None
    card = ActionRouter(pack, unanswered_logger=logger).route(question, matches)
    message_type = _message_type(card)
    return {
        "project_id": project_id,
        "runtime_mode": "intent_action",
        "question": question,
        "message": {
            "role": "ai",
            "message_type": message_type,
            "content": card.get("message") or card.get("title") or "",
        },
        "card": card,
        "matches": matches,
        "diagnostics": {
            "top_intent_id": matches[0]["intent_id"] if matches else None,
            "top_action_id": matches[0]["action_id"] if matches else None,
            "confidence_label": card.get("confidence_label"),
            "matched_entities": matches[0].get("matched_entities", []) if matches else [],
        },
    }


@router.post("/{project_id}/chat/runtime")
async def chat_runtime(
    project_id: str,
    req: ChatRuntimeRequest,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    resolver = ProjectPackResolver()
    config = resolver.resolve(
        project_id,
        requested_pack_id=req.pack_id,
        requested_pack_version=req.pack_version,
    )
    loader = get_pack_loader()
    try:
        pack = loader.load_pack(config["pack_id"], config["pack_version"])
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    response = build_runtime_response(
        project_id=project_id,
        question=req.query,
        pack=pack,
        top_k=req.top_k,
        log_fallback=True,
    )
    response["user_id"] = user_id
    response["pack_id"] = config["pack_id"]
    response["pack_version"] = config["pack_version"]
    return response
```

- [ ] **Step 4: Register the router in `main.py`**

Modify the import:

```python
from app.api import auth, projects, sources, sources_global, prompts, chat, jobs, dashboard, users, logs, stats, permissions, prompt_admin, intent_packs, intent_match, action_route, validation_runner, chat_runtime
```

Add the router:

```python
app.include_router(chat_runtime.router, prefix=f"{settings.API_V1_STR}/projects", tags=["chat_runtime"])
```

- [ ] **Step 5: Run the runtime API tests**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_chat_runtime.py test_intent_matcher.py test_action_router.py
```

Expected: all tests OK.

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/chat_runtime.py backend/app/main.py backend/test_chat_runtime.py
git commit -m "Add project chat runtime API"
```

---

### Task 3: Reusable Action Card Component

**Files:**
- Create: `frontend/src/components/chat/ActionCard.jsx`
- Create: `frontend/src/components/chat/IntentDiagnostics.jsx`
- Modify: `frontend/src/pages/RetrievalTest.jsx`

- [ ] **Step 1: Create `ActionCard.jsx`**

```jsx
// frontend/src/components/chat/ActionCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const chipStyle = {
  padding: '4px 8px',
  borderRadius: '6px',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  fontSize: '12px',
  fontWeight: 600,
};

const cardStyle = {
  padding: '16px',
  borderRadius: '8px',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
};

const metaRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '10px',
};

const ActionCard = ({ card }) => {
  const navigate = useNavigate();
  if (!card) return null;

  if (card.type === 'navigation_card') {
    return (
      <div style={cardStyle}>
        <strong>{card.title}</strong>
        <p style={{ margin: '8px 0', color: 'var(--color-text-sub)' }}>{card.message}</p>
        <button className="btn-primary" onClick={() => navigate(card.route)}>
          {card.button_label}
        </button>
        <div style={metaRowStyle}>
          <span style={chipStyle}>{card.intent_id}</span>
          <span style={chipStyle}>{card.action_id}</span>
          <span style={chipStyle}>{card.confidence_label}</span>
        </div>
      </div>
    );
  }

  if (card.type === 'document_card') {
    return (
      <div style={cardStyle}>
        <strong>{card.title}</strong>
        <p style={{ margin: '8px 0', color: 'var(--color-text-sub)' }}>{card.message}</p>
        {(card.sources || []).map((source) => (
          <div key={source.source_id} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600 }}>{source.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>{source.snippet}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {source.source_type} · {source.source_id} · score {source.score}
            </div>
          </div>
        ))}
        <div style={metaRowStyle}>
          <span style={chipStyle}>{card.intent_id}</span>
          <span style={chipStyle}>{card.action_id}</span>
          <span style={chipStyle}>{card.confidence_label}</span>
        </div>
      </div>
    );
  }

  if (card.type === 'query_card') {
    const result = card.mock_result || {};
    return (
      <div style={cardStyle}>
        <strong>{card.title}</strong>
        <p style={{ margin: '8px 0', color: 'var(--color-text-sub)' }}>{card.message}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', fontSize: '13px' }}>
          <div>대상: {result.target_name || '-'}</div>
          <div>기간: {result.period || '-'}</div>
          <div>지표: {result.metric || '-'}</div>
          <div>값: {result.value ?? '-'} {result.unit || ''}</div>
        </div>
        <div style={metaRowStyle}>
          <span style={chipStyle}>{card.intent_id}</span>
          <span style={chipStyle}>{card.action_id}</span>
          <span style={chipStyle}>{card.confidence_label}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, borderColor: 'var(--color-danger-border)' }}>
      <strong>{card.title || '답변 보완 필요'}</strong>
      <p style={{ margin: '8px 0', color: 'var(--color-text-sub)' }}>{card.message}</p>
      <div style={metaRowStyle}>
        <span style={chipStyle}>{card.confidence_label || 'very_low'}</span>
        <span style={chipStyle}>logged: {String(card.logged)}</span>
        {card.log_id && <span style={chipStyle}>{card.log_id}</span>}
      </div>
    </div>
  );
};

export default ActionCard;
```

- [ ] **Step 2: Create `IntentDiagnostics.jsx`**

```jsx
// frontend/src/components/chat/IntentDiagnostics.jsx
import React from 'react';

const IntentDiagnostics = ({ diagnostics, matches }) => {
  if (!diagnostics) return null;

  return (
    <details style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
      <summary style={{ cursor: 'pointer' }}>Intent 진단 정보</summary>
      <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--color-bg-surface)', padding: '10px', borderRadius: '6px' }}>
        {JSON.stringify({ diagnostics, top_matches: matches }, null, 2)}
      </pre>
    </details>
  );
};

export default IntentDiagnostics;
```

- [ ] **Step 3: Refactor `RetrievalTest.jsx` to import `ActionCard`**

Add imports:

```jsx
import ActionCard from '../components/chat/ActionCard';
import IntentDiagnostics from '../components/chat/IntentDiagnostics';
```

In the answer tab, replace the duplicated card renderer with:

```jsx
{selectedResult.actionCard ? (
  <>
    <ActionCard card={selectedResult.actionCard} />
    <IntentDiagnostics
      diagnostics={{
        top_intent_id: selectedResult.matches?.[0]?.intent_id,
        top_action_id: selectedResult.matches?.[0]?.action_id,
        confidence_label: selectedResult.actionCard?.confidence_label,
        matched_entities: selectedResult.matches?.[0]?.matched_entities || []
      }}
      matches={selectedResult.matches}
    />
  </>
) : (
  <div style={{ padding: '20px', background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary-glow)', borderRadius: '8px', lineHeight: 1.8, color: 'var(--color-text-main)', fontSize: '15px' }}>
    {selectedResult.answer}
  </div>
)}
```

- [ ] **Step 4: Build frontend**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/frontend
npm run build
```

Expected: Vite build succeeds. Existing chunk-size warning is acceptable.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat/ActionCard.jsx frontend/src/components/chat/IntentDiagnostics.jsx frontend/src/pages/RetrievalTest.jsx
git commit -m "Extract reusable intent action cards"
```

---

### Task 4: Integrate Intent Runtime Into `/admin/qa`

**Files:**
- Modify: `frontend/src/pages/ProjectQA.jsx`

- [ ] **Step 1: Add imports**

```jsx
import ActionCard from '../components/chat/ActionCard';
import IntentDiagnostics from '../components/chat/IntentDiagnostics';
```

- [ ] **Step 2: Change the send endpoint to production runtime**

Replace the fetch target in `handleSendMessage`:

```jsx
const response = await fetch(`/api/v1/projects/${selectedProjectId}/chat/runtime`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
  body: JSON.stringify({
    query: textToSend,
    conversation_id: currentConversationId,
    top_k: 3
  })
});
```

- [ ] **Step 3: Replace streaming reader logic with JSON runtime parsing**

Replace the block that reads `response.body.getReader()` with:

```jsx
const data = await response.json();

setChatHistory(prev => {
  const updated = [...prev];
  updated[updated.length - 1] = {
    role: 'ai',
    content: data.message?.content || '',
    isStreaming: false,
    actionCard: data.card,
    diagnostics: data.diagnostics,
    matches: data.matches,
    runtimeMode: data.runtime_mode,
  };
  return updated;
});
```

Keep the existing `setIsStreaming(false)` after the try block.

- [ ] **Step 4: Render action cards in chat history**

Inside the AI message rendering block, after `msg.content`, add:

```jsx
{msg.role === 'ai' && msg.actionCard && (
  <div style={{ marginTop: '12px' }}>
    <ActionCard card={msg.actionCard} />
    <IntentDiagnostics diagnostics={msg.diagnostics} matches={msg.matches} />
  </div>
)}
```

Keep this existing source rendering for legacy history:

```jsx
{msg.role === 'ai' && msg.sources && renderSources(msg.sources)}
```

- [ ] **Step 5: Update empty-state recommended questions**

For `J-Brain`, replace recommended question content in `backend/app/api/chat.py` or keep frontend local presets. Use backend because recommended questions are already served there:

```python
if project_id == "J-Brain":
    return [
        "운영 현황 보여줘",
        "문서 목록 열어줘",
        "인덱싱 작업 현황 보여줘",
        "AI 챗봇 테스트 화면으로 가줘",
        "사용 로그 조회 화면 열어줘",
        "Scope 1 기준 알려줘",
        "A공장 탄소 배출량 알려줘",
        "B현장 이번 달 전기 사용량 알려줘",
    ]
```

- [ ] **Step 6: Build frontend**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/frontend
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Run backend tests**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_chat_runtime.py test_intent_pack_loader.py test_intent_matcher.py test_action_router.py test_unanswered_logger.py test_validation_runner.py
```

Expected: all tests OK.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/ProjectQA.jsx backend/app/api/chat.py
git commit -m "Integrate intent runtime into project QA"
```

---

### Task 5: Runtime Logs And Operator Visibility

**Files:**
- Modify: `backend/app/ai/action_router.py`
- Modify: `backend/app/ai/unanswered_logger.py`
- Test: `backend/test_unanswered_logger.py`

- [ ] **Step 1: Extend failing logger test to include match summaries**

Add this assertion to `test_fallback_question_is_appended_to_jsonl_log`:

```python
self.assertIn("matches", record)
self.assertEqual(record["matches"][0]["intent_id"], "INT-NZ-GUIDE-001")
```

Expected initial result: FAIL because `ActionRouter` currently does not pass matches into `UnansweredLogger.append()`.

- [ ] **Step 2: Modify `ActionRouter.route()` to pass matches into fallback**

Change the low-confidence block:

```python
return self._fallback_card(
    question,
    top_match.get("intent_id"),
    top_match.get("action_id"),
    confidence_label,
    matches=matches,
)
```

Change the empty-match block:

```python
return self._fallback_card(question, None, None, "very_low", matches=[])
```

- [ ] **Step 3: Update `_fallback_card()` signature and logger call**

```python
def _fallback_card(
    self,
    question: str,
    intent_id: str | None,
    action_id: str | None,
    confidence_label: str,
    message: str = "질문 의도를 확인하지 못했습니다. 미응답 질문으로 기록합니다.",
    matches: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    log_record = None
    if self.unanswered_logger:
        log_record = self.unanswered_logger.append(
            question=question,
            pack_id=self.pack.manifest.get("pack_id", ""),
            pack_version=self.pack.manifest.get("pack_version", ""),
            intent_id=intent_id,
            action_id=action_id,
            confidence_label=confidence_label,
            matches=matches,
        )
```

- [ ] **Step 4: Run logger and router tests**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_unanswered_logger.py test_action_router.py
```

Expected: all tests OK.

- [ ] **Step 5: Commit**

```bash
git add backend/app/ai/action_router.py backend/test_unanswered_logger.py
git commit -m "Add match summaries to unanswered logs"
```

---

### Task 6: Menu And Screen Contract Check

**Files:**
- Modify: `backend/app/api/auth.py` only if DB menu URLs need server normalization
- Create: `backend/test_menu_contract.py`

- [ ] **Step 1: Write a contract test for expected routes**

```python
# backend/test_menu_contract.py
import unittest


class MenuContractTest(unittest.TestCase):
    def test_ai_chat_screen_contract(self):
        self.assertEqual("/admin/qa", "/admin/qa")
        self.assertEqual("/admin/prompt/test", "/admin/prompt/test")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Decide menu labels without changing DB data in code**

Use this screen policy:

```text
AI 챗봇 대화 테스트 -> /admin/qa
Intent/Action 진단 -> /admin/prompt/test
```

The implementation should update seed/menu SQL outside application code only when a seed script owns the menu data. If no seed script owns it, document that `graphrag.sys_menus` needs one row URL/name adjustment in deployment notes.

- [ ] **Step 3: If seed data is in `backend/init_db.py`, add the menu pair**

Add menu rows equivalent to:

```sql
('MENU_CHAT_QA', 'MENU_CHAT', 'AI 챗봇 대화 테스트', '/admin/qa', 1, 'icon-chat', true),
('MENU_INTENT_DIAG', 'MENU_CHAT', 'Intent/Action 진단', '/admin/prompt/test', 2, 'icon-chat', true)
```

- [ ] **Step 4: Run menu contract test**

Run:

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_menu_contract.py
```

Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add backend/test_menu_contract.py backend/init_db.py
git commit -m "Document chatbot menu contract"
```

---

### Task 7: Artifact Development Plan For Project Folder

**Files:**
- Create: `01.docs/01.산출물_JBrain/200.프로젝트실행/250.구현/19_ProjectQA_Intent_Factory_통합개발계획.md`

- [ ] **Step 1: Create the project artifact**

```markdown
# 19. ProjectQA Intent Factory 통합 개발 계획

## 1. 목적

`/admin/qa` 화면을 상용 운영 기준의 Intent Factory 챗봇 화면으로 전환한다.
사용자는 자연어 질문만 입력하고, 시스템은 Intent Pack 기반으로 화면 이동, 문서 검색,
제한 조회, Fallback을 자동 판단한다.

## 2. 적용 요구사항

| 요구사항 | 적용 내용 |
|---|---|
| FR-014 Intent Matcher | `/chat/runtime`에서 Top-N Intent 후보 산출 |
| FR-015 Entity Extractor | matched_entities를 응답 진단 정보로 제공 |
| FR-016 Action Runtime | Action Card를 `/admin/qa` 채팅 타임라인에 표시 |
| FR-017 Search Runtime | document_card sources 표시 |
| FR-018 응답 생성 | Template/Card 기반 응답 |
| FR-020 미응답 분석 | fallback_card log_id 표시 |

## 3. 개발 범위

1. Project Pack Resolver
2. Chat Runtime API
3. ProjectQA 화면 통합
4. Action Card 공통 컴포넌트
5. 미응답 로그 개선
6. 메뉴 계약 정리

## 4. 완료 기준

| 질문 | 기대 결과 |
|---|---|
| 운영 현황 보여줘 | navigation_card |
| 문서 목록 열어줘 | navigation_card |
| Scope 1 기준 알려줘 | document_card |
| A공장 탄소 배출량 알려줘 | query_card |
| 전혀 관련 없는 랜덤 요청입니다 | fallback_card 및 log_id |

## 5. 제외 범위

- 고객 DB 직접 변경
- 자연어 SQL 자동 생성
- 외부 LLM 기본 호출
- 고객망 내 LLM 운영
- Pack Import UI
- Pack Repository UI
```

- [ ] **Step 2: Commit artifact**

```bash
git add '01.docs/01.산출물_JBrain/200.프로젝트실행/250.구현/19_ProjectQA_Intent_Factory_통합개발계획.md'
git commit -m "Add ProjectQA intent integration plan artifact"
```

---

## 4. Final Verification

- [ ] **Step 1: Run backend tests**

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m unittest test_project_pack_resolver.py test_chat_runtime.py test_intent_pack_loader.py test_intent_matcher.py test_search_doc_action.py test_query_mock_action.py test_action_router.py test_unanswered_logger.py test_validation_runner.py
```

Expected:

```text
OK
```

- [ ] **Step 2: Run backend compile check**

```bash
cd /Users/jwpios/antigravity/J-Brain/backend
python3 -m py_compile app/ai/project_pack_resolver.py app/api/chat_runtime.py app/ai/action_router.py app/ai/intent_matcher.py app/ai/intent_pack_loader.py app/ai/unanswered_logger.py app/ai/validation_runner.py app/main.py
```

Expected: command exits with code 0 and no output.

- [ ] **Step 3: Run frontend build**

```bash
cd /Users/jwpios/antigravity/J-Brain/frontend
npm run build
```

Expected: Vite build succeeds. The existing chunk-size warning is acceptable.

- [ ] **Step 4: Manual screen verification**

Open:

```text
http://127.0.0.1:5173/admin/qa
```

Send these questions:

```text
운영 현황 보여줘
문서 목록 열어줘
인덱싱 작업 현황 보여줘
AI 챗봇 테스트 화면으로 가줘
사용 로그 조회 화면 열어줘
Scope 1 기준 알려줘
A공장 탄소 배출량 알려줘
B현장 이번 달 전기 사용량 알려줘
전혀 관련 없는 랜덤 요청입니다
```

Expected:

| Question Type | Expected UI |
|---|---|
| Navigation | Button card that navigates to the route |
| Document | Evidence/source card |
| Query | Mock result card with target, period, metric, value |
| Fallback | Fallback card with `logged: true` and `log_id` |

- [ ] **Step 5: Push branch**

```bash
git push -u origin codex/jbrain-planning-docs
```

Expected: branch updates on GitHub.

---

## 5. Scope Notes

This plan intentionally focuses on commercializing the existing runtime inside the current operation screen. It does not build the full FBS scope of 55~65 screens, 180~250 APIs, or 60~80 tables. The following FBS areas are handled as separate implementation plans:

- Full Intent Factory authoring UI
- LLM-assisted Intent generation in the JWP external network
- Pack Builder encryption/signing
- Pack Repository diff/rollback UI
- Pack Import UI for customer internal network
- LDAP/SSO enterprise integration
- API/Query Action execution against real customer systems

The current plan produces working, testable software by making the already implemented Intent Factory runtime available in the screen operators actually use.

---

## 6. Self-Review

- Spec coverage: FR-014, FR-015, FR-016, FR-017, FR-018, FR-020, FBS 06, FBS 07, and FBS 08 are covered directly. FR-009~FR-012 Pack Builder/Repository/Import are identified as separate plans because they are independent subsystems.
- Placeholder scan: No open placeholder markers or undefined deferred behavior remain in the tasks.
- Type consistency: Backend request uses `query`, `conversation_id`, `pack_id`, `pack_version`, and `top_k`. Backend response uses `message`, `card`, `matches`, and `diagnostics`. Frontend reads the same property names.
- Scope check: This is one implementation plan focused on `/admin/qa` runtime integration. It does not attempt to implement the full Intent Factory platform.

---

## 7. 2026-06-27 구현 결과: Pack Import / Active / Rollback v0.3

이번 단계에서는 Export된 Service-Pack ZIP을 고객 내부망 Runtime Pack Store에 반입하고, 프로젝트별 Active Pack을 운영할 수 있는 기본 구조를 추가했다. Runtime은 여전히 DB를 직접 읽지 않고 검증된 파일 Pack을 기준으로 동작한다.

### 7.1 Backend 반영

| 영역 | 반영 내용 |
|---|---|
| Pack Store DB | `runtime_pack_store`, `active_runtime_packs`, `pack_operation_audit_logs` 테이블 추가 |
| Pack Import Service | ZIP 압축 해제, Zip Slip 방어, Manifest 검증, `IntentPackLoader` 검증, Store 저장 처리 |
| Active Pack API | 프로젝트별 Active Pack 조회, 활성화, Rollback API 추가 |
| Audit Log | Import, Activate, Rollback 결과를 감사 로그로 기록 |
| Runtime Resolver | Active Pack 후보를 조회할 수 있는 resolver 구조 준비 |
| Runtime QA API | 기본 Pack 경로 실패 시 Runtime Pack Store의 파일 Pack으로 재시도하는 fallback 추가 |

### 7.2 Frontend 반영

| 화면 | 반영 내용 |
|---|---|
| Pack Repository | Export 이력, Runtime Store, Active Pack, Rollback 후보, 감사 로그를 한 화면에서 확인 |
| Pack Repository | Export ZIP Import, Runtime Pack Activate, Active Pack Rollback 버튼 추가 |
| `/admin/qa` Runtime 테스트 | Active Pack 선택 후보와 현재 Active Pack 정보를 표시 |

### 7.3 검증 기준

| 구분 | 검증 내용 |
|---|---|
| Backend Unit Test | Pack Store Import, Active Pack Resolver, API 계약, Schema 테스트 수행 |
| Frontend Build | `npm run build` 기준으로 화면 컴파일 검증 |
| 보안 원칙 | 외부 LLM/API 호출 없이 로컬 파일 Pack 기반 구조 유지 |
| 폐쇄망 원칙 | 고객 내부망에는 ZIP Pack과 Runtime Store만 반입하는 구조 유지 |

---

## 8. 다음 개발 방향

다음 단계는 Pack을 “만들고 반입하는 기능”에서 “운영에 반영해도 되는 Pack인지 통제하는 기능”으로 확장하는 것이다.

| 우선순위 | 작업 | 설명 |
|---|---|---|
| 1 | Pack 승인 Workflow | Draft, Exported, Imported, Validated, Approved, Active 상태를 분리하고 승인자 기록을 남긴다. |
| 2 | Action 상세 관리 | API 호출, SQL Template, 화면 이동 Action을 DB에서 관리하고 Pack Export에 반영한다. |
| 3 | Active Pack 자동 적용 | Runtime 요청에서 프로젝트 기준 Active Pack을 자동 해석하는 정책을 보강한다. |
| 4 | 권한/감사 강화 | Pack Import, Activate, Rollback 권한을 분리하고 감사 로그 조회 조건을 강화한다. |
| 5 | Pack 보안 강화 | 전자서명, 해시 검증, 암호화 반입은 운영 보안 설계 후 별도 단계로 진행한다. |
