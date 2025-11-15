"""
Schemas de submissões - Validação e serialização

Este módulo define os schemas Pydantic para submissões.
Usado para validação de dados de entrada e serialização de saída.

Schemas:
- SubmissionCreateIn: Dados para criar uma submissão (entrada)
- SubmissionResultOut: Resultado da avaliação (saída)

Validação:
- Validação de tipos e campos obrigatórios
- Score deve estar entre 0 e 100
- submitted_code é flexível (aceita código, texto ou planejamento)
"""

from pydantic import BaseModel, Field, conint
from typing import Optional, Dict, Any

# ==================== TIPOS ====================

Score = conint(ge=0, le=100)
"""
Tipo de score (pontuação) entre 0 e 100.
"""


# ==================== SCHEMAS ====================

class SubmissionCreateIn(BaseModel):
    """
    Dados para criar uma submissão (entrada da API).
    
    Schema usado para receber dados do frontend ao criar uma submissão.
    Flexível para aceitar diferentes tipos de submissões (código, texto, planejamento).
    
    Attributes:
        profile_id: ID do perfil (geralmente vem do token)
        challenge_id: ID do desafio
        submitted_code: Código/texto submetido (formato flexível)
        commit_message: Mensagem de commit (opcional)
        notes: Notas adicionais (opcional)
        time_taken_sec: Tempo gasto em segundos (opcional)
    
    Formato de submitted_code:
    - Para código: {"type": "codigo", "files": {"path": "conteudo"}}
    - Para texto: {"type": "texto_livre", "content": "..."}
    - Para planejamento: {"type": "planejamento", "form_data": {...}}
    """
    profile_id: str
    """
    ID do perfil que está submetendo.
    
    Nota: Atualmente não é usado (profile_id vem do token JWT).
    Mantido para compatibilidade.
    """
    
    challenge_id: int
    """ID do desafio sendo submetido"""
    
    submitted_code: Dict[str, Any]
    """
    Código/texto submetido (formato flexível).
    
    Formato depende do tipo de desafio:
    - Código: {"type": "codigo", "files": {"app/main.py": "código aqui"}}
    - Texto: {"type": "texto_livre", "content": "texto aqui"}
    - Planejamento: {"type": "planejamento", "form_data": {...}}
    """
    
    commit_message: Optional[str] = None
    """
    Mensagem de commit associada à submissão.
    
    Similar a mensagens de commit do Git.
    Opcional.
    """
    
    notes: Optional[str] = None
    """
    Notas adicionais sobre a submissão.
    
    Pode conter observações, dificuldades encontradas, etc.
    Opcional.
    """
    
    time_taken_sec: Optional[int] = None
    """
    Tempo gasto na submissão em segundos.
    
    Calculado do momento que o desafio foi aberto até a submissão.
    Opcional.
    """


class SubmissionResultOut(BaseModel):
    """
    Resultado da avaliação de uma submissão (saída da API).
    
    Schema usado para serializar o resultado da avaliação na resposta da API.
    Inclui feedback, pontuação, métricas e progressão de skills.
    
    Attributes:
        submission_id: ID da submissão
        status: Status da submissão (sent, evaluating, scored, error)
        score: Pontuação geral (0-100)
        metrics: Métricas específicas por critério
        feedback: Feedback detalhado da IA
        skills_progression: Progressão de múltiplas skills
        target_skill: Skill principal (compatibilidade)
        delta_applied: Delta aplicado (compatibilidade)
        updated_skill_value: Valor atualizado (compatibilidade)
    """
    submission_id: int
    """ID da submissão avaliada"""
    
    status: str = Field(description="sent | evaluating | scored | error")
    """
    Status da submissão.
    
    Valores:
    - "sent": Enviada, aguardando avaliação
    - "evaluating": Sendo avaliada pela IA
    - "scored": Avaliação concluída
    - "error": Erro durante a avaliação
    """
    
    score: Optional[Score] = None
    """
    Pontuação geral da submissão (0-100).
    
    None se ainda não foi avaliada.
    """
    
    metrics: Optional[Dict[str, Score]] = None
    """
    Métricas específicas por critério de avaliação.
    
    Dict com critério -> pontuação (0-100).
    Exemplo: {"FastAPI": 90, "Validação": 85, "Erros": 80}
    None se ainda não foi avaliada.
    """
    
    feedback: Optional[str] = None
    """
    Feedback detalhado da IA sobre a submissão.
    
    Texto em formato markdown ou texto puro.
    Inclui análise, pontos positivos, pontos de melhoria, etc.
    None se ainda não foi avaliada.
    """
    
    skills_progression: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Progressão de múltiplas skills: {skills_updated, deltas, new_values, skill_type}"
    )
    """
    Progressão de múltiplas skills avaliadas.
    
    Formato:
    {
        "skills_updated": ["FastAPI", "Python"],
        "deltas": {"FastAPI": +2, "Python": +1},
        "new_values": {"FastAPI": 72, "Python": 76},
        "skill_type": "tech_skills"
    }
    
    None se ainda não foi avaliada.
    """
    
    target_skill: Optional[str] = None
    """
    Skill principal do desafio (compatibilidade com frontend antigo).
    
    Mantido para compatibilidade.
    Use skills_progression para informações completas.
    """
    
    delta_applied: Optional[int] = None
    """
    Delta aplicado na skill principal (compatibilidade com frontend antigo).
    
    Mantido para compatibilidade.
    Use skills_progression para informações completas.
    """
    
    updated_skill_value: Optional[int] = None
    """
    Valor atualizado da skill principal (compatibilidade com frontend antigo).
    
    Mantido para compatibilidade.
    Use skills_progression para informações completas.
    """
