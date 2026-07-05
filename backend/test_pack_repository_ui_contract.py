import unittest
from pathlib import Path


class PackRepositoryUiContractTest(unittest.TestCase):
    def test_table_button_style_centers_link_and_button_content(self):
        css = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "index.css"
        ).read_text(encoding="utf-8")

        self.assertIn(".btn-table", css)
        self.assertIn("display: inline-flex", css)
        self.assertIn("align-items: center", css)
        self.assertIn("justify-content: center", css)
        self.assertIn("min-width: 54px", css)

    def test_pack_repository_shows_per_action_progress_labels(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "packs"
            / "PackRepository.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("operationKey", source)
        self.assertIn("setOperationKey", source)
        self.assertIn("Import 중...", source)
        self.assertIn("승인 중...", source)
        self.assertIn("반려 중...", source)
        self.assertIn("활성화 중...", source)
        self.assertIn("ZIP 다운로드", source)


if __name__ == "__main__":
    unittest.main()
