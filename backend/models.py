# models.py
import uuid
from datetime import datetime
from typing import List, Optional, Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, CheckConstraint, Text, ForeignKey, String
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.types import DateTime
from sqlalchemy.sql import func

# Usamos JSONB para os relatórios da IA, que é mais eficiente para buscas em JSON no PostgreSQL.
# Se o tipo JSONB não estiver disponível, pode usar `dict` com um tipo genérico.
JsonB = Any


class Profile(SQLModel, table=True):
    __tablename__ = "profiles"

    id: uuid.UUID = Field(primary_key=True)
    full_name: Optional[str] = None
    email: str = Field(index=True, nullable=False, unique=True)
    
    resumes: List["Resume"] = Relationship(back_populates="profile")
    submissions: List["Submission"] = Relationship(back_populates="profile")
    attributes: Optional["Attributes"] = Relationship(back_populates="profile")
    challenges: List["Challenge"] = Relationship(back_populates="profile")

class Resume(SQLModel, table=True):
    """
    Armazena os currículos enviados por um usuário.
    """
    __tablename__ = "resumes"

    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: uuid.UUID = Field(foreign_key="profiles.id")
    title: Optional[str] = Field(default=None, index=True)
    original_content: str
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )

    # Relações: Cada currículo pertence a um perfil e tem uma análise
    profile: Profile = Relationship(back_populates="resumes")
    analysis: Optional["ResumeAnalysis"] = Relationship(
        back_populates="resume")


class Attributes(SQLModel, table=True):
    """
    Armazena as informações de habilidades e objetivos do usuário.
    """
    __tablename__ = "attributes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="profiles.id", unique=True)

    career_goal: Optional[str] = Field(default=None)
    soft_skills: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    tech_skills: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )

    # Relação com Profile
    profile: Profile = Relationship(back_populates="attributes")


class ResumeAnalysis(SQLModel, table=True):
    """
    Guarda o resultado da análise de IA para um currículo específico.
    """
    __tablename__ = "resume_analyses"

    id: Optional[int] = Field(default=None, primary_key=True)
    resume_id: int = Field(unique=True, foreign_key="resumes.id")
    strengths: Optional[str] = Field(default=None)
    improvements: Optional[str] = Field(default=None)
    full_report: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )

    # Relação: A análise pertence a um currículo
    resume: Resume = Relationship(back_populates="analysis")


class Challenge(SQLModel, table=True):
    """
    Catálogo com todos os desafios técnicos disponíveis.
    """
    __tablename__ = "challenges"

    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: uuid.UUID = Field(foreign_key="profiles.id")
    title: str = Field(index=True)
    description: JsonB = Field(default=None, sa_column=Column(JSONB))
    difficulty: JsonB = Field(
        sa_column=Column(
            JSONB,
            default={
                "level": "Fácil",
                "time_limit": 30
            }
        )
    )
    fs: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    category: Optional[str] = Field(default=None, index=True)
    template_code: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )

    # Relação: Um desafio pode ter várias submissões
    submissions: List["Submission"] = Relationship(back_populates="challenge")
    profile: Optional["Profile"] = Relationship(back_populates="challenges")

    def set_difficulty(self, level: str):
        levels = {
            "Fácil": 30,
            "Médio": 60,
            "Difícil": 90
        }
        self.difficulty = {"level": level, "time_limit": levels.get(level, 30)}


class Submission(SQLModel, table=True):
    """
    Registra a solução de um usuário para um desafio.
    """
    __tablename__ = "submissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    profile_id: uuid.UUID = Field(foreign_key="profiles.id")
    challenge_id: int = Field(foreign_key="challenges.id")
    submitted_code: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    # Ex: 'Processando', 'Concluído', 'Erro'
    status: str = Field(default="sent")
    attempt_number: int = Field(default=1)
    commit_message: Optional[str] = None
    notes: Optional[str] = None
    time_taken_sec: Optional[int] = None
    submitted_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )

    # Relações: Uma submissão pertence a um perfil, a um desafio e tem um feedback
    profile: Profile = Relationship(back_populates="submissions")
    challenge: Challenge = Relationship(back_populates="submissions")
    feedback: Optional["SubmissionFeedback"] = Relationship(
        back_populates="submission")

    __table_args__ = (CheckConstraint(
        "status IN ('sent', 'evaluating', 'scored', 'error')", name="submissions_status_chk"),)


class SubmissionFeedback(SQLModel, table=True):
    """
    Armazena o feedback da IA (code review) para uma submissão.
    """
    __tablename__ = "submission_feedbacks"

    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: int = Field(unique=True, foreign_key="submissions.id")
    feedback: str = Field(sa_column=Column("feedback", Text, nullable=False))
    summary: Optional[str] = None
    score: Optional[int] = None  # Ex: 0-100
    metrics: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    raw_ai_response: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )

    # Relação: O feedback pertence a uma submissão
    submission: Submission = Relationship(back_populates="feedback")
