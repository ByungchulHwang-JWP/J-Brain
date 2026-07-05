from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class IntentPackValidationError(Exception):
    """Raised when an Intent Pack cannot be loaded or fails validation."""


@dataclass(frozen=True)
class IntentPack:
    root_dir: Path
    manifest: dict[str, Any]
    profile: dict[str, Any]
    nlu: dict[str, Any]
    action: dict[str, Any]
    knowledge: dict[str, Any]
    templates: dict[str, Any]
    validation: dict[str, Any]

    @property
    def intents_by_id(self) -> dict[str, dict[str, Any]]:
        return {item["intent_id"]: item for item in self.nlu["intents"]}

    @property
    def actions_by_id(self) -> dict[str, dict[str, Any]]:
        return {item["action_id"]: item for item in self.action["action_registry"]}

    @property
    def routes_by_id(self) -> dict[str, dict[str, Any]]:
        return {item["route_id"]: item for item in self.action["screen_routes"]}

    @property
    def routes_by_action_id(self) -> dict[str, list[dict[str, Any]]]:
        routes: dict[str, list[dict[str, Any]]] = {}
        for route in self.action["screen_routes"]:
            routes.setdefault(route["action_id"], []).append(route)
        return routes


class IntentPackLoader:
    REQUIRED_FILES = {
        "manifest": ["manifest/pack_manifest.json"],
        "profile": ["profile/service_profile.json"],
        "nlu": [
            "nlu/intents.json",
            "nlu/intent_examples.json",
            "nlu/entities.json",
            "nlu/entity_synonyms.json",
            "nlu/confidence_policy.json",
        ],
        "action": [
            "action/action_registry.json",
            "action/action_parameters.json",
            "action/api_mappings.json",
            "action/sql_templates.json",
            "action/screen_routes.json",
        ],
        "knowledge": [
            "knowledge/faqs.json",
            "knowledge/approved_documents.json",
            "knowledge/metadata_policy.json",
        ],
        "templates": [
            "templates/response_templates.json",
            "templates/card_templates.json",
            "templates/fallback_templates.json",
        ],
        "validation": [
            "validation/validation_questions.json",
            "validation/expected_results.json",
            "validation/acceptance_criteria.json",
        ],
    }

    def __init__(self, pack_root: Path | str):
        self.pack_root = Path(pack_root)

    def load_pack(self, pack_id: str, pack_version: str | None = None) -> IntentPack:
        pack_dir = self._resolve_pack_dir(pack_id, pack_version)
        sections = self._load_sections(pack_dir)
        sections["manifest"] = sections["manifest"]["pack_manifest"]
        sections["profile"] = sections["profile"]["service_profile"]
        pack = IntentPack(root_dir=pack_dir, **sections)
        validation = self.validate_pack(pack)
        if not validation["valid"]:
            raise IntentPackValidationError(
                f"Intent Pack validation failed: {validation['errors']}"
            )
        return pack

    def list_packs(self) -> list[dict[str, Any]]:
        if not self.pack_root.exists():
            return []

        packs = []
        for pack_dir in sorted(p for p in self.pack_root.iterdir() if p.is_dir()):
            manifest_path = pack_dir / "manifest" / "pack_manifest.json"
            profile_path = pack_dir / "profile" / "service_profile.json"
            if not manifest_path.exists() or not profile_path.exists():
                continue
            manifest = self._read_json(manifest_path)
            profile = self._read_json(profile_path)
            packs.append(
                {
                    "pack_id": manifest.get("pack_id") or profile.get("pack_id"),
                    "pack_version": manifest.get("pack_version")
                    or profile.get("pack_version"),
                    "service_id": profile.get("service_id"),
                    "service_name": profile.get("service_name"),
                    "path": str(pack_dir),
                }
            )
        return packs

    def build_summary(self, pack: IntentPack) -> dict[str, Any]:
        validation = self.validate_pack(pack)
        navigation_actions: dict[str, list[dict[str, Any]]] = {}
        for action_id, routes in pack.routes_by_action_id.items():
            action = pack.actions_by_id.get(action_id)
            if not action or action.get("action_type") != "NAVIGATE":
                continue
            navigation_actions[action_id] = [
                {
                    "route_id": route.get("route_id"),
                    "menu_name": route.get("menu_name"),
                    "route_type": route.get("route_type"),
                    "route_value": route.get("route_value"),
                    "required_role": route.get("required_role"),
                    "status": route.get("status"),
                    "service_id": route.get("service_id", pack.profile.get("service_id")),
                }
                for route in routes
            ]

        return {
            "pack_id": pack.manifest.get("pack_id") or pack.profile.get("pack_id"),
            "pack_version": pack.manifest.get("pack_version")
            or pack.profile.get("pack_version"),
            "service_id": pack.profile.get("service_id"),
            "service_name": pack.profile.get("service_name"),
            "target_environment": pack.profile.get("target_environment"),
            "root_dir": str(pack.root_dir),
            "counts": validation["counts"],
            "validation": validation,
            "navigation_actions": navigation_actions,
        }

    def validate_pack(self, pack: IntentPack) -> dict[str, Any]:
        errors: list[str] = []
        intents = pack.nlu["intents"]
        actions = pack.action["action_registry"]
        routes = pack.action["screen_routes"]
        questions = pack.validation["validation_questions"]

        intent_ids = self._unique_ids(intents, "intent_id", errors)
        action_ids = self._unique_ids(actions, "action_id", errors)
        route_ids = self._unique_ids(routes, "route_id", errors)

        for intent in intents:
            action_id = intent.get("action_id")
            if action_id and action_id not in action_ids:
                errors.append(
                    f"Intent {intent.get('intent_id')} references missing action {action_id}"
                )

        for route in routes:
            action_id = route.get("action_id")
            if action_id and action_id not in action_ids:
                errors.append(
                    f"Route {route.get('route_id')} references missing action {action_id}"
                )

        for question in questions:
            expected_intent_id = question.get("expected_intent_id")
            expected_action_id = question.get("expected_action_id")
            if expected_intent_id and expected_intent_id not in intent_ids:
                errors.append(
                    f"Question {question.get('question_id')} references missing intent {expected_intent_id}"
                )
            if expected_action_id and expected_action_id not in action_ids:
                errors.append(
                    f"Question {question.get('question_id')} references missing action {expected_action_id}"
                )

        manifest_files = set(pack.manifest.get("files", []))
        required_files = {
            file_name
            for file_names in self.REQUIRED_FILES.values()
            for file_name in file_names
        }
        missing_manifest_entries = sorted(required_files - manifest_files)
        for file_name in missing_manifest_entries:
            errors.append(f"Manifest missing required file entry {file_name}")

        return {
            "valid": not errors,
            "error_count": len(errors),
            "errors": errors,
            "counts": {
                "intents": len(intent_ids),
                "actions": len(action_ids),
                "routes": len(route_ids),
                "validation_questions": len(questions),
            },
        }

    def _resolve_pack_dir(self, pack_id: str, pack_version: str | None) -> Path:
        candidates = []
        if pack_version:
            candidates.append(self.pack_root / f"{pack_id}-v{pack_version}")
        candidates.append(self.pack_root / pack_id)

        for candidate in candidates:
            if candidate.exists() and candidate.is_dir():
                return candidate

        raise IntentPackValidationError(
            f"Intent Pack directory not found: pack_id={pack_id}, pack_version={pack_version}"
        )

    def _load_sections(self, pack_dir: Path) -> dict[str, dict[str, Any]]:
        sections: dict[str, dict[str, Any]] = {}
        for section_name, file_names in self.REQUIRED_FILES.items():
            sections[section_name] = {}
            for file_name in file_names:
                file_path = pack_dir / file_name
                if not file_path.exists():
                    raise IntentPackValidationError(
                        f"Intent Pack required file not found: {file_name}"
                    )
                key = Path(file_name).stem
                sections[section_name][key] = self._read_json(file_path)
        return sections

    def _read_json(self, file_path: Path) -> Any:
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise IntentPackValidationError(
                f"Invalid JSON file: {file_path} ({exc})"
            ) from exc

    def _unique_ids(
        self,
        items: list[dict[str, Any]],
        key: str,
        errors: list[str],
    ) -> set[str]:
        ids: set[str] = set()
        for item in items:
            item_id = item.get(key)
            if not item_id:
                errors.append(f"Missing required id field {key}: {item}")
                continue
            if item_id in ids:
                errors.append(f"Duplicate id {item_id} for field {key}")
            ids.add(item_id)
        return ids
