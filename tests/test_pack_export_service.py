import sys
import tempfile
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.services.pack_export_service import _build_pack_files, make_pack_zip
from app.services.intent_factory_service import _action_to_pack_records


def test_build_pack_files_includes_validation_questions_and_expected_results():
    draft = {
        "validation": {
            "validation_questions": [
                {
                    "question_id": "VQ-DEMO-001",
                    "question": "권한 관리 화면으로 가고 싶어",
                    "expected_intent_id": "INTENT_NAV_PERMISSIONS",
                    "expected_action_id": "ACT_NAV_PERMISSIONS",
                    "min_confidence_score": 0.7,
                    "expected_entities": [],
                    "status": "active",
                }
            ]
        }
    }

    files = _build_pack_files(
        project_id="J-Brain",
        pack_id="J-Brain-intent-pack",
        pack_version="0.1.2",
        draft=draft,
    )

    assert files["validation/validation_questions.json"] == draft["validation"]["validation_questions"]
    assert files["validation/expected_results.json"] == [
        {
            "question_id": "VQ-DEMO-001",
            "expected_intent_id": "INTENT_NAV_PERMISSIONS",
            "expected_action_id": "ACT_NAV_PERMISSIONS",
            "min_confidence_score": 0.7,
            "expected_entities": [],
        }
    ]


def test_make_pack_zip_preserves_full_semver_like_directory_name():
    with tempfile.TemporaryDirectory() as temp_dir:
        pack_dir = Path(temp_dir) / "J-Brain-intent-pack-v0.1.2"
        pack_dir.mkdir()
        (pack_dir / "manifest.json").write_text("{}", encoding="utf-8")

        zip_path = make_pack_zip(pack_dir)

        assert zip_path.name == "J-Brain-intent-pack-v0.1.2.zip"


def test_download_action_pack_record_preserves_download_metadata():
    records = _action_to_pack_records(
        {
            "action_id": "ACT_DOWNLOAD_MANUAL",
            "action_name": "운영 매뉴얼 다운로드",
            "action_type": "DOWNLOAD",
            "description": "운영 매뉴얼을 다운로드합니다.",
            "execution_mode": "local",
            "route_value": "/api/v1/files/manual/download",
            "menu_name": "J-Brain 운영 매뉴얼",
            "status": "active",
            "allowed_roles": [],
        }
    )

    registry = records["action_registry"][0]

    assert registry["route_value"] == "/api/v1/files/manual/download"
    assert registry["menu_name"] == "J-Brain 운영 매뉴얼"
