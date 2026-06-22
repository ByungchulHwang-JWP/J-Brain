"""In-memory vector store for tests and local development."""

from __future__ import annotations

import math
from collections import Counter

from common_core.ai_pipeline.graphrag.schemas import AuthContext, ChunkInput
from common_core.ai_pipeline.vectorstores.base import (
    ChunkQuery,
    ChunkResponse,
    ProviderHealth,
    VectorSearchRequest,
    VectorSearchResult,
    VectorWriteOptions,
    VectorWriteResult,
)


class InMemoryVectorStore:
    """Simple lexical vector store.

    This adapter is deterministic and dependency-free. It is not intended for
    production similarity search, but it gives the framework a real add/search/
    delete behavior for unit tests and early integration work.
    """

    provider = "in_memory"

    def __init__(self) -> None:
        self._collections: dict[str, dict[str, ChunkInput]] = {}

    def add_chunks(
        self,
        chunks: list[ChunkInput],
        options: VectorWriteOptions | None = None,
    ) -> VectorWriteResult:
        """Add or replace chunks in a collection."""

        options = options or VectorWriteOptions()
        collection = self._collections.setdefault(options.collection_name, {})
        for chunk in chunks:
            merged_metadata = {**options.metadata, **chunk.metadata}
            collection[chunk.chunk_id] = chunk.model_copy(update={"metadata": merged_metadata})
        return VectorWriteResult(
            provider=self.provider,
            written_count=len(chunks),
            metadata={"collection_name": options.collection_name},
        )

    def search(self, request: VectorSearchRequest) -> list[VectorSearchResult]:
        """Search chunks with cosine similarity over token frequencies."""

        collection = self._collections.get(request.collection_name, {})
        query_vector = self._text_vector(request.query)
        results: list[VectorSearchResult] = []
        for chunk in collection.values():
            if chunk.domain != request.domain:
                continue
            if not self._matches_filters(chunk, request.filters):
                continue
            score = self._cosine(query_vector, self._text_vector(chunk.content))
            if score <= 0:
                continue
            results.append(
                VectorSearchResult(
                    chunk_id=chunk.chunk_id,
                    source_id=chunk.source_id,
                    text=chunk.content,
                    score=score,
                    metadata=chunk.metadata,
                )
            )
        return sorted(results, key=lambda item: item.score, reverse=True)[: request.top_k]

    def delete_by_source(self, source_id: str, auth: AuthContext) -> int:
        """Delete chunks for one source across all collections."""

        deleted_count = 0
        for collection in self._collections.values():
            delete_ids = [
                chunk_id
                for chunk_id, chunk in collection.items()
                if chunk.source_id == source_id
            ]
            for chunk_id in delete_ids:
                del collection[chunk_id]
                deleted_count += 1
        return deleted_count

    def get_chunks(self, source_id: str, query: ChunkQuery) -> list[ChunkResponse]:
        """Return chunks for source preview."""

        chunks = [
            chunk
            for collection in self._collections.values()
            for chunk in collection.values()
            if chunk.source_id == source_id and self._matches_filters(chunk, query.filters)
        ]
        chunks = sorted(chunks, key=lambda item: item.chunk_index)
        window = chunks[query.offset : query.offset + query.limit]
        return [ChunkResponse(chunk=chunk) for chunk in window]

    def health_check(self) -> ProviderHealth:
        """Return provider health."""

        chunk_count = sum(len(collection) for collection in self._collections.values())
        return ProviderHealth(
            provider=self.provider,
            healthy=True,
            details={"collection_count": len(self._collections), "chunk_count": chunk_count},
        )

    @staticmethod
    def _matches_filters(chunk: ChunkInput, filters: dict) -> bool:
        for key, value in filters.items():
            if key == "source_id" and chunk.source_id == value:
                continue
            if key == "document_id" and chunk.document_id == value:
                continue
            if key == "domain" and chunk.domain == value:
                continue
            if chunk.metadata.get(key) != value:
                return False
        return True

    @staticmethod
    def _text_vector(text: str) -> Counter[str]:
        tokens = []
        current = []
        for character in text.lower():
            if character.isalnum() or character == "_":
                current.append(character)
                continue
            if current:
                tokens.append("".join(current))
                current = []
        if current:
            tokens.append("".join(current))
        return Counter(tokens)

    @staticmethod
    def _cosine(left: Counter[str], right: Counter[str]) -> float:
        if not left or not right:
            return 0.0
        common = set(left) & set(right)
        numerator = sum(left[token] * right[token] for token in common)
        left_norm = math.sqrt(sum(value * value for value in left.values()))
        right_norm = math.sqrt(sum(value * value for value in right.values()))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return numerator / (left_norm * right_norm)
