from common_core.ai_pipeline.document import (
    Chunker,
    ChunkingOptions,
    DocumentPipeline,
    DocumentSource,
    PipelineOptions,
    ParserRegistry,
    SourceType,
    TextNormalizer,
)


def test_text_normalizer_strips_control_chars_and_collapses_spaces():
    normalizer = TextNormalizer()

    text = normalizer.normalize("hello\u0000   world\r\n\r\n\r\nnext")

    assert text == "hello world\n\nnext"


def test_parser_registry_parses_json_as_text_document():
    registry = ParserRegistry()
    source = DocumentSource(
        source_id="source-1",
        domain="sol_bat",
        source_type=SourceType.JSON,
        name="sample",
        content='{"crop": "tomato", "risk": "high"}',
    )
    document = DocumentPipeline()._to_document_input(source, options=PipelineOptions())

    result = registry.parse(document)

    assert result.documents
    assert '"crop": "tomato"' in result.documents[0].text
    assert result.documents[0].metadata["json_root_type"] == "dict"


def test_chunker_creates_overlapping_chunks():
    source = DocumentSource(
        source_id="source-1",
        domain="sol_bat",
        source_type=SourceType.TEXT,
        name="sample",
        content="abcdefghij",
    )
    result = DocumentPipeline().process(
        source,
        options=PipelineOptions(
            chunking=ChunkingOptions(chunk_size=4, chunk_overlap=1, split_on_paragraph=False)
        ),
    )

    assert [chunk.content for chunk in result.chunks] == ["abcd", "defg", "ghij"]


def test_document_pipeline_enriches_chunk_metadata():
    pipeline = DocumentPipeline(chunker=Chunker())
    source = DocumentSource(
        source_id="source-1",
        domain="sol_bat",
        source_type=SourceType.TEXT,
        name="manual",
        content="tomato disease prevention guide",
        metadata={"tag": "guide"},
        tenant_id="tenant-1",
        user_id="user-1",
        scope="TENANT",
    )

    result = pipeline.process(
        source,
        options=PipelineOptions(chunking=ChunkingOptions(chunk_size=100, chunk_overlap=0)),
    )

    assert result.metrics["chunk_count"] == 1
    assert result.chunks[0].metadata["source_name"] == "manual"
    assert result.chunks[0].metadata["tenant_id"] == "tenant-1"
    assert result.chunks[0].metadata["tag"] == "guide"
