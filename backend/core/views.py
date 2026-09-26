"""Infrastructure endpoints that belong to no single app."""

from __future__ import annotations

from django.db import connection
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Liveness plus a real database round-trip, so a dead Neon surfaces here."""

    def get(self, request: Request) -> Response:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return Response({"status": "ok", "database": "ok"})
