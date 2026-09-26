"""
Output options and plans.

These never change per row, so they are code rather than tables — but the
catalogue endpoint still serves them, so the other tiers never hard-code a
price or a multiplier that Django is authoritative for.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any, NamedTuple


class Aspect(NamedTuple):
    id: str
    label: str
    ratio: float
    use: str

    def as_dict(self) -> dict[str, Any]:
        return {"id": self.id, "label": self.label, "ratio": self.ratio, "use": self.use}


class Resolution(NamedTuple):
    id: str
    label: str
    multiplier: Decimal

    def as_dict(self) -> dict[str, Any]:
        return {"id": self.id, "label": self.label, "multiplier": float(self.multiplier)}


class Plan(NamedTuple):
    id: str
    name: str
    price: int
    credits: int
    blurb: str
    features: tuple[str, ...]

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "credits": self.credits,
            "blurb": self.blurb,
            "features": list(self.features),
        }


ASPECTS: tuple[Aspect, ...] = (
    Aspect("16:9", "16:9", 16 / 9, "YouTube, landscape"),
    Aspect("9:16", "9:16", 9 / 16, "Reels, TikTok"),
    Aspect("1:1", "1:1", 1.0, "Feed"),
    Aspect("4:3", "4:3", 4 / 3, "Classic"),
    Aspect("3:4", "3:4", 3 / 4, "Portrait"),
    Aspect("21:9", "21:9", 21 / 9, "Anamorphic"),
)

RESOLUTIONS: tuple[Resolution, ...] = (
    Resolution("720p", "720p", Decimal("0.6")),
    Resolution("1080p", "1080p", Decimal("1")),
    Resolution("4k", "4K", Decimal("2.2")),
)

DURATIONS: tuple[int, ...] = (3, 5, 8, 10)

PLANS: tuple[Plan, ...] = (
    Plan(
        "free",
        "Free",
        0,
        240,
        "Try the whole surface, no card.",
        ("All camera moves and effects", "1080p output", "Community feed"),
    ),
    Plan(
        "studio",
        "Studio",
        29,
        1200,
        "For everyday shots and iteration.",
        ("Everything in Free", "4K output", "Batches of four", "Priority queue"),
    ),
    Plan(
        "production",
        "Production",
        79,
        3600,
        "For ambitious, sustained work.",
        ("Everything in Studio", "Largest credit pool", "Early access to new models"),
    ),
)

ASPECT_IDS: tuple[str, ...] = tuple(aspect.id for aspect in ASPECTS)
RESOLUTION_IDS: tuple[str, ...] = tuple(resolution.id for resolution in RESOLUTIONS)
RESOLUTION_MULTIPLIERS: dict[str, Decimal] = {r.id: r.multiplier for r in RESOLUTIONS}
PLAN_IDS: tuple[str, ...] = tuple(plan.id for plan in PLANS)
PLAN_CREDITS: dict[str, int] = {plan.id: plan.credits for plan in PLANS}

# 5s is the reference length; a generated audio bed is billed as a surcharge.
REFERENCE_DURATION = Decimal("5")
SOUND_SURCHARGE = Decimal("1.15")
