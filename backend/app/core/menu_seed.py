from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


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


INTENT_FACTORY_MENU_ITEMS: list[dict[str, Any]] = [
    {"id": 1000, "parent_id": None, "menu_name": "구축 워크플로우", "url": None, "sort_order": 10, "icon_code": "icon-workflow", "scope": "project"},
    {"id": 2000, "parent_id": None, "menu_name": "관리 기능", "url": None, "sort_order": 20, "icon_code": "icon-settings", "scope": "project"},
    {"id": 3000, "parent_id": None, "menu_name": "운영/분석", "url": None, "sort_order": 30, "icon_code": "icon-operations", "scope": "project"},
    {"id": 4000, "parent_id": None, "menu_name": "시스템 관리", "url": None, "sort_order": 40, "icon_code": "icon-system", "scope": "system"},
    {"id": 1010, "parent_id": 1000, "menu_name": "워크플로우 대시보드", "url": "/admin/workflow", "sort_order": 11, "icon_code": None, "scope": "project"},
    {"id": 1110, "parent_id": 1000, "menu_name": "1. 프로젝트 준비", "url": "/admin/workflow/projects/:projectId/stages/1", "sort_order": 21, "icon_code": None, "scope": "project"},
    {"id": 1120, "parent_id": 1000, "menu_name": "2. 지식 준비", "url": "/admin/workflow/projects/:projectId/stages/2", "sort_order": 22, "icon_code": None, "scope": "project"},
    {"id": 1130, "parent_id": 1000, "menu_name": "3. 의도 설계", "url": "/admin/workflow/projects/:projectId/stages/3", "sort_order": 23, "icon_code": None, "scope": "project"},
    {"id": 1140, "parent_id": 1000, "menu_name": "4. 실행 연결", "url": "/admin/workflow/projects/:projectId/stages/4", "sort_order": 24, "icon_code": None, "scope": "project"},
    {"id": 1150, "parent_id": 1000, "menu_name": "5. Pack 검증/빌드", "url": "/admin/workflow/projects/:projectId/stages/5", "sort_order": 25, "icon_code": None, "scope": "project"},
    {"id": 1160, "parent_id": 1000, "menu_name": "6. 배포 및 운영 개선", "url": "/admin/workflow/projects/:projectId/stages/6", "sort_order": 26, "icon_code": None, "scope": "project"},
    {"id": 2010, "parent_id": 2000, "menu_name": "운영 현황", "url": "/admin/dashboard", "sort_order": 41, "icon_code": None, "scope": "system"},
    {"id": 2020, "parent_id": 2000, "menu_name": "프로젝트 관리", "url": "/admin/projects", "sort_order": 42, "icon_code": None, "scope": "system"},
    {"id": 2030, "parent_id": 2000, "menu_name": "Source 관리", "url": "/admin/knowledge/sources", "sort_order": 43, "icon_code": None, "scope": "project"},
    {"id": 2040, "parent_id": 2000, "menu_name": "벡터화 작업 현황", "url": "/admin/knowledge/jobs", "sort_order": 44, "icon_code": None, "scope": "project"},
    {"id": 2050, "parent_id": 2000, "menu_name": "검색 테스트", "url": "/admin/knowledge/search-test", "sort_order": 45, "icon_code": None, "scope": "project"},
    {"id": 2060, "parent_id": 2000, "menu_name": "Intent 관리", "url": "/admin/intent-factory/intents", "sort_order": 46, "icon_code": None, "scope": "project"},
    {"id": 2070, "parent_id": 2000, "menu_name": "Entity/Synonym 관리", "url": "/admin/intent-factory/entities", "sort_order": 47, "icon_code": None, "scope": "project"},
    {"id": 2080, "parent_id": 2000, "menu_name": "FAQ 관리", "url": "/admin/intent-factory/faqs", "sort_order": 48, "icon_code": None, "scope": "project"},
    {"id": 2090, "parent_id": 2000, "menu_name": "Action 관리", "url": "/admin/intent-factory/actions", "sort_order": 49, "icon_code": None, "scope": "project"},
    {"id": 2100, "parent_id": 2000, "menu_name": "LLM 지원 도구", "url": "/admin/intent-factory/llm-assist", "sort_order": 50, "icon_code": None, "scope": "project"},
    {"id": 2110, "parent_id": 2000, "menu_name": "Pack Builder", "url": "/admin/packs/builder", "sort_order": 51, "icon_code": None, "scope": "project"},
    {"id": 2120, "parent_id": 2000, "menu_name": "Pack 검증", "url": "/admin/packs/validation", "sort_order": 52, "icon_code": None, "scope": "project"},
    {"id": 2130, "parent_id": 2000, "menu_name": "Pack Repository", "url": "/admin/packs/repository", "sort_order": 53, "icon_code": None, "scope": "project"},
    {"id": 2140, "parent_id": 2000, "menu_name": "버전/배포 관리", "url": "/admin/packs/versions", "sort_order": 54, "icon_code": None, "scope": "project"},
    {"id": 2150, "parent_id": 2000, "menu_name": "Action 실행 테스트", "url": "/admin/runtime/action-test", "sort_order": 55, "icon_code": None, "scope": "project"},
    {"id": 3010, "parent_id": 3000, "menu_name": "챗봇 대화 테스트", "url": "/admin/runtime/qa", "sort_order": 61, "icon_code": None, "scope": "project"},
    {"id": 3020, "parent_id": 3000, "menu_name": "Intent 매칭 테스트", "url": "/admin/runtime/intent-match", "sort_order": 62, "icon_code": None, "scope": "project"},
    {"id": 3030, "parent_id": 3000, "menu_name": "고객 위젯 미리보기", "url": "/admin/runtime/widget-preview", "sort_order": 63, "icon_code": None, "scope": "project"},
    {"id": 3040, "parent_id": 3000, "menu_name": "실시간 모니터링", "url": "/admin/operations/realtime", "sort_order": 64, "icon_code": None, "scope": "project"},
    {"id": 3050, "parent_id": 3000, "menu_name": "사용 통계", "url": "/admin/operations/stats", "sort_order": 65, "icon_code": None, "scope": "project"},
    {"id": 3060, "parent_id": 3000, "menu_name": "미응답 분석", "url": "/admin/operations/unanswered", "sort_order": 66, "icon_code": None, "scope": "project"},
    {"id": 3070, "parent_id": 3000, "menu_name": "개선 요청 관리", "url": "/admin/operations/improvement-requests", "sort_order": 67, "icon_code": None, "scope": "project"},
    {"id": 3080, "parent_id": 3000, "menu_name": "Pack 개선 이력", "url": "/admin/operations/pack-history", "sort_order": 68, "icon_code": None, "scope": "project"},
    {"id": 3090, "parent_id": 3000, "menu_name": "감사 로그", "url": "/admin/logs", "sort_order": 69, "icon_code": None, "scope": "system"},
    {"id": 4010, "parent_id": 4000, "menu_name": "사용자 관리", "url": "/admin/users", "sort_order": 81, "icon_code": None, "scope": "system"},
    {"id": 4020, "parent_id": 4000, "menu_name": "권한 관리", "url": "/admin/permissions", "sort_order": 82, "icon_code": None, "scope": "system"},
    {"id": 4030, "parent_id": 4000, "menu_name": "시스템 설정", "url": "/admin/system/settings", "sort_order": 83, "icon_code": None, "scope": "system"},
]

