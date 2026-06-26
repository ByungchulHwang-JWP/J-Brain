import unittest

from app.services.intent_factory_service import (
    build_default_source_scope,
    normalize_example_text,
    pack_intent_to_record,
)


class IntentFactoryServiceTest(unittest.TestCase):
    def test_normalize_example_text_collapses_spacing_and_lowercases(self):
        self.assertEqual(normalize_example_text("  Scope   1 기준 알려줘  "), "scope 1 기준 알려줘")

    def test_default_source_scope_for_search_doc(self):
        scope = build_default_source_scope("J-Brain", "INT-DOC", "SEARCH_DOC")
        self.assertEqual(scope["project_id"], "J-Brain")
        self.assertEqual(scope["intent_id"], "INT-DOC")
        self.assertEqual(scope["source_category"], "J-Brain")
        self.assertEqual(scope["source_status"], "completed")
        self.assertEqual(scope["document_types"], [])
        self.assertEqual(scope["tags"], [])
        self.assertEqual(scope["top_k"], 5)
        self.assertEqual(scope["score_threshold"], 0.65)

    def test_default_source_scope_for_lowercase_search_doc(self):
        scope = build_default_source_scope("J-Brain", "INT-DOC", "search_doc")
        self.assertEqual(scope["source_category"], "J-Brain")

    def test_default_source_scope_not_created_for_navigation(self):
        self.assertIsNone(build_default_source_scope("J-Brain", "INT-NAV", "NAVIGATION"))

    def test_pack_intent_to_record_maps_required_fields(self):
        item = {
            "intent_id": "INT-JB-NAV-DASHBOARD",
            "intent_name": "운영 현황 화면 이동",
            "description": "운영 현황으로 이동한다.",
            "category": "NAVIGATION",
            "action_id": "ACT-JB-NAV-DASHBOARD",
        }
        record = pack_intent_to_record("J-Brain", item)
        self.assertEqual(record["project_id"], "J-Brain")
        self.assertEqual(record["intent_id"], "INT-JB-NAV-DASHBOARD")
        self.assertEqual(record["intent_name"], "운영 현황 화면 이동")
        self.assertEqual(record["status"], "active")


if __name__ == "__main__":
    unittest.main()
