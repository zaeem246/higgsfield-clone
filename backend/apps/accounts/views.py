"""Auth and account endpoints. Thin: parse, delegate, serialise."""

from __future__ import annotations

from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts import services
from apps.accounts.models import User
from apps.accounts.serializers import (
    AccountSerializer,
    LoginSerializer,
    PlanChangeSerializer,
    RegisterSerializer,
)
from core.permissions import HasGatewayKeyAndSession


def _session_payload(user: User, token: str) -> dict:
    """The gateway strips `token` into its httpOnly cookie; the browser never sees it."""
    return {"token": token, "account": AccountSerializer(user).data}


class RegisterView(APIView):
    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, session = services.register(**serializer.validated_data)
        return Response(_session_payload(user, session.pk), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.authenticate(**serializer.validated_data)
        session = services.start_session(user)
        return Response(_session_payload(user, session.pk))


class LogoutView(APIView):
    def post(self, request: Request) -> Response:
        services.end_session(request.auth)
        return Response({"ok": True})


class MeView(APIView):
    permission_classes = [HasGatewayKeyAndSession]

    def get(self, request: Request) -> Response:
        return Response({"account": AccountSerializer(request.user).data})


class PlanView(APIView):
    permission_classes = [HasGatewayKeyAndSession]

    def post(self, request: Request) -> Response:
        serializer = PlanChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.change_plan(user=request.user, plan=serializer.validated_data["plan"])
        return Response({"account": AccountSerializer(user).data})
