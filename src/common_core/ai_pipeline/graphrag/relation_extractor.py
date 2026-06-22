"""Relation extraction contracts and a deterministic baseline."""

from __future__ import annotations

import re

from pydantic import BaseModel

from common_core.ai_pipeline.graphrag.schemas import (
    ChunkInput,
    DomainSchema,
    RelationCandidate,
    ResolvedEntity,
)


class RelationExtractionOptions(BaseModel):
    """Options for relation extraction."""

    use_llm: bool = False
    confidence_threshold: float = 0.60
    max_relations_per_chunk: int = 40
    allow_inferred_relation: bool = False
    model: str | None = None
    keyword_rules: dict[str, list[str]] = {
        "HAS_RISK_OF": [
            "발생",
            "위험",
            "주의",
            "경보",
            "예찰",
            "감염",
            "번식",
            "유행",
            "risk",
            "disease",
            "pest",
        ],
        "PREVENTS": [
            "예방",
            "방지",
            "억제",
            "차단",
            "사전 방제",
            "prevent",
            "prevention",
        ],
        "TREATS": [
            "처방",
            "방제",
            "살포",
            "처리",
            "제거",
            "대응",
            "조치",
            "treat",
            "treatment",
            "control",
        ],
        "AFFECTS": [
            "영향",
            "유발",
            "원인",
            "증가",
            "감소",
            "악화",
            "촉진",
            "피해",
            "affect",
            "cause",
            "trigger",
            "damage",
        ],
        "APPLIES_AT": [
            "시기",
            "단계",
            "때",
            "동안",
            "정식기",
            "개화기",
            "수확기",
            "고온 시",
            "강우 후",
            "apply",
        ],
    }


class RelationExtractor:
    """Extract relation candidates between resolved entities."""

    def extract(
        self,
        chunk: ChunkInput,
        entities: list[ResolvedEntity],
        schema: DomainSchema,
        options: RelationExtractionOptions | None = None,
    ) -> list[RelationCandidate]:
        """Return schema-valid relation candidates for entities in the same chunk."""

        options = options or RelationExtractionOptions()
        if len(entities) < 2:
            return []

        content = chunk.content.lower()
        candidates: list[RelationCandidate] = []
        seen: set[tuple[str, str, str]] = set()
        for relation_type in schema.relation_types:
            keyword_score = self._keyword_score(content, options.keyword_rules.get(relation_type.type, []))
            if keyword_score <= 0 and not options.allow_inferred_relation:
                continue
            for source in entities:
                for target in entities:
                    if source is target:
                        continue
                    if source.entity_type not in relation_type.source_types:
                        continue
                    if target.entity_type not in relation_type.target_types:
                        continue
                    key = (
                        relation_type.type,
                        source.entity_id or source.normalized_name,
                        target.entity_id or target.normalized_name,
                    )
                    if key in seen:
                        continue
                    seen.add(key)

                    candidates.append(
                        RelationCandidate(
                            domain=chunk.domain,
                            relation_type=relation_type.type,
                            source_entity_ref=source.entity_id or source.normalized_name,
                            target_entity_ref=target.entity_id or target.normalized_name,
                            source_entity_type=source.entity_type,
                            target_entity_type=target.entity_type,
                            chunk_id=chunk.chunk_id,
                            source_id=chunk.source_id,
                            confidence_score=max(0.60, keyword_score),
                            extraction_method="RULE",
                            rationale=self._rationale_for(relation_type.type, keyword_score),
                        )
                    )
                    if len(candidates) >= options.max_relations_per_chunk:
                        return candidates

        return [
            candidate
            for candidate in candidates
            if candidate.confidence_score >= options.confidence_threshold
        ]

    @staticmethod
    def _keyword_score(content: str, keywords: list[str]) -> float:
        for keyword in keywords:
            if re.search(re.escape(keyword.lower()), content):
                return 0.82
        return 0.0

    @staticmethod
    def _rationale_for(relation_type: str, keyword_score: float) -> str:
        if keyword_score > 0:
            return f"Matched {relation_type} relation keyword and schema-valid entity pair."
        return f"Inferred {relation_type} relation from schema-valid entity pair."
