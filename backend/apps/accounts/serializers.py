"""Account shapes and every rule about what may be sent to them."""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import Plan, User
from apps.catalog.constants import PLAN_IDS


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name", "plan", "credits", "created_at")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    name = serializers.CharField(max_length=80, trim_whitespace=True)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate_email(self, value: str) -> str:
        """Addresses are matched case-insensitively, so they are stored folded."""
        email = value.strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("That email is already registered.")
        return email

    def validate_password(self, value: str) -> str:
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class PlanChangeSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=PLAN_IDS)

    def validate_plan(self, value: str) -> str:
        return Plan(value).value
