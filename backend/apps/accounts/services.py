"""Account business rules. Views call these; nothing here knows about HTTP."""

from __future__ import annotations

from django.contrib.auth.hashers import check_password
from django.db import transaction

from apps.accounts.models import Session, User
from apps.catalog.constants import PLAN_CREDITS
from core.exceptions import InvalidCredentials


@transaction.atomic
def register(*, email: str, name: str, password: str) -> tuple[User, Session]:
    """A new account is signed in immediately; the gateway needs a token back."""
    user = User.objects.create_user(email=email, name=name, password=password)
    return user, start_session(user)


def authenticate(*, email: str, password: str) -> User:
    """
    Always runs a hash comparison, even for an unknown address, so response
    time does not reveal which emails exist.
    """
    user = User.objects.filter(email=email).first()
    if user is None:
        User().set_password(password)
        raise InvalidCredentials()
    if not check_password(password, user.password) or not user.is_active:
        raise InvalidCredentials()
    return user


def start_session(user: User) -> Session:
    return Session.objects.create(user=user)


def end_session(session: Session | None) -> None:
    """Logging out is idempotent: a stale cookie is not an error worth raising."""
    if session is not None:
        session.delete()


@transaction.atomic
def change_plan(*, user: User, plan: str) -> User:
    """
    Switching plan tops the balance up to the new allowance.

    Credits already bought are never confiscated, so a downgrade leaves a
    larger balance alone.
    """
    locked = User.objects.select_for_update().get(pk=user.pk)
    locked.plan = plan
    locked.credits = max(locked.credits, PLAN_CREDITS[plan])
    locked.save(update_fields=["plan", "credits"])
    return locked
