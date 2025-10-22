from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime

class AttributesOut(BaseModel):
    """
    Resposta completa dos atributos do perfil.
    """
    profile_id: str
    career_goal: Optional[str] = None
    soft_skills: Dict[str, int] = Field(default_factory=dict)  # ex: {"comunicacao": 60}
    tech_skills: Dict[str, int] = Field(default_factory=dict)  # ex: {"React": 62}
    updated_at: datetime

class AttributesPatchIn(BaseModel):
    """
    Atualização parcial (PATCH) — mande só o que quiser mudar.
    Validação fina (0..100) será feita nos endpoints (próximo bloco).
    """
    career_goal: Optional[str] = None
    soft_skills: Optional[Dict[str, int]] = None
    tech_skills: Optional[Dict[str, int]] = None