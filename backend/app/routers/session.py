"""
Router de sessão - Gerenciamento de sessões

Este router fornece endpoints para gerenciar sessões de usuários.
Atualmente fornece endpoint mock para desenvolvimento.

Endpoints:
- POST /session/mock: Cria sessão mock para desenvolvimento
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from backend.app.deps import get_repo
from backend.app.domain.ports import IRepository
from backend.app.schemas.profiles import SessionMockIn, ProfileOut

router = APIRouter(prefix="/session", tags=["session"])


@router.post("/mock", response_model=ProfileOut)
def create_mock_session(
    body: SessionMockIn,
    repo: IRepository = Depends(get_repo)
):
    """
    Cria sessão mock para desenvolvimento.
    
    ⚠️ ENDPOINT DE DESENVOLVIMENTO
    
    Este endpoint cria ou obtém um perfil mock para testes.
    Útil para desenvolvimento sem autenticação real.
    
    Args:
        body: Dados da sessão mock (email opcional, track opcional)
        repo: Repositório para acesso a dados (injetado)
    
    Returns:
        ProfileOut: Perfil criado ou obtido
    
    Raises:
        HTTPException: Se houver erro ao criar/obter perfil
    
    Notas:
        - Se email não for fornecido, usa email baseado no track
        - Tracks disponíveis: "frontend", "backend", "data_engineer"
        - Se track não for fornecido, usa "frontend" por padrão
        - Se track for inválido, usa "frontend" por padrão
    """
    email: Optional[str] = body.email
    full_name = "User Mock"

    # Se email não foi fornecido, gera baseado no track
    if not email:
        track = (body.track or "frontend").lower()
        # Valida track
        if track not in ("frontend", "backend", "data_engineer"):
            track = "frontend"
        # Gera email e nome baseado no track
        email = f"{track}.mock@praxis.dev"
        full_name = {
            "frontend": "João Silva",
            "backend": "Maria Santos",
            "data_engineer": "Ana Data"
        }[track]

    # Cria ou obtém perfil mock
    prof = repo.upsert_mock_profile(email, full_name)
    if not prof:
        raise HTTPException(
            status_code=500,
            detail="Falha ao criar/obter perfil"
        )
    return prof
