"""The catalogue endpoint: one call, everything the composer needs to render."""

from __future__ import annotations

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.constants import ASPECTS, DURATIONS, PLANS, RESOLUTIONS
from apps.catalog.models import Model, Preset
from apps.catalog.serializers import ModelSerializer, PresetSerializer


class CatalogView(APIView):
    """
    Read-only and open to any session.

    Presets come back in one list ordered by family, each carrying its own
    `family`, because that is the shape CONTRACT.md gives the Preset type.
    """

    def get(self, request: Request) -> Response:
        return Response(
            {
                "models": ModelSerializer(Model.objects.all(), many=True).data,
                "presets": PresetSerializer(Preset.objects.all(), many=True).data,
                "aspects": [aspect.as_dict() for aspect in ASPECTS],
                "resolutions": [resolution.as_dict() for resolution in RESOLUTIONS],
                "durations": [{"id": d, "label": f"{d}s"} for d in DURATIONS],
                "plans": [plan.as_dict() for plan in PLANS],
            }
        )
