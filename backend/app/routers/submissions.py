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

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from backend.app.deps import get_submission_service, get_current_user
from backend.app.domain.services import SubmissionService
from backend.app.domain.auth_service import AuthUser
from backend.app.schemas.submissions import SubmissionCreateIn, SubmissionResultOut
from backend.app.domain.exceptions import PraxisError, get_http_status_code
from backend.app.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.get("")
def get_my_submissions(
    challenge_id: Optional[int] = None,
    current_user: AuthUser = Depends(get_current_user),
    service: SubmissionService = Depends(get_submission_service)
):
    """
    Busca todas as submissões do usuário autenticado.
    
    🔒 ENDPOINT PROTEGIDO - Requer autenticação
    
    Query params:
    - challenge_id (opcional): filtra submissões de um desafio específico
    
    Retorna lista com todas as submissões do usuário logado,
    incluindo feedbacks e pontuações.
    
    ✅ Erros específicos:
    - 401: Token inválido ou ausente
    """
    try:
        # Busca submissões do usuário logado
        try:
            submissions = service.repo.get_submissions_by_profile(current_user.id)
        except Exception:
            # Se não houver submissões, retorna lista vazia
            return []
        
        # Filtra por challenge_id se fornecido
        if challenge_id is not None:
            submissions = [s for s in submissions if s.challenge_id == challenge_id]
        
        # Formata resposta
        result = []
        for sub in submissions:
            feedback = None
            challenge = None
            
            try:
                feedback = service.repo.get_feedback_by_submission(sub.id)
            except Exception as e:
                logger.warning(
                    f"Erro ao buscar feedback para submissão {sub.id}",
                    extra={"extra_data": {"submission_id": sub.id, "error": str(e)}}
                )
                feedback = None
            
            try:
                challenge = service.repo.get_challenge(sub.challenge_id)
            except Exception as e:
                logger.warning(
                    f"Erro ao buscar challenge {sub.challenge_id}",
                    extra={"extra_data": {"challenge_id": sub.challenge_id, "error": str(e)}}
                )
                challenge = None
            
            # Extrai score do feedback (se existir)
            score = 0
            if feedback:
                score = feedback.score if hasattr(feedback, 'score') and feedback.score is not None else 0
            
            result.append({
                "id": sub.id,
                "challenge_id": sub.challenge_id,
                "title": challenge.get("title") if challenge else "Desafio Desconhecido",
                "score": score,
                "points": score,  # Points é o mesmo que score
                "date": sub.submitted_at.strftime("%d/%m/%Y") if sub.submitted_at else "Data desconhecida",
                "tags": challenge.get("category") if challenge else "",
                "status": sub.status
            })
        
        return result
        
    except Exception as e:
        logger.exception(
            "Erro ao buscar submissões",
            extra={"extra_data": {"user_id": current_user.id}}
        )
        # Retorna lista vazia em vez de erro
        return []


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
