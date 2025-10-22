from pydantic import BaseModel, Field
from typing import Dict, Optional, List

class SubmissionIn(BaseModel):
    """
    Body de POST /submissions
    Envie 'files' para desafios de código (multi-arquivo) OU 'answer' para texto/planejamento.
    """
    profile_id: str
    challenge_id: int
    files: Optional[Dict[str, str]] = None      # {"path": "novo conteudo"}
    answer: Optional[str] = None                # texto livre
    commit_message: Optional[str] = None        # simula versionamento
    notes: Optional[str] = None                 # observações
    time_taken_sec: Optional[int] = Field(default=None, ge=0)

class SubmissionOut(BaseModel):
    """
    Resposta do modal: nota, métricas e updates de skill.
    """
    submission_id: int
    score: int
    metrics: dict
    feedback_summary: str
    positive: List[str]
    negative: List[str]
    suggestions: List[str]
    skills_updated: dict
    fallback_used: bool = False