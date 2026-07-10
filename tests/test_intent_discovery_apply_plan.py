import sys
from pathlib import Path

import pytest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.schemas.intent_discovery import DiscoveryCandidate, DiscoveryRun
from app.services.intent_discovery_service import AutoDiscoveryService, MockCandidateStore, build_approved_candidate_apply_plan


def candidate(candidate_type, payload, candidate_id):
    return DiscoveryCandidate(
        candidate_id=candidate_id,
        run_id="RUN-1",
        project_id="J-Brain",
        candidate_type=candidate_type,
        title=payload.get("intent_name") or payload.get("display_name") or payload.get("question") or candidate_type,
        payload=payload,
        confidence_score=0.85,
        reason="test",
        status="approved",
        created_at="2026-07-10T00:00:00+00:00",
        updated_at="2026-07-10T00:00:00+00:00",
    )


def run_with_candidates(candidates):
    return DiscoveryRun(
        run_id="RUN-1",
        project_id="J-Brain",
        status="completed",
        summary={},
        candidates=candidates,
        created_at="2026-07-10T00:00:00+00:00",
        updated_at="2026-07-10T00:00:00+00:00",
    )


def test_apply_plan_generates_faq_id_when_discovery_faq_has_no_id():
    plan = build_approved_candidate_apply_plan(
        "J-Brain",
        [
            candidate(
                "FAQ",
                {"question": "FAQ는 어떻게 등록하나요?", "answer": "FAQ 메뉴에서 등록합니다."},
                "CAND-FAQ-1",
            )
        ],
    )

    assert len(plan["faqs"]) == 1
    assert plan["faqs"][0].faq_id.startswith("FAQ-J-BRAIN-")


def test_apply_plan_merges_entity_candidates_with_same_type():
    plan = build_approved_candidate_apply_plan(
        "J-Brain",
        [
            candidate(
                "ENTITY",
                {
                    "entity_type": "USER_ROLE",
                    "display_name": "시스템 관리자",
                    "synonyms": [
                        {"canonical_value": "System Admin", "synonyms": ["관리자"], "code": "SYSTEM_ADMIN"}
                    ],
                },
                "CAND-ENT-1",
            ),
            candidate(
                "ENTITY",
                {
                    "entity_type": "USER_ROLE",
                    "display_name": "구축 PM",
                    "synonyms": [
                        {"canonical_value": "Project Manager", "synonyms": ["PM"], "code": "PROJECT_MANAGER"}
                    ],
                },
                "CAND-ENT-2",
            ),
        ],
    )

    assert len(plan["entities"]) == 1
    assert plan["entities"][0].entity_type == "USER_ROLE"
    assert {item.canonical_value for item in plan["entities"][0].synonyms} == {
        "System Admin",
        "Project Manager",
    }


@pytest.mark.anyio
async def test_auto_discovery_fallback_generates_enough_candidates_when_llm_unavailable(monkeypatch):
    def unavailable_llm(*args, **kwargs):
        raise RuntimeError("LLM unavailable")

    monkeypatch.setattr("app.services.intent_discovery_service.ChatOpenAI", unavailable_llm)

    run = await AutoDiscoveryService().generate(
        "J-Brain",
        [
            {
                "id": "SRC-1",
                "filename": "J-Brain_Manual.txt",
                "description": "챗봇 구축, Source 관리, Intent 설계, Entity 사전, Pack 검증 운영 매뉴얼",
                "content": "프로젝트 선택 Source 등록 벡터화 검색 테스트 Intent 등록 질문 커버리지 용어 사전 Action 연결 Pack Build",
            }
        ],
    )

    by_type = run.summary["by_type"]
    assert by_type["INTENT"] >= 8
    assert by_type["ENTITY"] >= 8
    assert by_type["FAQ"] >= 8


@pytest.mark.anyio
async def test_auto_discovery_fallback_uses_stable_candidate_ids(monkeypatch):
    def unavailable_llm(*args, **kwargs):
        raise RuntimeError("LLM unavailable")

    monkeypatch.setattr("app.services.intent_discovery_service.ChatOpenAI", unavailable_llm)

    sources = [
        {
            "id": "SRC-1",
            "filename": "J-Brain_Manual.txt",
            "content": "프로젝트 선택 Source 등록 벡터화 검색 테스트 Intent 등록 질문 커버리지 용어 사전 Action 연결 Pack Build",
        }
    ]

    first = await AutoDiscoveryService().generate("J-Brain", sources)
    second = await AutoDiscoveryService().generate("J-Brain", sources)

    assert [candidate.candidate_id for candidate in first.candidates] == [
        candidate.candidate_id for candidate in second.candidates
    ]


@pytest.mark.anyio
async def test_auto_discovery_fallback_uses_source_headings_and_questions(monkeypatch):
    def unavailable_llm(*args, **kwargs):
        raise RuntimeError("LLM unavailable")

    monkeypatch.setattr("app.services.intent_discovery_service.ChatOpenAI", unavailable_llm)

    run = await AutoDiscoveryService().generate(
        "J-Brain",
        [
            {
                "id": "SRC-1",
                "filename": "J-Brain_Manual.txt",
                "content": """
                # FAQ 관리
                FAQ는 어떻게 등록하나요?
                답변 후보를 검토하고 승인합니다.

                # Pack 검증
                Pack 검증은 어떻게 진행하나요?
                검증 질문을 실행해 기대 Intent와 Action을 확인합니다.
                """,
            }
        ],
    )

    intent_titles = {item.title for item in run.candidates if item.candidate_type == "INTENT"}
    faq_questions = {item.payload.get("question") for item in run.candidates if item.candidate_type == "FAQ"}
    assert "FAQ 관리 안내" in intent_titles
    assert "Pack 검증 안내" in intent_titles
    assert "FAQ는 어떻게 등록하나요?" in faq_questions
    assert "Pack 검증은 어떻게 진행하나요?" in faq_questions


def test_candidate_store_merges_payload_improvements_on_incremental_runs(tmp_path):
    store = MockCandidateStore(tmp_path)
    first = candidate(
        "INTENT",
        {
            "intent_id": "INTENT_J_BRAIN_SOURCE",
            "intent_name": "Source 관리",
            "examples": ["Source 등록 방법 알려줘"],
            "source_ids": ["SRC-1"],
        },
        "CAND-1",
    )
    second = candidate(
        "INTENT",
        {
            "intent_id": "INTENT_J_BRAIN_SOURCE",
            "intent_name": "Source 관리",
            "examples": ["문서 업로드는 어디서 하나요?"],
            "source_ids": ["SRC-2"],
        },
        "CAND-2",
    )

    store.save_run(run_with_candidates([first]))
    store.save_incremental_run(run_with_candidates([second]))

    [merged] = store.list_candidates("J-Brain")
    assert merged.payload["source_ids"] == ["SRC-1", "SRC-2"]
    assert merged.payload["examples"] == ["Source 등록 방법 알려줘", "문서 업로드는 어디서 하나요?"]
