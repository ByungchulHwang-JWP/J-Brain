from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_intent_detail_uses_query_project_before_context_sync():
    source = read("frontend/src/pages/intent-factory/IntentDetail.jsx")

    assert "const requestedProjectId = searchParams.get('project') || searchParams.get('projectId');" in source
    assert "const projectId = requestedProjectId || selectedProjectId;" in source
    assert "const projectId = selectedProjectId;" not in source


def test_intent_detail_syncs_query_project_into_context_without_driving_first_fetch():
    source = read("frontend/src/pages/intent-factory/IntentDetail.jsx")

    sync_effect = source.split("useEffect(() => {", 1)[1].split("  useEffect(() => {", 1)[0]

    assert "if (requestedProjectId && requestedProjectId !== selectedProjectId)" in sync_effect
    assert "setSelectedProjectId(requestedProjectId);" in sync_effect
