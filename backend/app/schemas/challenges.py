from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Literal, Any
from datetime import datetime

# Tipos aceitos para "level" (vamos normalizar internamente)
LevelPT = Literal["Fácil", "Médio", "Difícil"]
LevelEN = Literal["easy", "medium", "hard"]

def normalize_level(level: str) -> str:
    """Normaliza 'Fácil|Médio|Difícil' -> 'easy|medium|hard'."""
    mapa = {
        "Fácil": "easy", "fácil": "easy", "facil": "easy",
        "Médio": "medium", "médio": "medium", "medio": "medium",
        "Difícil": "hard", "difícil": "hard", "dificil": "hard",
        "easy": "easy", "medium": "medium", "hard": "hard"
    }
    return mapa.get(level, level)

class Difficulty(BaseModel):
    """
    JSONB difficulty — seu time quer guardar level + time_limit (min).
    """
    level: str = Field(description="easy|medium|hard (normalizado)")
    time_limit: int = Field(gt=0, description="Tempo em minutos")

    @field_validator("level", mode='before')
    def _norm_level(cls, v):
        return normalize_level(v)

class FS(BaseModel):
    """
    File system do desafio de código (multi-arquivo).
    """
    files: List[str] = Field(default_factory=list)
    open: Optional[str] = None
    contents: Dict[str, str] = Field(default_factory=dict)

class Description(BaseModel):
    """
    JSONB description — metadados do enunciado.
    """
    text: str
    type: Literal["codigo", "texto_livre", "planejamento"]
    language: Optional[str] = None
    eval_criteria: List[str] = Field(default_factory=list)
    target_skill: Optional[str] = None
    hints: List[str] = Field(default_factory=list)
    # Novo campo: contexto estruturado para novos layouts
    enunciado: Optional[Dict[str, Any]] = None

class ChallengeOut(BaseModel):
    """
    Resposta de um challenge para o front.
    """
    id: int
    profile_id: str
    title: str
    description: Description
    difficulty: Difficulty
    fs: Optional[FS] = None
    category: Optional[str] = None
    created_at: datetime
    # template_code: pode ser dict (código simples) ou list (formulário híbrido para planejamento)
    template_code: Optional[Dict[str, Any] | List[Dict[str, Any]]] = None

class GenerateIn(BaseModel):
    """
    Body de POST /challenges/generate
    """
    profile_id: str