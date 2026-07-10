import json
from pathlib import Path


def test_project_summary_sql_counts_demo_visible_projects():
    template_path = (
        Path(__file__).resolve().parents[1]
        / "backend"
        / "app_data"
        / "pack_validation_drafts"
        / "J-Brain-db-draft-v0.1-draft"
        / "action"
        / "sql_templates.json"
    )
    templates = json.loads(template_path.read_text(encoding="utf-8"))

    project_summary = next(
        item
        for item in templates
        if item["action_id"] == "ACT_J_BRAIN_QUERY_PROJECT_SUMMARY"
    )
    sql = project_summary["sql_template"].lower()

    assert "active_project_count" in sql
    assert "graphrag_sources" in sql
    assert "category" in sql
    assert "status = 'active'" not in sql
