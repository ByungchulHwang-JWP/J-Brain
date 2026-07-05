from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.schemas.intent_discovery import DiscoveryCandidate, DiscoveryRun
from app.schemas.intent_factory import (
    ActionPayload,
    EntityPayload,
    FaqPayload,
    IntentPayload,
    PackValidationQuestionPayload,
    SourceScopePayload,
)


VALID_CANDIDATE_STATUSES = {"pending", "approved", "rejected", "applied"}
VALID_CANDIDATE_TYPES = {"CATEGORY", "INTENT", "ENTITY", "FAQ", "SOURCE_SCOPE", "ACTION"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str, fallback: str = "ITEM") -> str:
    cleaned = re.sub(r"[^0-9a-zA-Z가-힣]+", "_", value.strip())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return (cleaned or fallback).upper()[:48]


def summarize_candidates(candidates: list[DiscoveryCandidate]) -> dict:
    by_type: dict[str, int] = {}
    by_status: dict[str, int] = {}
    for candidate in candidates:
        by_type[candidate.candidate_type] = by_type.get(candidate.candidate_type, 0) + 1
        by_status[candidate.status] = by_status.get(candidate.status, 0) + 1
    return {
        "total": len(candidates),
        "approved": by_status.get("approved", 0) + by_status.get("applied", 0),
        "applied": by_status.get("applied", 0),
        "pending": by_status.get("pending", 0),
        "rejected": by_status.get("rejected", 0),
        "by_type": by_type,
        "by_status": by_status,
    }


def build_latest_run_summary(run: DiscoveryRun, scope: str = "all") -> dict:
    source_ids: list[str] = []
    source_names: list[str] = []
    for candidate in run.candidates:
        payload = candidate.payload or {}
        for source_id in payload.get("source_ids") or []:
            normalized_id = str(source_id)
            if normalized_id and normalized_id not in source_ids:
                source_ids.append(normalized_id)
        for source_name in payload.get("source_names") or []:
            normalized_name = str(source_name)
            if normalized_name and normalized_name not in source_names:
                source_names.append(normalized_name)
    return {
        "run_id": run.run_id,
        "scope": scope,
        "source_count": len(source_ids) or len(source_names),
        "source_ids": source_ids,
        "source_names": source_names,
        "candidate_count": len(run.candidates),
        "created_at": run.created_at,
    }


def summarize_candidates_with_latest_run(
    candidates: list[DiscoveryCandidate],
    latest_run: DiscoveryRun | None = None,
    scope: str = "all",
) -> dict:
    summary = summarize_candidates(candidates)
    if latest_run:
        summary["latest_run"] = build_latest_run_summary(latest_run, scope)
    return summary


def model_to_dict(model) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


