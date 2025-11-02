"""
ROUTER: Profile (Dados do Perfil do Usuário)

Responsabilidades:
- Buscar dados do perfil do usuário autenticado
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.app.deps import get_repo, get_current_user
from backend.app.domain.ports import IRepository
from backend.app.domain.auth_service import AuthUser
from backend.app.domain.exceptions import PraxisError, get_http_status_code
from backend.app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
def get_my_profile(
    current_user: AuthUser = Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Busca dados do perfil do usuário autenticado atual.
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    Este endpoint retorna automaticamente o perfil do usuário logado.
    Não precisa passar profile_id - usa o ID do token JWT.
    
    Retorna:
    - id: UUID do usuário
    - full_name: nome completo
    - email: email do usuário
    
    ✅ Erros específicos:
    - 401: Token inválido ou ausente
    - 404: Perfil não encontrado
    """
    try:
        profile = repo.get_profile(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="Perfil não encontrado")
        
        return {
            "id": str(profile.id),
            "full_name": profile.full_name,
            "email": profile.email
        }
    except HTTPException:
        raise
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.exception(
            "Erro inesperado ao buscar perfil",
            extra={"extra_data": {"user_id": current_user.id}}
        )
        raise HTTPException(status_code=500, detail="Erro inesperado ao buscar perfil")

