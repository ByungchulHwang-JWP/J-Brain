import unittest

from app.core.menu_seed import INTENT_FACTORY_MENU_ITEMS, build_role_menu_rows


class MenuSeedTest(unittest.TestCase):
    def test_lifecycle_menu_groups_exist_in_order(self):
        roots = [item for item in INTENT_FACTORY_MENU_ITEMS if item["parent_id"] is None]
        titles = [item["menu_name"] for item in roots]

        self.assertEqual(
            titles,
            [
                "구축 워크플로우",
                "관리 기능",
                "운영/분석",
                "시스템 관리",
            ],
        )

    def test_each_child_has_existing_parent(self):
        ids = {item["id"] for item in INTENT_FACTORY_MENU_ITEMS}
        for item in INTENT_FACTORY_MENU_ITEMS:
            parent_id = item["parent_id"]
            if parent_id is not None:
                self.assertIn(parent_id, ids)

    def test_admin_role_mapping_covers_all_menu_items(self):
        rows = build_role_menu_rows("ROLE_ADMIN")
        menu_ids = {item["id"] for item in INTENT_FACTORY_MENU_ITEMS}
        mapped_ids = {row["menu_id"] for row in rows}

        self.assertEqual(mapped_ids, menu_ids)
        self.assertTrue(all(row["can_read"] for row in rows))
        self.assertTrue(all(row["can_write"] for row in rows))

    def test_menu_seed_contains_urls_for_leaf_items(self):
        for item in INTENT_FACTORY_MENU_ITEMS:
            has_children = any(
                child["parent_id"] == item["id"] for child in INTENT_FACTORY_MENU_ITEMS
            )
            if not has_children:
                self.assertIsInstance(item["url"], str)
                self.assertTrue(item["url"].startswith("/admin/"))

    def test_registration_and_detail_pages_are_not_sidebar_menus(self):
        names = {item["menu_name"] for item in INTENT_FACTORY_MENU_ITEMS}
        urls = {item["url"] for item in INTENT_FACTORY_MENU_ITEMS if item["url"]}

        self.assertIn("구축 워크플로우", names)
        self.assertIn("워크플로우 대시보드", names)
        self.assertNotIn("프로젝트 선택/목록", names)
        self.assertIn("1. 프로젝트 준비", names)
        self.assertIn("5. Pack 검증/빌드", names)
        self.assertIn("6. 배포 및 운영 개선", names)
        self.assertNotIn("12. 운영 분석/개선", names)
        self.assertIn("프로젝트 관리", names)
        self.assertIn("Source 관리", names)
        self.assertIn("Entity/Synonym 관리", names)
        self.assertIn("Pack Repository", names)
        self.assertIn("버전/배포 관리", names)
        self.assertIn("감사 로그", names)

        self.assertNotIn("프로젝트 등록", names)
        self.assertNotIn("Source 등록", names)
        self.assertNotIn("Synonym 관리", names)
        self.assertNotIn("/admin/projects/new", urls)
        self.assertNotIn("/admin/knowledge/sources/new", urls)
        self.assertNotIn("/admin/intent-factory/synonyms", urls)


if __name__ == "__main__":
    unittest.main()