def build_approved_candidate_apply_plan(candidates: list[DiscoveryCandidate]) -> dict:
    approved = [candidate for candidate in candidates if candidate.status == "approved"]
    source_scopes_by_intent = {
        candidate.payload.get("intent_id"): candidate.payload
        for candidate in approved
        if candidate.candidate_type == "SOURCE_SCOPE" and candidate.payload.get("intent_id")
    }
    actions: list[ActionPayload] = []
    intents: list[IntentPayload] = []
    entities: list[EntityPayload] = []
    faqs: list[FaqPayload] = []
    skipped = len(candidates) - len(approved)

    for candidate in approved:
        payload = candidate.payload or {}
        if candidate.candidate_type == "ACTION":
            actions.append(
                ActionPayload(
                    action_id=payload["action_id"],
                    action_name=payload.get("action_name") or payload["action_id"],
                    action_type=payload.get("action_type") or "SEARCH_DOC",
                    description=payload.get("description"),
                    execution_mode=payload.get("execution_mode") or "local",
                    route_value=payload.get("route_value"),
                    menu_name=payload.get("menu_name"),
                    api_method=payload.get("api_method"),
                    api_endpoint=payload.get("api_endpoint"),
                    sql_template=payload.get("sql_template"),
                    allowed_roles=payload.get("allowed_roles") or [],
                    status="active",
                )
            )
        elif candidate.candidate_type == "INTENT":
            scope_payload = source_scopes_by_intent.get(payload.get("intent_id"))
            source_scope = None
            if scope_payload:
                source_scope = SourceScopePayload(
                    source_category=scope_payload.get("source_category"),
                    source_status=scope_payload.get("source_status") or "completed",
                    document_types=scope_payload.get("document_types") or [],
                    tags=scope_payload.get("tags") or [],
                    top_k=int(scope_payload.get("top_k") or 5),
                    score_threshold=float(scope_payload.get("score_threshold") or 0.65),
                )
            intents.append(
                IntentPayload(
                    intent_id=payload["intent_id"],
                    intent_name=payload.get("intent_name") or payload["intent_id"],
                    description=payload.get("description"),
                    category=payload.get("category") or "SEARCH_DOC",
                    action_id=payload.get("action_id"),
                    status="active",
                    priority=int(payload.get("priority") or 100),
                    examples=payload.get("examples") or [],
                    source_scope=source_scope,
                )
            )
        elif candidate.candidate_type == "ENTITY":
            entities.append(
                EntityPayload(
                    entity_type=payload["entity_type"],
                    display_name=payload.get("display_name") or payload["entity_type"],
                    value_type=payload.get("value_type") or "string",
                    required_validation=bool(payload.get("required_validation") or False),
                    normalization_rule=payload.get("normalization_rule"),
                    description=payload.get("description"),
                    status="active",
                    synonyms=payload.get("synonyms") or [],
                )
            )
        elif candidate.candidate_type == "FAQ":
            faqs.append(
                FaqPayload(
                    faq_id=payload["faq_id"],
                    question=payload["question"],
                    answer=payload.get("answer") or "답변 후보를 검토해 주세요.",
                    category=payload.get("category"),
                    tags=payload.get("tags") or [],
                    source_id=payload.get("source_id"),
                    action_id=payload.get("action_id") or "SEARCH_DOC",
                    approved_for_pack=True,
                    status="active",
                )
            )

    return {
        "actions": actions,
        "intents": intents,
        "entities": entities,
        "faqs": faqs,
        "source_scopes": list(source_scopes_by_intent.values()),
        "approved": len(approved),
        "skipped": skipped,
    }


def build_validation_question_payloads_from_apply_plan(
    project_id: str,
    plan: dict,
    *,
    pack_id: str | None = None,
    pack_version: str = "0.1-draft",
) -> list[PackValidationQuestionPayload]:
    resolved_pack_id = pack_id or f"{project_id}-db-draft"
    questions: list[PackValidationQuestionPayload] = []
    for intent in plan.get("intents", []):
        if not intent.action_id:
            continue
        example = intent.examples[0] if intent.examples else None
        question = example or f"{project_id} {intent.intent_name} 알려줘"
        questions.append(
            PackValidationQuestionPayload(
                question_id=f"VAL-AUTO-{slugify(intent.intent_id)}",
                question=question,
                expected_intent_id=intent.intent_id,
                expected_action_id=intent.action_id,
                min_confidence_score=0.65,
                pack_id=resolved_pack_id,
                pack_version=pack_version,
                status="active",
            )
        )
    return questions


