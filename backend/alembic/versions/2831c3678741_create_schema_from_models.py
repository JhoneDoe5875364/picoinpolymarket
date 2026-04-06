"""create_schema_from_models

Revision ID: 2831c3678741
Revises: 50505e4bfda9
Create Date: 2026-04-06 17:21:08.672274

"""
from typing import Sequence, Union

from alembic import op

from app.models import Base

# revision identifiers, used by Alembic.
revision: str = "2831c3678741"
down_revision: Union[str, Sequence[str], None] = "50505e4bfda9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
