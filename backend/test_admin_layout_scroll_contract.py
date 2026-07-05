import unittest
from pathlib import Path


class AdminLayoutScrollContractTest(unittest.TestCase):
    def test_admin_layout_resets_scroll_on_route_change(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "components"
            / "Layout"
            / "AdminLayout.jsx"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn("mainContentRef", text)
        self.assertIn("window.scrollTo", text)
        self.assertIn("[location.pathname]", text)


if __name__ == "__main__":
    unittest.main()
