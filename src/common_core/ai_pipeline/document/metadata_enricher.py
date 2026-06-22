"""Metadata enrichment for document chunks."""

from typing import Any

from common_core.ai_pipeline.document.schemas import DocumentSource, ParsedDocument
from common_core.ai_pipeline.graphrag.schemas import ChunkInput


class MetadataEnricher:
    """Attach source, ownership, and retrieval metadata to parsed documents and chunks."""

    def enrich_document(self, document: ParsedDocument, source: DocumentSource) -> ParsedDocument:
        """Return a parsed document with source metadata."""

        metadata = self._base_metadata(source)
        metadata.update(document.metadata)
        return document.model_copy(update={"metadata": metadata})

    def enrich_chunks(self, chunks: list[ChunkInput], source: DocumentSource) -> list[ChunkInput]:
        """Return chunks with consistent source metadata."""

        base_metadata = self._base_metadata(source)
        result = []
        for chunk in chunks:
            result.append(chunk.model_copy(update={"metadata": {**base_metadata, **chunk.metadata}}))
        return result

    @staticmethod
    def _base_metadata(source: DocumentSource) -> dict[str, Any]:
        metadata = {
            "source_id": source.source_id,
            "source_name": source.name,
            "source_type": source.source_type.value,
            "source_version": source.version,
            "domain": source.domain,
            "tenant_id": source.tenant_id,
            "user_id": source.user_id,
            "scope": source.scope,
        }
        metadata.update(source.metadata)
        return metadata

