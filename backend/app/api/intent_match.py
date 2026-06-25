from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPackValidationError
from app.api.intent_packs import get_pack_loader


router = APIRouter()


class IntentMatchRequest(BaseModel):
    question: str = Field(..., min_length=1)
    pack_id: str = "netzero-intent-pack"
    pack_version: str = "0.1.0"
    top_k: int = Field(default=3, ge=1, le=10)


@router.post("")
async def match_intent(req: IntentMatchRequest) -> dict[str, Any]:
    loader = get_pack_loader()
    try:
        pack = loader.load_pack(req.pack_id, req.pack_version)
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    matcher = IntentMatcher(pack)
    matches = matcher.match(req.question, top_k=req.top_k)
    return {
        "pack_id": req.pack_id,
        "pack_version": req.pack_version,
        "question": req.question,
        "top_k": req.top_k,
        "matches": matches,
    }
