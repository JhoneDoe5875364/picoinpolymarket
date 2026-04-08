"""General-purpose helpers (randomness, parsing, etc.)."""

from __future__ import annotations

import secrets

__all__ = ["generate_bigint_256"]


def generate_bigint_256() -> int:
    """Return a cryptographically strong uniform integer in ``[0, 2^256)``."""
    return secrets.randbits(256)
