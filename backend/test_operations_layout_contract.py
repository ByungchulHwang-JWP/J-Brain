import unittest
from pathlib import Path


class OperationsLayoutContractTest(unittest.TestCase):
    def test_operations_page_does_not_stretch_rows_vertically(self):
        css = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "index.css"
        ).read_text(encoding="utf-8")

        self.assertIn(".operations-page", css)
        self.assertIn("align-content: start", css)
        self.assertIn(".operations-kpi {", css)
        self.assertIn("min-height: 112px", css)
        self.assertIn("align-content: start", css)


if __name__ == "__main__":
    unittest.main()
