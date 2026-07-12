from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_left_navigation_uses_korean_console_names():
    source = read("backend/app/core/menu_seed.py")
    for label in [
        "지식 센터",
        "의도 설계 스튜디오",
        "Pack 생명주기 콘솔",
        "Runtime 시뮬레이션",
        "운영 인사이트",
    ]:
        assert label in source


def test_console_tabs_use_korean_labels():
    sources = "\n".join([
        read("frontend/src/pages/knowledge/KnowledgeCenter.jsx"),
        read("frontend/src/pages/intent-factory/IntentStudio.jsx"),
        read("frontend/src/pages/runtime/RuntimeSimulationConsole.jsx"),
        read("frontend/src/pages/operations/OperationsIntelligenceConsole.jsx"),
        read("frontend/src/pages/packs/PackLifecycleConsole.jsx"),
    ])
    for label in [
        "Source 관리",
        "벡터화 작업",
        "검색 테스트",
        "Intent 관리",
        "Entity/Synonym 관리",
        "Action 관리",
        "LLM 지원 도구",
        "챗봇 대화 테스트",
        "Intent 매칭 테스트",
        "Action 실행 테스트",
        "위젯 미리보기",
        "실시간 모니터링",
        "운영 지표",
        "미응답 분석",
        "개선 요청",
        "Pack 개선 이력",
        "Pack 생명주기 콘솔",
    ]:
        assert label in sources


def test_legacy_english_console_titles_are_removed_from_visible_console_headers():
    sources = "\n".join([
        read("frontend/src/pages/knowledge/KnowledgeCenter.jsx"),
        read("frontend/src/pages/intent-factory/IntentStudio.jsx"),
        read("frontend/src/pages/runtime/RuntimeSimulationConsole.jsx"),
        read("frontend/src/pages/operations/OperationsIntelligenceConsole.jsx"),
        read("frontend/src/pages/packs/PackLifecycleConsole.jsx"),
    ])
    for legacy in [
        ">Knowledge Center<",
        ">Intent Studio<",
        ">Pack Lifecycle Console<",
        ">Runtime Simulation Console<",
        ">Operations Intelligence<",
        "label: 'Sources'",
        "label: 'Index Jobs'",
        "label: 'Search Test'",
        "label: 'Chat QA'",
        "label: 'Intent Match'",
        "label: 'Action Route'",
        "label: 'Widget Preview'",
        "label: 'Realtime'",
        "label: 'Metrics'",
        "label: 'Unanswered'",
        "label: 'Improvement Requests'",
        "label: 'Pack History'",
    ]:
        assert legacy not in sources
