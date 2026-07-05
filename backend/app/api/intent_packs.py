from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.ai.intent_pack_loader import IntentPackLoader, IntentPackValidationError


router = APIRouter()


def _default_pack_root() -> Path:
    from app.services.pack_store_service import PACK_STORE_ROOT
    return PACK_STORE_ROOT


def get_pack_loader() -> IntentPackLoader:
    return IntentPackLoader(_default_pack_root())


@router.get("")
async def list_intent_packs() -> list[dict[str, Any]]:
    return get_pack_loader().list_packs()


@router.get("/{pack_id}")
async def get_intent_pack(
    pack_id: str,
    version: str | None = Query(default=None),
) -> dict[str, Any]:
    loader = get_pack_loader()
    try:
        pack = loader.load_pack(pack_id, version)
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return loader.build_summary(pack)
