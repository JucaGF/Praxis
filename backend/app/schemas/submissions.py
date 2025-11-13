# backend/app/schemas/submissions.py
from pydantic import BaseModel, Field, conint
from typing import Optional, Dict, Any

Score = conint(ge=0, le=100)

class SubmissionCreateIn(BaseModel):
    profile_id: str
    challenge_id: int
    # Flexível: para "codigo" mande {"type":"codigo","files":{path:conteudo}}
    # para texto/planejamento: {"type":"texto_livre","content":"..."}
    submitted_code: Dict[str, Any]
    commit_message: Optional[str] = None
    notes: Optional[str] = None
    time_taken_sec: Optional[int] = None

class SubmissionResultOut(BaseModel):
    submission_id: int
    status: str = Field(description="sent | evaluating | scored | error")
    score: Optional[Score] = None
    metrics: Optional[Dict[str, Score]] = None
    feedback: Optional[str] = None
    # Novo formato: múltiplas skills
    skills_progression: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Progressão de múltiplas skills: {skills_updated, deltas, new_values, skill_type}"
    )
    # Mantém formato antigo para compatibilidade com frontend antigo
    target_skill: Optional[str] = None
    delta_applied: Optional[int] = None
    updated_skill_value: Optional[int] = None
