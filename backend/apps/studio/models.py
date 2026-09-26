"""Generations and the likes they collect."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.catalog.models import Kind, Model, Preset


class Status(models.TextChoices):
    QUEUED = "queued", "Queued"
    RENDERING = "rendering", "Rendering"
    READY = "ready", "Ready"
    FAILED = "failed", "Failed"


def _preset_field() -> models.ForeignKey:
    """
    Presets are reference data: a retired preset must not take history with it,
    and the id is kept on the row for the API, so SET_NULL is the right call.
    """
    return models.ForeignKey(
        Preset,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )


class Generation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="generations", on_delete=models.CASCADE
    )

    prompt = models.TextField()
    # Frozen at creation: the catalogue may change, this is what was rendered.
    composed_prompt = models.TextField()

    kind = models.CharField(max_length=8, choices=Kind.choices)
    model = models.ForeignKey(Model, related_name="generations", on_delete=models.PROTECT)

    camera = _preset_field()
    effect = _preset_field()
    film = _preset_field()
    palette = _preset_field()
    light = _preset_field()

    aspect = models.CharField(max_length=8)
    resolution = models.CharField(max_length=8)
    # Zero on stills: a duration means nothing without motion.
    duration = models.PositiveSmallIntegerField(default=0)
    sound = models.BooleanField(default=False)

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.QUEUED)
    seed = models.CharField(max_length=32)
    media_url = models.URLField(max_length=500, null=True, blank=True)

    credits_spent = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    # There is no worker on this tier, so progress is modelled against two
    # deadlines fixed at creation rather than pushed by a job. Both are stamped
    # from the application clock so deriving the status never has to compare
    # against the database's, which runs about half a second apart.
    queued_until = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)

    @property
    def current_status(self) -> str:
        """Status derived from the clock rather than read from the column.

        Computing it server-side on every read is what makes polling honest:
        a client cannot advance its own render by claiming time has passed,
        and two viewers always agree on where a shot has got to.
        """
        if self.status == Status.FAILED or self.ready_at is None:
            return self.status

        now = timezone.now()
        if now >= self.ready_at:
            return Status.READY
        if self.queued_until and now < self.queued_until:
            return Status.QUEUED
        return Status.RENDERING

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.kind} {self.id}"


class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="likes", on_delete=models.CASCADE
    )
    generation = models.ForeignKey(Generation, related_name="likes", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "generation"], name="unique_like_per_user")
        ]

    def __str__(self) -> str:
        return f"{self.user_id} likes {self.generation_id}"
