from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ACTION_TEST_PAGE = ROOT / "frontend" / "src" / "pages" / "runtime" / "ActionTest.jsx"


def test_action_test_page_uses_runtime_api_and_action_card():
    source = ACTION_TEST_PAGE.read_text(encoding="utf-8")

    assert "ShellPage" not in source
    assert "ActionCard" in source
    assert "/chat/runtime" in source
    assert "Action 실행 결과" in source
    assert "대상 프로젝트" in source
