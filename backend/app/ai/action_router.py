from __future__ import annotations

from typing import Any

from app.ai.intent_pack_loader import IntentPack
from app.ai.query_executor import QueryExecutionError, QueryExecutor
from app.ai.query_mock_action import QueryMockAction
from app.ai.search_doc_action import SearchDocAction
from app.ai.unanswered_logger import UnansweredLogger


from sqlalchemy.ext.asyncio import AsyncSession

class ActionRouter:
    BLOCKED_CONFIDENCE_LABELS = {"low", "very_low"}

    def __init__(
        self,
        pack: IntentPack,
        unanswered_logger: UnansweredLogger | None = None,
        db: AsyncSession | None = None,
    ):
        self.pack = pack
        self.intents_by_id = pack.intents_by_id
        self.actions_by_id = pack.actions_by_id
        self.routes_by_action_id = pack.routes_by_action_id
        self.search_doc_action = SearchDocAction(pack)
        self.query_mock_action = QueryMockAction(pack)
        self.unanswered_logger = unanswered_logger
        self.db = db

    async def route(self, question: str, matches: list[dict[str, Any]]) -> dict[str, Any]:
        if not matches:
            return self._fallback_card(question, None, None, "very_low", matches=matches)

        top_match = matches[0]
        confidence_label = top_match.get("confidence_label", "very_low")
        if confidence_label in self.BLOCKED_CONFIDENCE_LABELS:
            faq_card = self._direct_faq_card(question, top_match)
            if faq_card:
                return faq_card
            return self._fallback_card(
                question,
                top_match.get("intent_id"),
                top_match.get("action_id"),
                confidence_label,
                matches=matches,
            )

        action_id = top_match.get("action_id")
        action = self.actions_by_id.get(action_id)
        if not action:
            return self._fallback_card(
                question,
                top_match.get("intent_id"),
                action_id,
                confidence_label,
                message="연결된 Action을 찾지 못했습니다.",
                matches=matches,
            )

        action_type = action.get("action_type")
        if action_type == "NAVIGATE":
            return self._navigation_card(top_match, action)
        if action_type == "SEARCH_DOC":
            return self._document_card(question, top_match, action)
        if action_type in {"QUERY", "API"}:
            return await self._query_card(question, top_match, action)
        if action_type == "DOWNLOAD":
            return self._download_card(top_match, action)
        if action_type == "GUIDE":
            return self._guide_card(top_match, action)
        if action_type in {"CREATE_REQUEST", "FALLBACK"}:
            return self._fallback_card(
                question,
                top_match.get("intent_id"),
                action_id,
                confidence_label,
                matches=matches,
            )

        return self._fallback_card(
            question,
            top_match.get("intent_id"),
            action_id,
            confidence_label,
            message=f"지원하지 않는 Action 유형입니다: {action_type}",
            matches=matches,
        )

    def _navigation_card(
        self,
        match: dict[str, Any],
        action: dict[str, Any],
    ) -> dict[str, Any]:
        routes = self.routes_by_action_id.get(action["action_id"], [])
        route = routes[0] if routes else {}
        menu_name = route.get("menu_name") or action.get("action_name")
        route_value = route.get("route_value")

        return {
            "type": "navigation_card",
            "status": "ready",
            "intent_id": match.get("intent_id"),
            "action_id": action["action_id"],
            "confidence_label": match.get("confidence_label"),
            "title": menu_name,
            "message": "요청하신 화면으로 이동할 수 있습니다.",
            "route": route_value,
            "button_label": f"{menu_name} 열기",
            "required_role": route.get("required_role"),
            "route_id": route.get("route_id"),
        }

    def _document_card(
        self,
        question: str,
        match: dict[str, Any],
        action: dict[str, Any],
    ) -> dict[str, Any]:
        sources = self.search_doc_action.search(question, top_k=3)
        faq_matches = [source for source in sources if source.get("source_type") == "faq"]
        document_matches = [source for source in sources if source.get("source_type") != "faq"]
        status = "ready" if sources else "no_results"
        return {
            "type": "document_card",
            "status": status,
            "intent_id": match.get("intent_id"),
            "action_id": action["action_id"],
            "confidence_label": match.get("confidence_label"),
            "title": action.get("action_name"),
            "message": "승인된 문서에서 관련 근거를 검색했습니다."
            if sources
            else "승인된 문서에서 관련 근거를 찾지 못했습니다.",
            "query": question,
            "sources": sources,
            "faq_matches": faq_matches,
            "source_summary": {
                "faq_count": len(faq_matches),
                "document_count": len(document_matches),
            },
        }

    def _download_card(
        self,
        match: dict[str, Any],
        action: dict[str, Any],
    ) -> dict[str, Any]:
        file_name = action.get("menu_name") or action.get("action_name") or "다운로드 파일"
        download_url = action.get("route_value") or action.get("api_endpoint")
        return {
            "type": "download_card",
            "status": "ready" if download_url else "blocked",
            "intent_id": match.get("intent_id"),
            "action_id": action["action_id"],
            "confidence_label": match.get("confidence_label"),
            "title": action.get("action_name"),
            "message": action.get("description") or "요청하신 파일을 다운로드할 수 있습니다.",
            "download_url": download_url,
            "file_name": file_name,
            "button_label": f"{file_name} 다운로드",
            "confirmation_required": True,
            "execution_mode": action.get("execution_mode"),
        }

    def _direct_faq_card(
        self,
        question: str,
        match: dict[str, Any],
    ) -> dict[str, Any] | None:
        sources = self.search_doc_action.search(question, top_k=3)
        faq_matches = [
            source
            for source in sources
            if source.get("source_type") == "faq" and source.get("score", 0) >= 0.4
        ]
        if not faq_matches:
            return None

        action = self._first_search_doc_action()
        if not action:
            return None

        document_matches = [source for source in sources if source.get("source_type") != "faq"]
        return {
            "type": "document_card",
            "status": "ready",
            "intent_id": match.get("intent_id"),
            "action_id": action["action_id"],
            "confidence_label": "faq_direct",
            "title": action.get("action_name"),
            "message": "FAQ에서 직접 일치하는 근거를 검색했습니다.",
            "query": question,
            "sources": sources,
            "faq_matches": faq_matches,
            "source_summary": {
                "faq_count": len(faq_matches),
                "document_count": len(document_matches),
            },
        }

    def _first_search_doc_action(self) -> dict[str, Any] | None:
        for action in self.actions_by_id.values():
            if action.get("action_type") == "SEARCH_DOC":
                return action
        return None

    async def _query_card(
        self,
        question: str,
        match: dict[str, Any],
        action: dict[str, Any],
    ) -> dict[str, Any]:
        intent = self.intents_by_id.get(match.get("intent_id"), {})
        confirmation_required = intent.get("confirmation_required", True)
        parameters = self._parameters_from_entities(match.get("matched_entities", []))
        action_id = action["action_id"]

        # 범용 쿼리 엔진: DB 세션이 있고 SQL Template이 등록된 경우 실제 DB 조회 실행
        if self.db:
            executor = QueryExecutor(self.pack, self.db)
            if executor.has_template(action_id):
                try:
                    real_data = await executor.execute(action_id, parameters)
                    if real_data is not None:
                        return {
                            "type": "query_card",
                            "status": "ready",
                            "intent_id": match.get("intent_id"),
                            "action_id": action_id,
                            "confidence_label": match.get("confidence_label"),
                            "title": action.get("action_name"),
                            "message": f"조회 결과입니다. (총 {len(real_data)}건)",
                            "confirmation_required": confirmation_required,
                            "parameters": parameters,
                            "real_data": real_data,
                            "execution_mode": action.get("execution_mode"),
                        }
                except QueryExecutionError as e:
                    return {
                        "type": "query_card",
                        "status": "error",
                        "intent_id": match.get("intent_id"),
                        "action_id": action_id,
                        "confidence_label": match.get("confidence_label"),
                        "title": action.get("action_name"),
                        "message": f"쿼리 실행 중 오류가 발생했습니다: {e}",
                        "confirmation_required": confirmation_required,
                        "parameters": parameters,
                        "real_data": [],
                        "execution_mode": action.get("execution_mode"),
                    }
                    
        # API Action 직접 연동 (데모/MVP용 직접 호출)
        if action.get("action_type") == "API":
            api_mappings = self.pack.action.get("api_mappings", [])
            api_endpoint = ""
            for mapping in api_mappings:
                if mapping.get("action_id") == action_id:
                    api_endpoint = mapping.get("endpoint", "")
                    break

            if "dashboard/stats" in api_endpoint:
                try:
                    from app.api.dashboard import get_project_dashboard_stats, get_global_dashboard_stats
                    project_id = self.pack.manifest.get("project_id", "J-Brain")
                    if "{project_id}" in api_endpoint:
                        stats = await get_project_dashboard_stats(project_id, user_id="system", db=self.db)
                    else:
                        stats = await get_global_dashboard_stats(user_id="system", db=self.db)
                    return {
                        "type": "query_card",
                        "status": "ready",
                        "intent_id": match.get("intent_id"),
                        "action_id": action_id,
                        "confidence_label": match.get("confidence_label"),
                        "title": action.get("action_name"),
                        "message": "API 호출 결과입니다.",
                        "confirmation_required": confirmation_required,
                        "parameters": parameters,
                        "real_data": [stats],
                        "execution_mode": action.get("execution_mode"),
                    }
                except Exception as e:
                    return {
                        "type": "query_card",
                        "status": "error",
                        "intent_id": match.get("intent_id"),
                        "action_id": action_id,
                        "confidence_label": match.get("confidence_label"),
                        "title": action.get("action_name"),
                        "message": f"API 호출 중 오류가 발생했습니다: {e}",
                        "confirmation_required": confirmation_required,
                        "parameters": parameters,
                        "real_data": [],
                        "execution_mode": action.get("execution_mode"),
                    }
            else:
                return {
                    "type": "query_card",
                    "status": "error",
                    "intent_id": match.get("intent_id"),
                    "action_id": action_id,
                    "confidence_label": match.get("confidence_label"),
                    "title": action.get("action_name"),
                    "message": f"MVP에서 지원하지 않는 API 경로입니다: {api_endpoint}",
                    "confirmation_required": confirmation_required,
                    "parameters": parameters,
                    "real_data": [],
                    "execution_mode": action.get("execution_mode"),
                }

        # SQL Template이 없거나 DB 세션이 없으면 기존 Mock 폴백
        mock_result = self.query_mock_action.execute(action_id, question, parameters)

        return {
            "type": "query_card",
            "status": "mock_ready",
            "intent_id": match.get("intent_id"),
            "action_id": action_id,
            "confidence_label": match.get("confidence_label"),
            "title": action.get("action_name"),
            "message": "시연용 Mock 조회 결과입니다. 운영 적용 시 승인된 API 또는 SQL Template만 실행합니다.",
            "confirmation_required": confirmation_required,
            "parameters": parameters,
            "mock_result": mock_result,
            "execution_mode": action.get("execution_mode"),
        }

    def _guide_card(
        self,
        match: dict[str, Any],
        action: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "type": "guide_card",
            "status": "ready",
            "intent_id": match.get("intent_id"),
            "action_id": action["action_id"],
            "confidence_label": match.get("confidence_label"),
            "title": action.get("action_name"),
            "message": action.get("description"),
        }

    def _fallback_card(
        self,
        question: str,
        intent_id: str | None,
        action_id: str | None,
        confidence_label: str,
        message: str = "질문 의도를 확인하지 못했습니다. 미응답 질문으로 기록합니다.",
        matches: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        log_record = None
        if self.unanswered_logger:
            log_record = self.unanswered_logger.append(
                question=question,
                pack_id=self.pack.manifest.get("pack_id", ""),
                pack_version=self.pack.manifest.get("pack_version", ""),
                intent_id=intent_id,
                action_id=action_id,
                confidence_label=confidence_label,
                matches=matches,
            )

        return {
            "type": "fallback_card",
            "status": "blocked",
            "intent_id": intent_id,
            "action_id": action_id,
            "confidence_label": confidence_label,
            "title": "답변 보완 필요",
            "message": message,
            "question": question,
            "logged": bool(log_record),
            "log_id": log_record.get("log_id") if log_record else None,
        }

    def _parameters_from_entities(
        self,
        entities: list[dict[str, Any]],
    ) -> dict[str, Any]:
        parameters: dict[str, Any] = {}
        for entity in entities:
            entity_type = entity.get("entity_type")
            canonical_value = entity.get("canonical_value")
            if not entity_type or canonical_value is None:
                continue
            parameters[entity_type] = canonical_value

        if "factory" in parameters:
            parameters.setdefault("site_or_factory", parameters["factory"])
        if "site" in parameters:
            parameters.setdefault("site_or_factory", parameters["site"])
        return parameters
