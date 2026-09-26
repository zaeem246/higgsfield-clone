"""Permissions for the two things this tier trusts: the gateway, and a session."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.utils.crypto import constant_time_compare
from rest_framework.permissions import BasePermission

from core.exceptions import InvalidGatewayKey

if TYPE_CHECKING:  # importing DRF's views here at runtime would be circular
    from rest_framework.request import Request
    from rest_framework.views import APIView


class HasGatewayKey(BasePermission):
    """
    Applied globally: the API is only reachable through the gateway.

    Compared in constant time so the shared key cannot be recovered byte by byte
    from response timings.
    """

    def has_permission(self, request: "Request", view: "APIView") -> bool:
        presented = request.headers.get(settings.GATEWAY_KEY_HEADER, "")
        if not constant_time_compare(presented, settings.GATEWAY_KEY):
            raise InvalidGatewayKey()
        return True


class HasGatewayKeyAndSession(HasGatewayKey):
    """For endpoints that act on behalf of a user, so both credentials must hold."""

    def has_permission(self, request: "Request", view: "APIView") -> bool:
        super().has_permission(request, view)
        return bool(request.user and request.user.is_authenticated)
