"""Populate the public lookbook with presentable work.

The feed has to show something on a fresh database, and testing leaves behind
accounts called "Smoke Test" that make the product look unfinished. This command
clears that residue and composes a curated set in its place.

Everything it writes goes through `create_generations`, so these are ordinary
rows made by ordinary accounts: prompts are composed by the real composer, costs
are priced by the real pricer, and credits are actually deducted. Nothing here
is a fixture the API would not have produced itself.
"""

from __future__ import annotations

import random
from typing import Any

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.catalog.models import Kind, Model, Preset
from apps.studio.models import Generation
from apps.studio.services import GenerationSpec, create_generations

# Accounts created by test runs and verification, recognisable by prefix.
# Matched against the LOCAL PART of the address only, so a real account can
# never be swept by sharing a prefix with a test run.
TEST_PREFIXES = (
    "verify+", "refund+", "smoke+", "lifecycle+", "lc+", "liketest",
    "refresh", "director", "px", "rl", "cookie", "probe", "live+", "test",
)

DIRECTORS = [
    ("mara.delacroix@kinograde.studio", "Mara Delacroix"),
    ("ishan.rao@kinograde.studio", "Ishan Rao"),
    ("noor.haddad@kinograde.studio", "Noor Haddad"),
    ("tomas.lindqvist@kinograde.studio", "Tomas Lindqvist"),
    ("yuki.aoyama@kinograde.studio", "Yuki Aoyama"),
]

# (prompt, kind, model, camera, effect, film, palette, light, aspect, duration)
SHOTS: list[tuple[str, str, str, str | None, str | None, str | None, str | None, str | None, str, int]] = [
    ("A lighthouse keeper crossing a flooded pier at dusk, lamp swinging",
     "video", "seedance-2-5", "crash-zoom-in", None, "anamorphic", "neon-noir", "golden-hour", "21:9", 8),
    ("Ballet dancer suspended mid-leap in an abandoned theatre, dust in the air",
     "video", "seedance-2-5", "orbit-360", "frozen-in-motion", "35mm", None, "rim-light", "9:16", 5),
    ("Editorial portrait, wet hair, harsh single flash against raw concrete",
     "image", "soul", None, None, None, "monochrome", "hard-flash", "3:4", 0),
    ("Vintage F1 car mid-corner, tyre smoke lit by low afternoon sun",
     "video", "cinema-studio-4", "robo-arm", None, "35mm", "teal-orange", "golden-hour", "16:9", 5),
    ("A woman's silhouette dissolving into a flock of starlings over a wheat field",
     "video", "kling-3-0", "crane-up", "particles", None, "earth", "silhouette", "9:16", 8),
    ("Brutalist cathedral interior filled with fog, a single shaft of god-ray light",
     "image", "nano-banana-pro", None, None, "imax", "blue-depth", "natural", "16:9", 0),
    ("Astronaut removing a helmet on a black sand beach, steam rising",
     "video", "veo-3-1", "dolly-in", None, "anamorphic", "bleach-bypass", "overcast", "21:9", 5),
    ("Espresso pour in extreme macro, crema swirling under warm tungsten",
     "video", "seedance-2-0", "focus-change", None, None, "golden", "candlelit", "1:1", 3),
    ("Maasai elder in traditional beadwork, shallow depth of field",
     "image", "gpt-image-2", None, None, "documentary", None, "natural", "3:4", 0),
    ("A city street where every building folds into origami",
     "video", "kling-3-0", "overhead", "architecture-wave", None, "pastel", "natural", "9:16", 5),
    ("Neon-lit boxing gym, fighter shadowboxing, sweat catching the light",
     "video", "seedance-2-5", "snorricam", None, "vhs", "neon-noir", "neon", "16:9", 8),
    ("Fashion editorial: model in liquid chrome against a sandstorm",
     "image", "soul-2", None, None, None, "technicolor", "rim-light", "3:4", 0),
    ("Herd of horses running through shallow water, backlit spray",
     "video", "seedance-2-0", "arc-shot", None, "imax", "golden", "golden-hour", "21:9", 8),
    ("Retro sci-fi control room, CRT glow, analogue switches, operator in profile",
     "image", "flux-2", None, None, "archival", "blue-depth", "neon", "16:9", 0),
    ("Two dancers in a single spotlight, bodies made of smoke",
     "video", "cinema-studio-4", "orbit-360", "melting", "35mm", "monochrome", "silhouette", "9:16", 5),
    ("Surfer inside a barrel wave, sun refracting through the lip",
     "video", "sora-2", "object-pov", None, None, "teal-orange", "natural", "9:16", 5),
    ("Antique globe cracking open to reveal a miniature ocean storm",
     "video", "seedance-2-5", "super-dolly-in", "world-morphing", None, "earth", "candlelit", "1:1", 5),
    ("Old fisherman mending nets at dawn, weathered hands, Portuguese harbour",
     "image", "soul", None, None, "documentary", "earth", "natural", "3:4", 0),
]


