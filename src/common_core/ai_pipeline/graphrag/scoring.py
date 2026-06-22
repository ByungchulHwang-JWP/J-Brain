"""GraphRAG scoring helpers."""

from pydantic import BaseModel, Field


class HybridScore(BaseModel):
    """Score parts used by hybrid retrieval."""

    vector_score: float = 0.0
    graph_score: float = 0.0
    evidence_score: float = 0.0
    recency_score: float = 0.0
    final_score: float = 0.0
    reason: str = ""
    weights: dict[str, float] = Field(default_factory=dict)


def calculate_hybrid_score(
    vector_score: float = 0.0,
    graph_score: float = 0.0,
    evidence_score: float = 0.0,
    recency_score: float = 0.0,
) -> HybridScore:
    """Calculate the default weighted hybrid retrieval score."""

    weights = {"vector": 0.60, "graph": 0.25, "evidence": 0.10, "recency": 0.05}
    final_score = (
        vector_score * weights["vector"]
        + graph_score * weights["graph"]
        + evidence_score * weights["evidence"]
        + recency_score * weights["recency"]
    )
    return HybridScore(
        vector_score=vector_score,
        graph_score=graph_score,
        evidence_score=evidence_score,
        recency_score=recency_score,
        final_score=final_score,
        reason="default_weighted_sum",
        weights=weights,
    )


def normalize_score(value: float | None) -> float:
    """Clamp a score into the 0.0~1.0 range."""

    if value is None:
        return 0.0
    return max(0.0, min(1.0, value))
