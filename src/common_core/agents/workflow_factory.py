"""Minimal workflow factory abstraction."""

import inspect
from collections.abc import Callable
from typing import Any

from pydantic import BaseModel, Field

from common_core.agents.base_state import BaseAgentState

WorkflowNode = Callable[[BaseAgentState], BaseAgentState]


class WorkflowDefinition(BaseModel):
    """Workflow node order definition."""

    name: str
    nodes: list[str] = Field(default_factory=list)
    edges: list[tuple[str, str]] = Field(default_factory=list)
    entry_node: str | None = None
    finish_nodes: list[str] = Field(default_factory=list)
    stop_on_error: bool = True


class WorkflowRunResult(BaseModel):
    """Workflow execution result."""

    workflow_name: str
    state: dict[str, Any]
    executed_nodes: list[str] = Field(default_factory=list)
    status: str = "COMPLETED"


class WorkflowFactory:
    """Registry for workflow node callables.

    This is a lightweight bridge until LangGraph is added as an optional runtime
    dependency.
    """

    def __init__(self) -> None:
        self._nodes: dict[str, WorkflowNode] = {}

    def register_node(self, name: str, node: WorkflowNode) -> None:
        """Register a node callable by name."""

        self._nodes[name] = node

    def get_node(self, name: str) -> WorkflowNode:
        """Return a registered node."""

        try:
            return self._nodes[name]
        except KeyError as exc:
            raise KeyError(f"Workflow node is not registered: {name}") from exc

    def list_nodes(self) -> list[str]:
        """Return registered node names."""

        return sorted(self._nodes)

    def build(self, definition: WorkflowDefinition) -> "CompiledWorkflow":
        """Build a runnable workflow from a definition."""

        for node_name in definition.nodes:
            self.get_node(node_name)
        return CompiledWorkflow(definition=definition, nodes=self._nodes)


class CompiledWorkflow:
    """Dependency-free async workflow runner.

    It intentionally models a small subset of LangGraph-like execution:
    node state in, node state out, optional next_node routing, and stop-on-error.
    """

    def __init__(self, definition: WorkflowDefinition, nodes: dict[str, WorkflowNode]) -> None:
        self.definition = definition
        self.nodes = dict(nodes)
        self._edge_map = {source: target for source, target in definition.edges}

    async def run(self, initial_state: BaseAgentState) -> WorkflowRunResult:
        """Run the workflow and return final state plus execution metadata."""

        state: BaseAgentState = dict(initial_state)
        current_node = self.definition.entry_node or (self.definition.nodes[0] if self.definition.nodes else None)
        executed_nodes: list[str] = []

        while current_node:
            node = self.nodes[current_node]
            state = await self._invoke(node, state)
            executed_nodes.append(current_node)

            if self.definition.stop_on_error and state.get("error"):
                return WorkflowRunResult(
                    workflow_name=self.definition.name,
                    state=dict(state),
                    executed_nodes=executed_nodes,
                    status="FAILED",
                )
            if current_node in self.definition.finish_nodes:
                break

            next_node = state.pop("next_node", None) or self._edge_map.get(current_node)
            if next_node is None and current_node in self.definition.nodes:
                index = self.definition.nodes.index(current_node)
                next_node = self.definition.nodes[index + 1] if index + 1 < len(self.definition.nodes) else None
            current_node = next_node

        return WorkflowRunResult(
            workflow_name=self.definition.name,
            state=dict(state),
            executed_nodes=executed_nodes,
        )

    @staticmethod
    async def _invoke(node: WorkflowNode, state: BaseAgentState) -> BaseAgentState:
        result = node(state)
        if inspect.isawaitable(result):
            result = await result
        return result
