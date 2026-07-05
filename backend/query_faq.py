import asyncio
from app.db.session import AsyncSessionLocal
from app.api.chat_runtime import build_runtime_response
from app.ai.intent_pack_loader import IntentPackLoader
from pathlib import Path

async def main():
    loader = IntentPackLoader(Path("app_data/runtime_pack_store"))
    pack = loader.load_pack("J-Brain-intent-pack", "0.1.0")
    res = build_runtime_response("J-Brain", "J-Brain 어떻게 사용하나요?", pack, log_fallback=False)
    
    print("----- Matches -----")
    print(res.get("matches"))
    print("----- Card -----")
    print(res.get("card"))

asyncio.run(main())
