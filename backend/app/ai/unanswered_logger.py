from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class UnansweredLogger:
    def __init__(self, log_path: Path | str):
        self.log_path = Path(log_path)

    def append(
        self,
        *,
        question: str,
        pack_id: str,
        pack_version: str,
        intent_id: str | None,
        action_id: str | None,
        confidence_label: str,
        project_id: str | None = None,
        matches: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        log_id = self._next_log_id()
        record = {
            "log_id": log_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "open",
            "project_id": project_id,
            "question": question,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "intent_id": intent_id,
            "action_id": action_id,
            "confidence_label": confidence_label,
            "matches": matches or [],
        }
        with self.log_path.open("a", encoding="utf-8") as file:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
        return record

    def list_recent(self, limit: int = 100) -> list[dict[str, Any]]:
        if not self.log_path.exists():
            return []

        records = []
        for line in self.log_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            records.append(json.loads(line))
        return list(reversed(records[-limit:]))

    def update_status(
        self,
        log_id: str,
        status: str,
        extra_fields: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self.log_path.exists():
            raise FileNotFoundError(f"unanswered log file not found: {self.log_path}")

        records = []
        updated_record = None
        for line in self.log_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            if record.get("log_id") == log_id:
                record.update(extra_fields or {})
                record["status"] = status
                record["updated_at"] = datetime.now(timezone.utc).isoformat()
                updated_record = record
            records.append(record)

        if not updated_record:
            raise KeyError(log_id)

        with self.log_path.open("w", encoding="utf-8") as file:
            for record in records:
                file.write(json.dumps(record, ensure_ascii=False) + "\n")

        return updated_record

    def _next_log_id(self) -> str:
        count = 0
        if self.log_path.exists():
            count = sum(
                1
                for line in self.log_path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            )
        return f"UNANSWERED-{count + 1:06d}"


def default_unanswered_log_path() -> Path:
    return Path(__file__).resolve().parents[2] / "app_data" / "unanswered_questions.jsonl"
