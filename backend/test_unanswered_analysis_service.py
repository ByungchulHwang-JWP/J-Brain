import tempfile
import unittest
from pathlib import Path

from app.ai.unanswered_logger import UnansweredLogger
from app.services.unanswered_analysis_service import (
    build_faq_candidate_payload_from_unanswered,
    enrich_unanswered_record,
    list_project_unanswered_records,
)


class UnansweredAnalysisServiceTest(unittest.TestCase):
    def test_enriches_very_low_record_as_intent_improvement_candidate(self):
        record = {
            "log_id": "UNANSWERED-000001",
            "project_id": "J-Brain",
            "question": "알 수 없는 질문",
            "pack_id": "netzero-intent-pack",
            "pack_version": "0.1.0",
            "intent_id": None,
            "action_id": None,
            "confidence_label": "very_low",
            "status": "open",
        }

        enriched = enrich_unanswered_record(record)

        self.assertEqual(enriched["improvement_type"], "INTENT_OR_EXAMPLE")
        self.assertEqual(enriched["severity"], "high")
        self.assertIn("Intent", enriched["reason"])

    def test_builds_faq_candidate_payload_from_unanswered_record(self):
        record = {
            "log_id": "UNANSWERED-000002",
            "question": "Scope 3 기준이 뭐야?",
            "pack_id": "netzero-intent-pack",
            "pack_version": "0.1.0",
            "confidence_label": "low",
        }

        payload = build_faq_candidate_payload_from_unanswered(record)

        self.assertEqual(payload.candidate_id, "FAQC-UNANSWERED-000002")
        self.assertEqual(payload.question, "Scope 3 기준이 뭐야?")
        self.assertEqual(payload.source_log_id, "UNANSWERED-000002")
        self.assertIn("low", payload.tags)
        self.assertEqual(payload.status, "new")

    def test_lists_records_for_project_and_keeps_legacy_records(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            logger = UnansweredLogger(Path(tmp_dir) / "unanswered.jsonl")
            logger.append(
                project_id="J-Brain",
                question="J-Brain 질문",
                pack_id="pack",
                pack_version="0.1.0",
                intent_id=None,
                action_id=None,
                confidence_label="very_low",
            )
            logger.append(
                project_id="Other",
                question="다른 프로젝트 질문",
                pack_id="pack",
                pack_version="0.1.0",
                intent_id=None,
                action_id=None,
                confidence_label="very_low",
            )
            logger.append(
                question="기존 로그 질문",
                pack_id="pack",
                pack_version="0.1.0",
                intent_id=None,
                action_id=None,
                confidence_label="low",
            )

            records = list_project_unanswered_records(
                "J-Brain",
                log_path=Path(tmp_dir) / "unanswered.jsonl",
            )

        self.assertEqual([item["question"] for item in records], ["기존 로그 질문", "J-Brain 질문"])
        self.assertTrue(all("improvement_type" in item for item in records))

    def test_logger_updates_unanswered_record_status(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            logger = UnansweredLogger(Path(tmp_dir) / "unanswered.jsonl")
            record = logger.append(
                project_id="J-Brain",
                question="전환할 질문",
                pack_id="pack",
                pack_version="0.1.0",
                intent_id=None,
                action_id=None,
                confidence_label="very_low",
            )

            updated = logger.update_status(
                record["log_id"],
                "converted_to_faq_candidate",
                {"converted_candidate_id": "FAQC-UNANSWERED-000001"},
            )
            recent = logger.list_recent()

        self.assertEqual(updated["status"], "converted_to_faq_candidate")
        self.assertEqual(recent[0]["converted_candidate_id"], "FAQC-UNANSWERED-000001")


if __name__ == "__main__":
    unittest.main()
