from common_core.ai_pipeline.graphrag.context_assembler import ContextAssembler
from common_core.ai_pipeline.graphrag.schemas import (
    ContextAssembleRequest,
    EvidenceRecord,
    RetrievalItem,
)


def test_context_assembler_creates_citations():
    assembler = ContextAssembler()
    result = assembler.assemble(
        ContextAssembleRequest(
            query="How to prevent disease?",
            domain="sol_bat",
            items=[
                RetrievalItem(
                    rank=1,
                    result_type="CHUNK",
                    chunk_id="chunk-1",
                    text="fallback text",
                    score=0.9,
                    metadata={"source_id": "source-1"},
                )
            ],
            evidence=[
                EvidenceRecord(
                    source_id="source-1",
                    chunk_id="chunk-1",
                    quote_text="Use preventive action.",
                    confidence_score=1.0,
                    extraction_method="RULE",
                )
            ],
        )
    )

    assert "(E1) Use preventive action." in result.context
    assert result.citations[0]["chunk_id"] == "chunk-1"

