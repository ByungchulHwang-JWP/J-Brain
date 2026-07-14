import sys
from pathlib import Path
from shutil import copytree

import pytest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.schemas.intent_factory import PackValidationRunPayload
from app.services import pack_validation_service
from app.services.pack_validation_service import build_auto_validation_questions_from_draft


class _RuntimePackResult:
    def __init__(self, store_path: str):
        self._store_path = store_path

    def fetchone(self):
        return type("RuntimePackRow", (), {"store_path": self._store_path})()


class _RuntimePackDb:
    def __init__(self, store_path: str):
        self._store_path = store_path

    async def execute(self, _statement, _params=None):
        return _RuntimePackResult(self._store_path)


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_build_auto_validation_questions_from_draft_uses_examples_and_pack_scope():
    draft = {
        "nlu": {
            "intents": [
                {
                    "intent_id": "INT-JB-FAQ",
                    "intent_name": "FAQ 조회",
                    "action_id": "ACT-JB-SEARCH-DOC",
                    "status": "active",
                }
            ],
            "intent_examples": [
                {"intent_id": "INT-JB-FAQ", "text": "FAQ는 어떻게 등록하나요?"},
                {"intent_id": "INT-JB-FAQ", "example": " FAQ는 어떻게 등록하나요? "},
                {"intent_id": "INT-JB-FAQ", "text": "프로젝트 등록 방법 알려줘"},
            ],
        }
    }

    questions = build_auto_validation_questions_from_draft(
        "J-Brain",
        draft,
        pack_id="J-Brain-db-draft",
        pack_version="0.1-draft",
    )

    assert [item["question"] for item in questions] == [
        "FAQ는 어떻게 등록하나요?",
        "프로젝트 등록 방법 알려줘",
    ]
    assert questions[0]["question_id"].startswith("VAL-AUTO-")
    assert questions[0]["expected_intent_id"] == "INT-JB-FAQ"
    assert questions[0]["expected_action_id"] == "ACT-JB-SEARCH-DOC"
    assert questions[0]["pack_id"] == "J-Brain-db-draft"
    assert questions[0]["pack_version"] == "0.1-draft"


def test_build_auto_validation_questions_from_draft_falls_back_to_intent_name():
    draft = {
        "nlu": {
            "intents": [
                {
                    "intent_id": "INT-JB-ADMIN",
                    "intent_name": "시스템 관리자 역할",
                    "action_id": "ACT-JB-SEARCH-DOC",
                    "status": "active",
                },
                {
                    "intent_id": "INT-JB-NO-ACTION",
                    "intent_name": "액션 없음",
                    "status": "active",
                },
            ],
            "intent_examples": [],
        }
    }

    questions = build_auto_validation_questions_from_draft(
        "J-Brain",
        draft,
        pack_id="J-Brain-db-draft",
        pack_version="0.1-draft",
    )

    assert len(questions) == 1
    assert questions[0]["question"] == "시스템 관리자 역할 알려줘"
    assert questions[0]["expected_intent_id"] == "INT-JB-ADMIN"


@pytest.mark.anyio
async def test_load_pack_for_validation_recovers_stale_runtime_pack_store_path(tmp_path, monkeypatch):
    pack_id = "KT-NetZero-intent-pack"
    pack_version = "0.1.0"
    deployed_store_root = tmp_path / "runtime_pack_store"
    source_pack = (
        Path(__file__).resolve().parents[1]
        / "backend"
        / "app_data"
        / "runtime_pack_store"
        / f"{pack_id}-v{pack_version}"
    )
    deployed_pack = deployed_store_root / source_pack.name
    copytree(source_pack, deployed_pack)
    monkeypatch.setattr(pack_validation_service, "PACK_STORE_ROOT", deployed_store_root)

    pack = await pack_validation_service._load_pack_for_validation(
        _RuntimePackDb(
            "/former-workstation/j-brain/backend/app_data/runtime_pack_store/"
            f"{pack_id}-v{pack_version}"
        ),
        "KT-NetZero",
        PackValidationRunPayload(
            pack_id=pack_id,
            pack_version=pack_version,
            target_type="runtime_pack",
        ),
    )

    assert pack.root_dir == deployed_pack
