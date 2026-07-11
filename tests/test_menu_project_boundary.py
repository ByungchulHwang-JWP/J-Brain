import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.menu_seed import MENU_ITEMS


PROJECT_PREFIXES = (
    "/admin/workflow",
    "/admin/sources",
    "/admin/knowledge",
    "/admin/intent-factory",
    "/admin/packs",
    "/admin/runtime",
    "/admin/operations",
)

SYSTEM_PREFIXES = (
    "/admin/users",
    "/admin/permissions",
    "/admin/prompt",
    "/admin/logs",
    "/admin/stats",
    "/admin/system",
)


def test_project_and_system_menu_boundaries_are_explicit():
    project_items = [item for item in MENU_ITEMS if str(item.get("url", "")).startswith(PROJECT_PREFIXES)]
    system_items = [item for item in MENU_ITEMS if str(item.get("url", "")).startswith(SYSTEM_PREFIXES)]

    assert project_items
    assert system_items
    assert all(item.get("scope") == "project" for item in project_items)
    assert all(item.get("scope") == "system" for item in system_items)
