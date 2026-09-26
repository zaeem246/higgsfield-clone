"""Load the catalogue. Idempotent, so it is safe on every deploy."""

from __future__ import annotations

from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Model, Preset
from apps.catalog.seed_data import MODELS, PRESETS_BY_FAMILY


class Command(BaseCommand):
    help = "Upsert models and presets from apps/catalog/seed_data.py."

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        created, updated = self._sync_models()
        self.stdout.write(f"models: {created} created, {updated} updated")

        for family, rows in PRESETS_BY_FAMILY.items():
            created, updated = self._sync_presets(family, rows)
            self.stdout.write(
                f"presets[{family}]: {created} created, {updated} updated "
                f"({len(rows)} total)"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"catalogue ready: {Model.objects.count()} models, "
                f"{Preset.objects.count()} presets"
            )
        )

    def _sync_models(self) -> tuple[int, int]:
        created = updated = 0
        for position, row in enumerate(MODELS):
            _, was_created = Model.objects.update_or_create(
                id=row["id"],
                defaults={
                    "name": row["name"],
                    "kind": row["kind"],
                    "tagline": row["tagline"],
                    "cost": row["cost"],
                    "badge": row["badge"],
                    "strengths": row["strengths"],
                    "position": position,
                },
            )
            created, updated = (created + 1, updated) if was_created else (created, updated + 1)
        return created, updated

    def _sync_presets(self, family: str, rows: list[dict[str, str]]) -> tuple[int, int]:
        created = updated = 0
        for position, row in enumerate(rows):
            _, was_created = Preset.objects.update_or_create(
                id=row["id"],
                defaults={
                    "family": family,
                    "name": row["name"],
                    "grouping": row["grouping"],
                    "fragment": row["fragment"],
                    "position": position,
                },
            )
            created, updated = (created + 1, updated) if was_created else (created, updated + 1)
        return created, updated
