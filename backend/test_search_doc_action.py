import unittest
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader
from app.ai.search_doc_action import SearchDocAction


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class SearchDocActionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        loader = IntentPackLoader(PACK_ROOT)
        cls.pack = loader.load_pack("netzero-intent-pack", "0.1.0")
        cls.search = SearchDocAction(cls.pack)

    def test_searches_scope_question_from_faq_and_approved_documents(self):
        results = self.search.search("Scope 1 기준 알려줘", top_k=3)

        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["source_type"], "faq")
        self.assertEqual(results[0]["source_id"], "FAQ-NZ-002")
        self.assertIn("Scope", results[0]["title"])
        self.assertGreater(results[0]["score"], 0)

    def test_searches_emission_factor_question_from_approved_documents(self):
        results = self.search.search("배출계수 기준이 뭐야?", top_k=3)
        ids = [result["source_id"] for result in results]

        self.assertIn("DOC-NZ-FACTOR-001", ids)

    def test_returns_empty_results_for_unrelated_question(self):
        results = self.search.search("대표님이 원하는 그거 해줘", top_k=3)

        self.assertEqual(results, [])


if __name__ == "__main__":
    unittest.main()
