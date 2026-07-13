import pytest
from datetime import date

from app.api import operations
from app.schemas.operations import ImprovementRequestCreate, ImprovementRequestUpdate


class Row:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


class FakeResult:
    def __init__(self, rows=None, row=None):
        self._rows = rows or []
        self._row = row

    def fetchall(self):
        return self._rows

    def fetchone(self):
        return self._row


class RecordingDb:
    def __init__(self, results):
        self.results = list(results)
        self.statements = []
        self.params = []
        self.committed = False

    async def execute(self, stmt, params=None):
        self.statements.append(str(stmt))
        self.params.append(params or {})
        return self.results.pop(0)

    async def commit(self):
        self.committed = True


@pytest.mark.anyio
async def test_create_improvement_request_generates_request_id_from_path_project():
    db = RecordingDb([
        FakeResult(row=Row(id=7, request_id="REQ-ABC12345", created_at=__import__("datetime").datetime(2026, 7, 13, 1, 2, 3)))
    ])
    payload = ImprovementRequestCreate(
        request_type="INTENT_OR_EXAMPLE",
        title="탄소배출권 질문 미응답",
        description="의도 보강 필요",
        severity="high",
    )

    result = await operations.create_improvement_request(
        "KT-NetZero",
        payload,
        db=db,
        current_user={"role": "admin"},
    )

    assert result["id"] == 7
    assert db.committed is True
    assert db.params[0]["project_id"] == "KT-NetZero"
    assert db.params[0]["request_id"].startswith("REQ-")


@pytest.mark.anyio
async def test_pack_improvements_join_is_project_scoped():
    db = RecordingDb([FakeResult(rows=[])])

    await operations.get_pack_improvements(
        "KT-NetZero",
        db=db,
        current_user={"role": "admin"},
    )

    sql = db.statements[0]
    assert "r.project_id = l.project_id" in sql
    assert "WHERE l.project_id = :pid" in sql


@pytest.mark.anyio
async def test_update_improvement_request_allows_status_change():
    db = RecordingDb([FakeResult(row=Row(id=9))])

    result = await operations.update_improvement_request(
        "KT-NetZero",
        "REQ-0001",
        ImprovementRequestUpdate(status="reviewing"),
        db=db,
        current_user={"role": "admin"},
    )

    assert result == {"message": "updated"}
    assert db.params[0]["status"] == "reviewing"
    assert db.params[0]["pid"] == "KT-NetZero"
    assert db.params[0]["rid"] == "REQ-0001"


@pytest.mark.anyio
async def test_operation_metrics_aggregate_runtime_events_by_day():
    db = RecordingDb([
        FakeResult(rows=[
            Row(
                metric_date=date(2026, 7, 13),
                total_requests=4,
                intent_match_count=3,
                fallback_count=1,
                avg_confidence=0.0,
                avg_response_time_ms=42.5,
            )
        ])
    ])

    result = await operations.get_operation_metrics(
        "KT-NetZero",
        days=7,
        db=db,
        current_user={"role": "admin"},
    )

    sql = db.statements[0]
    assert "FROM graphrag.runtime_event_logs" in sql
    assert "DATE(created_at) AS metric_date" in sql
    assert "COUNT(*) AS total_requests" in sql
    assert "matched_intent_id IS NOT NULL" in sql
    assert "fallback_yn = true" in sql
    assert "AVG(confidence) AS avg_confidence" in sql
    assert "AVG(response_time_ms) AS avg_response_time_ms" in sql
    assert "GROUP BY DATE(created_at)" in sql
    assert db.params[0] == {"pid": "KT-NetZero", "days": 7}
    assert result == {
        "metrics": [{
            "date": "2026-07-13",
            "total_requests": 4,
            "intent_match_count": 3,
            "fallback_count": 1,
            "avg_confidence": 0.0,
            "avg_response_time_ms": 42.5,
        }]
    }
