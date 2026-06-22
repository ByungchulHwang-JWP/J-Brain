"""Graph store adapter contracts."""

from __future__ import annotations

from collections import deque
from uuid import uuid4
from typing import Protocol

from pydantic import BaseModel, Field

from common_core.ai_pipeline.graphrag.schemas import (
    AuthContext,
    EvidenceBundle,
    EvidenceLinkRecord,
    EvidenceRecord,
    RelationCandidate,
    ResolvedEntity,
)


class EntityQuery(BaseModel):
    """Entity search query."""

    domain: str
    text: str | None = None
    entity_ids: list[str] = Field(default_factory=list)
    entity_types: list[str] = Field(default_factory=list)
    filters: dict = Field(default_factory=dict)
    limit: int = 20


class RelationQuery(BaseModel):
    """Relation search query."""

    domain: str
    source_entity_ids: list[str] = Field(default_factory=list)
    target_entity_ids: list[str] = Field(default_factory=list)
    relation_types: list[str] = Field(default_factory=list)
    filters: dict = Field(default_factory=dict)
    limit: int = 50


class EvidenceQuery(BaseModel):
    """Evidence search query."""

    domain: str
    evidence_ids: list[str] = Field(default_factory=list)
    target_type: str | None = None
    target_ids: list[str] = Field(default_factory=list)
    source_ids: list[str] = Field(default_factory=list)
    limit: int = 50


class GraphTraversalRequest(BaseModel):
    """Graph traversal request."""

    domain: str
    seed_entity_ids: list[str]
    relation_types: list[str] = Field(default_factory=list)
    max_depth: int = 2
    direction: str = "BOTH"
    limit: int = 100
    include_evidence: bool = True


class GraphTraversalResult(BaseModel):
    """Graph traversal result."""

    entities: list[ResolvedEntity] = Field(default_factory=list)
    relations: list[RelationCandidate] = Field(default_factory=list)
    evidence: list[EvidenceRecord] = Field(default_factory=list)
    paths: list[dict] = Field(default_factory=list)


class GraphDeleteResult(BaseModel):
    """Graph delete result."""

    deleted_entities: int = 0
    deleted_relations: int = 0
    deleted_evidence: int = 0


class GraphStoreAdapter(Protocol):
    """Provider-neutral graph store adapter."""

    def upsert_entities(self, entities: list[ResolvedEntity]) -> list[ResolvedEntity]:
        """Insert or update canonical entities."""

    def upsert_relations(self, relations: list[RelationCandidate]) -> list[RelationCandidate]:
        """Insert or update relations."""

    def upsert_evidence(self, bundle: EvidenceBundle) -> EvidenceBundle:
        """Insert or update evidence and links."""

    def find_entities(self, query: EntityQuery, auth: AuthContext) -> list[ResolvedEntity]:
        """Find entities visible to the requester."""

    def find_relations(self, query: RelationQuery, auth: AuthContext) -> list[RelationCandidate]:
        """Find relations visible to the requester."""

    def get_evidence(self, query: EvidenceQuery, auth: AuthContext) -> list[EvidenceRecord]:
        """Find evidence visible to the requester."""

    def traverse(
        self,
        request: GraphTraversalRequest,
        auth: AuthContext,
    ) -> GraphTraversalResult:
        """Traverse graph from seed entities."""

    def delete_by_source(self, source_id: str, auth: AuthContext) -> GraphDeleteResult:
        """Delete graph data for one source."""


