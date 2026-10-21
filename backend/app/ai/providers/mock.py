"""Deterministic provider used for local development and tests."""

from __future__ import annotations

import json

from app.ai.providers.base import ChatMessage


class MockProvider:
    name = "mock"
    model = "mock"

    def complete(self, messages: list[ChatMessage]) -> str:
        question = next(
            (
                message["content"]
                for message in reversed(messages)
                if message["role"] == "user"
            ),
            "No question supplied.",
        )
        return json.dumps(
            {
                "summary": (
                    "Mock AI provider: no model was called. "
                    f"Question received: {question[:300]}"
                ),
                "confidence": 0.2,
                "hypotheses": [],
                "next_steps": [
                    "Review the cited evidence and verify the deterministic diagnosis."
                ],
                "risks": [],
                "unknowns": [
                    "The mock provider does not perform inference or inspect evidence."
                ],
                "proposed_remediation": [],
            }
        )
