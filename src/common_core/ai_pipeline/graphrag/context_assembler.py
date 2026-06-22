"""Build evidence-aware context for LLM and Agent workflows."""

from common_core.ai_pipeline.graphrag.schemas import (
    ContextAssembleRequest,
    ContextAssembleResult,
)


class ContextAssembler:
    """Assemble retrieval items and evidence into a compact context block."""

    def assemble(self, request: ContextAssembleRequest) -> ContextAssembleResult:
        """Create context text with simple citation markers."""

        lines = [
            "[Question]",
            request.query,
            "",
            "[Retrieval Summary]",
            f"domain={request.domain}",
            f"item_count={len(request.items)} evidence_count={len(request.evidence)}",
            "",
            "[Retrieved Evidence]",
        ]
        citations: list[dict] = []
        token_estimate = 0
        truncated = False

        evidence_by_chunk = {evidence.chunk_id: evidence for evidence in request.evidence if evidence.chunk_id}
        evidence_by_id = {evidence.evidence_id: evidence for evidence in request.evidence if evidence.evidence_id}

        for index, item in enumerate(sorted(request.items, key=lambda value: value.score, reverse=True), 1):
            citation_id = f"E{index}"
            evidence = evidence_by_chunk.get(item.chunk_id)
            if evidence is None:
                evidence = next(
                    (
                        evidence_by_id[evidence_id]
                        for evidence_id in item.evidence_ids
                        if evidence_id in evidence_by_id
                    ),
                    None,
                )
            snippet = evidence.quote_text if evidence else item.text
            line = f"({citation_id}) {snippet}"
            token_estimate += max(1, len(line) // 4)
            if token_estimate > request.max_tokens:
                truncated = True
                break
            lines.append(line)
            lines.append(
                "source="
                f"{item.metadata.get('source_id', '')} "
                f"chunk={item.chunk_id or ''} "
                f"type={item.result_type} score={item.score:.4f}"
            )
            citations.append(
                {
                    "citation_id": citation_id,
                    "chunk_id": item.chunk_id,
                    "evidence_id": evidence.evidence_id if evidence else None,
                    "relation_id": item.relation_id,
                    "entity_id": item.entity_id,
                    "score": item.score,
                }
            )

        if not citations:
            lines.append("No retrieval evidence was found.")

        return ContextAssembleResult(
            context="\n".join(lines),
            citations=citations,
            evidence=request.evidence,
            token_estimate=token_estimate,
            truncated=truncated,
        )
