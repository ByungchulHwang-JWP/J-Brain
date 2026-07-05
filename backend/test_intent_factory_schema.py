import unittest

from app.core.intent_factory_schema import INTENT_FACTORY_TABLES, build_create_table_sql


class IntentFactorySchemaTest(unittest.TestCase):
    def test_required_tables_are_declared(self):
        self.assertEqual(
            set(INTENT_FACTORY_TABLES),
            {
                "intent_definitions",
                "intent_examples",
                "intent_actions",
                "intent_action_links",
                "intent_source_scopes",
                "intent_entities",
                "entity_synonyms",
                "intent_entity_links",
                "intent_faqs",
                "intent_pack_exports",
                "runtime_pack_store",
                "pack_validation_questions",
                "pack_validation_results",
                "faq_candidates",
                "active_runtime_packs",
                "pack_operation_audit_logs",
            },
        )

    def test_create_sql_contains_idempotent_table_creation(self):
        sql = build_create_table_sql()
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_definitions", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_examples", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_actions", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_action_links", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_source_scopes", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_entities", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.entity_synonyms", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_entity_links", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_faqs", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_pack_exports", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.runtime_pack_store", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.pack_validation_questions", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.pack_validation_results", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.faq_candidates", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.active_runtime_packs", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.pack_operation_audit_logs", sql)
        self.assertIn("UNIQUE (project_id, intent_id)", sql)
        self.assertIn("UNIQUE (export_id)", sql)
        self.assertIn("UNIQUE (project_id, pack_id, pack_version)", sql)
        self.assertIn("JSONB", sql)


if __name__ == "__main__":
    unittest.main()
