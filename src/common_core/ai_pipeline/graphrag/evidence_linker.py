"""Evidence linking for GraphRAG extraction results."""

from pydantic import BaseModel

from common_core.ai_pipeline.graphrag.schemas import (
    ChunkInput,
    EvidenceBundle,
    EvidenceLinkRecord,
    EvidenceRecord,
    RelationCandidate,
    ResolvedEntity,
)


class EvidenceLinkOptions(BaseModel):
    """Options for evidence linking."""

    quote_window_chars: int = 300
    require_relation_evidence: bool = True
    default_support_type: str = "SUPPORTS"


class EvidenceLinker:
    """Create evidence records and target links for entities and relations."""

    def link(
        self,
        chunk: ChunkInput,
        entities: list[ResolvedEntity],
        relations: list[RelationCandidate],
        options: EvidenceLinkOptions | None = None,
    ) -> EvidenceBundle:
        """Link a chunk quote to extracted entities and relations."""

        options = options or EvidenceLinkOptions()
        quote = self._quote_for(chunk, entities, options.quote_window_chars)
        if not quote:
            return EvidenceBundle(warnings=[{"code": "EMPTY_CHUNK", "chunk_id": chunk.chunk_id}])

        evidence = EvidenceRecord(
            source_id=chunk.source_id,
            document_id=chunk.document_id,
            chunk_id=chunk.chunk_id,
            quote_text=quote,
            confidence_score=1.0,
            extraction_method="RULE",
        )

        links: list[EvidenceLinkRecord] = []
        for entity in entities:
            target_ref = entity.entity_id or entity.normalized_name
            links.append(
                EvidenceLinkRecord(
                    target_type="ENTITY",
                    target_id=entity.entity_id,
                    target_ref=target_ref,
                    support_type=options.default_support_type,
                    confidence_score=entity.confidence_score,
                )
            )
        for relation in relations:
            links.append(
                EvidenceLinkRecord(
                    target_type="RELATION",
                    target_id=relation.candidate_id,
                    target_ref=relation.candidate_id,
                    support_type=options.default_support_type,
                    confidence_score=relation.confidence_score,
                )
            )

        warnings = []
        if options.require_relation_evidence and relations and not links:
            warnings.append({"code": "RELATION_EVIDENCE_MISSING", "chunk_id": chunk.chunk_id})

        return EvidenceBundle(evidence=[evidence], links=links, warnings=warnings)

    @staticmethod
    def _quote_for(
        chunk: ChunkInput,
        entities: list[ResolvedEntity],
        quote_window_chars: int,
    ) -> str:
        offsets = [
            offset
            for entity in entities
            for mention in entity.mention_texts
            if (offset := chunk.content.find(mention)) >= 0
        ]
        if not offsets:
            return chunk.content[:quote_window_chars].strip()
        center = min(offsets)
        start = max(0, center - quote_window_chars // 3)
        end = min(len(chunk.content), start + quote_window_chars)
        return chunk.content[start:end].strip()
