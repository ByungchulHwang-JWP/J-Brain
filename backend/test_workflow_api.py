import unittest
from pathlib import Path


class WorkflowApiContractTest(unittest.TestCase):
    def test_workflow_router_declares_required_routes(self):
        source = (Path(__file__).resolve().parent / "app" / "api" / "workflow.py").read_text(encoding="utf-8")

        self.assertIn('@router.get("/projects")', source)
        self.assertIn('@router.get("/projects/{project_id}/summary")', source)
        self.assertIn('@router.get("/projects/{project_id}/stages")', source)
        self.assertIn('@router.get("/projects/{project_id}/next-actions")', source)
        self.assertIn('@router.post("/projects/{project_id}/draft-packs")', source)
        self.assertIn('@router.post("/projects/{project_id}/stage-events")', source)

    def test_main_includes_workflow_router(self):
        source = (Path(__file__).resolve().parent / "app" / "main.py").read_text(encoding="utf-8")

        self.assertIn("workflow", source)
        self.assertIn('prefix=f"{settings.API_V1_STR}/workflow"', source)


if __name__ == "__main__":
    unittest.main()

