# backend/app/infra/repo_sql.py
from __future__ import annotations
from backend.app.domain.ports import IRepository
from backend.models import (
    Profile, Attributes, Challenge, Submission, SubmissionFeedback, Resume, ResumeAnalysis
)
from backend.db import engine
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime

from sqlmodel import Session, select
from sqlalchemy import func

import sys
from pathlib import Path
# Adiciona o diretório backend ao path para imports
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))


# ✅ Importa a interface que vamos implementar

# normalização simples de nível de dificuldade
LEVEL_MAP = {
    "Fácil": "easy", "Médio": "medium", "Difícil": "hard",
    "facil": "easy", "fácil": "easy", "medio": "medium", "médio": "medium",
    "dificil": "hard", "difícil": "hard",
    "easy": "easy", "medium": "medium", "hard": "hard",
}


def _norm_level(v: str) -> str:
    return LEVEL_MAP.get(v, str(v).lower())

# -------- helpers de saída (dicts usados pelos endpoints) ----------


def _profile_out(p: Profile) -> dict:
    return {"id": str(p.id), "full_name": p.full_name or "", "email": p.email}


def _attributes_out(profile_id: uuid.UUID, a: Attributes) -> dict:
    import json

    # Parse JSONB fields se eles vierem como string
    soft_skills = a.soft_skills or {}
    tech_skills = a.tech_skills or {}

    # Se vier como string, parseia
    if isinstance(soft_skills, str):
        soft_skills = json.loads(soft_skills)
    if isinstance(tech_skills, str):
        tech_skills = json.loads(tech_skills)

    # Skills devem ser dicionários, mas se vier como lista, mantém
    # (para compatibilidade com dados antigos)
    if not isinstance(soft_skills, (dict, list)):
        soft_skills = {}
    if not isinstance(tech_skills, (dict, list)):
        tech_skills = {}

    return {
        "profile_id": str(profile_id),
        "career_goal": a.career_goal,
        "soft_skills": soft_skills,
        "tech_skills": tech_skills,
        "updated_at": a.updated_at,
    }


def _challenge_out(ch: Challenge) -> dict:
    difficulty = ch.difficulty or {}
    if "level" in difficulty:
        difficulty["level"] = _norm_level(difficulty["level"])
    return {
        "id": ch.id,
        "profile_id": str(ch.profile_id),
        "title": ch.title,
        "description": ch.description or {},
        "difficulty": difficulty,
        "fs": ch.fs or None,
        "category": ch.category,
        "template_code": ch.template_code or None,
        "created_at": ch.created_at,
    }


