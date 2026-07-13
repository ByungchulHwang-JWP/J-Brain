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


def test_realtime_monitoring_clears_data_when_fetch_fails():
    source = read("frontend/src/pages/operations/RealtimeMonitoring.jsx")
    catch_block = source.split("} catch (error) {", 1)[1].split("} finally {", 1)[0]

    assert "setData(null);" in catch_block
    assert "setMessage('실시간 운영 상태를 불러오지 못했습니다.');" in catch_block
    assert "active_pack: '-'" not in catch_block


def test_operation_metrics_clears_data_before_and_after_fetch_failure():
    source = read("frontend/src/pages/operations/OperationMetrics.jsx")
    load_metrics = source.split("const loadMetrics = useCallback(async () => {", 1)[1].split("}, [days, projectId]);", 1)[0]
    catch_block = load_metrics.split("} catch (error) {", 1)[1].split("} finally {", 1)[0]

    assert "setData([]);" in load_metrics.split("try {", 1)[0]
    assert "setData([]);" in catch_block


def test_operation_metrics_uses_intent_match_count_for_match_rate():
    source = read("frontend/src/pages/operations/OperationMetrics.jsx")

    assert "m.intent_match_count / m.total_requests" in source
    assert "m.total_requests - m.fallback_count" not in source
