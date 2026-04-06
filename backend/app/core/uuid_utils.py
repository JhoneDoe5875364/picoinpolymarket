"""Small UUID helpers shared across repositories."""

from __future__ import annotations

import uuid
from typing import Union

UuidLike = Union[str, uuid.UUID]


def as_uuid(value: UuidLike) -> uuid.UUID:
    """Coerce a string or :class:`uuid.UUID` to :class:`uuid.UUID`."""
    if isinstance(value, uuid.UUID):
        return value
    return uuid.UUID(str(value))
