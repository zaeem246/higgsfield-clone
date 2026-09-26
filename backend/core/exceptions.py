"""
One error shape for the whole API.

The gateway forwards error bodies to the browser untouched, so every failure —
validation, authentication or an unhandled crash — has to arrive as
``{"error": {"code": ..., "message": ...}}`` and nothing else.
"""

from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# DRF's own codes for these statuses read poorly on the wire; the rest are kept.
CODE_BY_STATUS: dict[int, str] = {
    status.HTTP_401_UNAUTHORIZED: "unauthenticated",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
    status.HTTP_429_TOO_MANY_REQUESTS: "rate_limited",
}


class InsufficientCredits(APIException):
    """Raised before any row is written, so a batch is rejected whole."""

    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "insufficient_credits"
    default_detail = "Not enough credits for this request."


class InvalidCredentials(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = "invalid_credentials"
    default_detail = "Email or password is incorrect."


class InvalidGatewayKey(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "invalid_gateway_key"
    default_detail = "Missing or invalid gateway key."


def _first_message(detail: Any, field: str = "") -> str:
    """Collapse DRF's nested error structure into one sentence a UI can show."""
    if isinstance(detail, dict):
        for key, value in detail.items():
            label = "" if key == "non_field_errors" else key
            return _first_message(value, label)
        return "Invalid request."
    if isinstance(detail, list):
        return _first_message(detail[0], field) if detail else "Invalid request."
    text = str(detail)
    return f"{field}: {text}" if field else text


def _code_for(exc: Exception, response: Response) -> str:
    if isinstance(exc, ValidationError):
        return "invalid_request"
    default_code = str(getattr(exc, "default_code", "") or "")
    custom = default_code not in {
        "",
        "error",
        "not_authenticated",
        "authentication_failed",
        "permission_denied",
        "not_found",
        "method_not_allowed",
        "throttled",
    }
    if custom:
        return default_code
    return CODE_BY_STATUS.get(response.status_code, default_code or "error")


def _message_for(exc: Exception, response: Response) -> str:
    detail = getattr(exc, "detail", None)
    if detail is None:
        return str(response.data)
    return _first_message(detail)


def envelope_exception_handler(exc: Exception, context: dict) -> Response:
    """DRF ``EXCEPTION_HANDLER``: rewrite every error into the contract envelope."""
    # Imported here because DRF loads this module while building its own views.
    from rest_framework.views import exception_handler as drf_exception_handler

    if isinstance(exc, Http404):
        exc = APIException(detail="Not found.")
        exc.status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, DjangoPermissionDenied):
        exc = InvalidGatewayKey(detail="Forbidden.")

    response = drf_exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled error in %s", context.get("view"), exc_info=exc)
        return Response(
            {"error": {"code": "server_error", "message": "Internal server error."}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    response.data = {
        "error": {"code": _code_for(exc, response), "message": _message_for(exc, response)}
    }
    return response
