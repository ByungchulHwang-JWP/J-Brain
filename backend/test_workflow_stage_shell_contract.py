import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class WorkflowStageShellContractTest(unittest.TestCase):
    def test_stage_page_uses_compact_shell_and_control_strip(self):
        source = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "WorkflowStagePage.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("workflow-stage-shell-v2", source)
        self.assertIn("workflow-stage-control-strip", source)
        self.assertLess(
            source.index("<WorkflowStepper"),
            source.index("<WorkflowGatePanel"),
            "완료 조건은 단계 레일 아래의 compact rail로 이어져야 합니다.",
        )

    def test_workflow_css_keeps_stepper_and_gate_compact(self):
        css = (ROOT / "frontend" / "src" / "index.css").read_text(encoding="utf-8")

        self.assertIn(".workflow-stage-shell-v2", css)
        self.assertIn("--workflow-rail-height: 52px", css)
        self.assertIn(".workflow-stage-shell-v2 .workflow-stage-card", css)
        self.assertIn("min-height: var(--workflow-rail-height)", css)
        self.assertIn(".workflow-stage-shell-v2 .workflow-gate-rail", css)
        self.assertIn("min-height: 42px", css)

    def test_stage_page_uses_three_zone_operator_layout(self):
        source = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "WorkflowStagePage.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("workflow-stage-main-zone", source)
        self.assertIn("workflow-stage-primary-zone", source)
        self.assertIn("workflow-stage-context-zone", source)
        self.assertIn("현재 단계 작업 요약", source)
        self.assertIn("운영자는 현재 단계 안에서 주요 작업을 처리합니다.", source)

    def test_gate_panel_exposes_compact_completion_summary(self):
        source = (
            ROOT / "frontend" / "src" / "components" / "workflow" / "WorkflowGatePanel.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("completedCount", source)
        self.assertIn("workflow-gate-summary-count", source)
        self.assertIn("완료 조건 요약", source)

    def test_stage_shell_css_supports_compact_workflow_content(self):
        css = (ROOT / "frontend" / "src" / "index.css").read_text(encoding="utf-8")

        self.assertIn(".workflow-stage-main-zone", css)
        self.assertIn("grid-template-columns: minmax(0, 1fr) 280px", css)
        self.assertIn(".workflow-stage-context-card", css)
        self.assertIn(".workflow-stage-shell-v2 .workflow-stage-guide", css)
        self.assertIn(".workflow-stage-shell-v2 .workflow-status-card", css)

    def test_primary_stage_actions_prefer_in_context_overlays(self):
        knowledge = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "stages" / "KnowledgeStage.jsx"
        ).read_text(encoding="utf-8")
        intent = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "stages" / "IntentDesignStage.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("setActiveDrawer('source')", knowledge)
        self.assertIn("setActiveDrawer('jobs')", knowledge)
        self.assertIn("openFaqModal", knowledge)
        self.assertIn("openIntentDrawer", intent)
        self.assertIn("workflow-drawer-overlay", intent)

    def test_left_workflow_menu_is_phase_navigation_only(self):
        source = (
            ROOT / "frontend" / "src" / "components" / "Layout" / "AdminLayout.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("WORKFLOW_PHASE_MENUS", source)
        self.assertIn("children: [dashboard, ...WORKFLOW_PHASE_MENUS]", source)
        self.assertNotIn("프로젝트 선택/목록", source)

    def test_auto_discovery_exposes_incremental_and_full_run_actions(self):
        candidate_review = (
            ROOT / "frontend" / "src" / "pages" / "intent-factory" / "CandidateReview.jsx"
        ).read_text(encoding="utf-8")
        knowledge = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "stages" / "KnowledgeStage.jsx"
        ).read_text(encoding="utf-8")
        api = (ROOT / "frontend" / "src" / "api" / "intentFactory.js").read_text(encoding="utf-8")

        self.assertIn("신규 자료 분석", candidate_review)
        self.assertIn("전체 재분석", candidate_review)
        self.assertIn("handleRun('new')", candidate_review)
        self.assertIn("handleRun('all')", candidate_review)
        self.assertIn("신규 자료 분석", knowledge)
        self.assertIn("handleDiscoveryRun('new')", knowledge)
        self.assertIn("handleDiscoveryRun('all')", knowledge)
        self.assertIn("scope = 'all'", api)
        self.assertIn("{ scope }", api)

    def test_discovery_review_surfaces_source_specific_run_context(self):
        candidate_review = (
            ROOT / "frontend" / "src" / "pages" / "intent-factory" / "CandidateReview.jsx"
        ).read_text(encoding="utf-8")
        knowledge = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "stages" / "KnowledgeStage.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("latest_run", candidate_review)
        self.assertIn("source_names", candidate_review)
        self.assertIn("sourceNames", candidate_review)
        self.assertIn("분석 대상 Source", knowledge)
        self.assertIn("latest_run", knowledge)

    def test_pack_validation_navigation_preserves_workflow_project_context(self):
        stage_source = (
            ROOT / "frontend" / "src" / "pages" / "workflow" / "stages" / "PackValidationStage.jsx"
        ).read_text(encoding="utf-8")
        page_source = (
            ROOT / "frontend" / "src" / "pages" / "packs" / "PackValidation.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("packValidationPath", stage_source)
        self.assertIn("projectId=", stage_source)
        self.assertIn("useSearchParams", page_source)
        self.assertIn("searchParams.get('projectId')", page_source)


if __name__ == "__main__":
    unittest.main()
