import tempfile
import unittest
from pathlib import Path

from app.ai.intent_pack_loader import IntentPackLoader
from app.services.pack_export_service import make_pack_zip, write_pack_directory
from app.services.pack_store_service import import_zip_to_store


class PackStoreServiceTest(unittest.TestCase):
    def _draft(self):
        return {
            "nlu": {
                "intents": [
                    {
                        "intent_id": "INT-STORE-001",
                        "intent_name": "스토어 테스트",
                        "category": "GUIDE",
                        "action_id": "ACT-STORE-001",
                        "priority": 100,
                        "status": "active",
                    }
                ],
                "intent_examples": [{"intent_id": "INT-STORE-001", "example": "스토어 테스트"}],
                "entities": [],
                "entity_synonyms": [],
            },
            "action": {
                "action_registry": [
                    {
                        "action_id": "ACT-STORE-001",
                        "action_name": "스토어 테스트",
                        "action_type": "GUIDE",
                        "enabled": True,
                    }
                ],
                "action_parameters": [],
            },
            "knowledge": {"source_scopes": []},
            "counts": {
                "intents": 1,
                "intent_examples": 1,
                "entities": 0,
                "entity_synonyms": 0,
                "actions": 1,
                "action_parameters": 0,
                "source_scopes": 0,
            },
        }

    def test_import_zip_to_store_extracts_and_validates_pack(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            export_root = root / "exports"
            store_root = root / "store"
            pack_dir = write_pack_directory(
                project_id="J-Brain",
                pack_id="jbrain-store-pack",
                pack_version="0.1.0",
                draft=self._draft(),
                output_root=export_root,
            )
            zip_path = make_pack_zip(pack_dir)

            result = import_zip_to_store(
                zip_path=zip_path,
                pack_id="jbrain-store-pack",
                pack_version="0.1.0",
                store_root=store_root,
            )

            self.assertEqual(result["status"], "validated")
            self.assertTrue(Path(result["store_path"]).exists())
            loaded = IntentPackLoader(store_root).load_pack("jbrain-store-pack", "0.1.0")
            self.assertEqual(loaded.manifest["pack_id"], "jbrain-store-pack")

    def test_import_zip_to_store_rejects_missing_zip(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                import_zip_to_store(
                    zip_path=Path(tmp) / "missing.zip",
                    pack_id="missing",
                    pack_version="0.1.0",
                    store_root=Path(tmp) / "store",
                )


if __name__ == "__main__":
    unittest.main()
