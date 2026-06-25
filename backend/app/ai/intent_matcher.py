import re
from collections import defaultdict
from difflib import SequenceMatcher
from typing import Any

from app.ai.intent_pack_loader import IntentPack


_TOKEN_RE = re.compile(r"[0-9a-zA-Z가-힣]+")


class IntentMatcher:
    def __init__(self, pack: IntentPack):
        self.pack = pack
        self.intents_by_id = pack.intents_by_id
        self.actions_by_id = pack.actions_by_id
        self.routes_by_action_id = pack.routes_by_action_id
        self.examples_by_intent = self._group_examples_by_intent()
        self.synonyms = pack.nlu["entity_synonyms"]
        self.confidence_policy = pack.nlu["confidence_policy"]

    def match(self, question: str, top_k: int = 3) -> list[dict[str, Any]]:
        normalized_question = self._normalize(question)
        question_tokens = set(self._tokens(normalized_question))
        question_ngrams = self._char_ngrams(normalized_question)
        matched_entities = self._match_entities(normalized_question)

        candidates = []
        for intent_id, examples in self.examples_by_intent.items():
            intent = self.intents_by_id.get(intent_id)
            if not intent:
                continue

            best_examples = []
            for example in examples:
                example_text = self._normalize(example["text"])
                score = self._score_example(
                    normalized_question,
                    question_tokens,
                    question_ngrams,
                    example_text,
                    matched_entities,
                    intent,
                    example,
                )
                best_examples.append(
                    {
                        "example_id": example["example_id"],
                        "text": example["text"],
                        "score": round(score, 4),
                    }
                )

            best_examples.sort(key=lambda item: item["score"], reverse=True)
            score = best_examples[0]["score"] if best_examples else 0.0
            action_id = intent.get("action_id")
            candidate = {
                "intent_id": intent["intent_id"],
                "intent_name": intent["intent_name"],
                "action_id": action_id,
                "category": intent["category"],
                "score": score,
                "confidence_label": self._confidence_label(intent["category"], score),
                "matched_examples": best_examples[:3],
                "matched_entities": matched_entities,
                "routes": self.routes_by_action_id.get(action_id, []),
            }
            candidates.append(candidate)

        candidates.sort(
            key=lambda item: (
                item["score"],
                len(item["matched_entities"]),
                item["intent_id"],
            ),
            reverse=True,
        )
        return candidates[: max(top_k, 0)]

    def _group_examples_by_intent(self) -> dict[str, list[dict[str, Any]]]:
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for example in self.pack.nlu["intent_examples"]:
            grouped[example["intent_id"]].append(example)
        return dict(grouped)

    def _score_example(
        self,
        normalized_question: str,
        question_tokens: set[str],
        question_ngrams: set[str],
        normalized_example: str,
        matched_entities: list[dict[str, Any]],
        intent: dict[str, Any],
        example: dict[str, Any],
    ) -> float:
        example_tokens = set(self._tokens(normalized_example))
        example_ngrams = self._char_ngrams(normalized_example)

        token_score = self._jaccard(question_tokens, example_tokens)
        ngram_score = self._jaccard(question_ngrams, example_ngrams)
        sequence_score = SequenceMatcher(
            None,
            normalized_question,
            normalized_example,
        ).ratio()
        substring_score = (
            1.0
            if normalized_question in normalized_example
            or normalized_example in normalized_question
            else 0.0
        )
        entity_score = self._entity_bonus(matched_entities, intent, example)

        score = (
            token_score * 0.35
            + ngram_score * 0.25
            + sequence_score * 0.25
            + substring_score * 0.10
            + entity_score * 0.15
        )
        return min(score, 1.0)

    def _entity_bonus(
        self,
        matched_entities: list[dict[str, Any]],
        intent: dict[str, Any],
        example: dict[str, Any],
    ) -> float:
        if not matched_entities:
            return 0.0

        required = set(intent.get("required_entities", []))
        optional = set(intent.get("optional_entities", []))
        example_entities = {
            entity.get("entity_type")
            for entity in example.get("entities", [])
            if entity.get("entity_type")
        }
        expected_entity_types = required | optional | example_entities
        if not expected_entity_types:
            return 0.0

        matched_types = {entity["entity_type"] for entity in matched_entities}
        overlap = matched_types & expected_entity_types
        return min(len(overlap) / max(len(expected_entity_types), 1), 1.0)

    def _match_entities(self, normalized_question: str) -> list[dict[str, Any]]:
        matches: list[dict[str, Any]] = []
        seen = set()

        def add_match(
            entity_type: str,
            canonical_value: str,
            matched_text: str,
            code: str | None = None,
        ) -> None:
            key = (entity_type, canonical_value, self._normalize(matched_text))
            if key in seen:
                return
            seen.add(key)
            matches.append(
                {
                    "entity_type": entity_type,
                    "canonical_value": canonical_value,
                    "matched_text": matched_text,
                    "code": code,
                }
            )

        for item in self.synonyms:
            for synonym in item.get("synonyms", []):
                normalized_synonym = self._normalize(synonym)
                if not normalized_synonym:
                    continue
                if normalized_synonym in normalized_question:
                    add_match(
                        item["entity_type"],
                        item["canonical_value"],
                        synonym,
                        item.get("code"),
                    )

        compact_question = re.sub(r"\s+", "", normalized_question)
        period_rules = [
            ("이번 달", ["이번 달", "이번달", "당월"], "period_current_month"),
            ("작년", ["작년", "전년도"], "period_last_year"),
        ]
        for canonical_value, terms, code in period_rules:
            if any(self._normalize(term) in normalized_question for term in terms) or any(
                self._normalize(term).replace(" ", "") in compact_question
                for term in terms
            ):
                add_match("period", canonical_value, canonical_value, code)

        if (
            "아직" in normalized_question
            and "입력" in normalized_question
            and "현장" in normalized_question
        ):
            add_match("period", "당월", "아직 입력 안 한", "period_current_month")

        if "산정 기준" in normalized_question or (
            "산정" in normalized_question and "기준" in normalized_question
        ):
            add_match("topic", "산정 기준", "산정 기준", "topic_calculation_criteria")

        if "배출계수" in compact_question:
            add_match(
                "emission_factor",
                "배출계수",
                "배출계수",
                "emission_factor",
            )
        return matches

    def _confidence_label(self, category: str, score: float) -> str:
        policy = self.confidence_policy.get("category_policy", {}).get(category)
        if not policy:
            policy = self.confidence_policy.get("default_policy", {})

        high = float(policy.get("high", 0.85))
        medium = float(policy.get("medium", 0.65))
        low = float(policy.get("low", 0.45))
        if score >= high:
            return "high"
        if score >= medium:
            return "medium"
        if score >= low:
            return "low"
        return "very_low"

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

    def _normalize(self, text: str) -> str:
        lowered = text.lower()
        normalized = re.sub(r"[^0-9a-zA-Z가-힣]+", " ", lowered)
        return re.sub(r"\s+", " ", normalized).strip()

    def _jaccard(self, left: set[str], right: set[str]) -> float:
        if not left and not right:
            return 0.0
        if not left or not right:
            return 0.0
        return len(left & right) / len(left | right)
