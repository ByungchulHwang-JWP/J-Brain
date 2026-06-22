"""LangGraph-compatible GraphRAG retrieval node."""

from common_core.agents.base_state import BaseAgentState
from common_core.ai_pipeline.graphrag.hybrid_retriever import HybridRetriever
from common_core.ai_pipeline.graphrag.schemas import AuthContext, RetrievalRequest
from common_core.ops.error_codes import ErrorCode


class GraphRAGRetrieveNode:
    """Inject GraphRAG retrieval context and evidence into an agent state."""

    def __init__(
        self,
        retriever: HybridRetriever,
        default_domain: str | None = None,
        default_strategy: str = "HYBRID",
        next_node: str | None = None,
    ) -> None:
        self.retriever = retriever
        self.default_domain = default_domain
        self.default_strategy = default_strategy
        self.next_node = next_node

    async def __call__(self, state: BaseAgentState) -> BaseAgentState:
        """Run retrieval and return updated state."""

        query = state.get("query") or self._last_user_message(state)
        domain = state.get("domain") or self.default_domain
        if not query:
            return self._with_error(state, ErrorCode.GRAG_RET_001, "Query is required.")
        if not domain:
            return self._with_error(state, ErrorCode.GRAG_RET_001, "Domain is required.")

        options = state.get("retrieval_options", {})
        auth = AuthContext(
            tenant_id=state.get("tenant_id"),
            user_id=state.get("user_id"),
            roles=state.get("roles", []),
        )
        response = self.retriever.search(
            RetrievalRequest(
                domain=domain,
                query=query,
                filters=state.get("filters", {}),
                top_k=options.get("top_k", 5),
                strategy=options.get("strategy", self.default_strategy),
                include_evidence=options.get("include_evidence", True),
                max_graph_depth=options.get("max_graph_depth", 2),
                auth=auth,
            )
        )

        new_state: BaseAgentState = dict(state)
        new_state["query"] = query
        new_state["domain"] = domain
        new_state["retrieval"] = response.model_dump(mode="json")
        new_state["context"] = response.context
        new_state["evidence"] = [item.model_dump(mode="json") for item in response.evidence]
        new_state["citations"] = [
            {
                "evidence_id": evidence.evidence_id,
                "source_id": evidence.source_id,
                "chunk_id": evidence.chunk_id,
            }
            for evidence in response.evidence
        ]
        new_state["error"] = None
        if self.next_node:
            new_state["next_node"] = self.next_node
        return new_state

    @staticmethod
    def _last_user_message(state: BaseAgentState) -> str | None:
        messages = state.get("messages", [])
        for message in reversed(messages):
            if message.get("role") == "user":
                return str(message.get("content", ""))
        return None

    @staticmethod
    def _with_error(state: BaseAgentState, code: ErrorCode, message: str) -> BaseAgentState:
        new_state: BaseAgentState = dict(state)
        new_state["error"] = {"code": code.value, "message": message}
        new_state["context"] = ""
        return new_state
