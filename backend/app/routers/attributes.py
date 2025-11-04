"""
ROUTER: Attributes (Atributos de Perfil - Skills e Career Goal)

Responsabilidades:
- Buscar atributos de um perfil
- Atualizar atributos parcialmente (PATCH)

✅ VALIDAÇÃO AUTOMÁTICA pelo Pydantic!
Não precisa mais validar manualmente aqui.
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.app.deps import get_repo, get_current_user
from backend.app.domain.ports import IRepository
from backend.app.domain.auth_service import AuthUser
from backend.app.schemas.attributes import AttributesOut, AttributesPatchIn
from backend.app.domain.exceptions import PraxisError, get_http_status_code, AuthorizationError
from backend.app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/attributes", tags=["attributes"])


@router.get("", response_model=AttributesOut)
def get_my_attributes(
    current_user: AuthUser = Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Busca atributos do usuário autenticado atual.
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    Este endpoint retorna automaticamente os atributos do usuário logado.
    Não precisa passar profile_id - usa o ID do token JWT.
    
    Retorna:
    - career_goal: objetivo de carreira
    - soft_skills: habilidades interpessoais
    - tech_skills: habilidades técnicas
    
    ✅ Erros específicos:
    - 401: Token inválido ou ausente
    - 404: Atributos não encontrados
    """
    try:
        return repo.get_attributes(current_user.id)
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.exception(
            "Erro inesperado ao buscar atributos",
            extra={"extra_data": {"user_id": current_user.id}}
        )
        raise HTTPException(status_code=500, detail="Erro inesperado ao buscar atributos")


@router.get("/{profile_id}", response_model=AttributesOut)
def get_attributes(
    profile_id: str,
    current_user: AuthUser = Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Busca atributos de um perfil (skills, career_goal).
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    ✅ Segurança:
    - Usuário só pode acessar seus próprios atributos
    - profile_id deve ser igual ao user_id do token
    
    Retorna:
    - career_goal: objetivo de carreira
    - soft_skills: habilidades interpessoais
    - tech_skills: habilidades técnicas
    
    ✅ Erros específicos:
    - 401: Token inválido ou ausente
    - 403: Tentando acessar atributos de outro usuário
    - 404: Atributos não encontrados
    """
    try:
        # Valida que usuário está acessando seus próprios dados
        if profile_id != current_user.id:
            raise AuthorizationError(
                f"Você não tem permissão para acessar atributos de outro usuário"
            )
        
        return repo.get_attributes(profile_id)
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.exception(
            "Erro inesperado ao buscar atributos",
            extra={"extra_data": {"profile_id": profile_id}}
        )
        raise HTTPException(status_code=500, detail="Erro inesperado ao buscar atributos")


@router.patch("/{profile_id}", response_model=AttributesOut)
def patch_attributes(
    profile_id: str,
    body: AttributesPatchIn,
    current_user: AuthUser = Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Atualiza atributos parcialmente (PATCH).
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    ✅ Segurança:
    - Usuário só pode atualizar seus próprios atributos
    - profile_id deve ser igual ao user_id do token
    
    Envie apenas os campos que deseja atualizar.
    
    ✅ Validação automática:
    - Skills devem estar entre 0-100 (Pydantic valida!)
    - Se enviar valor inválido → HTTP 422 automático
    
    ✅ Tratamento de erros específico:
    - 401: Token inválido ou ausente
    - 403: Tentando alterar atributos de outro usuário
    - 404: Atributos não encontrados
    - 422: Dados inválidos
    """
    try:
        # Valida que usuário está alterando seus próprios dados
        if profile_id != current_user.id:
            raise AuthorizationError(
                f"Você não tem permissão para alterar atributos de outro usuário"
            )
        
        # Converte para dict apenas com campos preenchidos
        payload = body.model_dump(exclude_unset=True)
        
        # Atualiza no banco (sem validação manual - Pydantic já fez!)
        return repo.update_attributes(profile_id, payload)
        
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        logger.exception(
            "Erro inesperado ao atualizar atributos",
            extra={"extra_data": {"profile_id": profile_id, "payload": body.model_dump(exclude_unset=True)}}
        )
        raise HTTPException(status_code=500, detail="Erro inesperado ao atualizar atributos")
