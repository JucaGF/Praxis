# backend/app/schemas/resumes.py
"""
Schemas para upload e análise de currículos
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class ResumeUpload(BaseModel):
    """Schema para upload de currículo"""
    title: Optional[str] = Field(None, description="Título/nome do currículo")
    content: str = Field(...,
                         description="Conteúdo do currículo (texto ou markdown)")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Meu Currículo - 2024",
                "content": "# João Silva\n\nDesenvolvedor Full Stack...",
            }
        }


class ResumeResponse(BaseModel):
    """Schema de resposta de currículo"""
    id: int
    profile_id: str
    title: Optional[str]
    original_content: str
    created_at: datetime
    has_analysis: bool = False

    # Campos de arquivo (quando upload via arquivo)
    original_filename: Optional[str] = None
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None

    class Config:
        from_attributes = True


class ResumeAnalysisResponse(BaseModel):
    """Schema de resposta da análise de currículo"""
    id: int
    resume_id: int
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    full_report: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeWithAnalysis(BaseModel):
    """Schema combinado de currículo com análise"""
    resume: ResumeResponse
    analysis: Optional[ResumeAnalysisResponse] = None
