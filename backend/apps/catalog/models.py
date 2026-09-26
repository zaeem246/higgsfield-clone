"""The generator's reference data: what can be generated, and with what look."""

from __future__ import annotations

from django.db import models


class Kind(models.TextChoices):
    IMAGE = "image", "Image"
    VIDEO = "video", "Video"


class PresetFamily(models.TextChoices):
    CAMERA = "camera", "Camera move"
    EFFECT = "effect", "Effect"
    FILM = "film", "Film setup"
    PALETTE = "palette", "Colour palette"
    LIGHT = "light", "Lighting"


class Model(models.Model):
    """A generation model. Ids are the catalogue slugs the other tiers send."""

    id = models.SlugField(primary_key=True, max_length=64)
    name = models.CharField(max_length=80)
    kind = models.CharField(max_length=8, choices=Kind.choices)
    tagline = models.CharField(max_length=160)
    # Credits for one generation at 1080p, before duration and sound.
    cost = models.PositiveIntegerField()
    badge = models.CharField(max_length=16, null=True, blank=True)
    strengths = models.JSONField(default=list)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.kind})"


class Preset(models.Model):
    """
    A one-click look or move.

    ``grouping`` and ``fragment`` are named for what they are rather than
    shadowing ``group`` (taken by auth) or repeating "prompt" on a prompt model.
    """

    id = models.SlugField(primary_key=True, max_length=64)
    family = models.CharField(max_length=8, choices=PresetFamily.choices, db_index=True)
    name = models.CharField(max_length=80)
    grouping = models.CharField(max_length=40)
    fragment = models.TextField()
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("family", "position", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.family})"
