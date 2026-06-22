"""PostgreSQL Graph Store adapter skeleton."""

from common_core.ai_pipeline.graphrag.graph_store import (
    EntityQuery,
    EvidenceQuery,
    GraphDeleteResult,
    GraphStoreAdapter,
    GraphTraversalRequest,
    GraphTraversalResult,
    RelationQuery,
)
from common_core.ai_pipeline.graphrag.schemas import (
    AuthContext,
    EvidenceBundle,
    EvidenceRecord,
    RelationCandidate,
    ResolvedEntity,
)


class PostgreSQLGraphStoreAdapter(GraphStoreAdapter):
    """PostgreSQL graph table adapter placeholder.

    The adapter defines the production provider boundary. Actual SQLAlchemy
    models, migrations, and pgvector/PostgreSQL transaction handling are left to
    the physical persistence implementation task.
    """

    provider = "postgresql"

    def __init__(self, session_factory=None) -> None:
        self.session_factory = session_factory

    def upsert_entities(self, entities: list[ResolvedEntity]) -> list[ResolvedEntity]:
        raise NotImplementedError("PostgreSQL entity upsert is not implemented yet.")

    def upsert_relations(self, relations: list[RelationCandidate]) -> list[RelationCandidate]:
        raise NotImplementedError("PostgreSQL relation upsert is not implemented yet.")

    def upsert_evidence(self, bundle: EvidenceBundle) -> EvidenceBundle:
        raise NotImplementedError("PostgreSQL evidence upsert is not implemented yet.")

    def find_entities(self, query: EntityQuery, auth: AuthContext) -> list[ResolvedEntity]:
        raise NotImplementedError("PostgreSQL entity search is not implemented yet.")

    def find_relations(self, query: RelationQuery, auth: AuthContext) -> list[RelationCandidate]:
        raise NotImplementedError("PostgreSQL relation search is not implemented yet.")

    def get_evidence(self, query: EvidenceQuery, auth: AuthContext) -> list[EvidenceRecord]:
        raise NotImplementedError("PostgreSQL evidence search is not implemented yet.")

    def traverse(
        self,
        request: GraphTraversalRequest,
        auth: AuthContext,
    ) -> GraphTraversalResult:
        raise NotImplementedError("PostgreSQL graph traversal is not implemented yet.")

    def delete_by_source(self, source_id: str, auth: AuthContext) -> GraphDeleteResult:
        raise NotImplementedError("PostgreSQL source delete is not implemented yet.")
