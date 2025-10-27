# backend/app/deps.py
"""
DEPENDENCIES - Injeção de Dependências

Este arquivo fornece instâncias de:
- Repositories (acesso a dados)
- AI Services (inteligência artificial)
- Services (lógica de negócio)
- Authentication (usuário autenticado)

FastAPI usa essas funções com Depends() para injetar nas rotas.
"""

from typing import Optional
from fastapi import Header, Depends

from backend.app.domain.ports import IRepository, IAIService
from backend.app.infra.repo_sql import SqlRepo
from backend.app.infra.ai_fake import FakeAI
from backend.app.domain.services import ChallengeService, SubmissionService
from backend.app.domain.auth_service import get_auth_service, AuthService, AuthUser

# Instâncias globais (por enquanto - podemos melhorar depois com factory pattern)
_repo = SqlRepo()
_ai = FakeAI()


# ==================== DEPENDÊNCIAS BASE ====================

def get_repo() -> IRepository:
    """
    Fornece instância de Repository.
    
    Usado em endpoints que precisam acesso direto ao banco.
    Exemplo: get_attributes(), patch_attributes()
    """
    return _repo


def get_ai() -> IAIService:
    """
    Fornece instância de AI Service.
    
    Por enquanto retorna FakeAI, mas pode ser trocado por IA real!
    """
    return _ai


# ==================== DEPENDÊNCIAS DE SERVICES ====================
# Estas são as NOVAS dependências que os endpoints vão usar!

def get_challenge_service() -> ChallengeService:
    """
    Fornece instância de ChallengeService.
    
    Service que encapsula lógica de geração e listagem de desafios.
    Endpoints devem usar este service ao invés de chamar repo + ai diretamente.
    """
    return ChallengeService(repository=_repo, ai_service=_ai)


def get_submission_service() -> SubmissionService:
    """
    Fornece instância de SubmissionService.
    
    Service que encapsula TODA a lógica complexa de:
    - Criar submissão
    - Avaliar com IA
    - Calcular progressão
    - Salvar feedback
    
    Este é o service mais importante! 🚀
    """
    return SubmissionService(repository=_repo, ai_service=_ai)


# ==================== AUTENTICAÇÃO ====================

def get_auth_service_dep() -> AuthService:
    """
    Fornece instância de AuthService.
    
    Service para validar tokens JWT do Supabase.
    """
    return get_auth_service()


def get_current_user(
    authorization: Optional[str] = Header(None),
    auth_service: AuthService = Depends(get_auth_service_dep)
) -> AuthUser:
    """
    Extrai e valida usuário autenticado do token JWT.
    
    Uso em endpoints protegidos:
        @router.get("/meus-dados")
        def get_meus_dados(current_user: AuthUser = Depends(get_current_user)):
            # current_user.id contém o ID do usuário autenticado
            # current_user.email contém o email
            return {"user_id": current_user.id, "email": current_user.email}
    
    Fluxo:
    1. Extrai header "Authorization: Bearer <token>"
    2. Valida token JWT com Supabase
    3. Retorna dados do usuário (id, email, role)
    4. Se inválido: lança exceção (FastAPI retorna 401 automaticamente)
    
    Args:
        authorization: Header Authorization (FastAPI extrai automaticamente)
        auth_service: Service de autenticação (injetado)
    
    Returns:
        Usuário autenticado
        
    Raises:
        AuthenticationError: Token inválido, expirado ou ausente (FastAPI converte em 401)
    """
    return auth_service.get_current_user(authorization)


def get_optional_user(
    authorization: Optional[str] = Header(None),
    auth_service: AuthService = Depends(get_auth_service_dep)
) -> Optional[AuthUser]:
    """
    Tenta extrair usuário autenticado, mas NÃO força autenticação.
    
    Útil para endpoints que funcionam com ou sem autenticação.
    
    Uso:
        @router.get("/public-data")
        def get_data(user: Optional[AuthUser] = Depends(get_optional_user)):
            if user:
                # Usuário autenticado: retorna dados personalizados
                return personalizar_para(user.id)
            else:
                # Usuário anônimo: retorna dados genéricos
                return dados_publicos()
    
    Returns:
        Usuário autenticado ou None
    """
    try:
        return auth_service.get_current_user(authorization)
    except Exception:
        # Token inválido ou ausente: retorna None (não força autenticação)
        return None
