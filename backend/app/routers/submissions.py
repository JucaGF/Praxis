# backend/app/routers/submissions.py
"""
ROUTER: Submissions (Submissões de Desafios)

Responsabilidade do Router (Garçom):
- Receber requisição HTTP
- Validar dados de entrada (Pydantic faz isso automaticamente)
- Chamar o SERVICE apropriado
- Retornar resposta formatada
- Tratar erros e converter para HTTPException

❌ NÃO faz: lógica de negócio, cálculos, coordenação complexa
✅ FAZ: recebe → delega → retorna
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.app.deps import get_submission_service, get_current_user
from backend.app.domain.services import SubmissionService
from backend.app.domain.auth_service import AuthUser
from backend.app.schemas.submissions import SubmissionCreateIn, SubmissionResultOut
from backend.app.domain.exceptions import PraxisError, get_http_status_code
from backend.app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionResultOut)
def create_and_score_submission(
    body: SubmissionCreateIn,
    current_user: AuthUser = Depends(get_current_user),
    service: SubmissionService = Depends(get_submission_service)
):
    """
    Cria uma submissão e retorna avaliação completa.
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    ✅ Segurança:
    - profile_id é extraído do token (não do body)
    - Impossível enviar submissão em nome de outro usuário
    
    Fluxo (executado pelo SERVICE):
    1. Valida que challenge existe
    2. Conta tentativas
    3. Cria submissão no banco
    4. Avalia com IA
    5. Salva feedback
    6. Calcula e aplica progressão de skills
    7. Retorna resultado consolidado
    
    ✅ Tratamento de erros específicos:
    - 401: Token inválido ou ausente
    - 404: Desafio não encontrado
    - 503: Erro ao avaliar com IA
    """
    try:
        # Converte Pydantic model para dict
        submission_data = body.model_dump()
        
        # SEGURANÇA: Força profile_id do token (não confia no body!)
        # Antes: qualquer um podia enviar profile_id de outro usuário
        # Depois: sempre usa ID do token (Supabase garante autenticidade)
        submission_data['profile_id'] = current_user.id
        
        # Delega TUDO para o service
        result = service.create_and_score_submission(submission_data)
        
        return result
        
    except PraxisError as e:
        # Todas as exceções customizadas caem aqui!
        # get_http_status_code() escolhe o status correto automaticamente
        status_code = get_http_status_code(e)
        raise HTTPException(status_code=status_code, detail=str(e))
        
    except Exception as e:
        # Apenas erros INESPERADOS (bugs) caem aqui
        # Log completo com traceback para investigação
        logger.exception(
            "Erro inesperado ao processar submissão",
            extra={"extra_data": {"profile_id": current_user.id, "challenge_id": body.challenge_id}}
        )
        raise HTTPException(
            status_code=500, 
            detail="Erro inesperado ao processar submissão. Por favor, tente novamente."
        )
