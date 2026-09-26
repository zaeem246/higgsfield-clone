"""
The rules the other tiers are not allowed to own: what a shot says, what it
costs, and what that does to a balance.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound

from apps.accounts.models import User
from apps.catalog.constants import (
    REFERENCE_DURATION,
    RESOLUTION_MULTIPLIERS,
    SOUND_SURCHARGE,
)
from apps.catalog.models import Kind, Model, Preset
from apps.studio.models import Generation, Like, Status
from core.exceptions import InsufficientCredits

# Fixed by the contract: subject, then the look, then the motion — so the
# camera instruction lands next to the action it describes.
COMPOSE_ORDER: tuple[str, ...] = ("film", "palette", "light", "effect", "camera")


@dataclass(frozen=True)
class GenerationSpec:
    """A validated, fully resolved request for one batch."""

    prompt: str
    kind: str
    model: Model
    presets: dict[str, Preset | None]
    aspect: str
    resolution: str
    duration: int
    sound: bool
    batch: int


def compose_prompt(spec: GenerationSpec) -> str:
    """A camera move on a still says nothing, so it is dropped rather than stored."""
    parts = [spec.prompt.strip()]
    for family in COMPOSE_ORDER:
        if family == "camera" and spec.kind != Kind.VIDEO:
            continue
        preset = spec.presets.get(family)
        if preset is not None:
            parts.append(preset.fragment)
    return ", ".join(part for part in parts if part)


def unit_cost(spec: GenerationSpec) -> int:
    """
    Credits for one generation.

    Decimal, and rounded half-up, so the number matches the frontend's
    optimistic quote instead of drifting by a credit on .5 cases.
    """
    amount = Decimal(spec.model.cost) * RESOLUTION_MULTIPLIERS[spec.resolution]
    if spec.kind == Kind.VIDEO:
        amount *= Decimal(spec.duration) / REFERENCE_DURATION
        if spec.sound:
            amount *= SOUND_SURCHARGE
    return int(amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def batch_cost(spec: GenerationSpec) -> int:
    return unit_cost(spec) * spec.batch


def _due_at(spec: "GenerationSpec") -> tuple[datetime, datetime]:
    """When a shot finishes rendering.

    Video costs more wall-clock than a still, and longer takes cost more again
    — enough to make the pipeline legible without making the demo tedious.
    """
    seconds = 2.5 if spec.kind == Kind.IMAGE else 4.0 + spec.duration * 0.25
    now = timezone.now()
    # The queue has to outlast a round trip, or the client's first poll already
    # finds the shot rendering and the state is never seen.
    return now + timedelta(seconds=1.8), now + timedelta(seconds=seconds)

def _new_seed() -> str:
    """Drives the deterministic poster art, so a result always looks the same."""
    return secrets.token_hex(4)


@transaction.atomic
def create_generations(*, user: User, spec: GenerationSpec) -> list[Generation]:
    """
    Charge and insert together, or do neither.

    The user row is locked first so two concurrent batches cannot both read the
    same balance and both decide they can afford it.
    """
    locked = User.objects.select_for_update().get(pk=user.pk)
    unit = unit_cost(spec)
    total = unit * spec.batch

    if locked.credits < total:
        raise InsufficientCredits(
            f"This batch costs {total} credits and the account has {locked.credits}."
        )

    composed = compose_prompt(spec)
    queued_until, ready_at = _due_at(spec)
    rows = [
        Generation(
            user=locked,
            prompt=spec.prompt.strip(),
            composed_prompt=composed,
            kind=spec.kind,
            model=spec.model,
            camera=spec.presets.get("camera") if spec.kind == Kind.VIDEO else None,
            effect=spec.presets.get("effect"),
            film=spec.presets.get("film"),
            palette=spec.presets.get("palette"),
            light=spec.presets.get("light"),
            aspect=spec.aspect,
            resolution=spec.resolution,
            duration=spec.duration,
            sound=spec.sound,
            # Queued now, due shortly: `current_status` derives the live
            # value from this deadline, so a client polling the API sees a
            # real transition rather than one animated on the client.
            status=Status.QUEUED,
            queued_until=queued_until,
            ready_at=ready_at,
            seed=_new_seed(),
            credits_spent=unit,
        )
        for _ in range(spec.batch)
    ]
    Generation.objects.bulk_create(rows)

    locked.credits -= total
    locked.save(update_fields=["credits"])
    return rows


@transaction.atomic
def delete_generation(*, user: User, generation_id: str) -> int:
    """
    Returns the credits refunded.

    A failed render is refunded — you should not pay for our error — and the
    row is locked so a double DELETE cannot refund twice.
    """
    locked_user = User.objects.select_for_update().get(pk=user.pk)
    generation = (
        Generation.objects.select_for_update()
        .filter(pk=generation_id, user=locked_user)
        .first()
    )
    if generation is None:
        raise NotFound("Generation not found.")

    refund = generation.credits_spent if generation.status == Status.FAILED else 0
    generation.delete()
    if refund:
        locked_user.credits += refund
        locked_user.save(update_fields=["credits"])
    return refund


def set_like(*, user: User, generation: Generation, liked: bool) -> tuple[bool, int]:
    """Idempotent in both directions: the UI sends state, not a toggle."""
    if liked:
        Like.objects.get_or_create(user=user, generation=generation)
    else:
        Like.objects.filter(user=user, generation=generation).delete()
    return liked, Like.objects.filter(generation=generation).count()
