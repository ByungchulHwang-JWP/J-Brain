"""Shared Agent state contracts."""

from typing import Any, TypedDict


class BaseAgentState(TypedDict, total=False):
    """Base state shape used by LangGraph-compatible workflows."""

    run_id: str
    domain: str
    user_id: str | None
    tenant_id: str | None
    roles: list[str]
    messages: list[dict[str, Any]]
    query: str
    filters: dict[str, Any]
    retrieval_options: dict[str, Any]
    retrieval: dict[str, Any]
    context: str
    evidence: list[dict[str, Any]]
    citations: list[dict[str, Any]]
    result: dict[str, Any]
    error: dict[str, Any] | None
    next_node: str | None

