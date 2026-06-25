import re
from difflib import SequenceMatcher
from typing import Any

from app.ai.intent_pack_loader import IntentPack


_TOKEN_RE = re.compile(r"[0-9a-zA-Z가-힣]+")


class SearchDocAction:
    def __init__(self, pack: IntentPack):
        self.pack = pack
        self.documents = self._build_documents()

    def search(self, query: str, top_k: int = 3) -> list[dict[str, Any]]:
        normalized_query = self._normalize(query)
        query_tokens = set(self._tokens(normalized_query))
        query_ngrams = self._char_ngrams(normalized_query)

        scored = []
        for document in self.documents:
            score = self._score_document(
                normalized_query,
                query_tokens,
                query_ngrams,
                document,
            )
            if score <= 0:
                continue
            scored.append({**document, "score": round(score, 4)})

        scored.sort(key=lambda item: (item["score"], item["source_id"]), reverse=True)
        return scored[: max(top_k, 0)]

    def _build_documents(self) -> list[dict[str, Any]]:
        documents: list[dict[str, Any]] = []
        for faq in self.pack.knowledge["faqs"]:
            documents.append(
                {
                    "source_id": faq["faq_id"],
                    "source_type": "faq",
                    "title": faq["question"],
                    "snippet": faq["answer"],
                    "section": "FAQ",
                    "source_ref": faq.get("faq_id"),
                    "tags": faq.get("tags", []),
                }
            )

        for doc in self.pack.knowledge["approved_documents"]:
            if not doc.get("approved_for_indexing"):
                continue
            if "SEARCH_DOC" not in doc.get("allowed_actions", []):
                continue
            tags = doc.get("tags", [])
            documents.append(
                {
                    "source_id": doc["document_id"],
                    "source_type": doc["source_type"],
                    "title": doc["title"],
                    "snippet": f"{doc['title']} 관련 승인 문서입니다. 태그: {', '.join(tags)}",
                    "section": "approved_documents",
                    "source_ref": doc.get("source_ref"),
                    "tags": tags,
                }
            )
        return documents

    def _score_document(
        self,
        normalized_query: str,
        query_tokens: set[str],
        query_ngrams: set[str],
        document: dict[str, Any],
    ) -> float:
        searchable_text = self._normalize(
            " ".join(
                [
                    document.get("title", ""),
                    document.get("snippet", ""),
                    " ".join(document.get("tags", [])),
                ]
            )
        )
        doc_tokens = set(self._tokens(searchable_text))
        doc_ngrams = self._char_ngrams(searchable_text)

        token_score = self._jaccard(query_tokens, doc_tokens)
        ngram_score = self._jaccard(query_ngrams, doc_ngrams)
        sequence_score = SequenceMatcher(None, normalized_query, searchable_text).ratio()
        substring_score = 1.0 if normalized_query in searchable_text else 0.0
        tag_score = self._tag_score(normalized_query, document.get("tags", []))
        source_bonus = 0.06 if document.get("source_type") == "faq" else 0.0

        has_lexical_evidence = (
            token_score > 0
            or tag_score > 0
            or substring_score > 0
            or ngram_score >= 0.08
        )
        if not has_lexical_evidence:
            return 0.0

        score = (
            token_score * 0.35
            + ngram_score * 0.35
            + sequence_score * 0.15
            + substring_score * 0.15
            + tag_score * 0.20
            + source_bonus
        )
        return min(score, 1.0) if score >= 0.05 else 0.0

    def _tag_score(self, normalized_query: str, tags: list[str]) -> float:
        if not tags:
            return 0.0
        normalized_tags = [self._normalize(tag) for tag in tags]
        hits = [
            tag
            for tag in normalized_tags
            if tag and (tag in normalized_query or normalized_query in tag)
        ]
        return min(len(hits) / len(normalized_tags), 1.0)

    def _normalize(self, text: str) -> str:
        lowered = text.lower()
        normalized = re.sub(r"[^0-9a-zA-Z가-힣]+", " ", lowered)
        return re.sub(r"\s+", " ", normalized).strip()

    def _tokens(self, text: str) -> list[str]:
        return _TOKEN_RE.findall(text)

    def _char_ngrams(self, text: str, min_n: int = 2, max_n: int = 3) -> set[str]:
        compact = re.sub(r"\s+", "", text)
        ngrams = set()
        for n in range(min_n, max_n + 1):
            if len(compact) < n:
                continue
            for idx in range(0, len(compact) - n + 1):
                ngrams.add(compact[idx : idx + n])
        return ngrams

    def _jaccard(self, left: set[str], right: set[str]) -> float:
        if not left or not right:
            return 0.0
        return len(left & right) / len(left | right)
