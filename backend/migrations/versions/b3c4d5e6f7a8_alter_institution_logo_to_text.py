"""alter institution logo to text

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-08-19
"""
from alembic import op
import sqlalchemy as sa

revision = "b3c4d5e6f7a8"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("institutions", schema=None) as batch_op:
        batch_op.alter_column(
            "logo",
            existing_type=sa.String(500),
            type_=sa.Text(),
            existing_nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("institutions", schema=None) as batch_op:
        batch_op.alter_column(
            "logo",
            existing_type=sa.Text(),
            type_=sa.String(500),
            existing_nullable=True,
        )
