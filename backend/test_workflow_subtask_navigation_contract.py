import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class WorkflowSubtaskNavigationContractTest(unittest.TestCase):
    def test_stage_page_renders_child_stages_as_phase_subtasks(self):
        source = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "WorkflowStagePage.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("workflow-subtask-nav", source)
        self.assertIn("getPhaseSubtaskMeta", source)
        self.assertIn("subtask.level", source)
        self.assertIn("subtask.description", source)
        self.assertIn("하위 작업", source)

    def test_phase_metadata_defines_operator_facing_subtasks(self):
        source = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "workflowPhases.js"
        ).read_text(encoding="utf-8")

        for level in ["2.1", "2.2", "3.1", "3.2", "3.3", "5.1", "5.2", "5.3", "6.1", "6.2"]:
            self.assertIn(level, source)

        self.assertIn("Intent 구조 설계", source)
        self.assertIn("예상 질문을 보강해 실제 사용자 표현을 커버합니다.", source)
        self.assertIn("업무 용어와 동의어를 표준화합니다.", source)

    def test_css_makes_subtask_navigation_visually_prominent(self):
        css = (ROOT / "frontend" / "src" / "index.css").read_text(encoding="utf-8")

        self.assertIn(".workflow-subtask-nav", css)
        self.assertIn(".workflow-subtask-card", css)
        self.assertIn(".workflow-subtask-level", css)
        self.assertIn(".workflow-subtask-card.active", css)
        self.assertIn("grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))", css)


if __name__ == "__main__":
    unittest.main()
