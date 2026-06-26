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
