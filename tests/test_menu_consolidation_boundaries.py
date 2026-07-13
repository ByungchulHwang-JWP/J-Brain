import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core import menu_seed


CONSOLIDATED_CONSOLES = {
    "/admin/knowledge": "지식 센터",
    "/admin/intent-factory": "의도 설계 스튜디오",
    "/admin/packs": "Pack 생명주기 콘솔",
    "/admin/runtime": "Runtime 시뮬레이션",
    "/admin/operations": "운영 인사이트",
}

LEGACY_LIST_ROUTES = {
    "/admin/knowledge/sources": "/admin/knowledge?tab=sources",
    "/admin/knowledge/jobs": "/admin/knowledge?tab=jobs",
    "/admin/knowledge/search-test": "/admin/knowledge?tab=search-test",
    "/admin/intent-factory/intents": "/admin/intent-factory?tab=intents",
    "/admin/intent-factory/entities": "/admin/intent-factory?tab=entities",
    "/admin/intent-factory/synonyms": "/admin/intent-factory?tab=entities",
    "/admin/intent-factory/faqs": "/admin/intent-factory?tab=faqs",
    "/admin/intent-factory/actions": "/admin/intent-factory?tab=actions",
    "/admin/intent-factory/llm-assist": "/admin/intent-factory?tab=llm-assist",
    "/admin/packs/builder": "/admin/packs?tab=build",
    "/admin/packs/validation": "/admin/packs?tab=validation",
    "/admin/packs/repository": "/admin/packs?tab=repository",
    "/admin/packs/versions": "/admin/packs?tab=repository",
    "/admin/packs/deployment": "/admin/packs?tab=repository",
    "/admin/runtime/qa": "/admin/runtime?tab=chat",
    "/admin/runtime/intent-match": "/admin/runtime?tab=intent-match",
    "/admin/runtime/action-test": "/admin/runtime?tab=action-route",
    "/admin/runtime/widget-preview": "/admin/runtime?tab=widget-preview",
    "/admin/operations/realtime": "/admin/operations?tab=realtime",
    "/admin/operations/stats": "/admin/operations?tab=metrics",
    "/admin/operations/unanswered": "/admin/operations?tab=unanswered",
    "/admin/operations/improvement-requests": "/admin/operations?tab=improvements",
    "/admin/operations/pack-history": "/admin/operations?tab=pack-history",
}

DETAIL_ROUTES = {
    "/admin/knowledge/sources/new",
    "/admin/sources/new",
    "/admin/sources/:id",
    "/admin/sources/:id/preview",
    "/admin/intent-factory/intents/new",
    "/admin/intent-factory/intents/:intentId",
    "/admin/intent-factory/candidates/:projectId",
    "/admin/projects/:projectId/jobs/:jobId",
}

VISIBLE_SYSTEM_MENU_URLS = {
    "/admin/users",
    "/admin/permissions",
    "/admin/system/settings",
    "/admin/logs",
}

SYSTEM_SCOPED_URLS = {
    *VISIBLE_SYSTEM_MENU_URLS,
    "/admin/stats",
}


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
    visible_names_by_url = {
        item["url"]: item["menu_name"]
        for item in menu_seed.INTENT_FACTORY_MENU_ITEMS
        if item.get("url")
    }
    for url, menu_name in CONSOLIDATED_CONSOLES.items():
        assert url in visible_urls
        assert visible_names_by_url[url] == menu_name
    for legacy_url in LEGACY_LIST_ROUTES:
        assert legacy_url not in visible_urls


def test_knowledge_center_legacy_routes_are_consolidated():
    targets = menu_seed.CONSOLIDATED_MENU_TARGETS
    assert targets["/admin/knowledge/sources"] == "/admin/knowledge?tab=sources"
    assert targets["/admin/knowledge/jobs"] == "/admin/knowledge?tab=jobs"
    assert targets["/admin/knowledge/search-test"] == "/admin/knowledge?tab=search-test"


def test_intent_studio_legacy_routes_are_consolidated():
    targets = menu_seed.CONSOLIDATED_MENU_TARGETS
    assert targets["/admin/intent-factory/intents"] == "/admin/intent-factory?tab=intents"
    assert targets["/admin/intent-factory/entities"] == "/admin/intent-factory?tab=entities"
    assert targets["/admin/intent-factory/synonyms"] == "/admin/intent-factory?tab=entities"
    assert targets["/admin/intent-factory/faqs"] == "/admin/intent-factory?tab=faqs"
    assert targets["/admin/intent-factory/actions"] == "/admin/intent-factory?tab=actions"
    assert targets["/admin/intent-factory/llm-assist"] == "/admin/intent-factory?tab=llm-assist"


def test_all_legacy_list_routes_have_consolidated_targets():
    assert menu_seed.CONSOLIDATED_MENU_TARGETS == LEGACY_LIST_ROUTES


def test_detail_routes_are_not_treated_as_consolidated_list_routes():
    for detail_route in DETAIL_ROUTES:
        assert detail_route not in menu_seed.CONSOLIDATED_MENU_TARGETS


def test_consolidated_project_consoles_are_project_scoped():
    visible_by_url = {
        item["url"]: item
        for item in menu_seed.INTENT_FACTORY_MENU_ITEMS
        if item.get("url")
    }
    for url in CONSOLIDATED_CONSOLES:
        assert visible_by_url[url]["scope"] == "project"


def test_system_global_menus_are_system_scoped():
    visible_by_url = {
        item["url"]: item
        for item in menu_seed.INTENT_FACTORY_MENU_ITEMS
        if item.get("url")
    }
    for url in VISIBLE_SYSTEM_MENU_URLS:
        assert visible_by_url[url]["scope"] == "system"
    for url in SYSTEM_SCOPED_URLS:
        assert menu_seed.infer_menu_scope(url) == "system"


def test_system_logs_are_not_under_project_operations_menu():
    logs_item = next(item for item in menu_seed.INTENT_FACTORY_MENU_ITEMS if item["url"] == "/admin/logs")
    assert logs_item["parent_id"] == 4000
    assert logs_item["scope"] == "system"