class AutoDiscoveryService:
    def generate(self, project_id: str, sources: list[dict], faqs: list[dict] | None = None) -> DiscoveryRun:
        run_id = "DISC-%s" % uuid4().hex[:12].upper()
        timestamp = now_iso()
        normalized_sources = sources or []
        normalized_faqs = faqs or []
        source_context = self._source_context(project_id, normalized_sources)
        primary_source = normalized_sources[0] if normalized_sources else {}
        source_id = str(primary_source.get("id") or primary_source.get("source_id") or "")
        source_name = (
            primary_source.get("filename")
            or primary_source.get("file_name")
            or primary_source.get("name")
            or "%s Source" % project_id
        )
        source_text = " ".join(
            str(part or "")
            for source in normalized_sources
            for part in [
                source.get("filename") or source.get("file_name"),
                source.get("description"),
                source.get("content"),
            ]
        )
        keywords = self._extract_keywords(source_text, project_id)
        intent_id = "INTENT_%s_SEARCH_DOC" % slugify(project_id)
        action_id = "ACT_%s_SEARCH_DOC" % slugify(project_id)

        candidates = [
            self._candidate(
                run_id,
                project_id,
                "CATEGORY",
                "문서 검색 카테고리",
                {
                    "category": "SEARCH_DOC",
                    "description": "등록된 Source와 FAQ를 검색하여 답변 근거를 제공하는 기본 카테고리입니다.",
                    **source_context,
                },
                0.82,
                "등록된 지식 자료가 있으므로 SEARCH_DOC 카테고리를 기본 후보로 생성했습니다.",
                timestamp,
            ),
            self._candidate(
                run_id,
                project_id,
                "ACTION",
                "문서 검색 Action",
                {
                    "action_id": action_id,
                    "action_name": "%s 문서 검색" % project_id,
                    "action_type": "SEARCH_DOC",
                    "execution_mode": "local",
                    "description": "폐쇄망 Runtime에서 Source/FAQ를 검색합니다.",
                    **source_context,
                },
                0.8,
                "지식 준비 단계의 기본 실행 방식으로 SEARCH_DOC Action 후보를 생성했습니다.",
                timestamp,
            ),
            self._candidate(
                run_id,
                project_id,
                "INTENT",
                "%s 문서/기능 질의" % project_id,
                {
                    "intent_id": intent_id,
                    "intent_name": "%s 문서/기능 질의" % project_id,
                    "category": "SEARCH_DOC",
                    "action_id": action_id,
                    "examples": self._build_examples(project_id, keywords),
                    "description": "%s 관련 문서와 FAQ에서 답변 근거를 검색합니다." % project_id,
                    **source_context,
                },
                0.76,
                "Source 제목과 설명에서 대표 문서 검색 Intent를 추정했습니다.",
                timestamp,
            ),
            self._candidate(
                run_id,
                project_id,
                "SOURCE_SCOPE",
                "%s 검색 범위" % project_id,
                {
                    "intent_id": intent_id,
                    "source_category": project_id,
                    "source_ids": [str(source.get("id")) for source in normalized_sources if source.get("id")],
                    "source_status": "completed",
                    "top_k": 5,
                    "score_threshold": 0.65,
                    **source_context,
                },
                0.78,
                "현재 프로젝트 Source를 검색 범위 후보로 연결했습니다.",
                timestamp,
            ),
            self._candidate(
                run_id,
                project_id,
                "ENTITY",
                "핵심 업무 용어",
                {
                    "entity_type": "%s_TERM" % slugify(project_id),
                    "display_name": "%s 핵심 용어" % project_id,
                    "value_type": "string",
                    "synonyms": [{"canonical_value": keyword, "synonyms": [keyword], "code": slugify(keyword)} for keyword in keywords[:5]],
                    **source_context,
                },
                0.68,
                "Source 텍스트에서 반복 가능성이 높은 업무 용어를 추출했습니다.",
                timestamp,
            ),
            self._candidate(
                run_id,
                project_id,
                "FAQ",
                "%s 대표 FAQ" % project_id,
                {**self._build_faq_payload(project_id, source_id, source_name, normalized_faqs), **source_context},
                0.7,
                "기존 FAQ 또는 Source 제목을 기준으로 대표 FAQ 후보를 생성했습니다.",
                timestamp,
            ),
        ]
        run = DiscoveryRun(
            run_id=run_id,
            project_id=project_id,
            status="completed",
            summary={},
            candidates=candidates,
            created_at=timestamp,
            updated_at=timestamp,
        )
        run.summary = summarize_candidates_with_latest_run(candidates, run, "all")
        return run

    def _source_context(self, project_id: str, sources: list[dict]) -> dict:
        source_ids: list[str] = []
        source_names: list[str] = []
        for index, source in enumerate(sources):
            source_id = str(source.get("id") or source.get("source_id") or "")
            source_name = (
                source.get("filename")
                or source.get("file_name")
                or source.get("name")
                or "%s Source %s" % (project_id, index + 1)
            )
            if source_id and source_id not in source_ids:
                source_ids.append(source_id)
            if source_name and source_name not in source_names:
                source_names.append(str(source_name))
        return {"source_ids": source_ids, "source_names": source_names}

    def _candidate(
        self,
        run_id: str,
        project_id: str,
        candidate_type: str,
        title: str,
        payload: dict,
        confidence_score: float,
        reason: str,
        timestamp: str,
    ) -> DiscoveryCandidate:
        return DiscoveryCandidate(
            candidate_id="CAND-%s" % uuid4().hex[:12].upper(),
            run_id=run_id,
            project_id=project_id,
            candidate_type=candidate_type,
            title=title,
            payload=payload,
            confidence_score=confidence_score,
            reason=reason,
            status="pending",
            created_at=timestamp,
            updated_at=timestamp,
        )

    def _extract_keywords(self, text: str, project_id: str) -> list[str]:
        tokens = re.findall(r"[0-9a-zA-Z가-힣]{2,}", text)
        stopwords = {"txt", "pdf", "docx", "manual", "source", "관리", "기능", "문서", "사용", "방법"}
        ordered: list[str] = []
        for token in [project_id, *tokens]:
            normalized = token.strip("_- ")
            if not normalized or normalized.lower() in stopwords:
                continue
            if normalized not in ordered:
                ordered.append(normalized)
        return ordered[:8] or [project_id]

    def _build_examples(self, project_id: str, keywords: list[str]) -> list[str]:
        first_keyword = keywords[0] if keywords else project_id
        return [
            "%s 주요 기능 알려줘" % project_id,
            "%s 사용 방법 알려줘" % first_keyword,
            "%s 문서에서 관련 내용 찾아줘" % project_id,
        ]

    def _build_faq_payload(self, project_id: str, source_id: str, source_name: str, faqs: list[dict]) -> dict:
        if faqs:
            faq = faqs[0]
            return {
                "faq_id": "FAQ_%s_AUTO" % slugify(project_id),
                "question": faq.get("question") or "%s에서 자주 묻는 질문은 무엇인가요?" % project_id,
                "answer": faq.get("answer") or "등록된 FAQ 원천을 기준으로 답변 후보를 검토해 주세요.",
                "category": faq.get("category") or "자동 생성 후보",
                "tags": faq.get("tags") or ["auto-discovery"],
                "source_id": faq.get("source_id") or source_id or None,
                "action_id": "SEARCH_DOC",
            }
        return {
            "faq_id": "FAQ_%s_OVERVIEW" % slugify(project_id),
            "question": "%s의 주요 내용은 무엇인가요?" % project_id,
            "answer": "%s 문서를 기준으로 주요 기능과 운영 절차를 안내합니다." % source_name,
            "category": "자동 생성 후보",
            "tags": ["auto-discovery", project_id],
            "source_id": source_id or None,
            "action_id": "SEARCH_DOC",
        }


