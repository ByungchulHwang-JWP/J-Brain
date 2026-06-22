"""LLM answer node skeleton."""

from collections.abc import Callable

from common_core.agents.base_state import BaseAgentState
from common_core.ops.error_codes import ErrorCode

AnswerProvider = Callable[[str, str, BaseAgentState], str]


class LLMAnswerNode:
    """Create an answer from query and retrieval context.

    The node accepts an answer provider callable so real LLM clients can be
    attached later without changing workflow contracts.
    """

    def __init__(
        self,
        answer_provider: AnswerProvider | None = None,
        next_node: str | None = None,
    ) -> None:
        self.answer_provider = answer_provider or self._default_answer_provider
        self.next_node = next_node

    async def __call__(self, state: BaseAgentState) -> BaseAgentState:
        query = state.get("query", "")
        context = state.get("context", "")
        if not query:
            return self._with_error(state, ErrorCode.AGENT_WORKFLOW_FAILED, "Query is required.")
        answer = self.answer_provider(query, context, state)
        new_state: BaseAgentState = dict(state)
        new_state["result"] = {
            **new_state.get("result", {}),
            "answer": answer,
            "answer_format": "markdown",
        }
        new_state.setdefault("messages", []).append({"role": "assistant", "content": answer})
        new_state["error"] = None
        if self.next_node:
            new_state["next_node"] = self.next_node
        return new_state

    @staticmethod
    def _default_answer_provider(query: str, context: str, state: BaseAgentState) -> str:
        if context:
            return f"Answer draft for '{query}' based on retrieved context.\n\n{context}"
        return f"Answer draft for '{query}'. No retrieval context was available."

    @staticmethod
    def _with_error(state: BaseAgentState, code: ErrorCode, message: str) -> BaseAgentState:
        new_state: BaseAgentState = dict(state)
        new_state["error"] = {"code": code.value, "message": message}
        return new_state

