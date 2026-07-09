from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.action_router import ActionRouter
from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPackValidationError
from app.ai.unanswered_logger import UnansweredLogger, default_unanswered_log_path
from app.api.intent_packs import get_pack_loader


router = APIRouter()


class ActionRouteRequest(BaseModel):
    question: str = Field(..., min_length=1)
    pack_id: str = "netzero-intent-pack"
    pack_version: str = "0.1.0"
    top_k: int = Field(default=3, ge=1, le=10)


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

@router.post("")
async def route_action(
    req: ActionRouteRequest,
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    loader = get_pack_loader()
    try:
        pack = loader.load_pack(req.pack_id, req.pack_version)
    except IntentPackValidationError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    matches = IntentMatcher(pack).match(req.question, top_k=req.top_k)
    logger = UnansweredLogger(default_unanswered_log_path())
    card = await ActionRouter(pack, unanswered_logger=logger, db=db).route(req.question, matches)
    return {
        "pack_id": req.pack_id,
        "pack_version": req.pack_version,
        "question": req.question,
        "matches": matches,
        "card": card,
    }
