import unittest
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.query_mock_action import QueryMockAction


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class QueryMockActionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")
        cls.query = QueryMockAction(cls.pack)

    def test_returns_emission_mock_result(self):
        result = self.query.execute(
            "ACT-NZ-QUERY-EMISSION",
            "A공장 탄소 배출량 알려줘",
            {"factory": "A공장"},
        )

        self.assertEqual(result["mock"], True)
        self.assertEqual(result["metric"], "탄소 배출량")
        self.assertEqual(result["target_name"], "A공장")
        self.assertEqual(result["unit"], "tCO2e")
        self.assertGreater(result["value"], 0)

    def test_returns_power_mock_result(self):
        result = self.query.execute(
            "ACT-NZ-QUERY-POWER",
            "B현장 이번 달 전기 사용량 알려줘",
            {"site_or_factory": "B현장"},
        )

        self.assertEqual(result["mock"], True)
        self.assertEqual(result["metric"], "전력 사용량")
        self.assertEqual(result["target_name"], "B현장")
        self.assertEqual(result["unit"], "kWh")
        self.assertEqual(result["period"], "이번 달")

    def test_returns_missing_input_mock_result(self):
        result = self.query.execute(
            "ACT-NZ-QUERY-MISSING-INPUT",
            "아직 입력 안 한 현장 있어?",
            {},
        )

        self.assertEqual(result["mock"], True)
        self.assertEqual(result["metric"], "미입력 현황")
        self.assertGreaterEqual(len(result["rows"]), 1)


if __name__ == "__main__":
    unittest.main()
