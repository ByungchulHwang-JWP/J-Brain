import re
from difflib import SequenceMatcher

def _normalize(text: str) -> str:
    lowered = text.lower()
    normalized = re.sub(r"[^0-9a-zA-Z가-힣]+", " ", lowered)
    return re.sub(r"\s+", " ", normalized).strip()

q = "J-Brain 어떻게 사용하나요?"
title = "J-Brain 어떻게 사용하나요?"

nq = _normalize(q)
nt = _normalize(title)
print("Normalized query:", nq)
print("Normalized title:", nt)
print("title_exact:", nq == nt)
print("title_ratio:", SequenceMatcher(None, nq, nt).ratio())

