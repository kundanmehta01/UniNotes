"""Add notes models and update existing models for notes support

This migration adds the following:
1. Note model with all necessary fields (similar to Paper model)
2. NoteStatus enum
3. Note-related models: NoteTag, NoteDownload, NoteBookmark, NoteReport, NoteRating
4. Updates to existing models to add note relationships
5. UserActivity model updated to support note activities
6. NotificationType enum updated to include NOTE_STATUS

Revision ID: add_notes_models
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_notes_models'
down_revision = None  # Replace with actual previous revision
branch_labels = None
depends_on = None

def upgrade():
    """
    Add note-related models and update existing models
    """
    
    # Create NoteStatus enum
    note_status_enum = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', name='notestatus')
    note_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Update NotificationType enum to include NOTE_STATUS
    op.execute("ALTER TYPE notificationtype ADD VALUE 'note_status'")
    
    # Create notes table
    op.create_table(
        'notes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('semester_year', sa.Integer(), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False),
        sa.Column('original_filename', sa.String(length=500), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('status', note_status_enum, nullable=False, default='PENDING'),
        sa.Column('moderation_notes', sa.Text(), nullable=True),
        sa.Column('subject_id', sa.String(length=36), nullable=False),
        sa.Column('uploader_id', sa.String(length=36), nullable=True),
        sa.Column('download_count', sa.Integer(), nullable=False, default=0),
        sa.Column('view_count', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('file_hash')
    )
    
    # Create indexes for notes table
    op.create_index('idx_notes_status_year', 'notes', ['status', 'semester_year'])
    op.create_index('idx_notes_subject_status', 'notes', ['subject_id', 'status'])
    op.create_index('idx_notes_uploader', 'notes', ['uploader_id'])
    op.create_index(op.f('ix_notes_title'), 'notes', ['title'])
    op.create_index(op.f('ix_notes_semester_year'), 'notes', ['semester_year'])
    op.create_index(op.f('ix_notes_file_hash'), 'notes', ['file_hash'])
    op.create_index(op.f('ix_notes_status'), 'notes', ['status'])
    op.create_index(op.f('ix_notes_subject_id'), 'notes', ['subject_id'])
    
    # Create note_tags table (many-to-many relationship)
    op.create_table(
        'note_tags',
        sa.Column('note_id', sa.String(length=36), nullable=False),
        sa.Column('tag_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('note_id', 'tag_id')
    )
    
    # Create note_downloads table
    op.create_table(
        'note_downloads',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('note_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=True),
        sa.Column('ip_hash', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('referer', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for note_downloads
    op.create_index('idx_note_downloads_note_created', 'note_downloads', ['note_id', 'created_at'])
    op.create_index('idx_note_downloads_user_created', 'note_downloads', ['user_id', 'created_at'])
    
    # Create note_bookmarks table
    op.create_table(
        'note_bookmarks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('note_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'note_id', name='unique_note_bookmark_per_user_note')
    )
    
    # Create index for note_bookmarks
    op.create_index('idx_note_bookmarks_user_created', 'note_bookmarks', ['user_id', 'created_at'])
    
    # Create note_reports table
    op.create_table(
        'note_reports',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('note_id', sa.String(length=36), nullable=False),
        sa.Column('reporter_id', sa.String(length=36), nullable=False),
        sa.Column('reason', sa.String(length=500), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('status', postgresql.ENUM('open', 'closed', name='reportstatus'), nullable=False, default='open'),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for note_reports
    op.create_index('idx_note_reports_note', 'note_reports', ['note_id'])
    op.create_index('idx_note_reports_status', 'note_reports', ['status'])
    
    # Create note_ratings table
    op.create_table(
        'note_ratings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('note_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'note_id', name='unique_note_rating_per_user_note')
    )
    
    # Create indexes for note_ratings
    op.create_index('idx_note_ratings_note', 'note_ratings', ['note_id'])
    op.create_index('idx_note_ratings_user', 'note_ratings', ['user_id'])
    
    # Add note_id column to user_activities table
    op.add_column('user_activities', sa.Column('note_id', sa.String(length=36), nullable=True))
    op.create_foreign_key(None, 'user_activities', 'notes', ['note_id'], ['id'])
    
    # Create index for note activities
    op.create_index('idx_user_activities_note', 'user_activities', ['note_id'])


def downgrade():
    """
    Remove note-related models and revert changes
    """
    
    # Drop indexes
    op.drop_index('idx_user_activities_note', table_name='user_activities')
    op.drop_index('idx_note_ratings_user', table_name='note_ratings')
    op.drop_index('idx_note_ratings_note', table_name='note_ratings')
    op.drop_index('idx_note_reports_status', table_name='note_reports')
    op.drop_index('idx_note_reports_note', table_name='note_reports')
    op.drop_index('idx_note_bookmarks_user_created', table_name='note_bookmarks')
    op.drop_index('idx_note_downloads_user_created', table_name='note_downloads')
    op.drop_index('idx_note_downloads_note_created', table_name='note_downloads')
    op.drop_index(op.f('ix_notes_subject_id'), table_name='notes')
    op.drop_index(op.f('ix_notes_status'), table_name='notes')
    op.drop_index(op.f('ix_notes_file_hash'), table_name='notes')
    op.drop_index(op.f('ix_notes_semester_year'), table_name='notes')
    op.drop_index(op.f('ix_notes_title'), table_name='notes')
    op.drop_index('idx_notes_uploader', table_name='notes')
    op.drop_index('idx_notes_subject_status', table_name='notes')
    op.drop_index('idx_notes_status_year', table_name='notes')
    
    # Remove note_id column from user_activities
    op.drop_constraint(None, 'user_activities', type_='foreignkey')
    op.drop_column('user_activities', 'note_id')
    
    # Drop tables
    op.drop_table('note_ratings')
    op.drop_table('note_reports')
    op.drop_table('note_bookmarks')
    op.drop_table('note_downloads')
    op.drop_table('note_tags')
    op.drop_table('notes')
    
    # Drop NoteStatus enum
    note_status_enum = postgresql.ENUM('PENDING', 'APPROVED', 'REJECTED', name='notestatus')
    note_status_enum.drop(op.get_bind(), checkfirst=True)
    
    # Note: Reverting the NotificationType enum change would be complex and potentially destructive
    # Consider handling this separately if needed
