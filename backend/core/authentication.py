"""Session-token authentication: this tier's half of the gateway cookie handshake."""

from __future__ import annotations

from django.apps import apps
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request


class SessionTokenAuthentication(BaseAuthentication):
    """
    Resolves the opaque ``X-Session-Token`` to its user.

    The session model is looked up from settings rather than imported, so
    ``core`` keeps no dependency on any particular app.
    """

    def authenticate(self, request: Request) -> tuple[AbstractBaseUser, object] | None:
        token = request.headers.get(settings.SESSION_TOKEN_HEADER)
        if not token:
            return None

        session_model = apps.get_model(settings.SESSION_TOKEN_MODEL)
        session = session_model.objects.select_related("user").filter(pk=token).first()
        if session is None:
            raise AuthenticationFailed("Session is invalid.")
        if session.expires_at <= timezone.now():
            session.delete()
            raise AuthenticationFailed("Session has expired.")
        if not session.user.is_active:
            raise AuthenticationFailed("Account is disabled.")

        return session.user, session

    def authenticate_header(self, request: Request) -> str:
        """Present, so DRF answers 401 rather than 403 when no token is sent."""
        return settings.SESSION_TOKEN_HEADER
