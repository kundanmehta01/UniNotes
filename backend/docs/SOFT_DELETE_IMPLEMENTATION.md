# Soft Delete Implementation Guide

This document explains how the soft delete functionality has been implemented in UniNotesHub and how to use it throughout the application.

## Overview

Soft delete allows records to be "deleted" without permanently removing them from the database. Instead, a `deleted_at` timestamp is set, and queries are modified to filter out these records by default.

## Implementation Details

### 1. Database Schema Changes

A new migration has been created (`2025_09_17_1749-b3bf6047-8aa_add_soft_delete_support.py`) that adds:

- `deleted_at` timestamp columns to all relevant tables
- Indexes on `deleted_at` columns for performance
- Composite indexes for better query performance

### 2. Model Updates

#### Base SoftDeleteMixin

All models that support soft delete now inherit from `SoftDeleteMixin` which provides:

```python
class SoftDeleteMixin:
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    @classmethod
    def active(cls):
        """Query only non-deleted records."""
        return cls.deleted_at.is_(None)
    
    @classmethod
    def deleted(cls):
        """Query only deleted records."""
        return cls.deleted_at.isnot(None)
    
    def soft_delete(self, session: Session = None):
        """Mark record as deleted."""
        self.deleted_at = func.now()
    
    def restore(self, session: Session = None):
        """Restore a soft-deleted record."""
        self.deleted_at = None
    
    @property
    def is_deleted(self) -> bool:
        """Check if the record is soft-deleted."""
        return self.deleted_at is not None
```

#### Models with Soft Delete Support

- `User` - User accounts
- `Paper` - Academic papers
- `Note` - Study notes
- `Tag` - Content tags
- `University` - Universities
- `Program` - Academic programs
- `Branch` - Academic branches
- `Semester` - Semesters
- `Subject` - Subjects

### 3. Service Layer

#### SoftDeleteService

A comprehensive service class provides utility functions for soft delete operations:

```python
from app.services.soft_delete import SoftDeleteService

# Get active records only
active_papers = SoftDeleteService.get_active_query(Paper, db).all()

# Get deleted records only
deleted_papers = SoftDeleteService.get_deleted_query(Paper, db).all()

# Soft delete a record
SoftDeleteService.soft_delete_by_id(Paper, paper_id, db)

# Restore a record
SoftDeleteService.restore_by_id(Paper, paper_id, db)

# Bulk operations
SoftDeleteService.bulk_soft_delete(Paper, [id1, id2, id3], db)
SoftDeleteService.bulk_restore(Paper, [id1, id2, id3], db)

# Hard delete (permanent - use with caution!)
SoftDeleteService.hard_delete_by_id(Paper, paper_id, db)
```

#### Query Decorators

```python
from app.services.soft_delete import active_only, include_deleted

@active_only
def get_papers(session):
    return session.query(Paper)  # Automatically filters out deleted records

@include_deleted
def get_all_papers_including_deleted(session):
    return session.query(Paper)  # Explicitly includes deleted records
```

#### SoftDeleteQueryMixin

For service classes that need soft delete functionality:

```python
class PaperService(SoftDeleteQueryMixin):
    model = Paper
    
    def get_by_subject(self, subject_id, session, include_deleted=False):
        query = self.get_base_query(session, include_deleted)
        return query.filter(Paper.subject_id == subject_id)
```

### 4. API Endpoints

#### Admin Soft Delete Management

The following admin endpoints have been added:

- `GET /admin/soft-delete/overview` - Overview of deleted items
- `GET /admin/soft-delete/{model_type}` - List deleted items by type
- `POST /admin/soft-delete/{model_type}/{item_id}/restore` - Restore an item
- `POST /admin/soft-delete/{model_type}/bulk-restore` - Bulk restore items
- `DELETE /admin/soft-delete/{model_type}/{item_id}/hard-delete` - Permanent delete (with confirmation)

#### Usage Examples

```python
# Get overview of all deleted items
GET /admin/soft-delete/overview

# Get deleted papers with pagination
GET /admin/soft-delete/papers?skip=0&limit=50

# Restore a specific paper
POST /admin/soft-delete/papers/123e4567-e89b-12d3-a456-426614174000/restore

# Bulk restore multiple papers
POST /admin/soft-delete/papers/bulk-restore?item_ids=id1,id2,id3

# Hard delete (permanent) - requires confirmation
DELETE /admin/soft-delete/papers/123e4567-e89b-12d3-a456-426614174000/hard-delete?confirm=true
```

## Migration Process

### Running the Migration

To apply the soft delete columns to your database:

```bash
alembic upgrade head
```

### Reverting the Migration (if needed)

```bash
alembic downgrade b3bf6047-8aa
```

## Usage Guidelines

### 1. Querying Records

**Default Behavior (Active Records Only):**
```python
# This will only return non-deleted papers
papers = db.query(Paper).all()

# Or use the service helper
papers = SoftDeleteService.get_active_query(Paper, db).all()
```

