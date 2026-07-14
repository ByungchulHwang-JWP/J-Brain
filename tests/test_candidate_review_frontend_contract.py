from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_candidate_review_uses_common_pagination_for_candidate_list():
    source = read("frontend/src/pages/intent-factory/CandidateReview.jsx")

    assert "import Pagination from '../../components/common/Pagination';" in source
    assert "const [currentPage, setCurrentPage] = useState(1);" in source
    assert "const [pageSize, setPageSize] = useState(20);" in source
    assert "const paginatedItems = useMemo(() => {" in source
    assert "orderedItems.slice(start, start + pageSize)" in source
    assert "paginatedItems.map((item) =>" in source
    assert "<Pagination" in source
    assert "onPageSizeChange={setPageSize}" in source


def test_knowledge_stage_embeds_candidate_review_for_stage_two_candidates():
    source = read("frontend/src/pages/workflow/stages/KnowledgeStage.jsx")

    assert "import CandidateReview from '../../intent-factory/CandidateReview';" in source
    assert "<CandidateReview embedded={true} />" in source
