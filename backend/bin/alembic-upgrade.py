#!/usr/bin/env python
"""Apply Alembic migrations: ``alembic upgrade head`` (run from repo root or backend)."""
from __future__ import annotations

import sys
from pathlib import Path

_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_root))

from alembic import command
from alembic.config import Config


def main() -> None:
    cfg = Config(str(_root / "alembic.ini"))
    command.upgrade(cfg, "head")


if __name__ == "__main__":
    main()
