import unittest
from pathlib import Path


API_FILE = Path(__file__).resolve().parent / "app" / "api" / "intent_factory.py"
MAIN_FILE = Path(__file__).resolve().parent / "app" / "main.py"


class IntentFactoryApiContractTest(unittest.TestCase):
    def test_intent_factory_router_file_declares_required_routes(self):
        source = API_FILE.read_text(encoding="utf-8")
        self.assertIn('@router.get("/projects/{project_id}/intents")', source)
        self.assertIn('@router.get("/projects/{project_id}/intents/{intent_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/intents")', source)
        self.assertIn('@router.put("/projects/{project_id}/intents/{intent_id}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/intents/{intent_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/import-pack")', source)

    def test_main_includes_intent_factory_router(self):
        source = MAIN_FILE.read_text(encoding="utf-8")
        self.assertIn("intent_factory", source)
        self.assertIn('prefix=f"{settings.API_V1_STR}/intent-factory"', source)

    def test_list_query_groups_by_priority_for_postgresql(self):
        service_source = (Path(__file__).resolve().parent / "app" / "services" / "intent_factory_service.py").read_text(encoding="utf-8")
        self.assertIn("d.priority,", service_source)
        self.assertIn("GROUP BY d.intent_id, d.intent_name, d.category, d.action_id, d.status, d.priority, s.id", service_source)


if __name__ == "__main__":
    unittest.main()
