from typing import Any

from app.ai.intent_pack_loader import IntentPack


class QueryMockAction:
    def __init__(self, pack: IntentPack):
        self.pack = pack

    def execute(
        self,
        action_id: str,
        question: str,
        parameters: dict[str, Any],
    ) -> dict[str, Any]:
        period = self._infer_period(question)
        if action_id == "ACT-NZ-QUERY-EMISSION":
            return self._emission_result(parameters, period)
        if action_id == "ACT-NZ-QUERY-POWER":
            return self._power_result(parameters, period)
        if action_id == "ACT-NZ-QUERY-MISSING-INPUT":
            return self._missing_input_result(parameters, period)
        return {
            "mock": True,
            "metric": "지원하지 않는 Mock 조회",
            "target_name": parameters.get("site_or_factory") or parameters.get("factory") or "-",
            "period": period,
            "rows": [],
        }

    def _emission_result(
        self,
        parameters: dict[str, Any],
        period: str,
    ) -> dict[str, Any]:
        target_name = parameters.get("factory") or parameters.get("site_or_factory") or "A공장"
        values = {
            "A공장": 12430,
            "B공장": 9870,
        }
        value = values.get(target_name, 10240)
        return {
            "mock": True,
            "metric": "탄소 배출량",
            "target_name": target_name,
            "period": period if period != "기본값" else "2024년",
            "value": value,
            "unit": "tCO2e",
            "basis": "시연용 Mock 데이터",
            "rows": [
                {
                    "scope": "Scope 1",
                    "value": round(value * 0.42),
                    "unit": "tCO2e",
                },
                {
                    "scope": "Scope 2",
                    "value": round(value * 0.58),
                    "unit": "tCO2e",
                },
            ],
        }

    def _power_result(
        self,
        parameters: dict[str, Any],
        period: str,
    ) -> dict[str, Any]:
        target_name = parameters.get("site_or_factory") or parameters.get("site") or "B현장"
        values = {
            "B현장": 84200,
            "A공장": 76500,
        }
        return {
            "mock": True,
            "metric": "전력 사용량",
            "target_name": target_name,
            "period": period if period != "기본값" else "이번 달",
            "value": values.get(target_name, 80000),
            "unit": "kWh",
            "basis": "시연용 Mock 데이터",
            "rows": [
                {
                    "item": "계량기 사용량",
                    "value": values.get(target_name, 80000),
                    "unit": "kWh",
                }
            ],
        }

    def _missing_input_result(
        self,
        parameters: dict[str, Any],
        period: str,
    ) -> dict[str, Any]:
        target_name = parameters.get("site_or_factory") or "전체 현장"
        return {
            "mock": True,
            "metric": "미입력 현황",
            "target_name": target_name,
            "period": period if period != "기본값" else "당월",
            "value": 3,
            "unit": "건",
            "basis": "시연용 Mock 데이터",
            "rows": [
                {
                    "site_name": "B현장",
                    "input_item": "전력 사용량",
                    "target_period": "당월",
                    "status": "MISSING",
                },
                {
                    "site_name": "C사업장",
                    "input_item": "도시가스 사용량",
                    "target_period": "당월",
                    "status": "MISSING",
                },
            ],
        }

    def _infer_period(self, question: str) -> str:
        if "이번 달" in question or "이번달" in question or "당월" in question:
            return "이번 달"
        if "지난달" in question or "전월" in question:
            return "지난달"
        if "작년" in question:
            return "작년"
        if "2024" in question:
            return "2024년"
        if "2025" in question:
            return "2025년"
        return "기본값"
