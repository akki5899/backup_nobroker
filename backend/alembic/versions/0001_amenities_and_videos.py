"""Add extended amenity columns to properties and create property_videos table.

Revision ID: 0001_amenities_videos
Revises:
Create Date: 2026-05-31

This migration brings the database in line with the SQLAlchemy models after
adding 24 amenity boolean columns (8 previously-referenced common amenities +
16 new extended amenities) and the property_videos table for MP4/MOV uploads.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_amenities_videos"
down_revision = None
branch_labels = None
depends_on = None


# All amenity columns added to the `properties` table.
AMENITY_COLUMNS = [
    # Common amenities (previously referenced by frontend but missing)
    "lift",
    "security",
    "power_backup",
    "club_house",
    "garden",
    "children_play_area",
    "intercom",
    "visitor_parking",
    # Extended amenities (F23)
    "mini_theatre",
    "library_reading_room",
    "community_hall",
    "pet_park",
    "ev_charging",
    "rainwater_harvesting",
    "solar_panels",
    "maintenance_staff",
    "cctv_surveillance",
    "fire_safety",
    "badminton_squash_court",
    "sauna_steam_room",
    "indoor_games_room",
    "yoga_meditation_room",
    "jogging_track",
    "outdoor_fitness_area",
]


def upgrade() -> None:
    # Add amenity boolean columns (default False, non-null) to properties.
    with op.batch_alter_table("properties") as batch_op:
        for col in AMENITY_COLUMNS:
            batch_op.add_column(
                sa.Column(col, sa.Boolean(), nullable=False, server_default=sa.false())
            )

    # Create property_videos table.
    op.create_table(
        "property_videos",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "property_id",
            sa.Integer(),
            sa.ForeignKey("properties.id"),
            nullable=False,
        ),
        sa.Column("video_url", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("property_videos")
    with op.batch_alter_table("properties") as batch_op:
        for col in reversed(AMENITY_COLUMNS):
            batch_op.drop_column(col)
