import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPackLoader


def test_jbrain_user_status_query_routes_to_sql_action():
    pack_root = (
        Path(__file__).resolve().parents[1]
        / "backend"
        / "app_data"
        / "runtime_pack_store"
    )
    pack = IntentPackLoader(pack_root).load_pack("J-Brain-intent-pack", "0.16.0")

    matches = IntentMatcher(pack).match("유저 현황 알려줘", top_k=1)
    top_match = matches[0]

    assert top_match["intent_id"] == "INT-JBRAIN-092804"
    assert top_match["action_id"] == "ACT-JBRAIN-QUERY-269518"
    assert top_match["category"] == "DATA_QUERY"
    assert top_match["confidence_label"] == "high"

    action = pack.actions_by_id[top_match["action_id"]]
    assert action["action_type"] == "QUERY"
    assert action["execution_mode"] == "sql_template"

    sql_template = next(
        item
        for item in pack.action["sql_templates"]
        if item["action_id"] == top_match["action_id"]
    )
    sql = sql_template["sql_template"].lower()

    assert "graphrag.admin_users" in sql
    assert "approval_status = 'approved'" in sql
    assert sql_template["readonly"] is True
