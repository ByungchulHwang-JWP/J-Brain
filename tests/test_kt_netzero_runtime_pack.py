import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPackLoader


def test_kt_netzero_goal_question_routes_to_platform_overview_search():
    pack_root = Path(__file__).resolve().parents[1] / "backend" / "app_data" / "runtime_pack_store"
    pack = IntentPackLoader(pack_root).load_pack("KT-NetZero-intent-pack", "0.1.0")

    top_match = IntentMatcher(pack).match("이 프로젝트의 핵심 목표는 무엇인가요?", top_k=1)[0]

    assert top_match["intent_id"] == "INTENT_KT_NETZERO_SEARCH_DOC_01_GETPLATFORMOVERVIEW"
    assert top_match["action_id"] == "ACT_KT_NETZERO_SEARCH_DOC"
    assert top_match["confidence_label"] == "high"
