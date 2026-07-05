import unittest

from app.services.intent_factory_service import (
    _action_to_pack_records,
    _pack_entity_to_payload,
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

    def test_pack_entity_to_payload_maps_synonyms(self):
        payload = _pack_entity_to_payload(
            {
                "entity_type": "scope",
                "display_name": "Scope",
                "value_type": "enum",
                "required_validation": True,
                "normalization_rule": "entity_synonyms",
                "description": "Scope 구분",
            },
            [
                {
                    "entity_type": "scope",
                    "canonical_value": "Scope 1",
                    "synonyms": ["Scope 1", "스코프1"],
                    "code": "scope_1",
                    "is_active": True,
                },
                {
                    "entity_type": "metric",
                    "canonical_value": "전력 사용량",
                    "synonyms": ["전력량"],
                    "code": "power_usage",
                    "is_active": True,
                },
            ],
        )
        self.assertEqual(payload.entity_type, "scope")
        self.assertEqual(payload.display_name, "Scope")
        self.assertTrue(payload.required_validation)
        self.assertEqual(len(payload.synonyms), 1)
        self.assertEqual(payload.synonyms[0].canonical_value, "Scope 1")

    def test_action_to_pack_records_maps_navigation_route(self):
        records = _action_to_pack_records(
            {
                "action_id": "ACT-JB-GO-DASHBOARD",
                "action_name": "운영 현황 화면 이동",
                "action_type": "NAVIGATE",
                "description": "운영 현황으로 이동한다.",
                "execution_mode": "screen",
                "route_value": "/admin/dashboard",
                "menu_name": "운영 현황",
                "allowed_roles": ["ROLE_ADMIN"],
                "status": "active",
            }
        )
        self.assertEqual(records["action_registry"][0]["action_id"], "ACT-JB-GO-DASHBOARD")
        self.assertEqual(records["screen_routes"][0]["route_value"], "/admin/dashboard")
        self.assertEqual(records["screen_routes"][0]["required_role"], "ROLE_ADMIN")

    def test_action_to_pack_records_maps_query_sql_template(self):
        records = _action_to_pack_records(
            {
                "action_id": "ACT-NZ-QUERY-POWER",
                "action_name": "전력 사용량 조회",
                "action_type": "QUERY",
                "execution_mode": "sql_template",
                "api_method": "POST",
                "api_endpoint": "/api/power",
                "sql_template": "SELECT * FROM power_usage WHERE site = :site",
                "allowed_roles": ["ROLE_OPERATOR"],
                "status": "active",
            }
        )
        self.assertEqual(records["api_mappings"][0]["endpoint"], "/api/power")
        self.assertIn("power_usage", records["sql_templates"][0]["sql_template"])


if __name__ == "__main__":
    unittest.main()
