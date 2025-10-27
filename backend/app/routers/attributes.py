"""
ROUTER: Attributes (Atributos de Perfil - Skills e Career Goal)

Responsabilidades:
- Buscar atributos de um perfil
- Atualizar atributos parcialmente (PATCH)

✅ VALIDAÇÃO AUTOMÁTICA pelo Pydantic!
Não precisa mais validar manualmente aqui.
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.app.deps import get_repo
from backend.app.domain.ports import IRepository
from backend.app.schemas.attributes import AttributesOut, AttributesPatchIn
from backend.app.domain.exceptions import PraxisError, get_http_status_code

router = APIRouter(prefix="/attributes", tags=["attributes"])


@router.get("/{profile_id}", response_model=AttributesOut)
def get_attributes(profile_id: str, repo: IRepository = Depends(get_repo)):
    """
    Busca atributos de um perfil (skills, career_goal).
    
    Retorna:
    - career_goal: objetivo de carreira
    - soft_skills: habilidades interpessoais
    - tech_skills: habilidades técnicas
    
    ✅ Erros específicos:
    - AttributesNotFoundError → 404
    """
    try:
        return repo.get_attributes(profile_id)
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro inesperado ao buscar atributos")


@router.patch("/{profile_id}", response_model=AttributesOut)
def patch_attributes(
    profile_id: str, 
    body: AttributesPatchIn, 
    repo: IRepository = Depends(get_repo)
):
    """
    Atualiza atributos parcialmente (PATCH).
    
    Envie apenas os campos que deseja atualizar.
    
    ✅ Validação automática:
    - Skills devem estar entre 0-100 (Pydantic valida!)
    - Se enviar valor inválido → HTTP 422 automático
    
    ✅ Tratamento de erros específico:
    - AttributesNotFoundError → 404
    - ValidationError → 400
    """
    try:
        # Converte para dict apenas com campos preenchidos
        payload = body.model_dump(exclude_unset=True)
        
        # Atualiza no banco (sem validação manual - Pydantic já fez!)
        return repo.update_attributes(profile_id, payload)
        
    except PraxisError as e:
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro inesperado ao atualizar atributos")
