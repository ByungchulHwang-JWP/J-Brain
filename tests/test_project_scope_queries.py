import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.api.dashboard import GLOBAL_PROJECT_COUNT_SQL
from app.api.projects import PROJECT_LIST_SQL


def test_project_list_sql_uses_project_master_first():
    sql = PROJECT_LIST_SQL.lower()

    assert "graphrag.projects" in sql
    assert "graphrag_sources" in sql
    assert "source_priority" in sql


def test_global_project_count_sql_does_not_count_only_active_status():
    sql = GLOBAL_PROJECT_COUNT_SQL.lower()

    assert "project_count" in sql
    assert "status = 'active'" not in sql
    assert "deleted" in sql
    assert "archived" in sql
    assert "graphrag_sources" in sql
