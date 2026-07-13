from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_project_context_does_not_reload_projects_on_every_route_change():
    source = read("frontend/src/context/ProjectContext.jsx")

    effect_body = source.split("useEffect(() => {", 1)[1].split("}, [location.pathname", 1)[0]

    assert "projects.length === 0" in effect_body
    assert "location.pathname.startsWith('/admin')" in effect_body


def test_admin_header_project_select_keeps_project_routes_in_sync():
    source = read("frontend/src/components/Layout/AdminLayout.jsx")

    handler = source.split("const handleProjectChange = (projectId) => {", 1)[1].split("  const menuIcons", 1)[0]

    assert "setSelectedProjectId(projectId);" in handler
    assert "pathname.startsWith('/admin/workflow/projects/')" in handler
    assert "`/admin/workflow/projects/${encodedProjectId}`" in handler
    assert "onChange={(event) => handleProjectChange(event.target.value)}" in source
