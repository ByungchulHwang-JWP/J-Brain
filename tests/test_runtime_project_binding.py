import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.api import action_route, intent_match


def route_paths(module):
    return {route.path for route in module.router.routes}


def test_intent_match_has_project_scoped_route():
    assert "/projects/{project_id}" in route_paths(intent_match)


def test_action_route_has_project_scoped_route():
    assert "/projects/{project_id}" in route_paths(action_route)
