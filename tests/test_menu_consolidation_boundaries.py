import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core import menu_seed


def test_pack_versions_menu_is_deprecated_to_repository():
    deprecated = {
        item["id"]: item
        for item in getattr(menu_seed, "DEPRECATED_MENU_ITEMS", [])
    }
    assert 2140 in deprecated
    assert deprecated[2140]["deprecated_to"] == "/admin/packs?tab=repository"


def test_visible_project_menus_use_consolidated_consoles():
    visible_urls = {
        item["url"]
        for item in menu_seed.INTENT_FACTORY_MENU_ITEMS
        if item.get("url")
    }
    assert "/admin/packs" in visible_urls
    assert "/admin/runtime" in visible_urls
    assert "/admin/operations" in visible_urls
    assert "/admin/packs/versions" not in visible_urls
    assert "/admin/packs/deployment" not in visible_urls


def test_system_logs_are_not_under_project_operations_menu():
    logs_item = next(item for item in menu_seed.INTENT_FACTORY_MENU_ITEMS if item["url"] == "/admin/logs")
    assert logs_item["parent_id"] == 4000
    assert logs_item["scope"] == "system"
