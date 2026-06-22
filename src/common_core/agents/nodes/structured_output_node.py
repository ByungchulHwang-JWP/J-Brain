"""Structured output node."""

from typing import Any

from common_core.agents.base_state import BaseAgentState


class StructuredOutputNode:
    """Normalize agent result into a stable output envelope."""

    def __init__(self, output_key: str = "structured_output") -> None:
        self.output_key = output_key

    async def __call__(self, state: BaseAgentState) -> BaseAgentState:
        result = state.get("result", {})
        retrieval = state.get("retrieval", {})
        evidence = state.get("evidence", [])
        output: dict[str, Any] = {
            "query": state.get("query", ""),
            "domain": state.get("domain", ""),
            "answer": result.get("answer", ""),
            "retrieval_status": retrieval.get("status"),
            "citations": retrieval.get("context_citations", state.get("citations", [])),
            "evidence_count": len(evidence),
            "error": state.get("error"),
        }
        new_state: BaseAgentState = dict(state)
        new_state["result"] = {**result, self.output_key: output}
        return new_state

