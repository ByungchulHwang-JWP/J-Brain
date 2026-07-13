from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


OPERATIONS_PAGES = [
    "frontend/src/pages/operations/RealtimeMonitoring.jsx",
    "frontend/src/pages/operations/OperationMetrics.jsx",
    "frontend/src/pages/operations/UnansweredAnalysis.jsx",
    "frontend/src/pages/operations/ImprovementRequests.jsx",
    "frontend/src/pages/operations/PackImprovementHistory.jsx",
]


def test_operations_pages_use_project_context():
    for path in OPERATIONS_PAGES:
        source = read(path)
        assert "useProjectContext" in source, path


def test_operations_pages_use_ai_access_token_only():
    combined = "\n".join(read(path) for path in OPERATIONS_PAGES)
    assert "ai_access_token" in combined
    assert "localStorage.getItem('access_token')" not in combined


def test_realtime_monitoring_does_not_use_route_project_param():
    source = read("frontend/src/pages/operations/RealtimeMonitoring.jsx")
    assert "useParams" not in source
    assert "/api/v1/projects/${projectId}/operations/realtime" in source
