"""
Cursor pagination over ``(created_at, id)``.

Offsets drift whenever a row is inserted mid-scroll, which is exactly what a
feed does, so the cursor names the last row seen instead of a position.
"""

from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from django.db.models import Q, QuerySet
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import ValidationError

DEFAULT_LIMIT = 24
MAX_LIMIT = 60


@dataclass(frozen=True)
class Page:
    items: list[Any]
    next_cursor: str | None


def encode_cursor(created_at: datetime, pk: Any) -> str:
    raw = f"{created_at.isoformat()}|{pk}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str) -> tuple[datetime, str]:
    try:
        raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    except (binascii.Error, UnicodeDecodeError, ValueError) as exc:
        raise ValidationError({"cursor": "Cursor is malformed."}) from exc
    timestamp, _, pk = raw.partition("|")
    parsed = parse_datetime(timestamp) if timestamp else None
    if parsed is None or not pk:
        raise ValidationError({"cursor": "Cursor is malformed."})
    return parsed, pk


def read_limit(raw: str | None) -> int:
    if not raw:
        return DEFAULT_LIMIT
    try:
        limit = int(raw)
    except ValueError as exc:
        raise ValidationError({"limit": "Limit must be an integer."}) from exc
    if limit < 1:
        raise ValidationError({"limit": "Limit must be at least 1."})
    return min(limit, MAX_LIMIT)


def paginate(queryset: QuerySet, *, limit: int, cursor: str | None) -> Page:
    """Newest first; the queryset must already be ordered by ``-created_at, -id``."""
    if cursor:
        created_at, pk = decode_cursor(cursor)
        queryset = queryset.filter(
            Q(created_at__lt=created_at) | Q(created_at=created_at, id__lt=pk)
        )

    rows = list(queryset[: limit + 1])
    has_more = len(rows) > limit
    items = rows[:limit]
    next_cursor = encode_cursor(items[-1].created_at, items[-1].id) if has_more else None
    return Page(items=items, next_cursor=next_cursor)
