from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_pack_lifecycle_model_defines_clear_workflow_steps():
    source = read("frontend/src/pages/packs/packLifecycleModel.js")
    for text in [
        "Build",
        "Validation",
        "Release",
        "Runtime Store 반입",
        "운영 승인",
        "챗봇 적용",
        "Runtime 테스트",
    ]:
        assert text in source


def test_pack_repository_prioritizes_runtime_store_and_collapses_history():
    source = read("frontend/src/pages/packs/PackRepository.jsx")
    history_source = read("frontend/src/pages/packs/PackHistoryPanels.jsx")
    assert "RuntimePackStoreTable" in source
    assert "PackHistoryPanels" in source
    assert "Export ZIP 이력" in history_source
    assert "Pack Operation Audit" in history_source
    assert "<details" in history_source


def test_pack_lifecycle_console_uses_workflow_shell_not_legacy_tabs_only():
    source = read("frontend/src/pages/packs/PackLifecycleConsole.jsx")
    repository_source = read("frontend/src/pages/packs/PackRepository.jsx")
    assert "PackLifecycleStepper" in source
    assert "PackLifecycleSummary" in source
    assert "Build부터 Runtime 테스트까지" in source
    assert "repositorySummary?.currentStepId" in source
    assert "onLifecycleSummaryChange" in source
    assert "onLifecycleSummaryChange?.(lifecycleSummary)" in repository_source


def test_pack_legacy_routes_still_redirect_to_pack_console():
    source = read("frontend/src/App.jsx")
    for route in [
        'path="packs/builder"',
        'path="packs/validation"',
        'path="packs/repository"',
        'path="packs/versions"',
        'path="packs/deployment"',
    ]:
        assert route in source
    assert "/admin/packs?tab=build" in source
    assert "/admin/packs?tab=validation" in source
    assert "/admin/packs?tab=repository" in source
