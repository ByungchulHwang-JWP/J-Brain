"""QueryExecutor 단위 테스트."""

import pytest

from app.ai.query_executor import QueryExecutionError, QueryExecutor


# ---------------------------------------------------------------------------
# 테스트용 가짜 IntentPack 객체
# ---------------------------------------------------------------------------

class _FakePack:
    """sql_templates 데이터만 가진 가짜 Pack."""

    def __init__(self, sql_templates: list[dict] | None = None):
        self.action = {
            "sql_templates": sql_templates or [],
        }


# ---------------------------------------------------------------------------
# _validate_sql 테스트
# ---------------------------------------------------------------------------

class TestValidateSql:
    def _make_executor(self, sql_templates=None):
        pack = _FakePack(sql_templates)
        # db=None은 validate 단계에서는 불필요
        return QueryExecutor(pack, db=None)

    def test_select_allowed(self):
        executor = self._make_executor()
        # SELECT 문은 에러가 발생하지 않아야 함
        executor._validate_sql("SELECT id, name FROM users ORDER BY id")

    def test_select_with_where(self):
        executor = self._make_executor()
        executor._validate_sql(
            "SELECT id, name FROM users WHERE department = :dept ORDER BY id"
        )

    def test_insert_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="INSERT"):
            executor._validate_sql("INSERT INTO users (name) VALUES ('test')")

    def test_update_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="UPDATE"):
            executor._validate_sql("UPDATE users SET name = 'test' WHERE id = 1")

    def test_delete_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="DELETE"):
            executor._validate_sql("DELETE FROM users WHERE id = 1")

    def test_drop_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="DROP"):
            executor._validate_sql("DROP TABLE users")

    def test_truncate_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="TRUNCATE"):
            executor._validate_sql("TRUNCATE TABLE users")

    def test_alter_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="ALTER"):
            executor._validate_sql("ALTER TABLE users ADD COLUMN age INT")

    def test_non_select_start_blocked(self):
        executor = self._make_executor()
        with pytest.raises(QueryExecutionError, match="DELETE"):
            executor._validate_sql("WITH cte AS (DELETE FROM users) SELECT 1")

    def test_keyword_in_string_literal_ok(self):
        """문자열 리터럴 안의 키워드는 차단하지 않아야 함."""
        executor = self._make_executor()
        # 'DELETE' 가 문자열 안에 있지만 실제 SQL은 SELECT
        executor._validate_sql(
            "SELECT id FROM users WHERE status = 'DELETE'"
        )


# ---------------------------------------------------------------------------
# has_template 테스트
# ---------------------------------------------------------------------------

class TestHasTemplate:
    def test_has_template_true(self):
        pack = _FakePack([
            {"action_id": "ACT-001", "sql_template": "SELECT 1"},
        ])
        executor = QueryExecutor(pack, db=None)
        assert executor.has_template("ACT-001") is True

    def test_has_template_false_missing(self):
        pack = _FakePack([])
        executor = QueryExecutor(pack, db=None)
        assert executor.has_template("ACT-NONE") is False

    def test_has_template_false_empty_sql(self):
        pack = _FakePack([
            {"action_id": "ACT-002", "sql_template": ""},
        ])
        executor = QueryExecutor(pack, db=None)
        assert executor.has_template("ACT-002") is False

    def test_has_template_false_none_sql(self):
        pack = _FakePack([
            {"action_id": "ACT-003", "sql_template": None},
        ])
        executor = QueryExecutor(pack, db=None)
        assert executor.has_template("ACT-003") is False


# ---------------------------------------------------------------------------
# _prepare_bind_params 테스트
# ---------------------------------------------------------------------------

class TestPrepareBindParams:
    def test_extract_params(self):
        pack = _FakePack()
        executor = QueryExecutor(pack, db=None)
        sql = "SELECT * FROM users WHERE department = :dept AND role = :role"
        params = executor._prepare_bind_params(sql, {"dept": "개발팀", "role": "admin", "extra": "ignored"})
        assert params == {"dept": "개발팀", "role": "admin"}

    def test_no_params(self):
        pack = _FakePack()
        executor = QueryExecutor(pack, db=None)
        sql = "SELECT * FROM users"
        params = executor._prepare_bind_params(sql, {"dept": "개발팀"})
        assert params == {}


# ---------------------------------------------------------------------------
# execute - template 미존재 시 None 반환
# ---------------------------------------------------------------------------

class TestExecuteNoTemplate:
    def test_execute_returns_none_when_no_template(self):
        import asyncio
        pack = _FakePack([])
        executor = QueryExecutor(pack, db=None)
        result = asyncio.run(executor.execute("ACT-NONEXISTENT", {}))
        assert result is None


# ---------------------------------------------------------------------------
# _serialize_value 테스트
# ---------------------------------------------------------------------------

class TestSerializeValue:
    def test_none(self):
        assert QueryExecutor._serialize_value(None) is None

    def test_int(self):
        assert QueryExecutor._serialize_value(42) == 42

    def test_float(self):
        assert QueryExecutor._serialize_value(3.14) == 3.14

    def test_str(self):
        assert QueryExecutor._serialize_value("hello") == "hello"

    def test_bool(self):
        assert QueryExecutor._serialize_value(True) is True

    def test_datetime(self):
        from datetime import datetime
        dt = datetime(2026, 7, 8, 10, 0, 0)
        assert QueryExecutor._serialize_value(dt) == str(dt)
