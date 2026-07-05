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
        self.assertIn('@router.get("/projects/{project_id}/entities")', source)
        self.assertIn('@router.post("/projects/{project_id}/entities")', source)
        self.assertIn('@router.put("/projects/{project_id}/entities/{entity_type}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/entities/{entity_type}")', source)
        self.assertIn('@router.get("/projects/{project_id}/actions")', source)
        self.assertIn('@router.get("/projects/{project_id}/actions/{action_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/actions")', source)
        self.assertIn('@router.put("/projects/{project_id}/actions/{action_id}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/actions/{action_id}")', source)
        self.assertIn('@router.get("/projects/{project_id}/faqs")', source)
        self.assertIn('@router.get("/projects/{project_id}/faqs/{faq_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/faqs")', source)
        self.assertIn('@router.put("/projects/{project_id}/faqs/{faq_id}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/faqs/{faq_id}")', source)
        self.assertIn('@router.get("/projects/{project_id}/faq-candidates")', source)
        self.assertIn('@router.post("/projects/{project_id}/faq-candidates")', source)
        self.assertIn('@router.put("/projects/{project_id}/faq-candidates/{candidate_id}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/faq-candidates/{candidate_id}")', source)
        self.assertIn('@router.get("/projects/{project_id}/intents/{intent_id}/entities")', source)
        self.assertIn('@router.put("/projects/{project_id}/intents/{intent_id}/entities")', source)
        self.assertIn('@router.get("/projects/{project_id}/pack-draft")', source)
        self.assertIn('@router.get("/projects/{project_id}/validation-questions")', source)
        self.assertIn('@router.get("/projects/{project_id}/validation-questions/{question_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/validation-questions")', source)
        self.assertIn('@router.put("/projects/{project_id}/validation-questions/{question_id}")', source)
        self.assertIn('@router.delete("/projects/{project_id}/validation-questions/{question_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/pack-validation-runs")', source)
        self.assertIn('@router.get("/projects/{project_id}/pack-validation-results")', source)
        self.assertIn('@router.get("/projects/{project_id}/pack-exports")', source)
        self.assertIn('@router.post("/projects/{project_id}/pack-exports")', source)
        self.assertIn('@router.get("/projects/{project_id}/pack-exports/{export_id}/download")', source)
        self.assertIn('@router.post("/projects/{project_id}/pack-exports/{export_id}/import")', source)
        self.assertIn('@router.get("/projects/{project_id}/runtime-packs")', source)
        self.assertIn('@router.get("/projects/{project_id}/active-pack")', source)
        self.assertIn('@router.post("/projects/{project_id}/active-pack")', source)
        self.assertIn('@router.post("/projects/{project_id}/runtime-packs/{pack_id}/{pack_version}/approve")', source)
        self.assertIn('@router.post("/projects/{project_id}/runtime-packs/{pack_id}/{pack_version}/reject")', source)
        self.assertIn('@router.post("/projects/{project_id}/active-pack/rollback")', source)
        self.assertIn('@router.get("/projects/{project_id}/pack-audit-logs")', source)
        self.assertIn('@router.get("/projects/{project_id}/unanswered-logs")', source)
        self.assertIn('@router.post("/projects/{project_id}/unanswered-logs/{log_id}/faq-candidate")', source)

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
