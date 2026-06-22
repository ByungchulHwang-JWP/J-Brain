"""Chunk documents for retrieval and embedding."""

from pydantic import BaseModel, Field

from common_core.ai_pipeline.document.schemas import ParsedDocument
from common_core.ai_pipeline.graphrag.schemas import ChunkInput


class ChunkingOptions(BaseModel):
    """Chunking options."""

    chunk_size: int = 1000
    chunk_overlap: int = 100
    min_chunk_chars: int = 1
    split_on_paragraph: bool = True
    metadata: dict = Field(default_factory=dict)


class Chunker:
    """Split parsed documents into overlapping chunks."""

    def chunk(
        self,
        document: ParsedDocument,
        options: ChunkingOptions | None = None,
    ) -> list[ChunkInput]:
        """Return chunks for a parsed document."""

        options = options or ChunkingOptions()
        if options.chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")
        if options.chunk_overlap < 0:
            raise ValueError("chunk_overlap must be zero or greater")
        if options.chunk_overlap >= options.chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")

        text = document.text.strip()
        if not text:
            return []

        chunks = self._paragraph_chunks(text, options) if options.split_on_paragraph else []
        if not chunks:
            chunks = self._sliding_window_chunks(text, options)

        result: list[ChunkInput] = []
        cursor = 0
        for index, chunk_text in enumerate(chunks):
            if len(chunk_text.strip()) < options.min_chunk_chars:
                continue
            start = text.find(chunk_text, cursor)
            if start < 0:
                start = cursor
            end = start + len(chunk_text)
            cursor = max(start + 1, end - options.chunk_overlap)
            result.append(
                ChunkInput(
                    chunk_id=f"{document.document_id}:chunk:{index}",
                    source_id=document.source_id,
                    document_id=document.document_id,
                    domain=document.domain,
                    content=chunk_text.strip(),
                    chunk_index=index,
                    start_offset=start,
                    end_offset=end,
                    metadata={**document.metadata, **options.metadata},
                )
            )
        return result

    @staticmethod
    def _paragraph_chunks(text: str, options: ChunkingOptions) -> list[str]:
        paragraphs = [item.strip() for item in text.split("\n\n") if item.strip()]
        if not paragraphs:
            return []

        chunks: list[str] = []
        current = ""
        for paragraph in paragraphs:
            candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
            if len(candidate) <= options.chunk_size:
                current = candidate
                continue
            if current:
                chunks.append(current)
            if len(paragraph) > options.chunk_size:
                chunks.extend(Chunker._sliding_window_chunks(paragraph, options))
                current = ""
            else:
                current = paragraph
        if current:
            chunks.append(current)
        return chunks

    @staticmethod
    def _sliding_window_chunks(text: str, options: ChunkingOptions) -> list[str]:
        chunks = []
        step = options.chunk_size - options.chunk_overlap
        start = 0
        while start < len(text):
            end = min(start + options.chunk_size, len(text))
            chunks.append(text[start:end])
            if end == len(text):
                break
            start += step
        return chunks

