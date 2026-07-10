import asyncio
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.ai.action_router import ActionRouter
from app.ai.intent_pack_loader import IntentPack


def test_action_router_returns_download_card_for_download_action():
    pack = IntentPack(
        root_dir=Path("/tmp/demo-pack"),
        manifest={"pack_id": "J-Brain-intent-pack", "pack_version": "0.1-test"},
        profile={},
        nlu={
            "intents": [
                {
                    "intent_id": "INTENT_DOWNLOAD_MANUAL",
                    "intent_name": "운영 매뉴얼 다운로드",
                    "action_id": "ACT_DOWNLOAD_MANUAL",
                    "category": "DOWNLOAD",
                }
            ],
            "intent_examples": [],
            "entities": [],
            "entity_synonyms": [],
            "confidence_policy": {},
        },
        action={
            "action_registry": [
                {
                    "action_id": "ACT_DOWNLOAD_MANUAL",
                    "action_name": "운영 매뉴얼 다운로드",
                    "action_type": "DOWNLOAD",
                    "description": "J-Brain 운영 매뉴얼 파일을 다운로드합니다.",
                    "execution_mode": "local",
                    "route_value": "/api/v1/intent-factory/projects/J-Brain/pack-exports/EXP-DEMO/download",
                    "menu_name": "J-Brain 운영 매뉴얼",
                    "enabled": True,
                }
            ],
            "screen_routes": [],
            "api_mappings": [],
            "sql_templates": [],
            "action_parameters": [],
        },
        knowledge={"faqs": [], "approved_documents": [], "metadata_policy": {}},
        templates={},
        validation={},
    )

    card = asyncio.run(
        ActionRouter(pack).route(
            "운영 매뉴얼 다운로드해줘",
            [
                {
                    "intent_id": "INTENT_DOWNLOAD_MANUAL",
                    "action_id": "ACT_DOWNLOAD_MANUAL",
                    "confidence_label": "high",
                }
            ],
        )
    )

    assert card["type"] == "download_card"
    assert card["status"] == "ready"
    assert card["download_url"] == "/api/v1/intent-factory/projects/J-Brain/pack-exports/EXP-DEMO/download"
    assert card["file_name"] == "J-Brain 운영 매뉴얼"
    assert card["confirmation_required"] is True
