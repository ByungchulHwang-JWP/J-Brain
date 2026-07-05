from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ProjectPackResolver:
    default_pack_id: str = "netzero-intent-pack"
    default_pack_version: str = "0.1.0"
    default_runtime_mode: str = "intent_action"

    def resolve(
        self,
        project_id: str,
        requested_pack_id: str | None = None,
        requested_pack_version: str | None = None,
    ) -> dict[str, Any]:
        # Project-specific pack mapping is not persisted yet; use one default pack.
        pack_id = self.default_pack_id
        pack_version = self.default_pack_version

        if requested_pack_id and requested_pack_version:
            pack_id = requested_pack_id
            pack_version = requested_pack_version

        return {
            "project_id": project_id,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "runtime_mode": self.default_runtime_mode,
        }

    def resolve_from_active_record(
        self,
        project_id: str,
        active_record: dict[str, Any] | None,
        requested_pack_id: str | None = None,
        requested_pack_version: str | None = None,
    ) -> dict[str, Any]:
        if requested_pack_id and requested_pack_version:
            return self.resolve(project_id, requested_pack_id, requested_pack_version)

        if active_record and active_record.get("pack_id") and active_record.get("pack_version"):
            return {
                "project_id": project_id,
                "pack_id": active_record["pack_id"],
                "pack_version": active_record["pack_version"],
                "runtime_mode": self.default_runtime_mode,
                "source": "active_runtime_pack",
            }

        return self.resolve(project_id)
