"""범용 SQL Template 실행기.

Pack에 등록된 SQL Template을 기반으로 QUERY 유형 Action의 실제 DB 조회를 수행합니다.

보안 정책:
- SELECT 문만 허용 (INSERT/UPDATE/DELETE/DROP 등 차단)
- 결과 행 수 제한 (기본 100건)
- 실행 타임아웃 (기본 5초)
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.intent_pack_loader import IntentPack

logger = logging.getLogger(__name__)


class QueryExecutionError(Exception):
    """SQL 실행 중 발생하는 에러."""


class QueryExecutor:
    """Pack의 sql_templates를 기반으로 안전하게 DB 조회를 수행하는 범용 실행기."""

    MAX_ROWS: int = 100
    TIMEOUT_SECONDS: int = 5
    BLOCKED_KEYWORDS: set[str] = {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
        "TRUNCATE", "CREATE", "REPLACE", "MERGE", "GRANT",
        "REVOKE", "EXEC", "EXECUTE", "CALL",
    }

    def __init__(self, pack: IntentPack, db: AsyncSession):
        self.sql_templates: dict[str, dict[str, Any]] = {
            t["action_id"]: t
            for t in pack.action.get("sql_templates", [])
        }
        self.db = db

    def has_template(self, action_id: str) -> bool:
        """해당 Action에 SQL Template이 등록되어 있는지 확인합니다."""
        template = self.sql_templates.get(action_id)
        if not template:
            return False
        sql = (template.get("sql_template") or "").strip()
        return len(sql) > 0

    async def execute(
        self,
        action_id: str,
        parameters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]] | None:
        """SQL Template을 조회하여 실행하고, 결과를 dict 리스트로 반환합니다.

        Args:
            action_id: Action ID
            parameters: Entity에서 추출한 파라미터 (SQL 바인딩용)

        Returns:
            조회 결과 dict 리스트. Template이 없으면 None 반환.

        Raises:
            QueryExecutionError: SQL 검증 실패 또는 실행 오류 시
        """
        template = self.sql_templates.get(action_id)
        if not template:
            return None

        sql = (template.get("sql_template") or "").strip()
        if not sql:
            return None

        # 보안 검증
        self._validate_sql(sql)

        # 파라미터 바인딩 준비
        bind_params = self._prepare_bind_params(sql, parameters or {})

        # 실행 (타임아웃 적용)
        try:
            rows = await asyncio.wait_for(
                self._execute_query(sql, bind_params),
                timeout=self.TIMEOUT_SECONDS,
            )
            logger.info(
                f"[QueryExecutor] action_id={action_id}, "
                f"rows={len(rows)}, template_id={template.get('template_id')}"
            )
            return rows
        except asyncio.TimeoutError:
            logger.error(
                f"[QueryExecutor] 타임아웃 ({self.TIMEOUT_SECONDS}초 초과): "
                f"action_id={action_id}"
            )
            raise QueryExecutionError(
                f"쿼리 실행 시간이 {self.TIMEOUT_SECONDS}초를 초과했습니다."
            )
        except QueryExecutionError:
            raise
        except Exception as e:
            logger.error(
                f"[QueryExecutor] SQL 실행 오류: action_id={action_id}, error={e}",
                exc_info=True,
            )
            raise QueryExecutionError(f"쿼리 실행 중 오류가 발생했습니다: {e}")

    def _validate_sql(self, sql: str) -> None:
        """SQL 문이 안전한 읽기 전용 쿼리인지 검증합니다."""
        # 주석 및 문자열 리터럴 제거 후 키워드 검사
        cleaned = re.sub(r"'[^']*'", "", sql)  # 문자열 리터럴 제거
        cleaned = re.sub(r"--[^\n]*", "", cleaned)  # 단일행 주석 제거
        cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.DOTALL)  # 블록 주석 제거

        tokens = set(re.findall(r"\b[A-Z]+\b", cleaned.upper()))
        violations = tokens & self.BLOCKED_KEYWORDS
        if violations:
            raise QueryExecutionError(
                f"허용되지 않는 SQL 키워드가 포함되어 있습니다: {', '.join(sorted(violations))}"
            )

        # SELECT로 시작하는지 확인
        first_keyword = re.match(r"\s*(\w+)", cleaned)
        if not first_keyword or first_keyword.group(1).upper() != "SELECT":
            raise QueryExecutionError(
                "SELECT 문만 허용됩니다."
            )

    def _prepare_bind_params(
        self,
        sql: str,
        parameters: dict[str, Any],
    ) -> dict[str, Any]:
        """SQL에 포함된 :param_name 바인드 변수에 매칭되는 파라미터를 추출합니다."""
        # :param_name 형태의 바인드 변수 추출
        bind_names = set(re.findall(r":(\w+)", sql))
        bind_params = {}
        for name in bind_names:
            if name in parameters:
                bind_params[name] = parameters[name]
        return bind_params

    async def _execute_query(
        self,
        sql: str,
        bind_params: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """실제 SQL을 실행하고 결과를 dict 리스트로 변환합니다."""
        # MAX_ROWS 제한을 위해 LIMIT 추가 (이미 LIMIT이 있으면 유지)
        effective_sql = sql
        if "LIMIT" not in sql.upper():
            effective_sql = f"{sql.rstrip().rstrip(';')}\nLIMIT {self.MAX_ROWS}"

        result = await self.db.execute(text(effective_sql), bind_params)
        rows = result.fetchall()
        columns = list(result.keys())

        return [
            {col: self._serialize_value(row[i]) for i, col in enumerate(columns)}
            for row in rows[:self.MAX_ROWS]
        ]

    @staticmethod
    def _serialize_value(value: Any) -> Any:
        """DB 값을 JSON 직렬화 가능한 형태로 변환합니다."""
        if value is None:
            return None
        if isinstance(value, (int, float, bool, str)):
            return value
        # datetime 등의 객체는 문자열로 변환
        return str(value)
