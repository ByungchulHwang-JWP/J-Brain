import asyncio

from common_core.agents import WorkflowDefinition, WorkflowFactory
from common_core.agents.nodes import GraphRAGRetrieveNode, LLMAnswerNode, StructuredOutputNode
from common_core.ai_pipeline.graphrag import HybridRetriever, RetrievalStrategy
from common_core.ai_pipeline.graphrag.schemas import ChunkInput
from common_core.ai_pipeline.vectorstores import InMemoryVectorStore, VectorWriteOptions


def _retriever() -> HybridRetriever:
    vector_store = InMemoryVectorStore()
    vector_store.add_chunks(
        [
            ChunkInput(
                chunk_id="chunk-1",
                source_id="source-1",
                document_id="doc-1",
                domain="sol_bat",
                content="tomato disease prevention guide",
                chunk_index=0,
            )
        ],
        VectorWriteOptions(collection_name="default"),
    )
    return HybridRetriever(vector_store=vector_store)


def test_workflow_factory_runs_retrieve_answer_and_structured_output():
    factory = WorkflowFactory()
    factory.register_node(
        "retrieve",
        GraphRAGRetrieveNode(retriever=_retriever(), default_domain="sol_bat"),
    )
    factory.register_node(
        "answer",
        LLMAnswerNode(answer_provider=lambda query, context, state: f"answer: {query} / {context[:20]}"),
    )
    factory.register_node("format", StructuredOutputNode())
    workflow = factory.build(
        WorkflowDefinition(
            name="graphrag_agent",
            nodes=["retrieve", "answer", "format"],
            edges=[("retrieve", "answer"), ("answer", "format")],
            finish_nodes=["format"],
        )
    )

    result = asyncio.run(
        workflow.run(
            {
                "query": "tomato",
                "retrieval_options": {"strategy": RetrievalStrategy.VECTOR_ONLY, "top_k": 1},
                "roles": ["ADMIN"],
            }
        )
    )

    assert result.status == "COMPLETED"
    assert result.executed_nodes == ["retrieve", "answer", "format"]
    assert result.state["retrieval"]["status"] == "HIT"
    assert result.state["result"]["answer"].startswith("answer: tomato")
    assert result.state["result"]["structured_output"]["answer"].startswith("answer: tomato")


def test_workflow_stops_on_retrieve_error():
    factory = WorkflowFactory()
    factory.register_node("retrieve", GraphRAGRetrieveNode(retriever=_retriever()))
    factory.register_node("answer", LLMAnswerNode())
    workflow = factory.build(
        WorkflowDefinition(name="error_flow", nodes=["retrieve", "answer"], stop_on_error=True)
    )

    result = asyncio.run(workflow.run({"query": "tomato"}))

    assert result.status == "FAILED"
    assert result.executed_nodes == ["retrieve"]
    assert result.state["error"]["code"] == "GRAG-RET-001"