MENU_ITEMS = INTENT_FACTORY_MENU_ITEMS


def infer_menu_scope(url: str | None, menu_id: int | None = None) -> str:
    if menu_id is not None:
        seeded = next((item for item in MENU_ITEMS if item["id"] == menu_id), None)
        if seeded and seeded.get("scope"):
            return str(seeded["scope"])
    if url and url.startswith(SYSTEM_PREFIXES):
        return "system"
    if url and url.startswith(PROJECT_PREFIXES):
        return "project"
    return "system"


def build_role_menu_rows(role_id: str) -> list[dict[str, Any]]:
    return [
        {
            "role_id": role_id,
            "menu_id": item["id"],
            "can_read": True,
            "can_write": True,
        }
        for item in INTENT_FACTORY_MENU_ITEMS
    ]


async def seed_intent_factory_menus(
    db: AsyncSession,
    role_id: str = "ROLE_ADMIN",
) -> dict[str, int]:
    await db.execute(
        text("DELETE FROM graphrag.sys_role_menus WHERE role_id = :role_id"),
        {"role_id": role_id},
    )

    for item in INTENT_FACTORY_MENU_ITEMS:
        await db.execute(
            text(
                """
                INSERT INTO graphrag.sys_menus
                    (id, parent_id, menu_name, url, sort_order, icon_code, is_active)
                VALUES
                    (:id, :parent_id, :menu_name, :url, :sort_order, :icon_code, true)
                ON CONFLICT (id) DO UPDATE SET
                    parent_id = EXCLUDED.parent_id,
                    menu_name = EXCLUDED.menu_name,
                    url = EXCLUDED.url,
                    sort_order = EXCLUDED.sort_order,
                    icon_code = EXCLUDED.icon_code,
                    is_active = true
                """
            ),
            item,
        )

    for row in build_role_menu_rows(role_id):
        await db.execute(
            text(
                """
                INSERT INTO graphrag.sys_role_menus
                    (role_id, menu_id, can_read, can_write)
                VALUES
                    (:role_id, :menu_id, :can_read, :can_write)
                ON CONFLICT (role_id, menu_id) DO UPDATE SET
                    can_read = EXCLUDED.can_read,
                    can_write = EXCLUDED.can_write
                """
            ),
            row,
        )

    await db.commit()
    return {
        "menus": len(INTENT_FACTORY_MENU_ITEMS),
        "role_menus": len(INTENT_FACTORY_MENU_ITEMS),
    }
