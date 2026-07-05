import unittest
from pathlib import Path


class IntentDiscoveryApiContractTest(unittest.TestCase):
    def test_router_declares_required_routes(self):
        source = (Path(__file__).resolve().parent / "app" / "api" / "intent_discovery.py").read_text(encoding="utf-8")

        self.assertIn('@router.post("/projects/{project_id}/runs")', source)
        self.assertIn("DiscoveryRunRequest", source)
        self.assertIn('payload.scope == "new"', source)
        self.assertIn("save_incremental_run", source)
        self.assertIn('@router.get("/projects/{project_id}/runs")', source)
        self.assertIn('@router.get("/projects/{project_id}/candidates")', source)
        self.assertIn('@router.patch("/projects/{project_id}/candidates/{candidate_id}")', source)
        self.assertIn('@router.post("/projects/{project_id}/apply-approved")', source)
        self.assertIn('@router.get("/projects/{project_id}/summary")', source)

    def test_main_includes_intent_discovery_router(self):
        source = (Path(__file__).resolve().parent / "app" / "main.py").read_text(encoding="utf-8")

        self.assertIn("intent_discovery", source)
        self.assertIn('prefix=f"{settings.API_V1_STR}/intent-discovery"', source)


if __name__ == "__main__":
    unittest.main()
