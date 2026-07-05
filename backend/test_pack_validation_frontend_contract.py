import unittest
from pathlib import Path


class PackValidationFrontendContractTest(unittest.TestCase):
    def test_db_draft_validation_uses_backend_draft_identity(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "packs"
            / "PackValidation.jsx"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn("`${projectId}-db-draft`", text)
        self.assertIn("'0.1-draft'", text)
        self.assertNotIn("`${projectId}-intent-pack`", text)


if __name__ == "__main__":
    unittest.main()
