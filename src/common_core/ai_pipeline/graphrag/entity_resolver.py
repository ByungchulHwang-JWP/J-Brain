"""Entity resolution for GraphRAG extraction."""

from common_core.ai_pipeline.graphrag.entity_extractor import EntityExtractor
from common_core.ai_pipeline.graphrag.schemas import DomainSchema, EntityCandidate, ResolvedEntity


class EntityResolver:
    """Merge entity candidates into canonical entities."""

    def resolve(
        self,
        candidates: list[EntityCandidate],
        schema: DomainSchema,
        existing_entities: list[ResolvedEntity] | None = None,
    ) -> list[ResolvedEntity]:
        """Resolve extracted candidates by domain, type, normalized name, and aliases."""

        allowed_types = schema.entity_type_names()
        canonical: dict[tuple[str, str, str], ResolvedEntity] = {}

        for entity in existing_entities or []:
            key = (entity.domain, entity.entity_type, entity.normalized_name)
            canonical[key] = entity
            for alias in entity.aliases:
                alias_key = (
                    entity.domain,
                    entity.entity_type,
                    EntityExtractor.normalize_name(alias),
                )
                canonical.setdefault(alias_key, entity)

        for candidate in candidates:
            if candidate.entity_type not in allowed_types:
                continue
            normalized_name = EntityExtractor.normalize_name(candidate.normalized_name or candidate.name)
            key = (candidate.domain, candidate.entity_type, normalized_name)
            existing = canonical.get(key)
            if existing:
                merged = existing.model_copy(
                    update={
                        "aliases": sorted(set(existing.aliases) | set(candidate.aliases)),
                        "mention_texts": sorted(
                            set(existing.mention_texts) | {candidate.mention_text}
                        ),
                        "confidence_score": max(
                            existing.confidence_score,
                            candidate.confidence_score,
                        ),
                        "attributes": {**existing.attributes, **candidate.attributes},
                        "evidence_chunk_ids": sorted(
                            set(existing.evidence_chunk_ids) | {candidate.chunk_id}
                        ),
                        "merge_reason": "matched_normalized_name",
                    }
                )
            else:
                merged = ResolvedEntity(
                    domain=candidate.domain,
                    entity_type=candidate.entity_type,
                    name=candidate.name,
                    normalized_name=normalized_name,
                    aliases=candidate.aliases,
                    mention_texts=[candidate.mention_text],
                    confidence_score=candidate.confidence_score,
                    merge_reason="new_entity",
                    attributes=candidate.attributes,
                    evidence_chunk_ids=[candidate.chunk_id],
                )
            canonical[key] = merged
            for alias in merged.aliases:
                canonical[(merged.domain, merged.entity_type, EntityExtractor.normalize_name(alias))] = merged

        unique: dict[tuple[str, str, str], ResolvedEntity] = {}
        for entity in canonical.values():
            unique[(entity.domain, entity.entity_type, entity.normalized_name)] = entity
        return sorted(unique.values(), key=lambda item: (item.entity_type, item.normalized_name))

