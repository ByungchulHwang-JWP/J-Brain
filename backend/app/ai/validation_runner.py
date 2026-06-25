from typing import Any

from app.ai.action_router import ActionRouter
from app.ai.intent_matcher import IntentMatcher
from app.ai.intent_pack_loader import IntentPack


class ValidationRunner:
    def __init__(self, pack: IntentPack):
        self.pack = pack
        self.matcher = IntentMatcher(pack)
        self.router = ActionRouter(pack)

    def run(self, top_k: int = 3) -> dict[str, Any]:
        results = [
            self._run_question(question, top_k)
            for question in self.pack.validation["validation_questions"]
        ]
        total = len(results)
        top1_pass_count = sum(1 for result in results if result["top1_pass"])
        top3_pass_count = sum(1 for result in results if result["top3_pass"])
        entity_pass_count = sum(1 for result in results if result["entities_pass"])
        wrong_action_count = sum(
            1
            for result in results
            if result["actual_action_id"]
            and result["actual_action_id"] != result["expected_action_id"]
        )

        return {
            "pack_id": self.pack.manifest.get("pack_id"),
            "pack_version": self.pack.manifest.get("pack_version"),
            "total_questions": total,
            "top1_pass_count": top1_pass_count,
            "top3_pass_count": top3_pass_count,
            "entity_pass_count": entity_pass_count,
            "wrong_action_count": wrong_action_count,
            "top1_accuracy": self._ratio(top1_pass_count, total),
            "top3_accuracy": self._ratio(top3_pass_count, total),
            "entity_accuracy": self._ratio(entity_pass_count, total),
            "wrong_action_execution_rate": self._ratio(wrong_action_count, total),
            "external_llm_calls": 0,
            "customer_data_external_transfer": 0,
            "criteria": self.pack.validation["acceptance_criteria"].get(
                "mvp_acceptance", {}
            ),
            "results": results,
        }

    def _run_question(
        self,
        validation_question: dict[str, Any],
        top_k: int,
    ) -> dict[str, Any]:
        question = validation_question["question"]
        expected_intent_id = validation_question["expected_intent_id"]
        expected_action_id = validation_question["expected_action_id"]
        matches = self.matcher.match(question, top_k=top_k)
        card = self.router.route(question, matches)
        top_match = matches[0] if matches else {}
        actual_intent_id = top_match.get("intent_id")
        actual_action_id = top_match.get("action_id")
        top3_intent_ids = [match.get("intent_id") for match in matches]
        matched_entities = top_match.get("matched_entities", [])

        return {
            "question_id": validation_question["question_id"],
            "question": question,
            "expected_intent_id": expected_intent_id,
            "actual_intent_id": actual_intent_id,
            "expected_action_id": expected_action_id,
            "actual_action_id": actual_action_id,
            "top1_pass": actual_intent_id == expected_intent_id
            and actual_action_id == expected_action_id,
            "top3_pass": expected_intent_id in top3_intent_ids,
            "entities_pass": self._entities_pass(
                validation_question.get("expected_entities", []),
                matched_entities,
            ),
            "confidence_label": top_match.get("confidence_label", "very_low"),
            "score": top_match.get("score", 0.0),
            "card_type": card.get("type"),
            "card_status": card.get("status"),
            "matched_entities": matched_entities,
            "top_matches": matches,
        }

    def _entities_pass(
        self,
        expected_entities: list[dict[str, Any]],
        matched_entities: list[dict[str, Any]],
    ) -> bool:
        if not expected_entities:
            return True

        matched_pairs = {
            (
                entity.get("entity_type"),
                entity.get("canonical_value") or entity.get("value"),
            )
            for entity in matched_entities
        }
        for expected in expected_entities:
            expected_type = expected.get("entity_type")
            expected_value = expected.get("value")
            if (expected_type, expected_value) not in matched_pairs:
                return False
        return True

    def _ratio(self, numerator: int, denominator: int) -> float:
        if denominator == 0:
            return 0.0
        return round(numerator / denominator, 4)