class MockCandidateStore:
    def __init__(self, root: Path):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def save_run(self, run: DiscoveryRun) -> DiscoveryRun:
        run.summary = summarize_candidates_with_latest_run(run.candidates, run, "all")
        self._write_project_runs(run.project_id, [model_to_dict(run)])
        return run

    def save_incremental_run(self, run: DiscoveryRun) -> DiscoveryRun:
        runs = self.list_runs(run.project_id)
        if not runs:
            return self.save_run(run)

        latest_run_summary = build_latest_run_summary(run, "new")
        candidates = self.list_candidates(run.project_id)
        by_key = {self._candidate_key(candidate): candidate for candidate in candidates}

        for candidate in run.candidates:
            key = self._candidate_key(candidate)
            existing = by_key.get(key)
            if existing is None or existing.status == "applied":
                candidates.append(candidate)
                by_key[key] = candidate
                continue
            self._merge_candidate(existing, candidate)

        run.candidates = candidates
        run.summary = summarize_candidates(candidates)
        run.summary["latest_run"] = latest_run_summary
        self._write_project_runs(run.project_id, [model_to_dict(run)])
        return run

    def list_runs(self, project_id: str) -> list[DiscoveryRun]:
        path = self._project_file(project_id)
        if not path.exists():
            return []
        with path.open("r", encoding="utf-8") as fp:
            raw = json.load(fp)
        return [DiscoveryRun(**item) for item in raw.get("runs", [])]

    def latest_run(self, project_id: str) -> DiscoveryRun | None:
        runs = self.list_runs(project_id)
        return runs[-1] if runs else None

    def list_candidates(self, project_id: str) -> list[DiscoveryCandidate]:
        candidates: list[DiscoveryCandidate] = []
        for run in self.list_runs(project_id):
            candidates.extend(run.candidates)
        return candidates

    def analyzed_source_ids(self, project_id: str) -> set[str]:
        source_ids: set[str] = set()
        for candidate in self.list_candidates(project_id):
            if candidate.candidate_type != "SOURCE_SCOPE":
                continue
            for source_id in candidate.payload.get("source_ids") or []:
                if source_id:
                    source_ids.add(str(source_id))
        return source_ids

    def update_candidate_status(self, project_id: str, candidate_id: str, status: str) -> DiscoveryCandidate:
        if status not in VALID_CANDIDATE_STATUSES:
            raise ValueError("지원하지 않는 후보 상태입니다.")
        runs = self.list_runs(project_id)
        updated_candidate = None
        timestamp = now_iso()
        for run in runs:
            for candidate in run.candidates:
                if candidate.candidate_id == candidate_id:
                    candidate.status = status
                    candidate.updated_at = timestamp
                    updated_candidate = candidate
            run.summary = summarize_candidates_with_latest_run(run.candidates, run, run.summary.get("latest_run", {}).get("scope", "all"))
            run.updated_at = timestamp
        if updated_candidate is None:
            raise KeyError(candidate_id)
        self._write_project_runs(project_id, [model_to_dict(run) for run in runs])
        return updated_candidate

    def summary(self, project_id: str) -> dict:
        latest_run = self.latest_run(project_id)
        return summarize_candidates_with_latest_run(
            self.list_candidates(project_id),
            latest_run,
            latest_run.summary.get("latest_run", {}).get("scope", "all") if latest_run else "all",
        )

    def _project_file(self, project_id: str) -> Path:
        safe_project_id = re.sub(r"[^0-9a-zA-Z가-힣_.-]+", "_", project_id)
        return self.root / ("%s.json" % safe_project_id)

    def _write_project_runs(self, project_id: str, runs: list[dict]) -> None:
        with self._project_file(project_id).open("w", encoding="utf-8") as fp:
            json.dump({"project_id": project_id, "runs": runs}, fp, ensure_ascii=False, indent=2)

    def _candidate_key(self, candidate: DiscoveryCandidate) -> tuple:
        payload = candidate.payload or {}
        candidate_type = candidate.candidate_type
        if candidate_type == "CATEGORY":
            return (candidate_type, payload.get("category") or candidate.title)
        if candidate_type == "ACTION":
            return (candidate_type, payload.get("action_id") or candidate.title)
        if candidate_type == "INTENT":
            return (candidate_type, payload.get("intent_id") or candidate.title)
        if candidate_type == "SOURCE_SCOPE":
            return (
                candidate_type,
                payload.get("intent_id") or "",
                payload.get("source_category") or "",
            )
        if candidate_type == "ENTITY":
            return (candidate_type, payload.get("entity_type") or candidate.title)
        if candidate_type == "FAQ":
            return (candidate_type, payload.get("faq_id") or candidate.title)
        return (candidate_type, candidate.title)

    def _merge_candidate(self, existing: DiscoveryCandidate, incoming: DiscoveryCandidate) -> None:
        changed = False
        for key in ("source_ids", "source_names"):
            existing_values = [str(value) for value in existing.payload.get(key) or []]
            for value in incoming.payload.get(key) or []:
                normalized_value = str(value)
                if normalized_value and normalized_value not in existing_values:
                    existing_values.append(normalized_value)
                    changed = True
            existing.payload[key] = existing_values
        if existing.candidate_type == "SOURCE_SCOPE":
            for key in ("source_status", "top_k", "score_threshold"):
                if incoming.payload.get(key) is not None:
                    existing.payload[key] = incoming.payload.get(key)
        if changed and existing.status != "pending":
            existing.status = "pending"
        existing.updated_at = incoming.updated_at


def default_candidate_store() -> MockCandidateStore:
    root = Path(__file__).resolve().parents[2] / "app_data" / "discovery_candidates"
    return MockCandidateStore(root)
