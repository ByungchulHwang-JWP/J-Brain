from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


STAGE_FILES = [
    "frontend/src/pages/workflow/stages/AnswerEvidenceStage.jsx",
    "frontend/src/pages/workflow/stages/PackValidationStage.jsx",
    "frontend/src/pages/workflow/stages/PackBuildStage.jsx",
    "frontend/src/pages/workflow/stages/DeployActivateStage.jsx",
    "frontend/src/pages/workflow/stages/OpsImprovementStage.jsx",
]


def test_workflow_late_stage_cards_use_quick_panel_before_external_navigation():
    for path in STAGE_FILES:
        page = read(path)

        assert "WorkflowQuickPanel" in page, path
        assert "activePanel" in page, path
        assert "quickPanels" in page, path
        assert "setActivePanel(card.panel)" in page, path
        assert "navigate(card.path)" not in page, path


def test_runtime_simulation_scenarios_have_in_stage_guidance_panel():
    page = read("frontend/src/pages/workflow/stages/RuntimeSimulationStage.jsx")

    assert "WorkflowQuickPanel" in page
    assert "activePanel" in page
    assert "quickPanels" in page
    assert "setActivePanel(card.panel)" in page
    assert "openRuntimeQA" in page
