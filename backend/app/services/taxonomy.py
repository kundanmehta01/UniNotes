import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from slugify import slugify

from app.db.models import University, Program, Branch, Semester, Subject
from app.schemas.paper import (
    UniversityBase, University as UniversitySchema, UniversityWithPrograms,
    ProgramBase, Program as ProgramSchema, ProgramWithBranches,
    BranchBase, Branch as BranchSchema, BranchWithSemesters,
    SemesterBase, Semester as SemesterSchema, SemesterWithSubjects,
    SubjectBase, Subject as SubjectSchema
)
from app.utils.errors import ValidationError, InsufficientPrivilegesError
from app.db.models import UserRole

logger = logging.getLogger(__name__)


class TaxonomyService:
    """Service for managing taxonomy hierarchy."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # University operations
    
    def create_university(self, university_data: UniversityBase, user) -> University:
        """Create a new university (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        # Generate slug
        slug = slugify(university_data.name)
        
        # Check if slug already exists
        existing = self.db.query(University).filter(University.slug == slug).first()
        if existing:
            raise ValidationError(
                detail="University with this name already exists",
                details={"name": university_data.name, "slug": slug}
            )
        
        try:
            university = University(
                name=university_data.name,
                slug=slug,
                code=university_data.code,
                location=university_data.location,
                website=university_data.website
            )
            
            self.db.add(university)
            self.db.commit()
            self.db.refresh(university)
            
            logger.info(f"University created: {university.name} by admin {user.id}")
            return university
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="University with this slug already exists")
    
    def get_universities(self, include_programs: bool = False) -> List[University]:
        """Get all universities."""
        
        query = self.db.query(University)
        
        if include_programs:
            query = query.options(
                joinedload(University.programs).joinedload(Program.branches).joinedload(Branch.semesters).joinedload(Semester.subjects)
            )
        
        return query.order_by(University.name).all()
    
    def get_university(self, university_id: str, include_programs: bool = False) -> University:
        """Get a single university by ID."""
        
        query = self.db.query(University)
        
        if include_programs:
            query = query.options(
                joinedload(University.programs).joinedload(Program.branches).joinedload(Branch.semesters).joinedload(Semester.subjects)
            )
        
        university = query.filter(University.id == university_id).first()
        if not university:
            raise ValidationError(detail="University not found")
        
        return university
    
    def update_university(self, university_id: str, university_data: UniversityBase, user) -> University:
        """Update a university (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        university = self.db.query(University).filter(University.id == university_id).first()
        if not university:
            raise ValidationError(detail="University not found")
        
        # Update fields
        university.name = university_data.name
        university.slug = slugify(university_data.name)
        university.code = university_data.code
        university.location = university_data.location
        university.website = university_data.website
        
        try:
            self.db.commit()
            self.db.refresh(university)
            
            logger.info(f"University updated: {university.name} by admin {user.id}")
            return university
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="University with this name already exists")
    
    def delete_university(self, university_id: str, user) -> None:
        """Delete a university (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        university = self.db.query(University).filter(University.id == university_id).first()
        if not university:
            raise ValidationError(detail="University not found")
        
        try:
            self.db.delete(university)
            self.db.commit()
            
            logger.info(f"University deleted: {university.name} by admin {user.id}")
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Cannot delete university with existing programs")
    
    # Program operations
    
    def create_program(self, program_data: ProgramBase, university_id: str, user) -> Program:
        """Create a new program (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        # Verify university exists
        university = self.db.query(University).filter(University.id == university_id).first()
        if not university:
            raise ValidationError(detail="University not found")
        
        # Generate slug
        slug = slugify(program_data.name)
        
        # Check if slug already exists for this university
        existing = self.db.query(Program).filter(
            Program.university_id == university_id,
            Program.slug == slug
        ).first()
        if existing:
            raise ValidationError(
                detail="Program with this name already exists in this university",
                details={"name": program_data.name, "slug": slug}
            )
        
        try:
            program = Program(
                name=program_data.name,
                slug=slug,
                duration_years=program_data.duration_years,
                university_id=university_id
            )
            
            self.db.add(program)
            self.db.commit()
            self.db.refresh(program)
            
            logger.info(f"Program created: {program.name} in {university.name} by admin {user.id}")
            return program
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Program with this name already exists")
    
    def get_programs(self, university_id: Optional[str] = None, include_branches: bool = False) -> List[Program]:
        """Get programs, optionally filtered by university."""
        
        query = self.db.query(Program)
        
        if include_branches:
            query = query.options(
                joinedload(Program.branches).joinedload(Branch.semesters).joinedload(Semester.subjects)
            )
        
        if university_id:
            query = query.filter(Program.university_id == university_id)
        
        return query.order_by(Program.name).all()
    
    def get_program(self, program_id: str, include_branches: bool = False) -> Program:
        """Get a single program by ID."""
        
        query = self.db.query(Program)
        
        if include_branches:
            query = query.options(
                joinedload(Program.branches).joinedload(Branch.semesters).joinedload(Semester.subjects)
            )
        
        program = query.filter(Program.id == program_id).first()
        if not program:
            raise ValidationError(detail="Program not found")
        
        return program
    
    def update_program(self, program_id: str, program_data: ProgramBase, user) -> Program:
        """Update a program (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        program = self.db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise ValidationError(detail="Program not found")
        
        # Update fields
        program.name = program_data.name
        program.slug = slugify(program_data.name)
        program.duration_years = program_data.duration_years
        
        try:
            self.db.commit()
            self.db.refresh(program)
            
            logger.info(f"Program updated: {program.name} by admin {user.id}")
            return program
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Program with this name already exists in this university")
    
    def delete_program(self, program_id: str, user) -> None:
        """Delete a program (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        program = self.db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise ValidationError(detail="Program not found")
        
        try:
            self.db.delete(program)
            self.db.commit()
            
            logger.info(f"Program deleted: {program.name} by admin {user.id}")
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Cannot delete program with existing branches")
    
    # Branch operations
    
    def create_branch(self, branch_data: BranchBase, program_id: str, user) -> Branch:
        """Create a new branch (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        # Verify program exists
        program = self.db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise ValidationError(detail="Program not found")
        
        # Generate slug
        slug = slugify(branch_data.name)
        
        # Check if slug already exists for this program
        existing = self.db.query(Branch).filter(
            Branch.program_id == program_id,
            Branch.slug == slug
        ).first()
        if existing:
            raise ValidationError(
                detail="Branch with this name already exists in this program",
                details={"name": branch_data.name, "slug": slug}
            )
        
        try:
            branch = Branch(
                name=branch_data.name,
                slug=slug,
                code=branch_data.code,
                program_id=program_id
            )
            
            self.db.add(branch)
            self.db.commit()
            self.db.refresh(branch)
            
            logger.info(f"Branch created: {branch.name} in {program.name} by admin {user.id}")
            return branch
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Branch with this name already exists")
    
    def get_branches(self, program_id: Optional[str] = None, include_semesters: bool = False) -> List[Branch]:
        """Get branches, optionally filtered by program."""
        
        query = self.db.query(Branch)
        
        if include_semesters:
            query = query.options(
                joinedload(Branch.semesters).joinedload(Semester.subjects)
            )
        
        if program_id:
            query = query.filter(Branch.program_id == program_id)
        
        return query.order_by(Branch.name).all()
    
    def get_branch(self, branch_id: str, include_semesters: bool = False) -> Branch:
        """Get a single branch by ID."""
        
        query = self.db.query(Branch)
        
        if include_semesters:
            query = query.options(
                joinedload(Branch.semesters).joinedload(Semester.subjects)
            )
        
        branch = query.filter(Branch.id == branch_id).first()
        if not branch:
            raise ValidationError(detail="Branch not found")
        
        return branch
    
    def update_branch(self, branch_id: str, branch_data: BranchBase, user) -> Branch:
        """Update a branch (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            raise ValidationError(detail="Branch not found")
        
        # Update fields
        branch.name = branch_data.name
        branch.slug = slugify(branch_data.name)
        branch.code = branch_data.code
        
        try:
            self.db.commit()
            self.db.refresh(branch)
            
            logger.info(f"Branch updated: {branch.name} by admin {user.id}")
            return branch
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Branch with this name already exists in this program")
    
    def delete_branch(self, branch_id: str, user) -> None:
        """Delete a branch (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            raise ValidationError(detail="Branch not found")
        
        try:
            self.db.delete(branch)
            self.db.commit()
            
            logger.info(f"Branch deleted: {branch.name} by admin {user.id}")
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Cannot delete branch with existing semesters")
    
    # Semester operations
    
    def create_semester(self, semester_data: SemesterBase, branch_id: str, user) -> Semester:
        """Create a new semester (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        # Verify branch exists
        branch = self.db.query(Branch).filter(Branch.id == branch_id).first()
        if not branch:
            raise ValidationError(detail="Branch not found")
        
        # Check if semester number already exists for this branch
        existing = self.db.query(Semester).filter(
            Semester.branch_id == branch_id,
            Semester.number == semester_data.number
        ).first()
        if existing:
            raise ValidationError(
                detail="Semester with this number already exists in this branch",
                details={"number": semester_data.number}
            )
        
        try:
            semester = Semester(
                number=semester_data.number,
                name=semester_data.name or f"Semester {semester_data.number}",
                branch_id=branch_id
            )
            
            self.db.add(semester)
            self.db.commit()
            self.db.refresh(semester)
            
            logger.info(f"Semester created: Semester {semester.number} in {branch.name} by admin {user.id}")
            return semester
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Semester with this number already exists")
    
    def get_semesters(self, branch_id: Optional[str] = None, include_subjects: bool = False) -> List[Semester]:
        """Get semesters, optionally filtered by branch."""
        
        query = self.db.query(Semester)
        
        if include_subjects:
            query = query.options(joinedload(Semester.subjects))
        
        if branch_id:
            query = query.filter(Semester.branch_id == branch_id)
        
        return query.order_by(Semester.number).all()
    
    def get_semester(self, semester_id: str, include_subjects: bool = False) -> Semester:
        """Get a single semester by ID."""
        
        query = self.db.query(Semester)
        
        if include_subjects:
            query = query.options(joinedload(Semester.subjects))
        
        semester = query.filter(Semester.id == semester_id).first()
        if not semester:
            raise ValidationError(detail="Semester not found")
        
        return semester
    
    def update_semester(self, semester_id: str, semester_data: SemesterBase, user) -> Semester:
        """Update a semester (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        semester = self.db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            raise ValidationError(detail="Semester not found")
        
        # Update fields
        semester.number = semester_data.number
        semester.name = semester_data.name or f"Semester {semester_data.number}"
        
        try:
            self.db.commit()
            self.db.refresh(semester)
            
            logger.info(f"Semester updated: Semester {semester.number} by admin {user.id}")
            return semester
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Semester with this number already exists in this branch")
    
    def delete_semester(self, semester_id: str, user) -> None:
        """Delete a semester (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        semester = self.db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            raise ValidationError(detail="Semester not found")
        
        try:
            self.db.delete(semester)
            self.db.commit()
            
            logger.info(f"Semester deleted: Semester {semester.number} by admin {user.id}")
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Cannot delete semester with existing subjects")
    
    # Subject operations
    
    def create_subject(self, subject_data: SubjectBase, semester_id: str, user) -> Subject:
        """Create a new subject (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        # Verify semester exists
        semester = self.db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            raise ValidationError(detail="Semester not found")
        
        # Generate slug
        slug = slugify(subject_data.name)
        
        # Check if slug already exists for this semester
        existing = self.db.query(Subject).filter(
            Subject.semester_id == semester_id,
            Subject.slug == slug
        ).first()
        if existing:
            raise ValidationError(
                detail="Subject with this name already exists in this semester",
                details={"name": subject_data.name, "slug": slug}
            )
        
        try:
            subject = Subject(
                name=subject_data.name,
                slug=slug,
                code=subject_data.code,
                credits=subject_data.credits,
                semester_id=semester_id
            )
            
            self.db.add(subject)
            self.db.commit()
            self.db.refresh(subject)
            
            logger.info(f"Subject created: {subject.name} in semester {semester.number} by admin {user.id}")
            return subject
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Subject with this name already exists")
    
    def get_subjects(self, semester_id: Optional[str] = None) -> List[Subject]:
        """Get subjects, optionally filtered by semester."""
        
        query = self.db.query(Subject).options(
            joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university)
        )
        
        if semester_id:
            query = query.filter(Subject.semester_id == semester_id)
        
        return query.order_by(Subject.name).all()
    
    def get_subject(self, subject_id: str) -> Subject:
        """Get a single subject by ID with full taxonomy."""
        
        subject = self.db.query(Subject).options(
            joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university)
        ).filter(Subject.id == subject_id).first()
        
        if not subject:
            raise ValidationError(detail="Subject not found")
        
        return subject
    
    def update_subject(self, subject_id: str, subject_data: SubjectBase, user) -> Subject:
        """Update a subject (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise ValidationError(detail="Subject not found")
        
        # Update fields
        subject.name = subject_data.name
        subject.slug = slugify(subject_data.name)
        subject.code = subject_data.code
        subject.credits = subject_data.credits
        
        try:
            self.db.commit()
            self.db.refresh(subject)
            
            logger.info(f"Subject updated: {subject.name} by admin {user.id}")
            return subject
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Subject with this name already exists in this semester")
    
    def delete_subject(self, subject_id: str, user) -> None:
        """Delete a subject (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        subject = self.db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise ValidationError(detail="Subject not found")
        
        try:
            self.db.delete(subject)
            self.db.commit()
            
            logger.info(f"Subject deleted: {subject.name} by admin {user.id}")
            
        except IntegrityError:
            self.db.rollback()
            raise ValidationError(detail="Cannot delete subject with existing papers")
    
    # Bulk operations for seeding data
    
    def create_taxonomy_bulk(self, taxonomy_data: Dict[str, Any], user) -> Dict[str, Any]:
        """Create taxonomy structure in bulk (admin only)."""
        
        if user.role != UserRole.ADMIN:
            raise InsufficientPrivilegesError(detail="Admin privileges required")
        
        created = {
            "universities": 0,
            "programs": 0,
            "branches": 0,
            "semesters": 0,
            "subjects": 0
        }
        
        try:
            for university_data in taxonomy_data.get("universities", []):
                # Create university
                university = self.create_university(
                    UniversityBase(**university_data["info"]),
                    user
                )
                created["universities"] += 1
                
                # Create programs
                for program_data in university_data.get("programs", []):
                    program = self.create_program(
                        ProgramBase(**program_data["info"]),
                        str(university.id),
                        user
                    )
                    created["programs"] += 1
                    
                    # Create branches
                    for branch_data in program_data.get("branches", []):
                        branch = self.create_branch(
                            BranchBase(**branch_data["info"]),
                            str(program.id),
                            user
                        )
                        created["branches"] += 1
                        
                        # Create semesters
                        for semester_data in branch_data.get("semesters", []):
                            semester = self.create_semester(
                                SemesterBase(**semester_data["info"]),
                                str(branch.id),
                                user
                            )
                            created["semesters"] += 1
                            
                            # Create subjects
                            for subject_info in semester_data.get("subjects", []):
                                subject = self.create_subject(
                                    SubjectBase(**subject_info),
                                    str(semester.id),
                                    user
                                )
                                created["subjects"] += 1
            
            logger.info(f"Bulk taxonomy creation completed by admin {user.id}: {created}")
            return created
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Bulk taxonomy creation failed: {e}")
            raise
    
    def get_taxonomy_tree(self) -> List[UniversityWithPrograms]:
        """Get complete taxonomy tree."""
        
        universities = self.db.query(University).options(
            joinedload(University.programs).joinedload(Program.branches).joinedload(Branch.semesters).joinedload(Semester.subjects)
        ).order_by(University.name).all()
        
        return universities
    
    def search_subjects(self, query: str, limit: int = 50) -> List[Subject]:
        """Search subjects by name or code."""
        
        search_term = f"%{query}%"
        subjects = self.db.query(Subject).options(
            joinedload(Subject.semester).joinedload(Semester.branch).joinedload(Branch.program).joinedload(Program.university)
        ).filter(
            Subject.name.ilike(search_term) | Subject.code.ilike(search_term)
        ).limit(limit).all()
        
        return subjects
    
    def get_taxonomy_stats(self) -> Dict[str, int]:
        """Get taxonomy statistics."""
        
        return {
            "universities": self.db.query(University).count(),
            "programs": self.db.query(Program).count(),
            "branches": self.db.query(Branch).count(),
            "semesters": self.db.query(Semester).count(),
            "subjects": self.db.query(Subject).count(),
        }


def get_taxonomy_service(db: Session) -> TaxonomyService:
    """Get taxonomy service instance."""
    return TaxonomyService(db)
