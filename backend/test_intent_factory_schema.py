import unittest

from app.core.intent_factory_schema import INTENT_FACTORY_TABLES, build_create_table_sql


class IntentFactorySchemaTest(unittest.TestCase):
    def test_required_tables_are_declared(self):
        self.assertEqual(
            set(INTENT_FACTORY_TABLES),
            {
                "intent_definitions",
                "intent_examples",
                "intent_action_links",
                "intent_source_scopes",
                "intent_entities",
                "entity_synonyms",
                "intent_entity_links",
            },
        )

    def test_create_sql_contains_idempotent_table_creation(self):
        sql = build_create_table_sql()
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_definitions", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_examples", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_action_links", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_source_scopes", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_entities", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.entity_synonyms", sql)
        self.assertIn("CREATE TABLE IF NOT EXISTS graphrag.intent_entity_links", sql)
        self.assertIn("UNIQUE (project_id, intent_id)", sql)
        self.assertIn("JSONB", sql)


if __name__ == "__main__":
    unittest.main()
