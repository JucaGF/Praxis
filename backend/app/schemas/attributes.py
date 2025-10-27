from pydantic import BaseModel, Field, field_validator
from typing import Dict, Optional
from datetime import datetime

# ==================== EXPLICAÇÃO: Validadores Pydantic ====================
# 
# field_validator = Decorador que valida campos AUTOMATICAMENTE
# 
# Como funciona?
# 1. Pydantic recebe os dados
# 2. ANTES de criar o objeto, chama o validador
# 3. Se validador retornar erro → HTTP 422 automático
# 4. Se validador passar → objeto criado
#
# Benefícios:
# - Validação acontece SEMPRE (não dá pra esquecer)
# - Erros claros e automáticos
# - Código dos endpoints fica limpo
# ===========================================================================


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
    
    ✅ AGORA COM VALIDAÇÃO AUTOMÁTICA!
    Não precisa mais validar manualmente nos endpoints.
    """
    career_goal: Optional[str] = None
    soft_skills: Optional[Dict[str, int]] = None
    tech_skills: Optional[Dict[str, int]] = None
    
    @field_validator('soft_skills', 'tech_skills')
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