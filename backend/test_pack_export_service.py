import tempfile
import unittest
import zipfile
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader
from app.services.pack_export_service import (
    make_pack_zip,
    validate_exported_pack,
    write_pack_directory,
)


class PackExportServiceTest(unittest.TestCase):
    def _draft(self):
        return {
            "nlu": {
                "intents": [
                    {
                        "intent_id": "INT-TEST-001",
                        "intent_name": "테스트 Intent",
                        "category": "GUIDE",
                        "action_id": "ACT-TEST-001",
                        "priority": 100,
                        "status": "active",
                    }
                ],
                "intent_examples": [
                    {"intent_id": "INT-TEST-001", "example": "테스트 알려줘"}
                ],
                "entities": [
                    {
                        "entity_type": "project",
                        "display_name": "프로젝트",
                        "value_type": "string",
                        "required_validation": False,
                        "normalization_rule": "entity_synonyms",
                        "description": "프로젝트명",
                        "status": "active",
                        "synonym_count": 1,
                    }
                ],
                "entity_synonyms": [
                    {
                        "entity_type": "project",
                        "canonical_value": "J-Brain",
                        "synonyms": ["제이브레인"],
                        "code": "J-Brain",
                        "is_active": True,
                    }
                ],
            },
            "action": {
                "action_registry": [
                    {
                        "action_id": "ACT-TEST-001",
                        "action_name": "테스트 Action",
                        "action_type": "GUIDE",
                        "enabled": True,
                    }
                ],
                "action_parameters": [],
            },
            "knowledge": {
                "source_scopes": [],
                "faqs": [
                    {
                        "faq_id": "FAQ-TEST-001",
                        "question": "테스트 FAQ?",
                        "answer": "테스트 답변입니다.",
                        "category": "test",
                        "tags": ["테스트"],
                        "action_id": "SEARCH_DOC",
                        "status": "active",
                    }
                ],
            },
            "counts": {
                "intents": 1,
                "intent_examples": 1,
                "entities": 1,
                "entity_synonyms": 1,
                "actions": 1,
                "action_parameters": 0,
                "source_scopes": 0,
            },
        }

    def test_write_pack_directory_creates_loader_compatible_pack(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack_dir = write_pack_directory(
                project_id="J-Brain",
                pack_id="jbrain-intent-pack",
                pack_version="0.1.0",
                draft=self._draft(),
                output_root=root,
            )

            loader = IntentPackLoader(root)
            pack = loader.load_pack("jbrain-intent-pack", "0.1.0")
            validation = loader.validate_pack(pack)

            self.assertTrue(validation["valid"], validation["errors"])
            self.assertEqual(validation["counts"]["intents"], 1)
            self.assertTrue((pack_dir / "manifest" / "pack_manifest.json").exists())
            self.assertTrue((pack_dir / "validation" / "acceptance_criteria.json").exists())

    def test_make_pack_zip_contains_standard_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pack_dir = write_pack_directory(
                project_id="J-Brain",
                pack_id="jbrain-intent-pack",
                pack_version="0.1.0",
                draft=self._draft(),
                output_root=root,
            )
            validation = validate_exported_pack(pack_dir, "jbrain-intent-pack", "0.1.0")
            zip_path = make_pack_zip(pack_dir)

            self.assertTrue(validation["valid"], validation["errors"])
            self.assertTrue(zip_path.exists())
            with zipfile.ZipFile(zip_path) as archive:
                names = set(archive.namelist())
                faq_payload = archive.read("jbrain-intent-pack-v0.1.0/knowledge/faqs.json").decode("utf-8")
            self.assertIn("jbrain-intent-pack-v0.1.0/manifest/pack_manifest.json", names)
            self.assertIn("jbrain-intent-pack-v0.1.0/nlu/intents.json", names)
            self.assertIn("FAQ-TEST-001", faq_payload)


if __name__ == "__main__":
    unittest.main()
