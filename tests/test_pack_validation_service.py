import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.services.pack_validation_service import build_auto_validation_questions_from_draft


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
