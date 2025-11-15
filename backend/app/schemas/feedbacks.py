"""
Schemas de feedback - Validação e serialização

Este módulo define os schemas Pydantic para feedback de submissões.
Usado para validação de dados de entrada e serialização de saída.

Schemas:
- FeedbackCreate: Dados para criar feedback (entrada)

Validação:
- Validação de tipos e campos obrigatórios
- Score deve estar entre 0 e 100 (se fornecido)
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class FeedbackCreate(BaseModel):
    """
    Schema para criar feedback de submissão (entrada da API).
    
    Schema usado para receber dados ao criar feedback de uma submissão.
    Geralmente criado automaticamente pela IA após avaliação.
    
    Attributes:
        submission_id: ID da submissão
        feedback: Feedback detalhado da IA
        score: Pontuação da submissão (0-100) (opcional)
        metrics: Métricas específicas por critério (opcional)
        raw_ai_response: Resposta bruta da IA (opcional)
    """
    submission_id: int
    """
    ID da submissão avaliada.
    
    Deve existir uma submissão com este ID no banco.
    """
    
    feedback: str
    """
    Feedback detalhado da IA sobre a submissão.
    
    Texto em formato markdown ou texto puro.
    Inclui análise, pontos positivos, pontos de melhoria, etc.
    Obrigatório: Não pode ser None.
    """
    
    score: Optional[int] = Field(None, ge=0, le=100)
    """
    Pontuação da submissão (0-100).
    
    Opcional: Se None, pontuação não foi calculada.
    Deve estar entre 0 e 100 se fornecido.
    """
    
    metrics: Optional[Dict[str, Any]] = None
    """
    Métricas específicas por critério de avaliação.
    
    Dict com critério -> pontuação ou métrica.
    Exemplo: {"FastAPI": 90, "Validação": 85, "Erros": 80}
    None se métricas não foram calculadas.
    """
    
    raw_ai_response: Optional[Dict[str, Any]] = None
    """
    Resposta bruta da IA antes do processamento.
    
    Útil para debug e desenvolvimento.
    Permite ver exatamente o que a IA retornou.
    None se não foi armazenado.
    """