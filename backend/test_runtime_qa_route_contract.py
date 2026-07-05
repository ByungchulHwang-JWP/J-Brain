import unittest
from pathlib import Path


class RuntimeQARouteContractTest(unittest.TestCase):
    def test_project_qa_keeps_runtime_route_and_reads_navigation_state(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "ProjectQA.jsx"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn("useLocation", text)
        self.assertIn("location.state?.projectId", text)
        self.assertNotIn("navigate(`/admin/qa`, { replace: true })", text)

    def test_runtime_stage_passes_project_context_to_runtime_qa(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "workflow"
            / "stages"
            / "RuntimeSimulationStage.jsx"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn("openRuntimeQA", text)
        self.assertIn("state: { projectId }", text)

    def test_runtime_qa_layout_avoids_fixed_viewport_clipping(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "index.css"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn(".runtime-qa-page", text)
        self.assertIn("min-height: calc(100vh - 60px - 56px);", text)
        self.assertIn("min-height: 560px;", text)
        self.assertNotIn("height: calc(100vh - 60px);", text)

    def test_runtime_qa_uses_self_contained_scroll_layout(self):
        css = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "index.css"
        ).read_text(encoding="utf-8")
        page = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "ProjectQA.jsx"
        ).read_text(encoding="utf-8")

        self.assertIn("height: calc(100vh - 56px);", css)
        self.assertIn("overflow-y: auto;", css)
        self.assertIn("position: sticky;", css)
        self.assertIn("runtime-qa-project-warning", page)
        self.assertIn("프로젝트를 선택하면 Runtime QA를 실행할 수 있습니다.", page)

    def test_runtime_qa_does_not_force_netzero_pack_from_frontend(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "ProjectQA.jsx"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn("runtime-resolver", text)
        self.assertIn("activePack.pack_id", text)
        self.assertNotIn("{ pack_id: 'netzero-intent-pack', pack_version: '0.1.0' }", text)
        self.assertIn("DEFAULT_RUNTIME_QUESTIONS", text)

    def test_runtime_intent_match_uses_dedicated_runtime_resolver_screen(self):
        source = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "pages"
            / "runtime"
            / "IntentMatchTest.jsx"
        )
        text = source.read_text(encoding="utf-8")

        self.assertIn("Intent 매칭 테스트", text)
        self.assertIn("/chat/runtime", text)
        self.assertIn("runtime-resolver", text)
        self.assertIn("Top Intent", text)
        self.assertNotIn("{ pack_id: 'netzero-intent-pack', pack_version: '0.1.0' }", text)

        css = (
            Path(__file__).resolve().parents[1]
            / "frontend"
            / "src"
            / "index.css"
        ).read_text(encoding="utf-8")
        self.assertIn(".intent-match-page", css)
        self.assertIn(".intent-match-grid", css)


if __name__ == "__main__":
    unittest.main()
