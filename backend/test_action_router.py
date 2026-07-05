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


class ActionRouterTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")
        cls.matcher = IntentMatcher(cls.pack)
        cls.router = ActionRouter(cls.pack)

    def route_question(self, question):
        matches = self.matcher.match(question, top_k=3)
        return self.router.route(question, matches)

    def test_jbrain_navigation_questions_return_ready_navigation_cards(self):
        cases = [
            ("운영 현황 보여줘", "/admin/dashboard", "운영 현황"),
            ("문서 목록 열어줘", "/admin/sources", "문서(Source) 목록"),
            ("인덱싱 작업 현황 보여줘", "/admin/jobs", "인덱싱 작업 현황"),
            ("AI 챗봇 테스트 화면으로 가줘", "/admin/prompt/test", "AI 챗봇 대화 테스트"),
            ("사용 로그 조회 화면 열어줘", "/admin/logs", "사용 로그 조회"),
        ]

        for question, route, menu_name in cases:
            with self.subTest(question=question):
                card = self.route_question(question)

                self.assertEqual(card["type"], "navigation_card")
                self.assertEqual(card["status"], "ready")
                self.assertEqual(card["route"], route)
                self.assertEqual(card["title"], menu_name)
                self.assertEqual(card["button_label"], f"{menu_name} 열기")

    def test_search_doc_intent_returns_document_card(self):
        card = self.route_question("Scope 1 기준 알려줘")

        self.assertEqual(card["type"], "document_card")
        self.assertEqual(card["status"], "ready")
        self.assertEqual(card["intent_id"], "INT-NZ-DOC-002")
        self.assertEqual(card["action_id"], "ACT-NZ-SEARCH-SCOPE-GUIDE")
        self.assertEqual(card["query"], "Scope 1 기준 알려줘")
        self.assertGreaterEqual(len(card["sources"]), 1)
        self.assertEqual(card["sources"][0]["faq_id"], "FAQ-NZ-002")
        self.assertEqual(card["source_summary"]["faq_count"], 1)
        self.assertGreaterEqual(len(card["faq_matches"]), 1)

    def test_direct_faq_match_returns_document_card_even_when_intent_confidence_is_low(self):
        card = self.route_question("탄소중립플랫폼이 무엇인가요?")

        self.assertEqual(card["type"], "document_card")
        self.assertEqual(card["status"], "ready")
        self.assertEqual(card["confidence_label"], "faq_direct")
        self.assertEqual(card["faq_matches"][0]["faq_id"], "FAQ-NZ-001")

    def test_query_intent_returns_confirmation_required_card(self):
        card = self.route_question("A공장 탄소 배출량 알려줘")

        self.assertEqual(card["type"], "query_card")
        self.assertEqual(card["status"], "mock_ready")
        self.assertEqual(card["intent_id"], "INT-NZ-QUERY-001")
        self.assertEqual(card["action_id"], "ACT-NZ-QUERY-EMISSION")
        self.assertTrue(card["confirmation_required"])
        self.assertIn("factory", card["parameters"])
        self.assertEqual(card["parameters"]["factory"], "A공장")
        self.assertEqual(card["mock_result"]["metric"], "탄소 배출량")
        self.assertEqual(card["mock_result"]["unit"], "tCO2e")

    def test_power_query_intent_returns_mock_result(self):
        card = self.route_question("B현장 이번 달 전기 사용량 알려줘")

        self.assertEqual(card["type"], "query_card")
        self.assertEqual(card["status"], "mock_ready")
        self.assertEqual(card["action_id"], "ACT-NZ-QUERY-POWER")
        self.assertEqual(card["mock_result"]["metric"], "전력 사용량")
        self.assertEqual(card["mock_result"]["target_name"], "B현장")

    def test_low_confidence_match_returns_fallback_card(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            logger = UnansweredLogger(Path(tmp_dir) / "unanswered.jsonl")
            router = ActionRouter(self.pack, unanswered_logger=logger)
            matches = self.matcher.match("전혀 관련 없는 랜덤 요청입니다", top_k=3)
            card = router.route("전혀 관련 없는 랜덤 요청입니다", matches)

            self.assertEqual(card["type"], "fallback_card")
            self.assertEqual(card["status"], "blocked")
            self.assertEqual(card["confidence_label"], "very_low")
            self.assertTrue(card["logged"])

    def test_route_handles_empty_matches_as_fallback(self):
        card = self.router.route("아무 질문", [])

        self.assertEqual(card["type"], "fallback_card")
        self.assertEqual(card["status"], "blocked")
        self.assertIsNone(card["intent_id"])
        self.assertIsNone(card["action_id"])


if __name__ == "__main__":
    unittest.main()