class SqlRepo(IRepository):
    """
    Implementação SQL do repositório.

    Herda de IRepository, o que significa:
    - "Eu prometo implementar TODOS os métodos definidos na interface"
    - Se esquecer algum método, Python vai dar erro
    - Qualquer código que espera IRepository pode usar SqlRepo

    Adapter que conversa com o Postgres (Supabase) via SQLModel.
    """

    def __init__(self, engine_=None):
        self.engine = engine_ or engine

    # -------------- PERFIL / SESSÃO MOCK --------------
    def upsert_mock_profile(self, email: str, full_name: str) -> dict:
        with Session(self.engine) as s:
            p = s.exec(select(Profile).where(Profile.email == email)).first()
            if p:
                return _profile_out(p)

            new_p = Profile(id=uuid.uuid4(), full_name=full_name, email=email)
            s.add(new_p)
            s.commit()
            s.refresh(new_p)

            # seed de atributos (ajuste as trilhas como preferirem)
            career = "Frontend Developer"
            low_email = email.lower()
            if "maria" in low_email or "back" in low_email:
                career = "Backend Developer"
            if "data" in low_email or "de@" in low_email:
                career = "Data Engineer"

            seed_attrs = Attributes(
                user_id=new_p.id,
                career_goal=career,
                soft_skills={"comunicacao": 60, "equipe": 80},
                tech_skills=(
                    {"React": 62, "CSS": 45, "TypeScript": 70} if career.startswith("Front")
                    else {"Python": 75, "FastAPI": 55, "SQL": 60} if career.startswith("Back")
                    else {"Python": 70, "SQL": 65, "Airflow": 40, "Data_Modeling": 55}
                )
            )
            s.add(seed_attrs)
            s.commit()
            return _profile_out(new_p)

    def get_profile(self, profile_id: str) -> Optional[dict]:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar busca por string diretamente
            try:
                pid = uuid.UUID(profile_id)
                p = s.get(Profile, pid)
            except ValueError:
                # ID não é UUID válido, busca como string
                p = s.exec(select(Profile).where(
                    Profile.id == profile_id)).first()
            return _profile_out(p) if p else None

    def create_profile(self, profile_id: str, profile_data: dict) -> dict:
        """
        Cria um novo perfil com ID específico.
        Permite tanto UUIDs válidos quanto strings.
        """
        with Session(self.engine) as s:
            # Tenta usar como UUID, senão usa como string
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # Não é UUID, usa o profile_id como string
                pid = profile_id

            new_profile = Profile(
                id=pid,
                full_name=profile_data.get("name"),
                email=profile_data["email"],
                # Campos opcionais do profile podem ser adicionados aqui
            )
            s.add(new_profile)
            s.commit()
            s.refresh(new_profile)
            return _profile_out(new_profile)

    # -------------- ATRIBUTOS --------------
    def get_attributes(self, profile_id: str) -> dict:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id

            a = s.exec(select(Attributes).where(
                Attributes.user_id == pid)).first()
            if not a:
                from backend.app.domain.exceptions import AttributesNotFoundError
                raise AttributesNotFoundError(profile_id)
            return _attributes_out(pid, a)

    def update_attributes(self, profile_id: str, patch: dict) -> dict:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id

            a = s.exec(select(Attributes).where(
                Attributes.user_id == pid)).first()
            if not a:
                # Se não existe, cria com os dados do patch
                a = Attributes(
                    user_id=pid,
                    career_goal=patch.get("career_goal"),
                    soft_skills=patch.get("soft_skills", {}),
                    tech_skills=patch.get("tech_skills", {})
                )
                s.add(a)
                s.commit()
                s.refresh(a)
                return _attributes_out(pid, a)

            if "career_goal" in patch and patch["career_goal"] is not None:
                a.career_goal = patch["career_goal"]
            if "soft_skills" in patch and patch["soft_skills"]:
                a.soft_skills = {**(a.soft_skills or {}),
                                 **patch["soft_skills"]}
            if "tech_skills" in patch and patch["tech_skills"]:
                a.tech_skills = {**(a.tech_skills or {}),
                                 **patch["tech_skills"]}
            a.updated_at = datetime.utcnow()
            s.add(a)
            s.commit()
            s.refresh(a)
            return _attributes_out(pid, a)

    def get_tech_skills(self, profile_id: str) -> Dict[str, int]:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id

            a = s.exec(select(Attributes).where(
                Attributes.user_id == pid)).first()

            # ✅ CORREÇÃO: Verificar se 'a' existe antes de acessar
            if not a:
                raise ValueError(
                    f"Attributes não encontrados para profile_id: {profile_id}")

            return dict(a.tech_skills or {})

    def update_tech_skills(self, profile_id: str, tech_skills: Dict[str, int]) -> None:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id

            a = s.exec(select(Attributes).where(
                Attributes.user_id == pid)).first()

            # ✅ CORREÇÃO: Verificar se 'a' existe antes de usar
            if not a:
                raise ValueError(
                    f"Attributes não encontrados para profile_id: {profile_id}")

            a.tech_skills = tech_skills
            a.updated_at = datetime.utcnow()
            s.add(a)
            s.commit()

    # -------------- CHALLENGES --------------
    def create_challenges_for_profile(self, profile_id: str, challenges: List[dict]) -> List[dict]:
        """
        Cria N desafios para o profile. Requer que NÃO haja UNIQUE em challenges.profile_id.
        """
        # Tenta converter para UUID, se falhar usa string diretamente
        try:
            pid = uuid.UUID(profile_id)
        except ValueError:
            # ID não é UUID válido
            pid = profile_id

        rows = []
        with Session(self.engine) as s:
            for ch in challenges:
                rows.append(Challenge(
                    profile_id=pid,
                    title=ch["title"],
                    description=ch.get("description"),
                    difficulty=ch.get("difficulty"),
                    fs=ch.get("fs"),
                    category=ch.get("category"),
                    template_code=ch.get("template_code"),
                ))
            s.add_all(rows)
            s.commit()
            for row in rows:
                s.refresh(row)
        return [_challenge_out(r) for r in rows]

    def delete_challenges_for_profile(self, profile_id: str) -> int:
        """
        Deleta apenas os desafios de um perfil que NÃO têm submissões.
        Mantém challenges com histórico de submissões para preservar os dados do usuário.
        """
        # Tenta converter para UUID, se falhar usa string diretamente
        try:
            pid = uuid.UUID(profile_id)
        except ValueError:
            # ID não é UUID válido
            pid = profile_id

        with Session(self.engine) as s:
            # Busca todos os challenges do usuário
            all_challenges = s.exec(
                select(Challenge)
                .where(Challenge.profile_id == pid)
            ).all()

            # Filtra apenas challenges sem submissões
            challenges_to_delete = []
            for ch in all_challenges:
                # Verifica se o challenge tem submissões
                has_submissions = s.exec(
                    select(func.count(Submission.id))
                    .where(Submission.challenge_id == ch.id)
                ).one() > 0
                
                # Só deleta se não tiver submissões (preserva histórico)
                if not has_submissions:
                    challenges_to_delete.append(ch)

            count = len(challenges_to_delete)

            if count > 0:
                # Deleta apenas challenges sem submissões
                for ch in challenges_to_delete:
                    s.delete(ch)
                s.commit()

            return count

    def list_active_challenges(self, profile_id: str, limit: int = 3) -> List[dict]:
        """
        Lista desafios ativos de um perfil.
        
        Estratégia:
        1. Busca TODOS os challenges do usuário (não limita)
        2. Retorna todos para o frontend decidir o que mostrar
        
        Isso garante que desafios completados não desapareçam da home.
        """
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id

            rows = s.exec(
                select(Challenge)
                .where(Challenge.profile_id == pid)
                .order_by(Challenge.created_at.desc())
                # Removido o .limit(limit) para retornar TODOS os challenges
                # O frontend vai filtrar/limitar conforme necessário
            ).all()
            return [_challenge_out(r) for r in rows]

    def get_challenge(self, challenge_id: int) -> Optional[dict]:
        with Session(self.engine) as s:
            ch = s.get(Challenge, challenge_id)
            return _challenge_out(ch) if ch else None

    # -------------- SUBMISSIONS --------------
    def count_attempts(self, profile_id: str, challenge_id: int) -> int:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id

            return int(s.exec(
                select(func.count(Submission.id)).where(
                    Submission.profile_id == pid,
                    Submission.challenge_id == challenge_id
                )
            ).one())

    def create_submission(self, payload: dict) -> dict:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(payload["profile_id"])
            except ValueError:
                # ID não é UUID válido
                pid = payload["profile_id"]

            row = Submission(
                profile_id=pid,
                challenge_id=payload["challenge_id"],
                submitted_code=payload.get("submitted_code"),
                status=payload.get("status", "sent"),
                attempt_number=payload.get("attempt_number", 1),
                commit_message=payload.get("commit_message"),
                notes=payload.get("notes"),
                time_taken_sec=payload.get("time_taken_sec"),
            )
            s.add(row)
            s.commit()
            s.refresh(row)
            return {"id": row.id, **payload}

    def update_submission(self, submission_id: int, patch: dict) -> None:
        with Session(self.engine) as s:
            sub = s.get(Submission, submission_id)
            if not sub:
                return
            for k, v in patch.items():
                setattr(sub, k, v)
            s.add(sub)
            s.commit()

    def get_submissions_by_profile(self, profile_id: str) -> List[Submission]:
        """
        Busca todas as submissões de um perfil, ordenadas por data mais recente primeiro.
        """
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                pid = profile_id
            
            # Busca submissões ordenadas por data mais recente primeiro
            submissions = s.exec(
                select(Submission)
                .where(Submission.profile_id == pid)
                .order_by(Submission.submitted_at.desc())
            ).all()
            
            return list(submissions) if submissions else []

    # -------------- FEEDBACK --------------
    def create_submission_feedback(self, payload: dict) -> dict:
        with Session(self.engine) as s:
            fb = SubmissionFeedback(
                submission_id=payload["submission_id"],
                feedback=payload["feedback"],
                summary=payload.get("summary"),
                score=payload.get("score"),
                metrics=payload.get("metrics"),
                raw_ai_response=payload.get("raw_ai_response"),
            )
            s.add(fb)
            s.commit()
            s.refresh(fb)
            return {"id": fb.id, **payload}

    def get_feedback_by_submission(self, submission_id: int) -> Optional[SubmissionFeedback]:
        """
        Busca feedback de uma submissão específica.
        """
        with Session(self.engine) as s:
            feedback = s.exec(
                select(SubmissionFeedback).where(SubmissionFeedback.submission_id == submission_id)
            ).first()
            return feedback

    # -------------- RESUME / CURRICULOS --------------
    def create_resume(
        self,
        profile_id: str,
        title: Optional[str],
        content: str,
        filename: Optional[str] = None,
        file_type: Optional[str] = None,
        file_size: Optional[int] = None,
        file_data: Optional[bytes] = None
    ) -> Resume:
        """
        Cria um novo currículo para o perfil.

        Suporta dois modos:
        1. Texto puro: apenas content
        2. Arquivo: content + filename + file_type + file_size + file_data
        """
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                pid = profile_id

            resume = Resume(
                profile_id=pid,
                title=title,
                original_content=content,
                original_filename=filename,
                file_type=file_type,
                file_size_bytes=file_size,
                file_data=file_data
            )
            s.add(resume)
            s.commit()
            s.refresh(resume)
            return resume

    def get_resumes(self, profile_id: str) -> List[Resume]:
        """Busca todos os currículos de um perfil"""
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                pid = profile_id

            resumes = s.exec(
                select(Resume)
                .where(Resume.profile_id == pid)
                .order_by(Resume.created_at.desc())
            ).all()
            return list(resumes)

    def get_resume(self, resume_id: int) -> Optional[Resume]:
        """Busca um currículo específico"""
        with Session(self.engine) as s:
            return s.get(Resume, resume_id)

    def create_resume_analysis(self, resume_id: int, strengths: str, improvements: str, full_report: dict) -> ResumeAnalysis:
        """Cria uma análise de currículo"""
        with Session(self.engine) as s:
            analysis = ResumeAnalysis(
                resume_id=resume_id,
                strengths=strengths,
                improvements=improvements,
                full_report=full_report
            )
            s.add(analysis)
            s.commit()
            s.refresh(analysis)
            return analysis

    def get_resume_analysis(self, resume_id: int) -> Optional[ResumeAnalysis]:
        """Busca a análise de um currículo"""
        with Session(self.engine) as s:
            return s.exec(
                select(ResumeAnalysis)
                .where(ResumeAnalysis.resume_id == resume_id)
            ).first()

    def delete_resume_analysis(self, resume_id: int) -> bool:
        """Deleta a análise de um currículo (se existir)"""
        with Session(self.engine) as s:
            analysis = s.exec(
                select(ResumeAnalysis)
                .where(ResumeAnalysis.resume_id == resume_id)
            ).first()
            
            if analysis:
                s.delete(analysis)
                s.commit()
                return True
            return False

    def delete_resume(self, resume_id: int) -> bool:
        """Deleta um currículo e sua análise associada"""
        with Session(self.engine) as s:
            resume = s.get(Resume, resume_id)
            
            if not resume:
                return False
            
            # Primeiro deleta a análise (se existir) devido à FK
            self.delete_resume_analysis(resume_id)
            
            # Depois deleta o currículo
            s.delete(resume)
            s.commit()
            return True