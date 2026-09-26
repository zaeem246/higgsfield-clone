"""Read paths. Every generation queryset arrives annotated for the API shape."""

from __future__ import annotations

from django.utils import timezone
from django.db.models import BooleanField, Count, Exists, OuterRef, QuerySet, Value

from apps.accounts.models import User
from apps.studio.models import Generation, Like, Status


def _annotated(queryset: QuerySet[Generation], viewer: User | None) -> QuerySet[Generation]:
    """
    Like counts are computed, not denormalised: one aggregate per page is
    cheaper than a counter that can drift.
    """
    liked = (
        Exists(Like.objects.filter(generation=OuterRef("pk"), user=viewer))
        if viewer is not None and viewer.is_authenticated
        else Value(False, output_field=BooleanField())
    )
    return (
        queryset.select_related("model", "user")
        .annotate(like_count=Count("likes", distinct=True), liked_by_me=liked)
        .order_by("-created_at", "-id")
    )


def own_generations(*, viewer: User) -> QuerySet[Generation]:
    return _annotated(Generation.objects.filter(user=viewer), viewer)


def own_generation(*, viewer: User, generation_id: str) -> Generation | None:
    return own_generations(viewer=viewer).filter(pk=generation_id).first()


def feed_generations(
    *, viewer: User | None, kind: str | None = None, model_id: str | None = None
) -> QuerySet[Generation]:
    """The public feed is finished work only; nobody wants a stranger's failures."""
    # Readiness is a function of the clock, not the stored column, so the
    # feed must ask the same question `current_status` does.
    queryset = Generation.objects.filter(ready_at__lte=timezone.now()).exclude(
        status=Status.FAILED
    )
    if kind:
        queryset = queryset.filter(kind=kind)
    if model_id:
        queryset = queryset.filter(model_id=model_id)
    return _annotated(queryset, viewer)


def feed_generation(*, viewer: User | None, generation_id: str) -> Generation | None:
    return feed_generations(viewer=viewer).filter(pk=generation_id).first()
