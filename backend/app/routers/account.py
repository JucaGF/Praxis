"""
Router de gerenciamento de conta

Este router fornece endpoints para gerenciamento da conta do usuário.

Endpoints:
- DELETE /account/delete: Deleta permanentemente a conta do usuário

⚠️ IMPORTANTE:
- Todas as ações são irreversíveis
- Requer autenticação (token JWT válido)
- Deleta todos os dados relacionados (perfil, atributos, submissões, currículos, etc)
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.app.deps import get_current_user
from backend.app.domain.auth_service import AuthUser
from backend.app.config import get_settings
from backend.app.logging_config import get_logger
import httpx

logger = get_logger(__name__)
router = APIRouter(prefix="/account", tags=["account"])

settings = get_settings()


@router.delete("/delete")
async def delete_account(
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Deleta permanentemente a conta do usuário autenticado.
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    ⚠️ AÇÃO IRREVERSÍVEL
    
    Fluxo:
    1. Deleta o perfil via REST API (com service_role_key)
    2. Trigger no banco deleta automaticamente todos os dados relacionados
    3. Deleta o usuário de auth.users via Admin API
    
    IMPORTANTE: Execute o SQL em backend/migrations/create_delete_user_function.sql
    no Supabase SQL Editor antes de usar este endpoint.
    
    Retorna:
    - 200: Conta deletada com sucesso
    - 401: Token inválido
    - 500: Erro ao deletar
    """
    user_id = current_user.id
    service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY
    
    if not service_role_key:
        logger.error("SUPABASE_SERVICE_ROLE_KEY não configurada! Esta chave é obrigatória para exclusão de conta.")
        raise HTTPException(
            status_code=500,
            detail="Configuração do servidor incompleta: SUPABASE_SERVICE_ROLE_KEY é obrigatória para deletar conta."
        )
    
    try:
        logger.info(f"Iniciando exclusão de conta para usuário {user_id}")
        
        async with httpx.AsyncClient() as client:
            # 1. Deleta o perfil (trigger vai deletar dados relacionados automaticamente)
            delete_profile_url = f"{settings.SUPABASE_URL}/rest/v1/profiles"
            delete_profile_response = await client.delete(
                delete_profile_url,
                headers={
                    "apikey": service_role_key,
                    "Authorization": f"Bearer {service_role_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                params={"id": f"eq.{user_id}"}
            )
            
            if delete_profile_response.status_code not in [200, 204]:
                logger.error(f"Erro ao deletar perfil: {delete_profile_response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Erro ao deletar perfil: {delete_profile_response.text}"
                )
            
            logger.info(f"Perfil {user_id} deletado (trigger limpou dados relacionados)")
            
            # 2. Deleta o usuário do auth.users
            delete_auth_url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
            delete_auth_response = await client.delete(
                delete_auth_url,
                headers={
                    "apikey": service_role_key,
                    "Authorization": f"Bearer {service_role_key}",
                    "Content-Type": "application/json"
                }
            )
            
            if delete_auth_response.status_code not in [200, 204]:
                logger.error(f"Erro ao deletar usuário do auth: {delete_auth_response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Erro ao deletar usuário: {delete_auth_response.text}"
                )
            
            logger.info(f"Usuário {user_id} deletado do auth.users com sucesso")
            
            return {
                "message": "Conta deletada com sucesso",
                "user_id": user_id,
                "details": {
                    "success": True,
                    "deleted_profile": True,
                    "deleted_auth": True
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Erro inesperado ao deletar conta {user_id}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao deletar conta: {str(e)}"
        )