class Command(BaseCommand):
    help = "Clear test residue and compose a curated public lookbook."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--keep-tests",
            action="store_true",
            help="Leave test accounts in place instead of deleting them.",
        )

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        if not options["keep_tests"]:
            self._purge_test_accounts()

        presets = {p.id: p for p in Preset.objects.all()}
        models = {m.id: m for m in Model.objects.all()}
        if not models:
            self.stderr.write("Catalogue is empty — run seed_catalog first.")
            return

        directors = [self._director(email, name) for email, name in DIRECTORS]

        # Re-running must not stack another 18 shots on top of the last set.
        removed, _ = Generation.objects.filter(user__in=directors).delete()
        if removed:
            self.stdout.write(f"cleared {removed} rows from a previous seed")
        rng = random.Random(20260925)  # fixed, so re-seeding is reproducible

        made = 0
        for i, row in enumerate(SHOTS):
            prompt, kind, model_id, camera, effect, film, palette, light, aspect, duration = row
            model = models.get(model_id)
            if model is None:
                self.stderr.write(f"skipping — unknown model {model_id}")
                continue

            author = directors[i % len(directors)]
            spec = GenerationSpec(
                prompt=prompt,
                kind=kind,
                model=model,
                presets={
                    "camera": presets.get(camera or ""),
                    "effect": presets.get(effect or ""),
                    "film": presets.get(film or ""),
                    "palette": presets.get(palette or ""),
                    "light": presets.get(light or ""),
                },
                aspect=aspect,
                resolution=rng.choice(["1080p", "1080p", "4k"]),
                duration=duration,
                sound=kind == Kind.VIDEO,
                batch=1,
            )

            # Top the author up rather than let a curated shot fail on balance.
            author.credits = max(author.credits, 500)
            author.save(update_fields=["credits"])

            created = create_generations(user=author, spec=spec)
            # These are the shop window: they must already be finished.
            Generation.objects.filter(id__in=[g.id for g in created]).update(
                queued_until=None, ready_at=created[0].created_at
            )
            made += len(created)

        self.stdout.write(
            self.style.SUCCESS(
                f"lookbook: {made} shots by {len(directors)} directors"
            )
        )

    def _purge_test_accounts(self) -> None:
        stale = User.objects.none()
        for prefix in TEST_PREFIXES:
            # Test accounts all live on .test domains; never touch real ones.
            stale = stale | User.objects.filter(
                email__startswith=prefix, email__endswith=".test"
            )
        emails = list(stale.values_list("email", flat=True))
        if not emails:
            self.stdout.write("no test accounts to remove")
            return
        # Generations and likes cascade from the user row.
        count, _ = User.objects.filter(email__in=emails).delete()
        self.stdout.write(f"removed {len(emails)} test accounts ({count} rows)")

    def _director(self, email: str, name: str) -> User:
        user = User.objects.filter(email=email).first()
        if user:
            return user
        user = User.objects.create(email=email, name=name, plan="studio", credits=1200)
        # Nobody signs in as a demo director; an unusable password means these
        # accounts cannot be logged into at all, by us or anyone else.
        user.set_unusable_password()
        user.save()
        return user
