from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_chat_widget_shows_selected_project_and_active_pack_context():
    source = read("frontend/src/components/ChatWidget.jsx")
    assert "useProjectContext" in source
    assert "getActivePack" in source
    assert "Project:" in source
    assert "Pack:" in source
    assert "activePackLabel" in source
    assert "handleProjectChange" in source
    assert "navigate('/admin/packs?tab=repository')" in source
