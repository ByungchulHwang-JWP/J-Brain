from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_workflow_quick_panel_component_contract():
    component = read("frontend/src/components/workflow/WorkflowQuickPanel.jsx")

    assert 'role="dialog"' in component
    assert 'aria-modal="true"' in component
    assert "workflow-drawer-overlay" in component
    assert "workflow-side-drawer" in component
    assert "workflow-quick-panel" in component
    assert "onClose" in component


def test_intent_design_stage_uses_in_stage_quick_panel_for_work_cards():
    page = read("frontend/src/pages/workflow/stages/IntentDesignStage.jsx")

    assert "WorkflowQuickPanel" in page
    assert "activePanel" in page
    assert "setActivePanel('examples')" in page
    assert "setActivePanel('assist')" in page
    assert "navigate(card.path)" not in page


def test_question_coverage_stage_uses_in_stage_quick_panel():
    page = read("frontend/src/pages/workflow/stages/QuestionCoverageStage.jsx")

    assert "WorkflowQuickPanel" in page
    assert "activePanel" in page
    assert "setActivePanel('examples')" in page
    assert "panel: 'validation'" in page
