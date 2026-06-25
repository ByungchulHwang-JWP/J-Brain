import json
import tempfile
import unittest
from pathlib import Path

from app.ai.action_router import ActionRouter
from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.unanswered_logger import UnansweredLogger


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class UnansweredLoggerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")
        cls.matcher = IntentMatcher(cls.pack)

    def test_fallback_question_is_appended_to_jsonl_log(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            log_path = Path(tmp_dir) / "unanswered.jsonl"
            logger = UnansweredLogger(log_path)
            router = ActionRouter(self.pack, unanswered_logger=logger)
            question = "전혀 관련 없는 랜덤 요청입니다"

            matches = self.matcher.match(question, top_k=3)
            card = router.route(question, matches)

            self.assertEqual(card["type"], "fallback_card")
            self.assertTrue(card["logged"])
            self.assertEqual(card["log_id"], "UNANSWERED-000001")

            rows = log_path.read_text(encoding="utf-8").splitlines()
            self.assertEqual(len(rows), 1)

            record = json.loads(rows[0])
            self.assertEqual(record["log_id"], "UNANSWERED-000001")
            self.assertEqual(record["question"], question)
            self.assertEqual(record["pack_id"], "netzero-intent-pack")
            self.assertEqual(record["pack_version"], "0.1.0")
            self.assertEqual(record["confidence_label"], "very_low")
            self.assertEqual(record["status"], "open")

    def test_ready_card_does_not_create_unanswered_log(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            log_path = Path(tmp_dir) / "unanswered.jsonl"
            logger = UnansweredLogger(log_path)
            router = ActionRouter(self.pack, unanswered_logger=logger)

            matches = self.matcher.match("운영 현황 보여줘", top_k=3)
            card = router.route("운영 현황 보여줘", matches)

            self.assertEqual(card["type"], "navigation_card")
            self.assertFalse(log_path.exists())


if __name__ == "__main__":
    unittest.main()
