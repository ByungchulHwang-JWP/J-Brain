from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_frontend_registers_global_api_auth_interceptors():
    client = read("frontend/src/api/httpClient.js")
    main = read("frontend/src/main.jsx")

    assert "axios.interceptors.request.use" in client
    assert "axios.interceptors.response.use" in client
    assert "ai_access_token" in client
    assert "Authorization" in client
    assert "Bearer" in client
    assert "status === 401 || status === 403" in client
    assert "localStorage.removeItem('ai_access_token')" in client
    assert "window.location.assign('/login')" in client
    assert "jbrain-auth-session-message" in client
    assert "import './api/httpClient'" in main


def test_source_pages_do_not_show_generic_failure_for_auth_errors():
    source_new = read("frontend/src/pages/SourceNew.jsx")
    source_detail = read("frontend/src/pages/SourceDetail.jsx")

    assert "isAuthError" in source_new
    assert "isAuthError" in source_detail
    assert "로그인 세션이 만료되었습니다" in source_new
    assert "로그인 세션이 만료되었습니다" in source_detail
