# backend/app/domain/exceptions.py
"""
EXCEÇÕES CUSTOMIZADAS - Erros específicos do domínio

Por que criar exceções próprias?
1. CLAREZA: Nome diz exatamente o que aconteceu
2. TRATAMENTO: Pode tratar cada tipo de erro diferente
3. MENSAGENS: Erros com contexto útil
4. DEBUG: Fácil encontrar onde o erro foi gerado

Antes: raise ValueError("Não encontrado") → genérico
Depois: raise ProfileNotFoundError(profile_id) → específico!
"""

from typing import Optional


# ==================== EXCEÇÃO BASE ====================

class PraxisError(Exception):
    """
    Exceção base para todos os erros do domínio Praxis.
    
    Todas as exceções customizadas herdam dela.
    Isso permite capturar TODOS os erros do domínio de uma vez:
    
    try:
        ...
    except PraxisError as e:
        # Qualquer erro do nosso domínio cai aqui
        
    Atributos:
        message: Mensagem descritiva do erro
        details: Dict com detalhes adicionais (opcional)
    """
    def __init__(self, message: str, details: Optional[dict] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)
    
    def __str__(self):
        if self.details:
            return f"{self.message} | Detalhes: {self.details}"
        return self.message


# ==================== ERROS DE RECURSOS NÃO ENCONTRADOS ====================

class ResourceNotFoundError(PraxisError):
    """
    Erro quando um recurso não é encontrado no banco.
    
    Uso: Quando buscar algo por ID e não existir.
    HTTP Status: 404 (Not Found)
    """
    pass


class ProfileNotFoundError(ResourceNotFoundError):
    """Perfil não encontrado."""
    def __init__(self, profile_id: str):
        super().__init__(
            message=f"Perfil não encontrado",
            details={"profile_id": profile_id}
        )
        self.profile_id = profile_id


class ChallengeNotFoundError(ResourceNotFoundError):
    """Desafio não encontrado."""
    def __init__(self, challenge_id: int):
        super().__init__(
            message=f"Desafio não encontrado",
            details={"challenge_id": challenge_id}
        )
        self.challenge_id = challenge_id


class AttributesNotFoundError(ResourceNotFoundError):
    """Atributos não encontrados para um perfil."""
    def __init__(self, profile_id: str):
        super().__init__(
            message=f"Atributos não encontrados para o perfil",
            details={"profile_id": profile_id}
        )
        self.profile_id = profile_id


# ==================== ERROS DE VALIDAÇÃO ====================

class ValidationError(PraxisError):
    """
    Erro de validação de regra de negócio.
    
    Uso: Quando dados estão corretos tecnicamente mas violam regras de negócio.
    HTTP Status: 400 (Bad Request)
    
    Exemplo:
    - Submeter desafio já completado
    - Skill value fora do range (se não fosse validado pelo Pydantic)
    """
    pass


class InvalidSkillValueError(ValidationError):
    """Valor de skill inválido."""
    def __init__(self, skill_name: str, value: int):
        super().__init__(
            message=f"Valor inválido para skill '{skill_name}'",
            details={"skill": skill_name, "value": value, "expected_range": "0-100"}
        )


# ==================== ERROS DE PROCESSAMENTO ====================

class ProcessingError(PraxisError):
    """
    Erro durante processamento de operação complexa.
    
    Uso: Quando algo falha no meio de um processo (ex: avaliação de IA)
    HTTP Status: 500 (Internal Server Error) ou 503 (Service Unavailable)
    """
    pass


class AIEvaluationError(ProcessingError):
    """Falha ao avaliar submissão com IA."""
    def __init__(self, reason: str, submission_id: Optional[int] = None):
        super().__init__(
            message=f"Falha ao avaliar submissão com IA: {reason}",
            details={"submission_id": submission_id} if submission_id else {}
        )


class DatasetGenerationError(ProcessingError):
    """Falha ao gerar dataset."""
    def __init__(self, template_id: str, reason: str):
        super().__init__(
            message=f"Falha ao gerar dataset: {reason}",
            details={"template_id": template_id}
        )


# ==================== ERROS DE AUTORIZAÇÃO ====================

class AuthorizationError(PraxisError):
    """
    Erro de autorização - usuário não tem permissão.
    
    Uso: Usuário autenticado, mas sem permissão para a operação
    HTTP Status: 403 (Forbidden)
    
    Exemplo:
    - Tentar acessar atributos de outro usuário
    - Tentar editar desafio de outro usuário
    """
    pass


# ==================== ERROS DE ESTADO ====================

class InvalidStateError(PraxisError):
    """
    Erro quando recurso está em estado inválido para operação.
    
    Uso: Tentar fazer algo que não é permitido no estado atual
    HTTP Status: 409 (Conflict)
    
    Exemplo:
    - Avaliar submissão que já foi avaliada
    - Editar desafio que já tem submissões
    """
    pass


class SubmissionAlreadyEvaluatedError(InvalidStateError):
    """Tentou avaliar submissão que já foi avaliada."""
    def __init__(self, submission_id: int):
        super().__init__(
            message="Submissão já foi avaliada",
            details={"submission_id": submission_id}
        )


# ==================== MAPEAMENTO HTTP ====================

def get_http_status_code(error: PraxisError) -> int:
    """
    Mapeia exceção customizada para código HTTP apropriado.
    
    Uso nos endpoints:
        except PraxisError as e:
            status_code = get_http_status_code(e)
            raise HTTPException(status_code=status_code, detail=str(e))
    
    Returns:
        Código HTTP apropriado para o tipo de erro
    """
    # Importação local para evitar circular import
    from backend.app.domain.auth_service import AuthenticationError
    
    if isinstance(error, AuthenticationError):
        return 401  # Unauthorized (autenticação falhou)
    elif isinstance(error, AuthorizationError):
        return 403  # Forbidden (sem permissão)
    elif isinstance(error, ResourceNotFoundError):
        return 404  # Not Found
    elif isinstance(error, ValidationError):
        return 400  # Bad Request
    elif isinstance(error, InvalidStateError):
        return 409  # Conflict
    elif isinstance(error, AIEvaluationError):
        return 503  # Service Unavailable (serviço externo falhou)
    elif isinstance(error, ProcessingError):
        return 500  # Internal Server Error
    else:
        return 500  # Default: Internal Server Error

