import tempfile
import unittest
from pathlib import Path

from app.services.intent_discovery_service import (
    AutoDiscoveryService,
    MockCandidateStore,
    build_approved_candidate_apply_plan,
    build_validation_question_payloads_from_apply_plan,
    summarize_candidates,
)


class IntentDiscoveryServiceTest(unittest.TestCase):
    def test_generates_required_candidate_types_from_sources(self):
        service = AutoDiscoveryService()
        run = service.generate(
            "J-Brain",
            sources=[
                {
                    "id": "SRC-1",
                    "filename": "J-Brain_Manual.txt",
                    "description": "J-Brain 관리자 기능과 메뉴 사용 방법",
                    "status": "completed",
                    "chunk_count": 3,
                    "content": "프로젝트 관리 Source 관리 Intent 관리 FAQ 관리 Action 관리 Pack Build Runtime 테스트",
                }
            ],
            faqs=[],
        )

        candidate_types = {candidate.candidate_type for candidate in run.candidates}
        self.assertIn("CATEGORY", candidate_types)
        self.assertIn("INTENT", candidate_types)
        self.assertIn("ENTITY", candidate_types)
        self.assertIn("FAQ", candidate_types)
        self.assertIn("SOURCE_SCOPE", candidate_types)
        self.assertIn("ACTION", candidate_types)
        self.assertEqual(run.summary["total"], len(run.candidates))

    def test_mock_store_persists_status_changes(self):
        service = AutoDiscoveryService()
        run = service.generate(
            "J-Brain",
            sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
            faqs=[],
        )
        target = run.candidates[0]

        with tempfile.TemporaryDirectory() as tmp:
            store = MockCandidateStore(Path(tmp))
            store.save_run(run)
            updated = store.update_candidate_status("J-Brain", target.candidate_id, "approved")
            loaded = store.list_candidates("J-Brain")

        self.assertEqual(updated.status, "approved")
        self.assertEqual(loaded[0].status, "approved")

    def test_mock_store_replaces_previous_review_candidates_on_new_run(self):
        service = AutoDiscoveryService()

        with tempfile.TemporaryDirectory() as tmp:
            store = MockCandidateStore(Path(tmp))
            first_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
                faqs=[],
            )
            second_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
                faqs=[],
            )

            store.save_run(first_run)
            store.save_run(second_run)
            candidates = store.list_candidates("J-Brain")

        self.assertEqual(len(candidates), len(second_run.candidates))
        self.assertEqual({candidate.run_id for candidate in candidates}, {second_run.run_id})

    def test_incremental_run_adds_only_new_source_scope_without_duplicate_candidates(self):
        service = AutoDiscoveryService()

        with tempfile.TemporaryDirectory() as tmp:
            store = MockCandidateStore(Path(tmp))
            first_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
                faqs=[],
            )
            incremental_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-2", "filename": "guide.txt", "description": "운영자 가이드"}],
                faqs=[],
            )

            store.save_run(first_run)
            store.save_incremental_run(incremental_run)
            candidates = store.list_candidates("J-Brain")
            source_scope = next(candidate for candidate in candidates if candidate.candidate_type == "SOURCE_SCOPE")

        self.assertEqual(len(candidates), len(first_run.candidates))
        self.assertEqual(source_scope.payload["source_ids"], ["SRC-1", "SRC-2"])

    def test_incremental_source_scope_merge_requires_review_again(self):
        service = AutoDiscoveryService()

        with tempfile.TemporaryDirectory() as tmp:
            store = MockCandidateStore(Path(tmp))
            first_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
                faqs=[],
            )
            for candidate in first_run.candidates:
                if candidate.candidate_type == "SOURCE_SCOPE":
                    candidate.status = "approved"
            incremental_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-2", "filename": "guide.txt", "description": "운영자 가이드"}],
                faqs=[],
            )

            store.save_run(first_run)
            store.save_incremental_run(incremental_run)
            candidates = store.list_candidates("J-Brain")
            source_scope = next(candidate for candidate in candidates if candidate.candidate_type == "SOURCE_SCOPE")

        self.assertEqual(source_scope.payload["source_ids"], ["SRC-1", "SRC-2"])
        self.assertEqual(source_scope.status, "pending")

    def test_incremental_run_marks_all_merged_candidates_with_new_source_context(self):
        service = AutoDiscoveryService()

        with tempfile.TemporaryDirectory() as tmp:
            store = MockCandidateStore(Path(tmp))
            first_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
                faqs=[],
            )
            for candidate in first_run.candidates:
                candidate.status = "approved"
            incremental_run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-2", "filename": "guide.txt", "description": "운영자 가이드"}],
                faqs=[],
            )

            store.save_run(first_run)
            merged_run = store.save_incremental_run(incremental_run)
            candidates = store.list_candidates("J-Brain")

        self.assertEqual(merged_run.summary["latest_run"]["scope"], "new")
        self.assertEqual(merged_run.summary["latest_run"]["source_names"], ["guide.txt"])
        self.assertTrue(all("guide.txt" in candidate.payload.get("source_names", []) for candidate in candidates))
        self.assertTrue(any(candidate.status == "pending" for candidate in candidates))

    def test_store_returns_source_ids_already_covered_by_discovery(self):
        service = AutoDiscoveryService()

        with tempfile.TemporaryDirectory() as tmp:
            store = MockCandidateStore(Path(tmp))
            run = service.generate(
                "J-Brain",
                sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
                faqs=[],
            )

            store.save_run(run)
            analyzed_source_ids = store.analyzed_source_ids("J-Brain")

        self.assertEqual(analyzed_source_ids, {"SRC-1"})

    def test_summary_counts_only_approved_candidates(self):
        service = AutoDiscoveryService()
        run = service.generate(
            "J-Brain",
            sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
            faqs=[],
        )
        run.candidates[0].status = "approved"

        summary = summarize_candidates(run.candidates)

        self.assertEqual(summary["total"], len(run.candidates))
        self.assertEqual(summary["approved"], 1)
        self.assertEqual(summary["pending"], len(run.candidates) - 1)

    def test_build_apply_plan_uses_only_approved_candidates(self):
        service = AutoDiscoveryService()
        run = service.generate(
            "J-Brain",
            sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
            faqs=[],
        )
        for candidate in run.candidates:
            if candidate.candidate_type in {"ACTION", "INTENT", "ENTITY", "FAQ", "SOURCE_SCOPE"}:
                candidate.status = "approved"
            else:
                candidate.status = "rejected"

        plan = build_approved_candidate_apply_plan(run.candidates)

        self.assertEqual(len(plan["actions"]), 1)
        self.assertEqual(len(plan["intents"]), 1)
        self.assertEqual(len(plan["entities"]), 1)
        self.assertEqual(len(plan["faqs"]), 1)
        self.assertEqual(plan["intents"][0].source_scope.source_category, "J-Brain")
        self.assertEqual(plan["skipped"], 1)

    def test_build_validation_questions_from_approved_intent_plan(self):
        service = AutoDiscoveryService()
        run = service.generate(
            "J-Brain",
            sources=[{"id": "SRC-1", "filename": "manual.txt", "description": "관리자 매뉴얼"}],
            faqs=[],
        )
        for candidate in run.candidates:
            if candidate.candidate_type in {"ACTION", "INTENT", "SOURCE_SCOPE"}:
                candidate.status = "approved"

        plan = build_approved_candidate_apply_plan(run.candidates)
        questions = build_validation_question_payloads_from_apply_plan("J-Brain", plan)

        self.assertEqual(len(questions), 1)
        self.assertTrue(questions[0].question_id.startswith("VAL-AUTO-"))
        self.assertIn("J-Brain", questions[0].question)
        self.assertEqual(questions[0].expected_intent_id, plan["intents"][0].intent_id)
        self.assertEqual(questions[0].expected_action_id, plan["intents"][0].action_id)
        self.assertEqual(questions[0].pack_id, "J-Brain-db-draft")
        self.assertEqual(questions[0].pack_version, "0.1-draft")


if __name__ == "__main__":
    unittest.main()