**Including Deleted Records:**
```python
# Get all records including deleted ones
all_papers = SoftDeleteService.get_all_query(Paper, db).all()

# Get only deleted records
deleted_papers = SoftDeleteService.get_deleted_query(Paper, db).all()
```

### 2. Deleting Records

**Soft Delete:**
```python
# Using the service
SoftDeleteService.soft_delete_by_id(Paper, paper_id, db)

# Or using the model method
paper = db.query(Paper).filter(Paper.id == paper_id).first()
paper.soft_delete(db)
```

**Hard Delete (Use with Caution):**
```python
# Only use when you really need to permanently remove data
SoftDeleteService.hard_delete_by_id(Paper, paper_id, db)
```

### 3. Restoring Records

```python
# Restore a single record
SoftDeleteService.restore_by_id(Paper, paper_id, db)

# Bulk restore
SoftDeleteService.bulk_restore(Paper, [id1, id2, id3], db)

# Or using the model method
paper = SoftDeleteService.get_deleted_query(Paper, db).filter(Paper.id == paper_id).first()
paper.restore(db)
```

## Best Practices

### 1. Always Use Soft Delete by Default

- Use soft delete for user-generated content (papers, notes, user accounts)
- Only use hard delete for temporary data or when legally required

### 2. Query Considerations

- Always be explicit about whether you want to include deleted records
- Use the service methods rather than writing raw queries
- Consider performance implications of additional WHERE clauses

### 3. Admin Interface

- Provide admins with tools to view and restore deleted content
- Log all restoration actions for audit purposes
- Require confirmation for hard deletes

### 4. Data Cleanup

- Implement periodic cleanup jobs for very old soft-deleted records
- Consider hard deleting after a certain period (e.g., 6 months to 2 years)
- Follow data retention policies

## Performance Considerations

### 1. Indexes

The migration creates indexes on `deleted_at` columns to ensure good performance:

```sql
CREATE INDEX idx_papers_deleted_at ON papers(deleted_at);
CREATE INDEX idx_papers_status_deleted ON papers(status, deleted_at);
```

### 2. Query Patterns

Good query patterns:
```python
# Good - uses index efficiently
papers = db.query(Paper).filter(Paper.deleted_at.is_(None)).all()

# Good - specific condition
active_papers = db.query(Paper).filter(
    Paper.deleted_at.is_(None),
    Paper.status == PaperStatus.APPROVED
).all()
```

Avoid:
```python
# Avoid - can't use index effectively
papers = db.query(Paper).filter(Paper.deleted_at == None).all()
```

## Troubleshooting

### Common Issues

1. **ImportError for SoftDeleteMixin**
   - Ensure you've imported from `app.models.base`
   - Check that the model inherits from both `Base` and `SoftDeleteMixin`

2. **Migration Errors**
   - Check that all previous migrations are applied
   - Ensure database user has ALTER TABLE permissions

3. **Performance Issues**
   - Verify indexes are created properly
   - Use EXPLAIN to analyze query performance
   - Consider composite indexes for complex queries

### Testing Soft Deletes

```python
def test_soft_delete():
    # Create a paper
    paper = Paper(title="Test Paper")
    db.add(paper)
    db.commit()
    
    # Soft delete it
    SoftDeleteService.soft_delete_by_id(Paper, paper.id, db)
    
    # Verify it's not in active query
    active_papers = SoftDeleteService.get_active_query(Paper, db).all()
    assert paper not in active_papers
    
    # Verify it's in deleted query
    deleted_papers = SoftDeleteService.get_deleted_query(Paper, db).all()
    assert paper in deleted_papers
    
    # Restore it
    SoftDeleteService.restore_by_id(Paper, paper.id, db)
    
    # Verify it's back in active query
    active_papers = SoftDeleteService.get_active_query(Paper, db).all()
    assert paper in active_papers
```

## Security Considerations

1. **Admin Access Only**: Restore functionality should only be available to admins
2. **Audit Logging**: Log all soft delete and restore operations
3. **Data Privacy**: Consider hard deleting personal data when required by law
4. **Access Control**: Soft-deleted records should not be accessible to regular users

## Monitoring and Maintenance

### Monitoring Deleted Records

```python
# Check counts of deleted records
deleted_counts = {
    'users': SoftDeleteService.get_deleted_query(User, db).count(),
    'papers': SoftDeleteService.get_deleted_query(Paper, db).count(),
    'notes': SoftDeleteService.get_deleted_query(Note, db).count(),
}
```

### Cleanup Jobs

Consider implementing cleanup jobs for:
- Old soft-deleted records (>2 years)
- Orphaned relationships
- Temporary data that doesn't need to be preserved

## Future Enhancements

1. **Cascade Soft Deletes**: When a user is soft-deleted, consider soft-deleting their content
2. **Retention Policies**: Implement configurable retention periods
3. **Bulk Operations UI**: Admin interface for bulk restore/delete operations
4. **Analytics**: Track deletion patterns and restoration rates
