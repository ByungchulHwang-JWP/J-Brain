from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.schemas.llm_discovery import LLMDiscoveryOutput
from app.core.config import settings


import logging
import hashlib
import json
import re
import time
import random
from typing import Any
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
    SynonymPayload,
)


VALID_CANDIDATE_STATUSES = {"pending", "approved", "rejected", "applied"}
VALID_CANDIDATE_TYPES = {"CATEGORY", "INTENT", "ENTITY", "FAQ", "SOURCE_SCOPE", "ACTION"}
MIN_DISCOVERY_INTENTS = 8
MIN_DISCOVERY_ENTITIES = 8
MIN_DISCOVERY_FAQS = 8
MAX_DISCOVERY_INPUT_CHARS = 60000

logger = logging.getLogger(__name__)


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


def build_approved_candidate_apply_plan(project_id: str, candidates: list[DiscoveryCandidate]) -> dict:
    approved = [candidate for candidate in candidates if candidate.status == "approved"]
    source_scopes_by_intent = {
        candidate.payload.get("intent_id"): candidate.payload
        for candidate in approved
        if candidate.candidate_type == "SOURCE_SCOPE" and candidate.payload.get("intent_id")
    }
    actions: list[ActionPayload] = []
    intents: list[IntentPayload] = []
    entities_by_type: dict[str, EntityPayload] = {}
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
            entity_type = payload["entity_type"]
            existing = entities_by_type.get(entity_type)
            incoming_synonyms = payload.get("synonyms") or []
            if existing is None:
                entities_by_type[entity_type] = EntityPayload(
                    entity_type=entity_type,
                    display_name=payload.get("display_name") or entity_type,
                    value_type=payload.get("value_type") or "string",
                    required_validation=bool(payload.get("required_validation") or False),
                    normalization_rule=payload.get("normalization_rule"),
                    description=payload.get("description"),
                    status="active",
                    synonyms=incoming_synonyms,
                )
            else:
                seen_canonical_values = {synonym.canonical_value for synonym in existing.synonyms}
                for synonym in incoming_synonyms:
                    canonical_value = synonym.get("canonical_value") if isinstance(synonym, dict) else synonym.canonical_value
                    if canonical_value not in seen_canonical_values:
                        existing.synonyms.append(SynonymPayload(**synonym) if isinstance(synonym, dict) else synonym)
                        seen_canonical_values.add(canonical_value)
                existing.required_validation = existing.required_validation or bool(payload.get("required_validation") or False)
                existing.description = existing.description or payload.get("description")
                existing.normalization_rule = existing.normalization_rule or payload.get("normalization_rule")
        elif candidate.candidate_type == "FAQ":
            faqs.append(
                FaqPayload(
                    faq_id=payload.get("faq_id") or f"FAQ-{project_id.upper()}-{int(time.time())}-{random.randint(100, 999)}",
                    question=payload.get("question", "질문 없음"),
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
        "entities": list(entities_by_type.values()),
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
    async def generate(self, project_id: str, sources: list[dict], faqs: list[dict] | None = None) -> DiscoveryRun:
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
        source_text = self._build_source_text(normalized_sources)
        keywords = self._extract_keywords(source_text, project_id)
        source_signals = self._extract_source_signals(source_text, project_id)
        intent_id = "INTENT_%s_SEARCH_DOC" % slugify(project_id)
        action_id = "ACT_%s_SEARCH_DOC" % slugify(project_id)
        candidates = self._base_candidates(
            run_id,
            project_id,
            intent_id,
            action_id,
            source_context,
            normalized_sources,
            timestamp,
        )

        try:
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=settings.OPENAI_API_KEY)
            structured_llm = llm.with_structured_output(LLMDiscoveryOutput)
            prompt = ChatPromptTemplate.from_messages([
                (
                    "system",
                    "You analyze enterprise manuals for chatbot intent-pack design. "
                    "Extract deterministic Korean candidates based only on the provided text. "
                    "Return 8-12 intents, 8-12 entities, and 8-12 FAQs when the source contains enough material. "
                    "Each intent must include 3-5 realistic user example utterances. "
                    "Prefer concrete workflow/menu/domain terms over generic words.",
                ),
                (
                    "human",
                    "Project ID: {project_id}\n"
                    "Analyze all source sections below and extract chatbot knowledge candidates.\n\n{text}",
                ),
            ])
            chain = prompt | structured_llm
            llm_result = await chain.ainvoke({"project_id": project_id, "text": source_text})
        except Exception as e:
            logger.warning("LLM Extraction failed for project %s: %s", project_id, e)
            llm_result = LLMDiscoveryOutput(intents=[], entities=[], faqs=[])

        candidates.extend(
            self._llm_candidates(
                run_id,
                project_id,
                intent_id,
                action_id,
                source_context,
                source_id,
                source_name,
                llm_result,
                timestamp,
            )
        )
        candidates = self._ensure_minimum_candidates(
            run_id,
            project_id,
            action_id,
            source_context,
            source_id,
            source_name,
            normalized_faqs,
            keywords,
            source_signals,
            candidates,
            timestamp,
        )

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

    def _build_source_text(self, sources: list[dict]) -> str:
        sections: list[str] = []
        if not sources:
            return ""
        per_source_budget = max(MAX_DISCOVERY_INPUT_CHARS // max(len(sources), 1), 8000)
        for index, source in enumerate(sources, start=1):
            source_name = source.get("filename") or source.get("file_name") or source.get("name") or f"Source {index}"
            body = "\n".join(
                str(part or "")
                for part in [source.get("description"), source.get("content")]
                if part
            )
            section = f"[Source {index}] {source_name}\n{body}"[:per_source_budget]
            sections.append(section)
        return "\n\n".join(sections)[:MAX_DISCOVERY_INPUT_CHARS]

    def _base_candidates(
        self,
        run_id: str,
        project_id: str,
        intent_id: str,
        action_id: str,
        source_context: dict,
        sources: list[dict],
        timestamp: str,
    ) -> list[DiscoveryCandidate]:
        return [
            self._candidate(
                run_id, project_id, "CATEGORY", "문서 검색 카테고리",
                {"category": "SEARCH_DOC", "description": "기본 카테고리", **source_context},
                0.9, "기본 카테고리", timestamp,
            ),
            self._candidate(
                run_id, project_id, "ACTION", "문서 검색 Action",
                {"action_id": action_id, "action_name": f"{project_id} 검색", "action_type": "SEARCH_DOC", "execution_mode": "local", **source_context},
                0.9, "기본 Action", timestamp,
            ),
            self._candidate(
                run_id, project_id, "SOURCE_SCOPE", "검색 범위",
                {
                    "intent_id": intent_id,
                    "source_category": project_id,
                    "source_ids": [str(source.get("id")) for source in sources if source.get("id")],
                    "source_status": "completed",
                    "top_k": 5,
                    "score_threshold": 0.65,
                    **source_context,
                },
                0.9, "기본 검색 범위", timestamp,
            ),
        ]

    def _llm_candidates(
        self,
        run_id: str,
        project_id: str,
        intent_id: str,
        action_id: str,
        source_context: dict,
        source_id: str,
        source_name: str,
        llm_result: LLMDiscoveryOutput,
        timestamp: str,
    ) -> list[DiscoveryCandidate]:
        candidates: list[DiscoveryCandidate] = []
        for index, intent in enumerate(llm_result.intents, start=1):
            resolved_intent_id = f"{intent_id}_{index:02d}_{slugify(intent.intent_name, 'INTENT')[:24]}"
            candidates.append(
                self._candidate(
                    run_id, project_id, "INTENT", intent.intent_name,
                    {
                        "intent_id": resolved_intent_id,
                        "intent_name": intent.intent_name,
                        "category": "SEARCH_DOC",
                        "action_id": action_id,
                        "examples": intent.examples[:5],
                        "description": intent.description,
                        **source_context,
                    },
                    0.85, "LLM 추출", timestamp,
                )
            )
        for entity in llm_result.entities:
            candidates.append(
                self._candidate(
                    run_id, project_id, "ENTITY", entity.display_name,
                    {
                        "entity_type": slugify(entity.entity_type, "ENTITY"),
                        "display_name": entity.display_name,
                        "value_type": "string",
                        "synonyms": [
                            {
                                "canonical_value": entity.canonical_value,
                                "synonyms": entity.synonyms[:10],
                                "code": slugify(entity.canonical_value),
                            }
                        ],
                        **source_context,
                    },
                    0.85, "LLM 추출", timestamp,
                )
            )
        for faq in llm_result.faqs:
            candidates.append(
                self._candidate(
                    run_id, project_id, "FAQ", faq.question,
                    {"question": faq.question, "answer": faq.answer, "source_id": source_id, "source_name": source_name, **source_context},
                    0.85, "LLM 추출", timestamp,
                )
            )
        return candidates

    def _ensure_minimum_candidates(
        self,
        run_id: str,
        project_id: str,
        action_id: str,
        source_context: dict,
        source_id: str,
        source_name: str,
        faqs: list[dict],
        keywords: list[str],
        source_signals: dict[str, list[str]],
        candidates: list[DiscoveryCandidate],
        timestamp: str,
    ) -> list[DiscoveryCandidate]:
        result = list(candidates)
        existing_keys = {self._candidate_identity(candidate.candidate_type, candidate.title, candidate.payload) for candidate in result}

        def add(candidate: DiscoveryCandidate) -> None:
            key = self._candidate_identity(candidate.candidate_type, candidate.title, candidate.payload)
            if key not in existing_keys:
                result.append(candidate)
                existing_keys.add(key)

        for payload in self._fallback_intent_payloads(project_id, action_id, keywords, source_signals, source_context):
            if len([item for item in result if item.candidate_type == "INTENT"]) >= MIN_DISCOVERY_INTENTS:
                break
            add(self._candidate(run_id, project_id, "INTENT", payload["intent_name"], payload, 0.7, "규칙 기반 보강", timestamp))
        for payload in self._fallback_entity_payloads(project_id, keywords, source_signals, source_context):
            if len([item for item in result if item.candidate_type == "ENTITY"]) >= MIN_DISCOVERY_ENTITIES:
                break
            add(self._candidate(run_id, project_id, "ENTITY", payload["display_name"], payload, 0.7, "규칙 기반 보강", timestamp))
        for payload in self._fallback_faq_payloads(project_id, source_id, source_name, faqs, keywords, source_signals, source_context):
            if len([item for item in result if item.candidate_type == "FAQ"]) >= MIN_DISCOVERY_FAQS:
                break
            add(self._candidate(run_id, project_id, "FAQ", payload["question"], payload, 0.7, "규칙 기반 보강", timestamp))
        return result

    def _fallback_intent_payloads(
        self,
        project_id: str,
        action_id: str,
        keywords: list[str],
        source_signals: dict[str, list[str]],
        source_context: dict,
    ) -> list[dict]:
        first_keyword = keywords[0] if keywords else project_id
        templates = [
            *[
                (
                    f"HEADING_{index:02d}",
                    f"{heading} 안내",
                    f"Source의 '{heading}' 섹션을 기준으로 관련 업무 절차와 사용 방법을 안내합니다.",
                )
                for index, heading in enumerate(source_signals.get("headings", [])[:8], start=1)
            ],
            ("OVERVIEW", f"{project_id} 개요 안내", f"{project_id}의 주요 기능과 사용 목적을 안내합니다."),
            ("SOURCE", "Source 등록 및 관리", "문서 Source 등록, 분석, 벡터화 상태 확인 절차를 안내합니다."),
            ("SEARCH", "문서 검색 및 테스트", "등록된 Source를 기준으로 검색 테스트와 검색 결과 확인을 지원합니다."),
            ("INTENT", "Intent 설계 및 등록", "사용자 질문 의도를 Intent와 예시 질문으로 설계하는 절차를 안내합니다."),
            ("TERM", "Entity/Synonym 용어 사전 관리", "업무 용어와 동의어를 표준화해 Entity 추출 품질을 높입니다."),
            ("ACTION", "Action 연결 관리", "Intent와 화면 이동, 문서 검색, 조회 Action 연결을 안내합니다."),
            ("PACK", "Pack 검증 및 Build", "검증 질문 실행, Pack Build, 배포 준비 절차를 안내합니다."),
            ("ROLE", "사용자 역할 및 권한 안내", "관리자와 설계자 등 사용자 역할별 주요 업무를 안내합니다."),
        ]
        payloads = []
        for index, (code, name, description) in enumerate(templates, start=1):
            intent_id = f"INTENT_{slugify(project_id)}_{code}"
            payloads.append(
                {
                    "intent_id": intent_id,
                    "intent_name": name,
                    "category": "SEARCH_DOC",
                    "action_id": action_id,
                    "description": description,
                    "priority": 100 + index,
                    "examples": [
                        f"{name} 알려줘",
                        f"{first_keyword}에서 {name} 어떻게 하나요?",
                        f"{project_id} {name} 절차 설명해줘",
                    ],
                    **source_context,
                }
            )
        return payloads

    def _fallback_entity_payloads(
        self,
        project_id: str,
        keywords: list[str],
        source_signals: dict[str, list[str]],
        source_context: dict,
    ) -> list[dict]:
        keyword = keywords[0] if keywords else project_id
        templates = [
            *[(f"TERM_{index:02d}", term, [term]) for index, term in enumerate(source_signals.get("terms", [])[:8], start=1)],
            ("PROJECT", project_id, [project_id, f"{project_id} 프로젝트"]),
            ("SOURCE", "Source", ["문서", "자료", "업로드 파일"]),
            ("INTENT", "Intent", ["의도", "질문 의도", "Intent 구조"]),
            ("ENTITY", "Entity", ["용어", "파라미터", "업무 용어"]),
            ("ACTION", "Action", ["실행", "화면 이동", "검색 Action"]),
            ("PACK", "Pack", ["Intent Pack", "배포 패키지", "검증 Pack"]),
            ("USER_ROLE", "사용자 역할", ["System Admin", "관리자", "Intent 설계자"]),
            ("KEYWORD", keyword, [keyword]),
        ]
        return [
            {
                "entity_type": entity_type,
                "display_name": display_name,
                "value_type": "string",
                "synonyms": [
                    {
                        "canonical_value": display_name,
                        "synonyms": synonyms,
                        "code": slugify(display_name),
                    }
                ],
                **source_context,
            }
            for entity_type, display_name, synonyms in templates
        ]

    def _fallback_faq_payloads(
        self,
        project_id: str,
        source_id: str,
        source_name: str,
        faqs: list[dict],
        keywords: list[str],
        source_signals: dict[str, list[str]],
        source_context: dict,
    ) -> list[dict]:
        keyword = keywords[0] if keywords else project_id
        payloads: list[dict] = []
        for faq in faqs[:5]:
            payloads.append(
                {
                    "faq_id": faq.get("faq_id") or f"FAQ_{slugify(project_id)}_{slugify(faq.get('question') or 'AUTO')}",
                    "question": faq.get("question") or f"{project_id}에서 자주 묻는 질문은 무엇인가요?",
                    "answer": faq.get("answer") or "등록된 FAQ 원천을 기준으로 답변 후보를 검토해 주세요.",
                    "category": faq.get("category") or "자동 생성 후보",
                    "tags": faq.get("tags") or ["auto-discovery"],
                    "source_id": faq.get("source_id") or source_id or None,
                    "action_id": faq.get("action_id") or "SEARCH_DOC",
                    **source_context,
                }
            )
        templates = [
            *[(question, "Source 원문 질문을 기준으로 답변 후보를 검토해 주세요.") for question in source_signals.get("questions", [])[:8]],
            (f"{project_id}의 주요 기능은 무엇인가요?", f"{project_id} 문서를 기준으로 주요 기능과 운영 절차를 안내합니다."),
            ("Source는 어떻게 등록하나요?", "Source 관리 화면에서 문서를 업로드하고 벡터화 상태를 확인합니다."),
            ("Intent는 어떻게 설계하나요?", "사용자 질문 의도를 Intent로 정의하고 대표 질문을 함께 등록합니다."),
            ("질문 커버리지는 어떻게 보강하나요?", "Intent별 예시 질문, 구어체 표현, 표기 변형을 추가해 커버리지를 높입니다."),
            ("용어 사전은 왜 필요한가요?", "Entity와 Synonym을 표준화해 사용자 표현을 정확한 값으로 매칭하기 위해 필요합니다."),
            ("Pack 검증은 어떻게 진행하나요?", "검증 질문을 실행해 기대 Intent와 Action이 맞는지 확인합니다."),
            ("Action 연결은 무엇을 확인해야 하나요?", "Intent가 실행할 검색, 화면 이동, 조회 Action이 올바르게 연결됐는지 확인합니다."),
            (f"{keyword} 관련 내용은 어디서 확인하나요?", "등록된 Source 검색과 FAQ 근거를 통해 관련 내용을 확인합니다."),
        ]
        for index, (question, answer) in enumerate(templates, start=1):
            payloads.append(
                {
                    "faq_id": f"FAQ_{slugify(project_id)}_AUTO_{index:02d}",
                    "question": question,
                    "answer": answer,
                    "category": "자동 생성 후보",
                    "tags": ["auto-discovery", project_id],
                    "source_id": source_id or None,
                    "action_id": "SEARCH_DOC",
                    **source_context,
                }
            )
        return payloads

    def _extract_source_signals(self, text: str, project_id: str) -> dict[str, list[str]]:
        headings: list[str] = []
        questions: list[str] = []
        terms: list[str] = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            heading_match = re.match(r"^(?:#{1,6}\s*|\d+(?:\.\d+)*[.)]\s+)(.+)$", line)
            if heading_match:
                heading = re.sub(r"\s+", " ", heading_match.group(1).strip(" -:"))
                if 2 <= len(heading) <= 60 and heading not in headings:
                    headings.append(heading)
            if "?" in line or line.endswith(("나요", "까요", "습니까")):
                question = re.sub(r"\s+", " ", line.strip())
                if 5 <= len(question) <= 120 and question not in questions:
                    questions.append(question)
            for token in re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}|[가-힣][가-힣A-Za-z0-9_-]{2,}", line):
                normalized = token.strip("_- ")
                if normalized.lower() in {"source", "intent", "entity", "action", "pack"}:
                    continue
                if normalized and normalized not in terms and normalized != project_id:
                    terms.append(normalized)
        return {
            "headings": headings[:20],
            "questions": questions[:20],
            "terms": terms[:30],
        }

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
        candidate_identity = self._candidate_identity(candidate_type, title, payload)
        digest = hashlib.sha1(f"{project_id}|{candidate_identity}".encode("utf-8")).hexdigest()[:12].upper()
        return DiscoveryCandidate(
            candidate_id="CAND-%s" % digest,
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

    def _candidate_identity(self, candidate_type: str, title: str, payload: dict) -> str:
        if candidate_type == "CATEGORY":
            key = payload.get("category") or title
        elif candidate_type == "ACTION":
            key = payload.get("action_id") or title
        elif candidate_type == "INTENT":
            key = payload.get("intent_id") or payload.get("intent_name") or title
        elif candidate_type == "SOURCE_SCOPE":
            key = "%s|%s" % (payload.get("intent_id") or "", payload.get("source_category") or "")
        elif candidate_type == "ENTITY":
            key = payload.get("entity_type") or title
        elif candidate_type == "FAQ":
            key = payload.get("faq_id") or payload.get("question") or title
        else:
            key = title
        return f"{candidate_type}|{key}"

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
        for key in ("examples", "tags"):
            if self._merge_scalar_list(existing.payload, incoming.payload, key):
                changed = True
        if existing.candidate_type == "ENTITY":
            if self._merge_synonym_list(existing.payload, incoming.payload):
                changed = True
        for key in ("description", "answer", "question", "intent_name", "display_name"):
            incoming_value = incoming.payload.get(key)
            existing_value = existing.payload.get(key)
            if incoming_value and (not existing_value or len(str(incoming_value)) > len(str(existing_value))):
                existing.payload[key] = incoming_value
                changed = True
        if existing.candidate_type == "SOURCE_SCOPE":
            for key in ("source_status", "top_k", "score_threshold"):
                if incoming.payload.get(key) is not None:
                    existing.payload[key] = incoming.payload.get(key)
                    changed = True
        if incoming.confidence_score > existing.confidence_score:
            existing.confidence_score = incoming.confidence_score
            changed = True
        if changed and existing.status != "pending":
            existing.status = "pending"
        existing.updated_at = incoming.updated_at

    def _merge_scalar_list(self, existing_payload: dict, incoming_payload: dict, key: str) -> bool:
        changed = False
        values = list(existing_payload.get(key) or [])
        for value in incoming_payload.get(key) or []:
            if value and value not in values:
                values.append(value)
                changed = True
        if changed:
            existing_payload[key] = values
        return changed

    def _merge_synonym_list(self, existing_payload: dict, incoming_payload: dict) -> bool:
        changed = False
        values = list(existing_payload.get("synonyms") or [])
        by_canonical = {
            item.get("canonical_value"): item
            for item in values
            if isinstance(item, dict) and item.get("canonical_value")
        }
        for incoming in incoming_payload.get("synonyms") or []:
            if not isinstance(incoming, dict):
                continue
            canonical = incoming.get("canonical_value")
            if not canonical:
                continue
            existing = by_canonical.get(canonical)
            if existing is None:
                values.append(incoming)
                by_canonical[canonical] = incoming
                changed = True
                continue
            existing_synonyms = list(existing.get("synonyms") or [])
            for synonym in incoming.get("synonyms") or []:
                if synonym and synonym not in existing_synonyms:
                    existing_synonyms.append(synonym)
                    changed = True
            existing["synonyms"] = existing_synonyms
            if incoming.get("code") and not existing.get("code"):
                existing["code"] = incoming["code"]
                changed = True
        if changed:
            existing_payload["synonyms"] = values
        return changed


def default_candidate_store() -> MockCandidateStore:
    root = Path(__file__).resolve().parents[2] / "app_data" / "discovery_candidates"
    return MockCandidateStore(root)
