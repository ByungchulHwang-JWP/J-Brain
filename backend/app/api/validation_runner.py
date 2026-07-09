from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.ai.intent_pack_loader import IntentPackValidationError
from app.ai.validation_runner import ValidationRunner
from app.api.intent_packs import get_pack_loader


router = APIRouter()


@router.get("")
async def run_validation(
    pack_id: str = Query(default="netzero-intent-pack"),
    pack_version: str = Query(default="0.1.0"),
) -> dict[str, Any]:
    loader = get_pack_loader()
    try:
        pack = loader.load_pack(pack_id, pack_version)
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return await ValidationRunner(pack).run()
