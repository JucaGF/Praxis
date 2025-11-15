"""
Schemas de atributos - Validação e serialização

Este módulo define os schemas Pydantic para atributos (skills e career goal).
Usado para validação de dados de entrada e serialização de saída.

Schemas:
- AttributesOut: Atributos completos do perfil (saída)
- AttributesPatchIn: Atualização parcial de atributos (entrada)

Validação:
- Skills devem estar entre 0 e 100 (validação automática)
- Validação de tipos e campos obrigatórios
- Conversão automática de dados JSONB

Validador Pydantic:
- field_validator valida campos AUTOMATICAMENTE
- Se validador retornar erro → HTTP 422 automático
- Não precisa validar manualmente nos endpoints
"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, Optional, List, Any
from datetime import datetime


class TechSkill(BaseModel):
    """Uma habilidade técnica com porcentagem e última atualização."""
    name: str
    percentage: int
    last_updated: str


class SoftSkill(BaseModel):
    """Uma habilidade interpessoal com nível."""
    name: str
    level: str


class AttributesOut(BaseModel):
    """
    Resposta completa dos atributos do perfil.

    IMPORTANTE: tech_skills, strong_skills e soft_skills são DICIONÁRIOS (Dict[str, int])
    onde a chave é o nome da skill e o valor é a porcentagem/nível.

    - tech_skills: TODAS as habilidades técnicas (conhecidas + a melhorar) - 6 skills
    - strong_skills: APENAS as habilidades técnicas conhecidas (amarelas) - 3 skills
    - soft_skills: Habilidades interpessoais

    Exemplo:
    {
      "tech_skills": {"Python": 80, "FastAPI": 70, "Docker": 60, "AWS": 50, "React": 65, "PostgreSQL": 75},
      "strong_skills": {"Python": 80, "FastAPI": 70, "PostgreSQL": 75},
      "soft_skills": {"Comunicação": 90, "Trabalho em Equipe": 85}
    }
    """
    profile_id: str
    career_goal: Optional[str] = None
    soft_skills: Dict[str, int] = Field(default_factory=dict)
    tech_skills: Dict[str, int] = Field(default_factory=dict)
    strong_skills: Dict[str, int] = Field(default_factory=dict)
    updated_at: datetime

    class Config:
        # Permite que o Pydantic receba campos JSONB do SQLAlchemy
        from_attributes = True


class AttributesPatchIn(BaseModel):
    """
    Atualização parcial (PATCH) — mande só o que quiser mudar.

    ✅ AGORA COM VALIDAÇÃO AUTOMÁTICA!
    Não precisa mais validar manualmente nos endpoints.

    Campos:
    - tech_skills: TODAS as habilidades técnicas (conhecidas + a melhorar)
    - strong_skills: APENAS as habilidades conhecidas (subset de tech_skills)
    - soft_skills: Habilidades interpessoais
    """
    career_goal: Optional[str] = None
    soft_skills: Optional[Dict[str, int]] = None
    tech_skills: Optional[Dict[str, int]] = None
    strong_skills: Optional[Dict[str, int]] = None

    @field_validator('soft_skills', 'tech_skills', 'strong_skills')
    @classmethod
    def validate_skills(cls, value: Optional[Dict[str, int]], info) -> Optional[Dict[str, int]]:
        """
        Valida que todas as skills estão entre 0 e 100.

        Este método é chamado AUTOMATICAMENTE pelo Pydantic!

        Args:
            value: O dicionário de skills que o usuário enviou
            info: Informações sobre o campo (nome, etc)

        Returns:
            O value validado (se passar)

        Raises:
            ValueError: Se algum valor estiver fora do range (Pydantic converte em HTTP 422)

        Exemplo:
        - Input: {"React": 70, "Python": 85} → ✅ OK
        - Input: {"React": 150} → ❌ ValueError → HTTP 422
        - Input: {"React": -10} → ❌ ValueError → HTTP 422
        """
        # Se value for None, tudo bem (campo opcional)
        if value is None:
            return value

        # Valida cada skill
        field_name = info.field_name  # "soft_skills" ou "tech_skills"

        for skill_name, skill_value in value.items():
            # Verifica se é inteiro (Pydantic já faz isso, mas vamos garantir)
            if not isinstance(skill_value, int):
                raise ValueError(
                    f"{field_name}.{skill_name} deve ser um número inteiro, "
                    f"mas recebeu {type(skill_value).__name__}"
                )

            # Verifica range 0-100
            if skill_value < 0 or skill_value > 100:
                raise ValueError(
                    f"{field_name}.{skill_name} deve estar entre 0 e 100, "
                    f"mas recebeu {skill_value}"
                )

        return value
