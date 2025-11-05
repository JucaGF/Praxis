# backend/app/infra/repo_sql.py
from __future__ import annotations
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

from db import engine
from models import (
    Profile, Attributes, Challenge, Submission, SubmissionFeedback
)

# ✅ Importa a interface que vamos implementar
from backend.app.domain.ports import IRepository

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
    soft_skills = a.soft_skills or []
    tech_skills = a.tech_skills or []
    
    # Se vier como string, parseia
    if isinstance(soft_skills, str):
        soft_skills = json.loads(soft_skills)
    if isinstance(tech_skills, str):
        tech_skills = json.loads(tech_skills)
    
    return {
        "profile_id": str(profile_id),
        "career_goal": a.career_goal,
        "soft_skills": soft_skills if isinstance(soft_skills, list) else [],
        "tech_skills": tech_skills if isinstance(tech_skills, list) else [],
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
                p = s.exec(select(Profile).where(Profile.id == profile_id)).first()
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
            
            a = s.exec(select(Attributes).where(Attributes.user_id == pid)).first()
            if not a:
                raise ValueError(f"Attributes não encontrados para profile_id: {profile_id}")
            return _attributes_out(pid, a)

    def update_attributes(self, profile_id: str, patch: dict) -> dict:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id
            
            a = s.exec(select(Attributes).where(Attributes.user_id == pid)).first()
            if not a:
                # Se não existe, cria com os dados do patch
                a = Attributes(
                    user_id=pid,
                    career_goal=patch.get("career_goal"),
                    soft_skills=patch.get("soft_skills", {}),
                    tech_skills=patch.get("tech_skills", {})
                )
                s.add(a); s.commit(); s.refresh(a)
                return _attributes_out(pid, a)
            
            if "career_goal" in patch and patch["career_goal"] is not None:
                a.career_goal = patch["career_goal"]
            if "soft_skills" in patch and patch["soft_skills"]:
                a.soft_skills = {**(a.soft_skills or {}), **patch["soft_skills"]}
            if "tech_skills" in patch and patch["tech_skills"]:
                a.tech_skills = {**(a.tech_skills or {}), **patch["tech_skills"]}
            a.updated_at = datetime.utcnow()
            s.add(a); s.commit(); s.refresh(a)
            return _attributes_out(pid, a)

    def get_tech_skills(self, profile_id: str) -> Dict[str, int]:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id
            
            a = s.exec(select(Attributes).where(Attributes.user_id == pid)).first()
            
            # ✅ CORREÇÃO: Verificar se 'a' existe antes de acessar
            if not a:
                raise ValueError(f"Attributes não encontrados para profile_id: {profile_id}")
            
            return dict(a.tech_skills or {})

    def update_tech_skills(self, profile_id: str, tech_skills: Dict[str, int]) -> None:
        with Session(self.engine) as s:
            # Tenta converter para UUID, se falhar usa string diretamente
            try:
                pid = uuid.UUID(profile_id)
            except ValueError:
                # ID não é UUID válido
                pid = profile_id
            
            a = s.exec(select(Attributes).where(Attributes.user_id == pid)).first()
            
            # ✅ CORREÇÃO: Verificar se 'a' existe antes de usar
            if not a:
                raise ValueError(f"Attributes não encontrados para profile_id: {profile_id}")
            
            a.tech_skills = tech_skills
            a.updated_at = datetime.utcnow()
            s.add(a); s.commit()

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
        Deleta todos os desafios de um perfil.
        Também deleta submissions e feedbacks relacionados.
        """
        # Tenta converter para UUID, se falhar usa string diretamente
        try:
            pid = uuid.UUID(profile_id)
        except ValueError:
            # ID não é UUID válido
            pid = profile_id
        
        with Session(self.engine) as s:
            # Busca todos os challenges do usuário
            challenges = s.exec(
                select(Challenge)
                .where(Challenge.profile_id == pid)
            ).all()
            
            count = len(challenges)
            
            if count > 0:
                # SQLAlchemy vai deletar em cascata as submissions e feedbacks
                # graças aos relacionamentos definidos nos models
                for ch in challenges:
                    s.delete(ch)
                s.commit()
            
            return count

    def list_active_challenges(self, profile_id: str, limit: int = 3) -> List[dict]:
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
                .limit(limit)
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
            s.add(row); s.commit(); s.refresh(row)
            return {"id": row.id, **payload}

    def update_submission(self, submission_id: int, patch: dict) -> None:
        with Session(self.engine) as s:
            sub = s.get(Submission, submission_id)
            if not sub:
                return
            for k, v in patch.items():
                setattr(sub, k, v)
            s.add(sub); s.commit()

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
            s.add(fb); s.commit(); s.refresh(fb)
            return {"id": fb.id, **payload}