class InMemoryGraphStore:
    """Small in-memory graph store for tests and early local development."""

    def __init__(self) -> None:
        self.entities: dict[str, ResolvedEntity] = {}
        self.relations: dict[str, RelationCandidate] = {}
        self.evidence: dict[str, EvidenceRecord] = {}
        self.evidence_links: list[EvidenceLinkRecord] = []

    def upsert_entities(self, entities: list[ResolvedEntity]) -> list[ResolvedEntity]:
        upserted = []
        for entity in entities:
            entity_id = entity.entity_id or self._entity_key(entity)
            existing = self.entities.get(entity_id)
            if existing:
                entity = existing.model_copy(
                    update={
                        "aliases": sorted(set(existing.aliases) | set(entity.aliases)),
                        "mention_texts": sorted(
                            set(existing.mention_texts) | set(entity.mention_texts)
                        ),
                        "confidence_score": max(
                            existing.confidence_score,
                            entity.confidence_score,
                        ),
                        "attributes": {**existing.attributes, **entity.attributes},
                        "evidence_chunk_ids": sorted(
                            set(existing.evidence_chunk_ids) | set(entity.evidence_chunk_ids)
                        ),
                    }
                )
            entity = entity.model_copy(update={"entity_id": entity_id})
            self.entities[entity_id] = entity
            upserted.append(entity)
        return upserted

    def upsert_relations(self, relations: list[RelationCandidate]) -> list[RelationCandidate]:
        upserted = []
        for relation in relations:
            relation_id = self._relation_key(relation)
            existing = self.relations.get(relation_id)
            if existing:
                relation = existing.model_copy(
                    update={
                        "confidence_score": max(
                            existing.confidence_score,
                            relation.confidence_score,
                        ),
                        "attributes": {**existing.attributes, **relation.attributes},
                        "rationale": relation.rationale or existing.rationale,
                    }
                )
            relation = relation.model_copy(update={"candidate_id": relation_id})
            self.relations[relation_id] = relation
            upserted.append(relation)
        return upserted

    def upsert_evidence(self, bundle: EvidenceBundle) -> EvidenceBundle:
        evidence_records = []
        link_records = []
        for evidence in bundle.evidence:
            evidence_id = evidence.evidence_id or str(uuid4())
            evidence = evidence.model_copy(update={"evidence_id": evidence_id})
            self.evidence[evidence_id] = evidence
            evidence_records.append(evidence)

        default_evidence_id = evidence_records[0].evidence_id if evidence_records else None
        for link in bundle.links:
            link = link.model_copy(
                update={
                    "evidence_link_id": link.evidence_link_id or str(uuid4()),
                    "evidence_id": link.evidence_id or default_evidence_id,
                }
            )
            self.evidence_links.append(link)
            link_records.append(link)

        return EvidenceBundle(
            evidence=evidence_records,
            links=link_records,
            warnings=bundle.warnings,
        )

    def find_entities(self, query: EntityQuery, auth: AuthContext) -> list[ResolvedEntity]:
        results = [entity for entity in self.entities.values() if entity.domain == query.domain]
        if query.entity_ids:
            allowed_ids = set(query.entity_ids)
            results = [
                entity
                for entity in results
                if (entity.entity_id or entity.normalized_name) in allowed_ids
            ]
        if query.text:
            text = query.text.lower()
            results = [
                entity
                for entity in results
                if text in entity.normalized_name.lower() or text in entity.name.lower()
            ]
        if query.entity_types:
            allowed = set(query.entity_types)
            results = [entity for entity in results if entity.entity_type in allowed]
        results = [entity for entity in results if self._matches_filters(entity.attributes, query.filters)]
        return results[: query.limit]

    def find_relations(self, query: RelationQuery, auth: AuthContext) -> list[RelationCandidate]:
        results = [relation for relation in self.relations.values() if relation.domain == query.domain]
        if query.source_entity_ids:
            allowed = set(query.source_entity_ids)
            results = [relation for relation in results if relation.source_entity_ref in allowed]
        if query.target_entity_ids:
            allowed = set(query.target_entity_ids)
            results = [relation for relation in results if relation.target_entity_ref in allowed]
        if query.relation_types:
            allowed = set(query.relation_types)
            results = [relation for relation in results if relation.relation_type in allowed]
        results = [relation for relation in results if self._matches_filters(relation.attributes, query.filters)]
        return results[: query.limit]

    def get_evidence(self, query: EvidenceQuery, auth: AuthContext) -> list[EvidenceRecord]:
        results = list(self.evidence.values())
        if query.evidence_ids:
            allowed = set(query.evidence_ids)
            results = [evidence for evidence in results if evidence.evidence_id in allowed]
        if query.source_ids:
            allowed = set(query.source_ids)
            results = [evidence for evidence in results if evidence.source_id in allowed]
        if query.target_type or query.target_ids:
            target_ids = set(query.target_ids)
            evidence_ids = {
                link.evidence_id
                for link in self.evidence_links
                if (not query.target_type or link.target_type == query.target_type)
                and (not target_ids or (link.target_id or link.target_ref) in target_ids)
            }
            results = [evidence for evidence in results if evidence.evidence_id in evidence_ids]
        return results[: query.limit]

    def traverse(
        self,
        request: GraphTraversalRequest,
        auth: AuthContext,
    ) -> GraphTraversalResult:
        visited = set(request.seed_entity_ids)
        queue: deque[tuple[str, int, list[str]]] = deque(
            (entity_id, 0, [entity_id]) for entity_id in request.seed_entity_ids
        )
        relations: list[RelationCandidate] = []
        paths: list[dict] = []

        while queue and len(relations) < request.limit:
            current_id, depth, path = queue.popleft()
            if depth >= request.max_depth:
                continue
            adjacent = self._adjacent_relations(current_id, request)
            for relation in adjacent:
                if relation in relations:
                    continue
                relations.append(relation)
                next_ids = self._next_entity_ids(current_id, relation, request.direction)
                for next_id in next_ids:
                    next_path = [*path, relation.candidate_id, next_id]
                    paths.append({"nodes": next_path, "depth": depth + 1})
                    if next_id not in visited:
                        visited.add(next_id)
                        queue.append((next_id, depth + 1, next_path))
                if len(relations) >= request.limit:
                    break

        entities = [
            entity
            for entity_id, entity in self.entities.items()
            if entity_id in visited and entity.domain == request.domain
        ]
        evidence = self._evidence_for_relations(relations) if request.include_evidence else []
        return GraphTraversalResult(
            entities=entities,
            relations=relations,
            evidence=evidence,
            paths=paths,
        )

    def delete_by_source(self, source_id: str, auth: AuthContext) -> GraphDeleteResult:
        before_entities = len(self.entities)
        before_relations = len(self.relations)
        before_evidence = len(self.evidence)

        self.relations = {
            relation_id: relation
            for relation_id, relation in self.relations.items()
            if relation.source_id != source_id
        }
        self.evidence = {
            evidence_id: evidence
            for evidence_id, evidence in self.evidence.items()
            if evidence.source_id != source_id
        }
        valid_evidence_ids = set(self.evidence)
        self.evidence_links = [
            link for link in self.evidence_links if link.evidence_id in valid_evidence_ids
        ]

        relation_refs = {
            relation.source_entity_ref
            for relation in self.relations.values()
        } | {
            relation.target_entity_ref
            for relation in self.relations.values()
        }
        self.entities = {
            entity_id: entity
            for entity_id, entity in self.entities.items()
            if entity_id in relation_refs or source_id not in entity.evidence_chunk_ids
        }
        return GraphDeleteResult(
            deleted_entities=before_entities - len(self.entities),
            deleted_relations=before_relations - len(self.relations),
            deleted_evidence=before_evidence - len(self.evidence),
        )

    @staticmethod
    def _entity_key(entity: ResolvedEntity) -> str:
        return f"{entity.domain}:{entity.entity_type}:{entity.normalized_name}"

    @staticmethod
    def _relation_key(relation: RelationCandidate) -> str:
        return (
            f"{relation.domain}:{relation.relation_type}:"
            f"{relation.source_entity_ref}:{relation.target_entity_ref}"
        )

    @staticmethod
    def _matches_filters(values: dict, filters: dict) -> bool:
        return all(values.get(key) == value for key, value in filters.items())

    def _adjacent_relations(
        self,
        current_id: str,
        request: GraphTraversalRequest,
    ) -> list[RelationCandidate]:
        allowed_types = set(request.relation_types)
        relations = []
        for relation in self.relations.values():
            if relation.domain != request.domain:
                continue
            if allowed_types and relation.relation_type not in allowed_types:
                continue
            outgoing = relation.source_entity_ref == current_id
            incoming = relation.target_entity_ref == current_id
            if request.direction == "OUT" and not outgoing:
                continue
            if request.direction == "IN" and not incoming:
                continue
            if request.direction == "BOTH" and not (outgoing or incoming):
                continue
            relations.append(relation)
        return relations

    @staticmethod
    def _next_entity_ids(
        current_id: str,
        relation: RelationCandidate,
        direction: str,
    ) -> list[str]:
        next_ids = []
        if direction in {"OUT", "BOTH"} and relation.source_entity_ref == current_id:
            next_ids.append(relation.target_entity_ref)
        if direction in {"IN", "BOTH"} and relation.target_entity_ref == current_id:
            next_ids.append(relation.source_entity_ref)
        return next_ids

    def _evidence_for_relations(self, relations: list[RelationCandidate]) -> list[EvidenceRecord]:
        relation_ids = {relation.candidate_id for relation in relations}
        evidence_ids = {
            link.evidence_id
            for link in self.evidence_links
            if link.target_type == "RELATION" and link.target_ref in relation_ids
        }
        return [
            evidence
            for evidence_id, evidence in self.evidence.items()
            if evidence_id in evidence_ids
        ]
