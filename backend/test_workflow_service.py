import unittest

from app.services.workflow_service import build_workflow_summary, calculate_workflow_stages


class WorkflowServiceTest(unittest.TestCase):
    def test_calculates_locked_and_next_action_from_metrics(self):
        stages = calculate_workflow_stages(
            {
                "project_id": "J-Brain",
                "source_count": 0,
                "completed_source_count": 0,
                "intent_count": 0,
            }
        )

        self.assertEqual(stages[0]["status"], "done")
        self.assertEqual(stages[1]["status"], "warning")
        self.assertEqual(stages[2]["status"], "locked")
        self.assertEqual(stages[1]["next_actions"][0]["path"], "/admin/knowledge/sources")

    def test_summary_reports_progress_and_current_stage(self):
        summary = build_workflow_summary(
            "J-Brain",
            "J-Brain",
            {
                "source_count": 1,
                "completed_source_count": 1,
                "intent_count": 1,
                "intent_example_count": 1,
                "entity_count": 1,
                "synonym_count": 1,
                "faq_count": 1,
                "action_count": 1,
                "action_link_count": 1,
                "validation_question_count": 0,
            },
        )

        self.assertEqual(summary["current_stage"], 8)
        self.assertGreaterEqual(summary["overall_progress"], 50)
        self.assertEqual(summary["next_action"]["path"], "/admin/packs/validation")

    def test_answer_evidence_requires_faq_or_completed_source(self):
        stages = calculate_workflow_stages(
            {
                "project_id": "J-Brain",
                "source_count": 1,
                "completed_source_count": 0,
                "intent_count": 1,
                "intent_example_count": 1,
                "entity_count": 1,
                "synonym_count": 0,
                "faq_count": 0,
            }
        )

        answer_evidence = stages[5]
        self.assertEqual(answer_evidence["stage"], 6)
        self.assertNotEqual(answer_evidence["status"], "done")

    def test_approved_discovery_candidates_count_as_next_stage_progress(self):
        stages = calculate_workflow_stages(
            {
                "project_id": "J-Brain",
                "source_count": 1,
                "completed_source_count": 1,
                "intent_count": 0,
                "intent_example_count": 0,
                "entity_count": 0,
                "faq_count": 0,
                "action_count": 0,
                "action_link_count": 0,
                "approved_discovery_intent_count": 1,
                "approved_discovery_entity_count": 1,
                "approved_discovery_faq_count": 1,
                "approved_discovery_action_count": 1,
            }
        )

        self.assertEqual(stages[2]["status"], "done")
        self.assertEqual(stages[4]["status"], "done")
        self.assertEqual(stages[5]["status"], "done")
        self.assertEqual(stages[6]["status"], "done")

    def test_pending_new_source_discovery_reopens_downstream_workflow_checks(self):
        summary = build_workflow_summary(
            "탄소중립플랫폼",
            "탄소중립플랫폼",
            {
                "source_count": 2,
                "completed_source_count": 2,
                "intent_count": 18,
                "intent_example_count": 18,
                "entity_count": 16,
                "synonym_count": 16,
                "faq_count": 2,
                "action_count": 3,
                "action_link_count": 3,
                "validation_question_count": 1,
                "validation_pass_count": 1,
                "export_count": 1,
                "runtime_pack_count": 1,
                "pending_discovery_count": 6,
                "unanalyzed_source_count": 0,
            },
        )

        stages_by_no = {stage["stage"]: stage for stage in summary["stages"]}

        self.assertEqual(stages_by_no[2]["status"], "done")
        self.assertNotEqual(stages_by_no[3]["status"], "done")
        self.assertLess(stages_by_no[3]["progress"], 100)
        self.assertLess(summary["overall_progress"], 100)


if __name__ == "__main__":
    unittest.main()
