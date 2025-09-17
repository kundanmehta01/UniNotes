import uuid
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base, UUID, SoftDeleteMixin


class University(Base, SoftDeleteMixin):
    __tablename__ = "universities"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    code = Column(String(20))  # University code like "VTU", "ANNA", etc.
    location = Column(String(255))
    website = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    programs = relationship("Program", back_populates="university")


class Program(Base, SoftDeleteMixin):
    __tablename__ = "programs"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # B.Tech, B.Sc, MBA, etc.
    slug = Column(String(255), nullable=False)
    duration_years = Column(Integer)  # 4 for B.Tech, 2 for MBA, etc.
    
    university_id = Column(UUID(), ForeignKey("universities.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    university = relationship("University", back_populates="programs")
    branches = relationship("Branch", back_populates="program")

    __table_args__ = (
        UniqueConstraint("university_id", "slug", name="unique_program_per_university"),
    )


class Branch(Base, SoftDeleteMixin):
    __tablename__ = "branches"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # CSE, ECE, Mechanical, etc.
    slug = Column(String(255), nullable=False)
    code = Column(String(20))  # CSE, ECE, ME, etc.
    
    program_id = Column(UUID(), ForeignKey("programs.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    program = relationship("Program", back_populates="branches")
    semesters = relationship("Semester", back_populates="branch")

    __table_args__ = (
        UniqueConstraint("program_id", "slug", name="unique_branch_per_program"),
    )


class Semester(Base, SoftDeleteMixin):
    __tablename__ = "semesters"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    name = Column(String(100))  # "First Semester", "Sem 1", etc.
    
    branch_id = Column(UUID(), ForeignKey("branches.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    branch = relationship("Branch", back_populates="semesters")
    subjects = relationship("Subject", back_populates="semester")

    __table_args__ = (
        UniqueConstraint("branch_id", "number", name="unique_semester_per_branch"),
    )


class Subject(Base, SoftDeleteMixin):
    __tablename__ = "subjects"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # Database Management Systems
    code = Column(String(50))  # CS301, 18CS53, etc.
    slug = Column(String(255), nullable=False)
    credits = Column(Integer)
    
    semester_id = Column(UUID(), ForeignKey("semesters.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="subjects")
    papers = relationship("Paper", back_populates="subject")
    notes = relationship("Note", back_populates="subject")

    __table_args__ = (
        UniqueConstraint("semester_id", "slug", name="unique_subject_per_semester"),
    )
