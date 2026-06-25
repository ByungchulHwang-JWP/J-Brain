import unittest
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.validation_runner import ValidationRunner


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class ValidationRunnerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")

    def test_runs_pack_validation_questions_and_returns_summary(self):
        report = ValidationRunner(self.pack).run()

        self.assertEqual(report["pack_id"], "netzero-intent-pack")
        self.assertEqual(report["pack_version"], "0.1.0")
        self.assertEqual(report["total_questions"], 14)
        self.assertEqual(len(report["results"]), 14)
        self.assertGreaterEqual(report["top1_accuracy"], 0.80)
        self.assertGreaterEqual(report["top3_accuracy"], 0.90)
        self.assertGreaterEqual(report["entity_accuracy"], 0.85)
        self.assertEqual(report["external_llm_calls"], 0)
        self.assertIn("criteria", report)

    def test_jbrain_navigation_questions_pass_top1_and_card_type(self):
        report = ValidationRunner(self.pack).run()
        by_question_id = {
            result["question_id"]: result for result in report["results"]
        }

        for question_id in [
            "VQ-JB-NAV-001",
            "VQ-JB-NAV-002",
            "VQ-JB-NAV-003",
            "VQ-JB-NAV-004",
            "VQ-JB-NAV-005",
        ]:
            with self.subTest(question_id=question_id):
                result = by_question_id[question_id]
                self.assertTrue(result["top1_pass"])
                self.assertTrue(result["top3_pass"])
                self.assertEqual(result["card_type"], "navigation_card")
                self.assertEqual(result["card_status"], "ready")

    def test_failed_questions_are_reported_with_expected_and_actual_values(self):
        report = ValidationRunner(self.pack).run()

        for result in report["results"]:
            self.assertIn("expected_intent_id", result)
            self.assertIn("actual_intent_id", result)
            self.assertIn("expected_action_id", result)
            self.assertIn("actual_action_id", result)
            self.assertIn("confidence_label", result)


if __name__ == "__main__":
    unittest.main()
