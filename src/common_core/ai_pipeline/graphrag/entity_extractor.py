"""Entity extraction contracts and a lightweight rule based implementation."""

from __future__ import annotations

import re
import unicodedata
from collections.abc import Iterable

from pydantic import BaseModel

from common_core.ai_pipeline.graphrag.schemas import ChunkInput, DomainSchema, EntityCandidate


class EntityExtractionOptions(BaseModel):
    """Options for entity extraction."""

    use_rule: bool = True
    use_llm: bool = False
    confidence_threshold: float = 0.60
    max_entities_per_chunk: int = 30
    language: str = "ko"
    model: str | None = None
    dictionary: dict[str, list[str]] = {}


class EntityExtractor:
    """Extract entity candidates from chunks.

    The first implementation is intentionally deterministic. LLM based
    extraction can be added behind the same interface in the next task.
    """

    def extract(
        self,
        chunk: ChunkInput,
        schema: DomainSchema,
        options: EntityExtractionOptions | None = None,
    ) -> list[EntityCandidate]:
        """Extract candidates from one chunk."""

        options = options or EntityExtractionOptions()
        if not chunk.content.strip() or not options.use_rule:
            return []

        content = unicodedata.normalize("NFC", chunk.content)
        candidates: list[EntityCandidate] = []
        seen: set[tuple[str, str, int]] = set()

        for entity_type in schema.entity_types:
            terms = self._terms_for(entity_type.type, entity_type.aliases, options.dictionary)
            for term in terms:
                if not term:
                    continue
                pattern = self._term_pattern(term)
                for match in re.finditer(pattern, content, flags=re.IGNORECASE):
                    key = (entity_type.type, match.group(0).lower(), match.start())
                    if key in seen:
                        continue
                    seen.add(key)
                    candidates.append(
                        EntityCandidate(
                            domain=chunk.domain,
                            entity_type=entity_type.type,
                            name=match.group(0),
                            normalized_name=self.normalize_name(match.group(0)),
                            mention_text=match.group(0),
                            chunk_id=chunk.chunk_id,
                            source_id=chunk.source_id,
                            start_offset=match.start(),
                            end_offset=match.end(),
                            confidence_score=self._confidence_for(term, entity_type.aliases),
                            extraction_method="RULE",
                            attributes={"matched_term": term},
                        )
                    )
                    if len(candidates) >= options.max_entities_per_chunk:
                        return candidates
        return [
            candidate
            for candidate in candidates
            if candidate.confidence_score >= options.confidence_threshold
        ]

    @staticmethod
    def normalize_name(name: str) -> str:
        """Normalize an entity name for matching."""

        normalized = unicodedata.normalize("NFC", name)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized.lower()

    @staticmethod
    def _terms_for(
        entity_type: str,
        aliases: Iterable[str],
        dictionary: dict[str, list[str]],
    ) -> list[str]:
        terms = [entity_type, *aliases, *dictionary.get(entity_type, [])]
        result = []
        seen = set()
        for term in terms:
            key = term.lower()
            if key not in seen:
                seen.add(key)
                result.append(term)
        return sorted(result, key=len, reverse=True)

    @staticmethod
    def _term_pattern(term: str) -> str:
        escaped = re.escape(term)
        if re.fullmatch(r"[A-Za-z0-9_]+", term):
            return rf"\b{escaped}\b"
        return escaped

    @staticmethod
    def _confidence_for(term: str, aliases: list[str]) -> float:
        if term in aliases:
            return 0.85
        if re.fullmatch(r"[A-Z_]+", term):
            return 0.70
        return 0.80

