-- J-Brain Workspace -> Project 용어 일괄 변경에 따른 시스템 메뉴 업데이트 스크립트
-- DB에서 아래 쿼리를 실행해 주시기 바랍니다.

UPDATE graphrag.sys_menus 
SET menu_name = REPLACE(menu_name, '워크스페이스', '프로젝트'),
    url = REPLACE(url, '/admin/workspaces', '/admin/projects')
WHERE menu_name LIKE '%워크스페이스%' OR url LIKE '%/admin/workspaces%';
