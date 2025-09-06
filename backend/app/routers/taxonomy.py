from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.db.session import get_db
from app.deps import get_current_admin_user, get_current_user_optional
from app.schemas.paper import (
    UniversityBase, University, UniversityWithPrograms,
    ProgramBase, Program, BranchBase, Branch,
    SemesterBase, Semester, SubjectBase, Subject
)
from app.schemas.user import User
from app.services.taxonomy import get_taxonomy_service

router = APIRouter()


# Universities
@router.post("/universities", response_model=University, status_code=status.HTTP_201_CREATED)
async def create_university(
    university_data: UniversityBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new university (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    university = taxonomy_service.create_university(university_data, current_user)
    
    return university


@router.get("/universities", response_model=List[University])
async def get_universities(
    include_programs: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get all universities."""
    
    taxonomy_service = get_taxonomy_service(db)
    universities = taxonomy_service.get_universities(include_programs=include_programs)
    
    return universities


@router.get("/universities/{university_id}", response_model=University)
async def get_university(
    university_id: str,
    include_programs: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get a single university by ID."""
    
    taxonomy_service = get_taxonomy_service(db)
    university = taxonomy_service.get_university(university_id, include_programs=include_programs)
    
    return university


@router.put("/universities/{university_id}", response_model=University)
async def update_university(
    university_id: str,
    university_data: UniversityBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a university (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    university = taxonomy_service.update_university(university_id, university_data, current_user)
    
    return university


@router.delete("/universities/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_university(
    university_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a university (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    taxonomy_service.delete_university(university_id, current_user)
    
    return None


# Programs
@router.post("/universities/{university_id}/programs", response_model=Program, status_code=status.HTTP_201_CREATED)
async def create_program(
    university_id: str,
    program_data: ProgramBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new program (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    program = taxonomy_service.create_program(program_data, university_id, current_user)
    
    return program


@router.get("/programs", response_model=List[Program])
async def get_programs(
    university_id: Optional[str] = Query(None),
    include_branches: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get programs, optionally filtered by university."""
    
    taxonomy_service = get_taxonomy_service(db)
    programs = taxonomy_service.get_programs(university_id=university_id, include_branches=include_branches)
    
    return programs


@router.get("/programs/{program_id}", response_model=Program)
async def get_program(
    program_id: str,
    include_branches: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get a single program by ID."""
    
    taxonomy_service = get_taxonomy_service(db)
    program = taxonomy_service.get_program(program_id, include_branches=include_branches)
    
    return program


@router.put("/programs/{program_id}", response_model=Program)
async def update_program(
    program_id: str,
    program_data: ProgramBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a program (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    program = taxonomy_service.update_program(program_id, program_data, current_user)
    
    return program


@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
    program_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a program (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    taxonomy_service.delete_program(program_id, current_user)
    
    return None


# Branches
@router.post("/programs/{program_id}/branches", response_model=Branch, status_code=status.HTTP_201_CREATED)
async def create_branch(
    program_id: str,
    branch_data: BranchBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new branch (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    branch = taxonomy_service.create_branch(branch_data, program_id, current_user)
    
    return branch


@router.get("/branches", response_model=List[Branch])
async def get_branches(
    program_id: Optional[str] = Query(None),
    include_semesters: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get branches, optionally filtered by program."""
    
    taxonomy_service = get_taxonomy_service(db)
    branches = taxonomy_service.get_branches(program_id=program_id, include_semesters=include_semesters)
    
    return branches


@router.get("/branches/{branch_id}", response_model=Branch)
async def get_branch(
    branch_id: str,
    include_semesters: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get a single branch by ID."""
    
    taxonomy_service = get_taxonomy_service(db)
    branch = taxonomy_service.get_branch(branch_id, include_semesters=include_semesters)
    
    return branch


@router.put("/branches/{branch_id}", response_model=Branch)
async def update_branch(
    branch_id: str,
    branch_data: BranchBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a branch (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    branch = taxonomy_service.update_branch(branch_id, branch_data, current_user)
    
    return branch


@router.delete("/branches/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch(
    branch_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a branch (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    taxonomy_service.delete_branch(branch_id, current_user)
    
    return None


# Semesters
@router.post("/branches/{branch_id}/semesters", response_model=Semester, status_code=status.HTTP_201_CREATED)
async def create_semester(
    branch_id: str,
    semester_data: SemesterBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new semester (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    semester = taxonomy_service.create_semester(semester_data, branch_id, current_user)
    
    return semester


@router.get("/semesters", response_model=List[Semester])
async def get_semesters(
    branch_id: Optional[str] = Query(None),
    include_subjects: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get semesters, optionally filtered by branch."""
    
    taxonomy_service = get_taxonomy_service(db)
    semesters = taxonomy_service.get_semesters(branch_id=branch_id, include_subjects=include_subjects)
    
    return semesters


@router.get("/semesters/{semester_id}", response_model=Semester)
async def get_semester(
    semester_id: str,
    include_subjects: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Get a single semester by ID."""
    
    taxonomy_service = get_taxonomy_service(db)
    semester = taxonomy_service.get_semester(semester_id, include_subjects=include_subjects)
    
    return semester


@router.put("/semesters/{semester_id}", response_model=Semester)
async def update_semester(
    semester_id: str,
    semester_data: SemesterBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a semester (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    semester = taxonomy_service.update_semester(semester_id, semester_data, current_user)
    
    return semester


@router.delete("/semesters/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_semester(
    semester_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a semester (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    taxonomy_service.delete_semester(semester_id, current_user)
    
    return None


# Subjects
@router.post("/semesters/{semester_id}/subjects", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(
    semester_id: str,
    subject_data: SubjectBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new subject (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    subject = taxonomy_service.create_subject(subject_data, semester_id, current_user)
    
    return subject


@router.get("/subjects", response_model=List[Subject])
async def get_subjects(
    semester_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get subjects, optionally filtered by semester."""
    
    taxonomy_service = get_taxonomy_service(db)
    subjects = taxonomy_service.get_subjects(semester_id=semester_id)
    
    return subjects


@router.get("/subjects/{subject_id}", response_model=Subject)
async def get_subject(
    subject_id: str,
    db: Session = Depends(get_db),
):
    """Get a single subject by ID with full taxonomy."""
    
    taxonomy_service = get_taxonomy_service(db)
    subject = taxonomy_service.get_subject(subject_id)
    
    return subject


@router.put("/subjects/{subject_id}", response_model=Subject)
async def update_subject(
    subject_id: str,
    subject_data: SubjectBase,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update a subject (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    subject = taxonomy_service.update_subject(subject_id, subject_data, current_user)
    
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a subject (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    taxonomy_service.delete_subject(subject_id, current_user)
    
    return None


@router.get("/subjects/search", response_model=List[Subject])
async def search_subjects(
    q: str = Query(..., min_length=2, description="Search query for subject name or code"),
    limit: int = Query(50, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db),
):
    """Search subjects by name or code."""
    
    taxonomy_service = get_taxonomy_service(db)
    subjects = taxonomy_service.search_subjects(query=q, limit=limit)
    
    return subjects


# Tree and bulk operations
@router.get("/tree", response_model=List[UniversityWithPrograms])
async def get_taxonomy_tree(
    db: Session = Depends(get_db),
):
    """Get complete taxonomy tree."""
    
    taxonomy_service = get_taxonomy_service(db)
    tree = taxonomy_service.get_taxonomy_tree()
    
    return tree


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def create_taxonomy_bulk(
    taxonomy_data: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create taxonomy structure in bulk (admin only)."""
    
    taxonomy_service = get_taxonomy_service(db)
    result = taxonomy_service.create_taxonomy_bulk(taxonomy_data, current_user)
    
    return {
        "message": "Taxonomy created successfully",
        "created": result
    }


@router.get("/stats")
async def get_taxonomy_stats(
    db: Session = Depends(get_db),
):
    """Get taxonomy statistics."""
    
    from app.db.models import University, Program, Branch, Subject
    
    # Get direct counts from database for accurate statistics
    total_universities = db.query(University).count()
    total_programs = db.query(Program).count()
    total_branches = db.query(Branch).count()
    total_subjects = db.query(Subject).count()
    
    # Get detailed stats from service for additional data
    taxonomy_service = get_taxonomy_service(db)
    detailed_stats = taxonomy_service.get_taxonomy_stats()
    
    # Return in format expected by frontend
    return {
        "total": total_universities,
        "programs": total_programs,
        "branches": total_branches,
        "subjects": total_subjects,
        "detailed": detailed_stats  # Include detailed stats for other uses
    }
