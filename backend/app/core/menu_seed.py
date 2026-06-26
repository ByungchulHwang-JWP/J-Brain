from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


INTENT_FACTORY_MENU_ITEMS: list[dict[str, Any]] = [
    {"id": 1000, "parent_id": None, "menu_name": "대시보드", "url": "/admin/dashboard", "sort_order": 10, "icon_code": "icon-dashboard"},
    {"id": 1100, "parent_id": None, "menu_name": "프로젝트 준비", "url": None, "sort_order": 20, "icon_code": "icon-project"},
    {"id": 1200, "parent_id": None, "menu_name": "지식 자료 관리", "url": None, "sort_order": 30, "icon_code": "icon-knowledge"},
    {"id": 1300, "parent_id": None, "menu_name": "Intent Factory", "url": None, "sort_order": 40, "icon_code": "icon-intent"},
    {"id": 1400, "parent_id": None, "menu_name": "Pack 제작/배포", "url": None, "sort_order": 50, "icon_code": "icon-pack"},
    {"id": 1500, "parent_id": None, "menu_name": "Runtime 테스트", "url": None, "sort_order": 60, "icon_code": "icon-runtime"},
    {"id": 1600, "parent_id": None, "menu_name": "운영 및 개선", "url": None, "sort_order": 70, "icon_code": "icon-operations"},
    {"id": 1700, "parent_id": None, "menu_name": "시스템 관리", "url": None, "sort_order": 80, "icon_code": "icon-settings"},
    {"id": 1110, "parent_id": 1100, "menu_name": "프로젝트 목록", "url": "/admin/projects", "sort_order": 21, "icon_code": None},
    {"id": 1120, "parent_id": 1100, "menu_name": "프로젝트 등록", "url": "/admin/projects/new", "sort_order": 22, "icon_code": None},
    {"id": 1130, "parent_id": 1100, "menu_name": "고객사/서비스 정보", "url": "/admin/project-settings/service", "sort_order": 23, "icon_code": None},
    {"id": 1140, "parent_id": 1100, "menu_name": "메뉴/화면/API 정보 관리", "url": "/admin/project-settings/integration-map", "sort_order": 24, "icon_code": None},
    {"id": 1210, "parent_id": 1200, "menu_name": "Source 목록", "url": "/admin/knowledge/sources", "sort_order": 31, "icon_code": None},
    {"id": 1220, "parent_id": 1200, "menu_name": "Source 등록", "url": "/admin/knowledge/sources/new", "sort_order": 32, "icon_code": None},
    {"id": 1230, "parent_id": 1200, "menu_name": "벡터화 작업 현황", "url": "/admin/knowledge/jobs", "sort_order": 33, "icon_code": None},
    {"id": 1240, "parent_id": 1200, "menu_name": "검색 테스트", "url": "/admin/knowledge/search-test", "sort_order": 34, "icon_code": None},
    {"id": 1250, "parent_id": 1200, "menu_name": "문서 Preview", "url": "/admin/knowledge/preview", "sort_order": 35, "icon_code": None},
    {"id": 1310, "parent_id": 1300, "menu_name": "Intent 관리", "url": "/admin/intent-factory/intents", "sort_order": 41, "icon_code": None},
    {"id": 1320, "parent_id": 1300, "menu_name": "Entity 관리", "url": "/admin/intent-factory/entities", "sort_order": 42, "icon_code": None},
    {"id": 1330, "parent_id": 1300, "menu_name": "Synonym 관리", "url": "/admin/intent-factory/synonyms", "sort_order": 43, "icon_code": None},
    {"id": 1340, "parent_id": 1300, "menu_name": "FAQ 관리", "url": "/admin/intent-factory/faqs", "sort_order": 44, "icon_code": None},
    {"id": 1350, "parent_id": 1300, "menu_name": "Action 관리", "url": "/admin/intent-factory/actions", "sort_order": 45, "icon_code": None},
    {"id": 1360, "parent_id": 1300, "menu_name": "LLM 지원 도구", "url": "/admin/intent-factory/llm-assist", "sort_order": 46, "icon_code": None},
    {"id": 1410, "parent_id": 1400, "menu_name": "Pack Builder", "url": "/admin/packs/builder", "sort_order": 51, "icon_code": None},
    {"id": 1420, "parent_id": 1400, "menu_name": "Pack 검증", "url": "/admin/packs/validation", "sort_order": 52, "icon_code": None},
    {"id": 1430, "parent_id": 1400, "menu_name": "Pack Repository", "url": "/admin/packs/repository", "sort_order": 53, "icon_code": None},
    {"id": 1440, "parent_id": 1400, "menu_name": "버전 관리", "url": "/admin/packs/versions", "sort_order": 54, "icon_code": None},
    {"id": 1450, "parent_id": 1400, "menu_name": "배포 패키지 생성", "url": "/admin/packs/deployment", "sort_order": 55, "icon_code": None},
    {"id": 1510, "parent_id": 1500, "menu_name": "챗봇 대화 테스트", "url": "/admin/runtime/qa", "sort_order": 61, "icon_code": None},
    {"id": 1520, "parent_id": 1500, "menu_name": "Intent 매칭 테스트", "url": "/admin/runtime/intent-match", "sort_order": 62, "icon_code": None},
    {"id": 1530, "parent_id": 1500, "menu_name": "Action 실행 테스트", "url": "/admin/runtime/action-test", "sort_order": 63, "icon_code": None},
    {"id": 1540, "parent_id": 1500, "menu_name": "고객 위젯 미리보기", "url": "/admin/runtime/widget-preview", "sort_order": 64, "icon_code": None},
    {"id": 1610, "parent_id": 1600, "menu_name": "실시간 모니터링", "url": "/admin/operations/realtime", "sort_order": 71, "icon_code": None},
    {"id": 1620, "parent_id": 1600, "menu_name": "사용 통계", "url": "/admin/operations/stats", "sort_order": 72, "icon_code": None},
    {"id": 1630, "parent_id": 1600, "menu_name": "미응답 분석", "url": "/admin/operations/unanswered", "sort_order": 73, "icon_code": None},
    {"id": 1640, "parent_id": 1600, "menu_name": "개선 요청 관리", "url": "/admin/operations/improvement-requests", "sort_order": 74, "icon_code": None},
    {"id": 1650, "parent_id": 1600, "menu_name": "Pack 개선 이력", "url": "/admin/operations/pack-history", "sort_order": 75, "icon_code": None},
    {"id": 1710, "parent_id": 1700, "menu_name": "사용자 관리", "url": "/admin/users", "sort_order": 81, "icon_code": None},
    {"id": 1720, "parent_id": 1700, "menu_name": "권한 관리", "url": "/admin/permissions", "sort_order": 82, "icon_code": None},
    {"id": 1730, "parent_id": 1700, "menu_name": "감사 로그", "url": "/admin/logs", "sort_order": 83, "icon_code": None},
    {"id": 1740, "parent_id": 1700, "menu_name": "시스템 설정", "url": "/admin/system/settings", "sort_order": 84, "icon_code": None},
]


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
