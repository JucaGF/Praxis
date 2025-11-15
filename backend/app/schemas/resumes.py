"""
Schemas de currículos - Validação e serialização

Este módulo define os schemas Pydantic para currículos e análises.
Usado para validação de dados de entrada e serialização de saída.

Schemas:
- ResumeUpload: Dados para upload de currículo (entrada)
- ResumeResponse: Resposta de currículo (saída)
- ResumeAnalysisResponse: Resposta de análise de currículo (saída)
- ResumeWithAnalysis: Currículo com análise (saída)

Validação:
- Validação de tipos e campos obrigatórios
- Suporte a upload de texto e arquivo
- Metadados de arquivo (nome, tipo, tamanho)
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ResumeUpload(BaseModel):
    """
    Schema para upload de currículo via texto.
    
    Usado quando o usuário cola o texto do currículo diretamente.
    Para upload de arquivo, use multipart/form-data.
    
    Attributes:
        title: Título/nome do currículo (opcional)
        content: Conteúdo do currículo em texto ou markdown
    """
    title: Optional[str] = Field(None, description="Título/nome do currículo")
    """
    Título/nome do currículo.
    
    Opcional: Se None, usa "Currículo sem título".
    """
    
    content: str = Field(...,
                         description="Conteúdo do currículo (texto ou markdown)")
    """
    Conteúdo do currículo em texto ou markdown.
    
    Obrigatório: Deve ter pelo menos 10 caracteres.
    Pode ser texto puro ou markdown formatado.
    """

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Meu Currículo - 2024",
                "content": "# João Silva\n\nDesenvolvedor Full Stack...",
            }
        }


class ResumeResponse(BaseModel):
    """
    Schema de resposta de currículo (saída da API).
    
    Schema usado para serializar currículos na resposta da API.
    Inclui metadados do arquivo se foi enviado como arquivo.
    
    Attributes:
        id: ID único do currículo
        profile_id: ID do perfil dono do currículo
        title: Título do currículo
        original_content: Conteúdo do currículo (texto)
        created_at: Data de criação
        has_analysis: Indica se tem análise disponível
        original_filename: Nome do arquivo (se enviado como arquivo)
        file_type: Tipo MIME do arquivo (se enviado como arquivo)
        file_size_bytes: Tamanho do arquivo em bytes (se enviado como arquivo)
    """
    id: int
    """ID único do currículo"""
    
    profile_id: str
    """ID do perfil dono do currículo"""
    
    title: Optional[str]
    """Título do currículo"""
    
    original_content: str
    """Conteúdo do currículo (texto extraído)"""
    
    created_at: datetime
    """Data e hora de criação do currículo"""
    
    has_analysis: bool = False
    """
    Indica se o currículo tem análise disponível.
    
    True se já foi analisado pela IA.
    False se ainda não foi analisado.
    """
    
    original_filename: Optional[str] = None
    """
    Nome original do arquivo (se enviado como arquivo).
    
    None se foi digitado como texto puro.
    """
    
    file_type: Optional[str] = None
    """
    Tipo MIME do arquivo (se enviado como arquivo).
    
    Exemplos: "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    None se foi digitado como texto puro.
    """
    
    file_size_bytes: Optional[int] = None
    """
    Tamanho do arquivo em bytes (se enviado como arquivo).
    
    None se foi digitado como texto puro.
    """

    class Config:
        from_attributes = True


class ResumeAnalysisResponse(BaseModel):
    """
    Schema de resposta da análise de currículo (saída da API).
    
    Schema usado para serializar análises de currículo na resposta da API.
    Inclui pontos fortes, melhorias, relatório completo e metadados.
    
    Attributes:
        id: ID único da análise
        resume_id: ID do currículo analisado
        strengths: Pontos fortes do currículo
        improvements: Sugestões de melhoria
        full_report: Relatório completo em formato JSON
        created_at: Data de criação da análise
    """
    id: int
    """ID único da análise"""
    
    resume_id: int
    """ID do currículo analisado"""
    
    strengths: Optional[str] = None
    """
    Pontos fortes do currículo identificados pela IA.
    
    Texto em formato markdown ou texto puro.
    None se a análise ainda não foi realizada.
    """
    
    improvements: Optional[str] = None
    """
    Sugestões de melhoria para o currículo.
    
    Texto em formato markdown ou texto puro.
    None se a análise ainda não foi realizada.
    """
    
    full_report: Optional[Dict[str, Any]] = None
    """
    Relatório completo da análise em formato JSON.
    
    Contém todos os detalhes da análise:
    - Pontuações por seção
    - Recomendações específicas
    - Comparação com padrões da indústria
    - Etc.
    None se a análise ainda não foi realizada.
    """
    
    created_at: datetime
    """Data e hora de criação da análise"""

    class Config:
        from_attributes = True


class ResumeWithAnalysis(BaseModel):
    """
    Schema combinado de currículo com análise (saída da API).
    
    Schema usado para retornar um currículo completo com sua análise (se existir).
    Útil para exibir todos os dados de uma vez.
    
    Attributes:
        resume: Dados do currículo
        analysis: Análise do currículo (opcional)
    """
    resume: ResumeResponse
    """Dados do currículo"""
    
    analysis: Optional[ResumeAnalysisResponse] = None
    """
    Análise do currículo pela IA.
    
    None se a análise ainda não foi realizada.
    """
