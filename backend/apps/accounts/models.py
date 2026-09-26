"""Accounts and the opaque sessions the gateway trades for a cookie."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.catalog.constants import PLAN_CREDITS

# Long enough that a working session is never cut short, short enough that a
# leaked token eventually dies on its own.
SESSION_TTL = timedelta(days=30)


def default_session_expiry() -> datetime:
    return timezone.now() + SESSION_TTL


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


class Plan(models.TextChoices):
    FREE = "free", "Free"
    STUDIO = "studio", "Studio"
    PRODUCTION = "production", "Production"


class UserManager(BaseUserManager):
    """Email is the identifier, so the stock username-based manager is out."""

    use_in_migrations = True

    def create_user(self, email: str, name: str, password: str, **extra) -> "User":
        if not email:
            raise ValueError("An email address is required.")
        user = self.model(email=self.normalize_email(email).lower(), name=name, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, name: str, password: str, **extra) -> "User":
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        if not (extra["is_staff"] and extra["is_superuser"]):
            raise ValueError("A superuser must have is_staff and is_superuser set.")
        return self.create_user(email, name, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=80)
    plan = models.CharField(max_length=16, choices=Plan.choices, default=Plan.FREE)
    # Unsigned, so an accounting bug can never drive a balance negative.
    credits = models.PositiveIntegerField(default=PLAN_CREDITS[Plan.FREE])
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.email


class Session(models.Model):
    """
    The token itself is the primary key: one indexed lookup per request, and
    nothing else about it is worth storing.
    """

    token = models.CharField(primary_key=True, max_length=64, default=new_session_token)
    user = models.ForeignKey(User, related_name="sessions", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_session_expiry)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user.email} until {self.expires_at:%Y-%m-%d}"
