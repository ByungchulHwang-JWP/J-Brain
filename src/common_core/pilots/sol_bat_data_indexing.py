"""Sol-Bat pilot data indexing runner."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from common_core.admin import AdminService, GraphRAGSearchTestRequest, SourceCreateRequest
from common_core.admin.schemas import IndexJobRequest
from common_core.ai_pipeline.document import SourceType


P1_QUERIES = {
    "DATA-01": "작물 병해충 토양 관리 농사코치",
    "DATA-02": "Hello world",
    "DATA-03": "Hello World",
}


def load_sol_bat_p1_sources(sol_bat_root: Path) -> list[dict[str, Any]]:
    """Load the Sol-Bat P1 pilot source contents."""

    prompt_file = next((sol_bat_root / "doc").glob("*AI*txt"))
    return [
        {
            "source_key": "DATA-01",
            "path": prompt_file,
            "content": prompt_file.read_text(encoding="utf-8", errors="replace"),
        },
        {
            "source_key": "DATA-02",
            "path": sol_bat_root / "test.txt",
            "content": (sol_bat_root / "test.txt").read_text(encoding="utf-8", errors="replace"),
        },
        {
            "source_key": "DATA-03",
            "path": sol_bat_root / "valid_test.pdf",
            "content": _read_pdf_text(sol_bat_root / "valid_test.pdf"),
        },
    ]


def run_sol_bat_p1_indexing(sol_bat_root: Path) -> list[dict[str, Any]]:
    """Run P1 source registration, indexing, preview, and search."""

    service = AdminService()
    summary = []
    for item in load_sol_bat_p1_sources(sol_bat_root):
        path = item["path"]
        source = service.create_source(
            SourceCreateRequest(
                domain="sol_bat",
                source_type=SourceType.TEXT,
                name=path.name,
                content=item["content"],
                scope="GLOBAL",
                tags=["sol_bat", "pilot", item["source_key"]],
                metadata={
                    "source_key": item["source_key"],
                    "file_path": str(path),
                    "file_type": path.suffix.lstrip(".").upper() or "TXT",
                    "pilot_stage": "7.4",
                },
            )
        )
        job = service.create_index_job(IndexJobRequest(source_id=source.source_id))
        completed = service.run_index_job(job.job_id)
        preview = service.get_source_preview(source.source_id)
        search = service.search_test(
            GraphRAGSearchTestRequest(
                domain="sol_bat",
                query=P1_QUERIES[item["source_key"]],
                strategy="HYBRID",
                filters={"source_id": source.source_id},
            )
        )
        summary.append(
            {
                "source_key": item["source_key"],
                "filename": path.name,
                "source_id": source.source_id,
                "job_id": completed.job_id,
                "job_status": completed.status.value,
                "source_status": service.get_source(source.source_id).status.value,
                "content_length": len(item["content"]),
                "metrics": completed.metrics,
                "preview_metrics": preview.metrics,
                "search_query": P1_QUERIES[item["source_key"]],
                "search_status": search.status.value,
                "search_metrics": search.metrics,
                "top_results": [
                    {
                        "rank": result.rank,
                        "type": result.result_type,
                        "score": round(result.score, 4),
                        "metadata": result.metadata,
                        "text": result.text[:120],
                    }
                    for result in search.results[:3]
                ],
            }
        )
    return summary


def _read_pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("pypdf is required to read Sol-Bat pilot PDF samples.") from exc

    reader = PdfReader(str(path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


if __name__ == "__main__":
    default_root = Path(r"D:\Dev\codex\GitHub\Sol-Bat")
    print(json.dumps(run_sol_bat_p1_indexing(default_root), ensure_ascii=False, indent=2))
