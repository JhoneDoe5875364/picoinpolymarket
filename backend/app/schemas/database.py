"""
Backward-compatible re-exports. Prefer:
- app.schemas.entities — persisted row / response shapes
- app.schemas.requests — command / body DTOs
"""
from app.schemas.entities import *  # noqa: F403
from app.schemas.requests import *  # noqa: F403
