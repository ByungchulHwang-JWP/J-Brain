import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.unanswered_logger import UnansweredLogger
from app.api.deps import get_current_user_id
from app.api.chat_runtime import build_runtime_response
from app.main import app


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
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")

    def test_navigation_question_returns_navigation_card(self):
        response = build_runtime_response(
            "project-123",
            "인덱싱 작업 현황 보여줘",
            self.pack,
            top_k=3,
            log_fallback=False,
        )

        self.assertEqual(response["project_id"], "project-123")
        self.assertEqual(response["pack_id"], "netzero-intent-pack")
        self.assertEqual(response["pack_version"], "0.1.0")
        self.assertEqual(response["runtime_mode"], "intent_action")
        self.assertEqual(response["question"], "인덱싱 작업 현황 보여줘")
        self.assertEqual(response["card"]["type"], "navigation_card")
        self.assertEqual(response["card"]["route"], "/admin/jobs")
        self.assertEqual(response["message"]["role"], "ai")
        self.assertEqual(response["message"]["message_type"], "action_card")
        self.assertEqual(response["diagnostics"]["top_intent_id"], "INT-JB-NAV-JOBS")
        self.assertEqual(response["diagnostics"]["top_action_id"], "ACT-JB-GO-JOBS")
        self.assertEqual(response["diagnostics"]["top_confidence_label"], "high")
        self.assertIsInstance(response["diagnostics"]["matched_entities"], list)

    def test_fallback_question_returns_fallback_card(self):
        response = build_runtime_response(
            "project-123",
            "전혀 관련 없는 랜덤 요청입니다",
            self.pack,
            top_k=3,
            log_fallback=False,
        )

        self.assertEqual(response["card"]["type"], "fallback_card")
        self.assertEqual(response["message"]["role"], "ai")
        self.assertEqual(response["message"]["message_type"], "fallback")
        self.assertEqual(response["diagnostics"]["top_confidence_label"], "very_low")
        self.assertEqual(response["card"]["confidence_label"], "very_low")
        self.assertNotIn("log_id", response)

    def test_fallback_logging_failure_does_not_fail_response(self):
        with patch.object(UnansweredLogger, "append", side_effect=OSError("disk full")):
            response = build_runtime_response(
                "project-123",
                "전혀 관련 없는 랜덤 요청입니다",
                self.pack,
                top_k=3,
                log_fallback=True,
            )

        self.assertEqual(response["card"]["type"], "fallback_card")
        self.assertEqual(response["message"]["message_type"], "fallback")
        self.assertNotIn("log_id", response)


class ChatRuntimeEndpointTest(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_current_user_id] = lambda: "test-user"
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.pop(get_current_user_id, None)

    def test_endpoint_navigation_question_returns_navigation_card(self):
        response = self.client.post(
            "/api/v1/projects/J-Brain/chat/runtime",
            json={"query": "인덱싱 작업 현황 보여줘"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["project_id"], "J-Brain")
        self.assertEqual(payload["card"]["type"], "navigation_card")
        self.assertEqual(payload["card"]["route"], "/admin/jobs")
        self.assertEqual(payload["message"]["role"], "ai")

    def test_endpoint_rejects_pack_id_without_pack_version(self):
        response = self.client.post(
            "/api/v1/projects/J-Brain/chat/runtime",
            json={
                "query": "인덱싱 작업 현황 보여줘",
                "pack_id": "netzero-intent-pack",
            },
        )

        self.assertEqual(response.status_code, 422)

    def test_endpoint_rejects_pack_version_without_pack_id(self):
        response = self.client.post(
            "/api/v1/projects/J-Brain/chat/runtime",
            json={
                "query": "인덱싱 작업 현황 보여줘",
                "pack_version": "0.1.0",
            },
        )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
