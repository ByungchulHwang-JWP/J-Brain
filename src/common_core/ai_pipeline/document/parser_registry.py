"""Parser registry and built-in lightweight parsers."""

from __future__ import annotations

import csv
import io
import json
from collections.abc import Callable
from typing import Any

from common_core.ai_pipeline.document.normalizer import TextNormalizer
from common_core.ai_pipeline.document.schemas import (
    DocumentInput,
    DocumentParseResult,
    ParsedDocument,
    SourceType,
)

Parser = Callable[[DocumentInput], DocumentParseResult]


class ParserRegistry:
    """Registry that maps source types to parser callables."""

    def __init__(self, normalizer: TextNormalizer | None = None) -> None:
        self.normalizer = normalizer or TextNormalizer()
        self._parsers: dict[SourceType, Parser] = {}
        self.register(SourceType.TEXT, self._parse_text)
        self.register(SourceType.MARKDOWN, self._parse_text)
        self.register(SourceType.JSON, self._parse_json)
        self.register(SourceType.CSV, self._parse_csv)
        self.register(SourceType.FILE, self._parse_text)
        self.register(SourceType.URL, self._parse_text)
        self.register(SourceType.API, self._parse_json)

    def register(self, source_type: SourceType, parser: Parser) -> None:
        """Register a parser for a source type."""

        self._parsers[source_type] = parser

    def parse(self, document: DocumentInput) -> DocumentParseResult:
        """Parse a document with the registered parser."""

        try:
            parser = self._parsers[document.source_type]
        except KeyError as exc:
            raise KeyError(f"Parser is not registered: {document.source_type}") from exc
        return parser(document)

    def list_supported_types(self) -> list[str]:
        """Return supported source type names."""

        return sorted(source_type.value for source_type in self._parsers)

    def _parsed_document(
        self,
        document: DocumentInput,
        text: str,
        metadata: dict[str, Any] | None = None,
        title: str | None = None,
    ) -> ParsedDocument:
        return ParsedDocument(
            document_id=document.document_id,
            source_id=document.source_id,
            domain=document.domain,
            title=title or document.name,
            text=self.normalizer.normalize(text),
            metadata={**document.metadata, **(metadata or {})},
        )

    def _parse_text(self, document: DocumentInput) -> DocumentParseResult:
        return DocumentParseResult(documents=[self._parsed_document(document, document.content)])

    def _parse_json(self, document: DocumentInput) -> DocumentParseResult:
        warnings: list[dict[str, Any]] = []
        try:
            payload = json.loads(document.content)
        except json.JSONDecodeError:
            warnings.append({"code": "JSON_PARSE_FAILED", "document_id": document.document_id})
            return DocumentParseResult(
                documents=[self._parsed_document(document, document.content)],
                warnings=warnings,
            )
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        return DocumentParseResult(
            documents=[self._parsed_document(document, text, metadata={"json_root_type": type(payload).__name__})]
        )

    def _parse_csv(self, document: DocumentInput) -> DocumentParseResult:
        reader = csv.DictReader(io.StringIO(document.content))
        rows = list(reader)
        if not rows:
            return DocumentParseResult(
                documents=[self._parsed_document(document, document.content)],
                warnings=[{"code": "CSV_EMPTY_OR_NO_HEADER", "document_id": document.document_id}],
            )
        lines = []
        for index, row in enumerate(rows, 1):
            values = [f"{key}: {value}" for key, value in row.items()]
            lines.append(f"row {index} - " + ", ".join(values))
        return DocumentParseResult(
            documents=[
                self._parsed_document(
                    document,
                    "\n".join(lines),
                    metadata={"row_count": len(rows), "columns": reader.fieldnames or []},
                )
            ]
        )

