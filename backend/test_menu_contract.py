import unittest
from pathlib import Path

from app.core.menu_seed import INTENT_FACTORY_MENU_ITEMS

APP_JSX = Path(__file__).resolve().parent.parent / "frontend" / "src" / "App.jsx"


class MenuContractTest(unittest.TestCase):
    def test_leaf_menu_routes_are_registered_in_react_router(self):
        source = APP_JSX.read_text(encoding="utf-8")
        leaf_urls = [
            item["url"]
            for item in INTENT_FACTORY_MENU_ITEMS
            if item["url"]
            and not any(
                child["parent_id"] == item["id"] for child in INTENT_FACTORY_MENU_ITEMS
            )
        ]

        missing = []
        for url in leaf_urls:
            route_path = url.replace("/admin/", "")
            has_dynamic_workflow_stage_route = (
                route_path.startswith("workflow/projects/:projectId/stages/")
                and 'path="workflow/projects/:projectId/stages/:stageNo"' in source
            )
            if f'path="{route_path}"' not in source and not has_dynamic_workflow_stage_route:
                missing.append(url)

        self.assertEqual(missing, [])

    def test_runtime_routes_keep_existing_project_qa_contract(self):
        source = APP_JSX.read_text(encoding="utf-8")
        self.assertIn('path="runtime/qa" element={<ProjectQA />}', source)
        self.assertIn('path="runtime/intent-match" element={<IntentMatchTest />}', source)


if __name__ == "__main__":
    unittest.main()
