import unittest

from app.ai.project_pack_resolver import ProjectPackResolver


class ProjectPackResolverTest(unittest.TestCase):
    def test_resolves_default_pack_config(self):
        resolver = ProjectPackResolver()

        config = resolver.resolve("project-123")

        self.assertEqual(config["project_id"], "project-123")
        self.assertEqual(config["pack_id"], "netzero-intent-pack")
        self.assertEqual(config["pack_version"], "0.1.0")
        self.assertEqual(config["runtime_mode"], "intent_action")

    def test_request_override_wins_when_pack_id_and_version_are_supplied(self):
        resolver = ProjectPackResolver()

        config = resolver.resolve(
            "project-123",
            requested_pack_id="custom-pack",
            requested_pack_version="2.0.0",
        )

        self.assertEqual(config["project_id"], "project-123")
        self.assertEqual(config["pack_id"], "custom-pack")
        self.assertEqual(config["pack_version"], "2.0.0")
        self.assertEqual(config["runtime_mode"], "intent_action")

    def test_partial_override_uses_default_pack_config(self):
        resolver = ProjectPackResolver()

        id_only = resolver.resolve("project-123", requested_pack_id="custom-pack")
        version_only = resolver.resolve(
            "project-123",
            requested_pack_version="2.0.0",
        )

        self.assertEqual(id_only["pack_id"], "netzero-intent-pack")
        self.assertEqual(id_only["pack_version"], "0.1.0")
        self.assertEqual(version_only["pack_id"], "netzero-intent-pack")
        self.assertEqual(version_only["pack_version"], "0.1.0")


if __name__ == "__main__":
    unittest.main()
