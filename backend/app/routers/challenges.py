# backend/app/routers/challenges.py
"""
ROUTER: Challenges (Desafios Técnicos)

Responsabilidades:
- Gerar desafios personalizados
- Listar desafios ativos
- Buscar desafio específico

Delega toda lógica para ChallengeService.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.deps import get_challenge_service, get_current_user
from backend.app.domain.services import ChallengeService
from backend.app.domain.auth_service import AuthUser
from backend.app.schemas.challenges import ChallengeOut
from backend.app.domain.exceptions import PraxisError, get_http_status_code
from backend.app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.post("/generate", response_model=List[ChallengeOut])
def generate_challenges(
    current_user: AuthUser = Depends(get_current_user),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Gera desafios personalizados para o usuário autenticado.
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    Como usar:
    1. Faça login no Supabase (frontend)
    2. Envie o token JWT no header:
       Authorization: Bearer <seu-token-jwt>
    
    O service cuida de:
    - Buscar atributos do usuário
    - Chamar IA para gerar desafios personalizados
    - Salvar no banco vinculado ao usuário
    
    ✅ Mudança importante:
    - ANTES: Recebia profile_id no body (inseguro - podia mentir)
    - DEPOIS: Usa current_user.id do token (seguro - Supabase garante)
    
    ✅ Erros:
    - 401: Token inválido, expirado ou ausente
    - 404: Profile não encontrado
    """
    try:
        # Usa ID do usuário autenticado (do token JWT)
        # Impossível mentir! Supabase garante que é esse user mesmo
        return service.generate_challenges_for_profile(
            profile_id=current_user.id,
            count=3  # MVP: sempre 3 desafios
        )
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.exception(
            "Erro inesperado ao gerar desafios",
            extra={"extra_data": {"profile_id": current_user.id}}
        )
        raise HTTPException(status_code=500, detail="Erro inesperado ao gerar desafios")


@router.get("/active", response_model=List[ChallengeOut])
def list_active(
    current_user: AuthUser = Depends(get_current_user),
    limit: int = Query(3, ge=1, le=10),
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Lista desafios ativos do usuário autenticado (mais recentes).
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    Query params:
    - limit: máximo de desafios a retornar (padrão 3, max 10)
    
    ✅ Mudança:
    - ANTES: Recebia profile_id via query param (inseguro)
    - DEPOIS: Usa current_user.id do token (seguro)
    """
    return service.get_active_challenges(current_user.id, limit)


@router.get("/{challenge_id}", response_model=ChallengeOut)
def get_one(
    challenge_id: int,
    service: ChallengeService = Depends(get_challenge_service)
):
    """
    Busca um desafio específico por ID.
    
    ✅ Erros específicos:
    - ChallengeNotFoundError → 404
    """
    try:
        return service.get_challenge_by_id(challenge_id)
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.exception(
            "Erro inesperado ao buscar desafio",
            extra={"extra_data": {"challenge_id": challenge_id}}
        )
        raise HTTPException(status_code=500, detail="Erro inesperado ao buscar desafio")
