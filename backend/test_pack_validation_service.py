import unittest

from app.services.pack_validation_service import _apply_confidence_policy


class PackValidationServiceTest(unittest.TestCase):
    def test_apply_confidence_policy_marks_passed_when_top1_and_score_pass(self):
        result = {
            "question_id": "VAL-001",
            "top1_pass": True,
            "score": 0.7,
        }
        questions = [{"question_id": "VAL-001", "min_confidence_score": 0.65}]

        actual = _apply_confidence_policy(result, questions)

        self.assertTrue(actual["confidence_pass"])
        self.assertTrue(actual["passed"])

    def test_apply_confidence_policy_fails_low_confidence(self):
        result = {
            "question_id": "VAL-001",
            "top1_pass": True,
            "score": 0.4,
        }
        questions = [{"question_id": "VAL-001", "min_confidence_score": 0.65}]

        actual = _apply_confidence_policy(result, questions)

        self.assertFalse(actual["confidence_pass"])
        self.assertFalse(actual["passed"])


if __name__ == "__main__":
    unittest.main()
