"""DocumentPipeline for RAG ingestion."""

from __future__ import annotations

from uuid import uuid4

from pydantic import BaseModel, Field

from common_core.ai_pipeline.document.chunker import Chunker, ChunkingOptions
from common_core.ai_pipeline.document.metadata_enricher import MetadataEnricher
from common_core.ai_pipeline.document.parser_registry import ParserRegistry
from common_core.ai_pipeline.document.schemas import (
    DocumentInput,
    DocumentParseResult,
    DocumentSource,
    ParsedDocument,
)
from common_core.ai_pipeline.graphrag.schemas import ChunkInput


class PipelineOptions(BaseModel):
    """DocumentPipeline options."""

    chunking: ChunkingOptions = Field(default_factory=ChunkingOptions)
    max_content_chars: int | None = None
    fail_on_warning: bool = False


class PipelineResult(BaseModel):
    """DocumentPipeline processing result."""

    source_id: str
    documents: list[ParsedDocument] = Field(default_factory=list)
    chunks: list[ChunkInput] = Field(default_factory=list)
    warnings: list[dict] = Field(default_factory=list)
    metrics: dict = Field(default_factory=dict)


class PipelinePreview(BaseModel):
    """Lightweight preview result for admin UI."""

    source_id: str
    documents: list[ParsedDocument] = Field(default_factory=list)
    chunks: list[ChunkInput] = Field(default_factory=list)
    warnings: list[dict] = Field(default_factory=list)


class DocumentPipeline:
    """Load, parse, normalize, chunk, and enrich source content."""

    def __init__(
        self,
        parser_registry: ParserRegistry | None = None,
        chunker: Chunker | None = None,
        metadata_enricher: MetadataEnricher | None = None,
    ) -> None:
        self.parser_registry = parser_registry or ParserRegistry()
        self.chunker = chunker or Chunker()
        self.metadata_enricher = metadata_enricher or MetadataEnricher()

    def process(
        self,
        source: DocumentSource,
        options: PipelineOptions | None = None,
    ) -> PipelineResult:
        """Process one source into parsed documents and chunks."""

        options = options or PipelineOptions()
        document_input = self._to_document_input(source, options)
        parse_result = self.parser_registry.parse(document_input)
        if options.fail_on_warning and parse_result.warnings:
            raise ValueError(f"Document parsing warnings: {parse_result.warnings}")

        documents = [
            self.metadata_enricher.enrich_document(document, source)
            for document in parse_result.documents
        ]
        chunks: list[ChunkInput] = []
        for document in documents:
            chunks.extend(self.chunker.chunk(document, options.chunking))
        chunks = self.metadata_enricher.enrich_chunks(chunks, source)

        return PipelineResult(
            source_id=source.source_id,
            documents=documents,
            chunks=chunks,
            warnings=parse_result.warnings,
            metrics={
                "document_count": len(documents),
                "chunk_count": len(chunks),
                "source_type": source.source_type.value,
            },
        )

    def preview(
        self,
        source: DocumentSource,
        options: PipelineOptions | None = None,
        max_chunks: int = 5,
    ) -> PipelinePreview:
        """Return a chunk preview for admin screens."""

        result = self.process(source, options)
        return PipelinePreview(
            source_id=result.source_id,
            documents=result.documents,
            chunks=result.chunks[:max_chunks],
            warnings=result.warnings,
        )

    def _to_document_input(
        self,
        source: DocumentSource,
        options: PipelineOptions,
    ) -> DocumentInput:
        content = self._read_source_content(source)
        if options.max_content_chars is not None:
            content = content[: options.max_content_chars]
        return DocumentInput(
            document_id=f"{source.source_id}:doc:{uuid4()}",
            source_id=source.source_id,
            domain=source.domain,
            source_type=source.source_type,
            name=source.name,
            content=content,
            metadata=source.metadata,
        )

    @staticmethod
    def _read_source_content(source: DocumentSource) -> str:
        if source.content is None:
            raise ValueError("source.content is required for the initial DocumentPipeline")
        if isinstance(source.content, bytes):
            return source.content.decode("utf-8")
        return source.content

