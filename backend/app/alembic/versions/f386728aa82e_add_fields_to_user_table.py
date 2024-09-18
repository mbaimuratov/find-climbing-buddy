"""add fields to user table

Revision ID: f386728aa82e
Revises: 03f14bdf80a0
Create Date: 2024-09-18 16:09:47.971128

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'f386728aa82e'
down_revision = '03f14bdf80a0'
branch_labels = None
depends_on = None


def upgrade():
    # Ensure foreign key constraints and relationships are correctly set up
    op.create_foreign_key(
        'fk_event_organizer_id_user', 'event', 'user', ['organizer_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_eventregistration_user_id_user', 'eventregistration', 'user', ['user_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_eventregistration_event_id_event', 'eventregistration', 'event', ['event_id'], ['id'], ondelete='CASCADE'
    )


def downgrade():
    # Remove foreign key constraints and relationships
    op.drop_constraint('fk_eventregistration_event_id_event', 'eventregistration', type_='foreignkey')
    op.drop_constraint('fk_eventregistration_user_id_user', 'eventregistration', type_='foreignkey')
    op.drop_constraint('fk_event_organizer_id_user', 'event', type_='foreignkey')