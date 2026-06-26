import unittest

from app.core.menu_seed import INTENT_FACTORY_MENU_ITEMS, build_role_menu_rows


class MenuSeedTest(unittest.TestCase):
    def test_lifecycle_menu_groups_exist_in_order(self):
        roots = [item for item in INTENT_FACTORY_MENU_ITEMS if item["parent_id"] is None]
        titles = [item["menu_name"] for item in roots]

        self.assertEqual(
            titles,
            [
                "대시보드",
                "프로젝트 준비",
                "지식 자료 관리",
                "Intent Factory",
                "Pack 제작/배포",
                "Runtime 테스트",
                "운영 및 개선",
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


if __name__ == "__main__":
    unittest.main()
