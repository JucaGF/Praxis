# backend/app/deps.py
import math
from typing import Dict
from backend.app.infra.repo_sql import SqlRepo
from backend.app.infra.ai_fake import FakeAI

_repo = SqlRepo()
_ai = FakeAI()

def get_repo():
    return _repo

def get_ai():
    return _ai

def non_linear_delta(skill_atual: int, nota: int, dificuldade_level: str, tentativas: int) -> int:
    """
    ganho = (nota - skill_atual) * peso_dificuldade * curva_aprendizado * penalidade_tentativas / 20
    """
    pesos = {"easy": 0.7, "medium": 1.0, "hard": 1.3}
    peso = pesos.get(dificuldade_level, 1.0)
    curva = 1 / (1 + math.exp((skill_atual - 70) / 10))
    penal = max(0.6, 1 - 0.1 * (tentativas - 1))
    ganho = (nota - skill_atual) * peso * curva * penal / 20.0
    return int(round(ganho))

def clamp_skill(v: int) -> int:
    return max(0, min(100, v))

def apply_skill_update(tech_skills: Dict[str, int], target_skill: str | None, delta: int) -> Dict[str, int]:
    if not target_skill:
        return tech_skills
    cur = tech_skills.get(target_skill, 50)
    tech_skills[target_skill] = clamp_skill(cur + delta)
    return tech_skills
