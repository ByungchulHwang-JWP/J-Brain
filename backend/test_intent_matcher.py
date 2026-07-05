import unittest
from pathlib import Path

from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPack, IntentPackLoader


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class IntentMatcherTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")
        cls.matcher = IntentMatcher(cls.pack)

    def assert_top_intent(self, question, expected_intent_id):
        matches = self.matcher.match(question, top_k=3)

        self.assertGreaterEqual(len(matches), 1)
        self.assertEqual(matches[0]["intent_id"], expected_intent_id)
        self.assertIn("intent_name", matches[0])
        self.assertIn("action_id", matches[0])
        self.assertIn("category", matches[0])
        self.assertIn("score", matches[0])
        self.assertIn("confidence_label", matches[0])
        self.assertIn("matched_examples", matches[0])
        self.assertIn("matched_entities", matches[0])
        self.assertGreaterEqual(matches[0]["score"], 0.85)
        self.assertEqual(matches[0]["confidence_label"], "high")

    def assert_top3_contains(self, question, expected_intent_id):
        matches = self.matcher.match(question, top_k=3)
        intent_ids = [match["intent_id"] for match in matches]

        self.assertIn(expected_intent_id, intent_ids)

    def test_jbrain_navigation_questions_match_top1(self):
        cases = [
            ("운영 현황 보여줘", "INT-JB-NAV-DASHBOARD"),
            ("문서 목록 열어줘", "INT-JB-NAV-SOURCES"),
            ("인덱싱 작업 현황 보여줘", "INT-JB-NAV-JOBS"),
            ("AI 챗봇 테스트 화면으로 가줘", "INT-JB-NAV-PROMPT-TEST"),
            ("사용 로그 조회 화면 열어줘", "INT-JB-NAV-LOGS"),
        ]

        for question, intent_id in cases:
            with self.subTest(question=question):
                self.assert_top_intent(question, intent_id)

    def test_jbrain_navigation_matches_include_route(self):
        matches = self.matcher.match("인덱싱 작업 현황 보여줘", top_k=3)

        self.assertEqual(matches[0]["action_id"], "ACT-JB-GO-JOBS")
        self.assertEqual(matches[0]["routes"][0]["route_value"], "/admin/jobs")

    def test_netzero_representative_questions_match_top3(self):
        cases = [
            ("Scope 1 기준 알려줘", "INT-NZ-DOC-002"),
            ("A공장 탄소 배출량 알려줘", "INT-NZ-QUERY-001"),
            ("B현장 이번 달 전기 사용량 알려줘", "INT-NZ-QUERY-002"),
        ]

        for question, intent_id in cases:
            with self.subTest(question=question):
                self.assert_top3_contains(question, intent_id)

    def test_returns_only_requested_top_k(self):
        matches = self.matcher.match("배출량 기준 알려줘", top_k=2)

        self.assertEqual(len(matches), 2)

    def test_entity_synonym_bonus_extracts_canonical_entities(self):
        matches = self.matcher.match("에이공장 작년 배출량 조회해줘", top_k=3)
        entities = matches[0]["matched_entities"]

        self.assertTrue(
            any(
                entity["entity_type"] == "factory"
                and entity["canonical_value"] == "A공장"
                for entity in entities
            )
        )

    def test_accepts_db_draft_example_shape(self):
        pack = IntentPack(
            root_dir=Path("."),
            manifest={},
            profile={},
            nlu={
                "intents": [
                    {
                        "intent_id": "INT-DB-DRAFT",
                        "intent_name": "DB Draft 검증",
                        "category": "SEARCH_DOC",
                        "action_id": "ACT-DB-DRAFT",
                    }
                ],
                "intent_examples": [
                    {
                        "intent_id": "INT-DB-DRAFT",
                        "example": "J-Brain 주요 기능 알려줘",
                    }
                ],
                "entity_synonyms": [],
                "confidence_policy": {"category_policy": {"SEARCH_DOC": {"high": 0.65}}},
            },
            action={
                "action_registry": [{"action_id": "ACT-DB-DRAFT", "action_type": "SEARCH_DOC"}],
                "screen_routes": [],
            },
            knowledge={},
            templates={},
            validation={},
        )

        matches = IntentMatcher(pack).match("J-Brain 주요 기능 알려줘", top_k=1)

        self.assertEqual(matches[0]["intent_id"], "INT-DB-DRAFT")
        self.assertEqual(matches[0]["matched_examples"][0]["text"], "J-Brain 주요 기능 알려줘")


if __name__ == "__main__":
    unittest.main()
