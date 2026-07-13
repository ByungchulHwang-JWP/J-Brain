import pytest

from app.api.chat_runtime import build_runtime_response
from app.services.runtime_event_log_service import record_runtime_event


class RecordingDb:
    def __init__(self):
        self.statements = []
        self.params = []

    async def execute(self, stmt, params=None):
        self.statements.append(str(stmt))
        self.params.append(params or {})


@pytest.mark.anyio
async def test_record_runtime_event_inserts_runtime_event_log():
    db = RecordingDb()
    response = {
        "conversation_id": "conv-1",
        "pack_id": "KT-NetZero-intent-pack",
        "pack_version": "v0.1.0",
        "card": {"type": "fallback_card", "status": "blocked"},
        "diagnostics": {
            "top_intent_id": None,
            "top_action_id": None,
            "top_confidence_label": "very_low",
            "top_score": 0.12,
        },
    }

    await record_runtime_event(
        db,
        project_id="KT-NetZero",
        question="없는 질문",
        response=response,
        response_time_ms=37,
    )

    assert "INSERT INTO graphrag.runtime_event_logs" in db.statements[0]
    assert db.params[0]["project_id"] == "KT-NetZero"
    assert db.params[0]["session_id"] == "conv-1"
    assert db.params[0]["question"] == "없는 질문"
    assert db.params[0]["fallback_yn"] is True
    assert db.params[0]["confidence"] == 0.12
    assert db.params[0]["response_status"] == "blocked"
    assert db.params[0]["active_pack_version"] == "v0.1.0"


@pytest.mark.anyio
async def test_build_runtime_response_includes_conversation_id(monkeypatch):
    class StubMatcher:
        def __init__(self, pack):
            pass

        def match(self, question, top_k):
            return []

    class StubRouter:
        def __init__(self, pack, unanswered_logger, db):
            pass

        async def route(self, question, matches):
            return {"type": "fallback_card", "message": "No match"}

    class StubPack:
        manifest = {"pack_id": "pack-1", "pack_version": "v1"}
        profile = {}

    monkeypatch.setattr("app.api.chat_runtime.IntentMatcher", StubMatcher)
    monkeypatch.setattr("app.api.chat_runtime.ActionRouter", StubRouter)

    response = await build_runtime_response(
        "project-1",
        "question",
        StubPack(),
        conversation_id="conv-1",
        log_fallback=False,
    )

    assert response["conversation_id"] == "conv-1"


@pytest.mark.anyio
async def test_build_runtime_response_generates_and_logs_conversation_id(monkeypatch):
    class StubMatcher:
        def __init__(self, pack):
            pass

        def match(self, question, top_k):
            return []

    class StubRouter:
        def __init__(self, pack, unanswered_logger, db):
            pass

        async def route(self, question, matches):
            return {"type": "fallback_card", "message": "No match"}

    class StubPack:
        manifest = {"pack_id": "pack-1", "pack_version": "v1"}
        profile = {}

    db = RecordingDb()
    monkeypatch.setattr("app.api.chat_runtime.IntentMatcher", StubMatcher)
    monkeypatch.setattr("app.api.chat_runtime.ActionRouter", StubRouter)

    response = await build_runtime_response(
        "project-1",
        "question",
        StubPack(),
        db=db,
        conversation_id=None,
        log_fallback=False,
    )

    assert response["conversation_id"]
    assert response["conversation_id"].startswith("conv-")
    assert db.params[0]["session_id"] == response["conversation_id"]
