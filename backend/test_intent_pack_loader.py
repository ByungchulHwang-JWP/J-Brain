import unittest
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader, IntentPackValidationError


PACK_ROOT = (
    Path(__file__).resolve().parent.parent
    / "01.docs"
    / "01.산출물_JBrain"
    / "200.프로젝트실행"
    / "250.구현"
    / "intent-packs"
)


class IntentPackLoaderTest(unittest.TestCase):
    def test_loads_netzero_pack_and_indexes_core_records(self):
        loader = IntentPackLoader(PACK_ROOT)

        pack = loader.load_pack("netzero-intent-pack", "0.1.0")

        self.assertEqual(pack.profile["service_id"], "NETZERO")
        self.assertEqual(pack.profile["pack_version"], "0.1.0")
        self.assertIn("INT-NZ-DOC-001", pack.intents_by_id)
        self.assertIn("ACT-NZ-SEARCH-CALC-GUIDE", pack.actions_by_id)
        self.assertIn("RTE-JB-JOBS", pack.routes_by_id)
        self.assertEqual(
            pack.routes_by_action_id["ACT-JB-GO-JOBS"][0]["route_value"],
            "/admin/jobs",
        )

    def test_validates_references_between_intents_actions_routes_and_questions(self):
        loader = IntentPackLoader(PACK_ROOT)

        pack = loader.load_pack("netzero-intent-pack", "0.1.0")
        result = loader.validate_pack(pack)

        self.assertTrue(result["valid"])
        self.assertEqual(result["error_count"], 0)
        self.assertGreaterEqual(result["counts"]["intents"], 17)
        self.assertGreaterEqual(result["counts"]["actions"], 17)
        self.assertGreaterEqual(result["counts"]["routes"], 7)

    def test_builds_api_summary_for_loaded_pack(self):
        loader = IntentPackLoader(PACK_ROOT)
        pack = loader.load_pack("netzero-intent-pack", "0.1.0")

        summary = loader.build_summary(pack)

        self.assertEqual(summary["pack_id"], "netzero-intent-pack")
        self.assertEqual(summary["pack_version"], "0.1.0")
        self.assertEqual(summary["service_id"], "NETZERO")
        self.assertTrue(summary["validation"]["valid"])
        self.assertIn("ACT-JB-GO-JOBS", summary["navigation_actions"])
        self.assertEqual(
            summary["navigation_actions"]["ACT-JB-GO-JOBS"][0]["route_value"],
            "/admin/jobs",
        )

    def test_raises_clear_error_for_missing_pack(self):
        loader = IntentPackLoader(PACK_ROOT)

        with self.assertRaises(IntentPackValidationError) as ctx:
            loader.load_pack("missing-pack", "9.9.9")

        self.assertIn("Intent Pack directory not found", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
