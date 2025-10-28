# backend/app/domain/auth_service.py
"""
AUTH SERVICE - Serviço de Autenticação com Supabase

Responsabilidades:
- Validar tokens JWT do Supabase
- Extrair informações do usuário do token
- Verificar se token está expirado
- Integrar com Supabase Auth

Como funciona?
1. Frontend faz login no Supabase
2. Supabase retorna JWT token
3. Frontend envia token em cada requisição (Header: Authorization: Bearer <token>)
4. AuthService valida token
5. Se válido: extrai user_id, email, etc
6. Se inválido: retorna erro 401 Unauthorized
"""

import jwt
from typing import Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from backend.app.config import get_settings, DEV_USER_UUID
from backend.app.logging_config import get_logger
from backend.app.domain.exceptions import PraxisError

settings = get_settings()
logger = get_logger(__name__)


# ==================== EXCEÇÕES ====================

class AuthenticationError(PraxisError):
    """Erro de autenticação (token inválido, expirado, etc)"""
    pass


class TokenInvalidError(AuthenticationError):
    """Token inválido ou malformado"""
    def __init__(self, reason: str = "Token inválido"):
        super().__init__(message=reason)


class TokenExpiredError(AuthenticationError):
    """Token expirado"""
    def __init__(self):
        super().__init__(message="Token expirado. Faça login novamente.")


class TokenMissingError(AuthenticationError):
    """Token não fornecido"""
    def __init__(self):
        super().__init__(message="Token de autenticação não fornecido")


# ==================== MODELOS ====================

class AuthUser(BaseModel):
    """
    Representa um usuário autenticado.
    
    Extraído do token JWT do Supabase.
    """
    id: str
    """ID do usuário no Supabase (UUID)"""
    
    email: Optional[str] = None
    """Email do usuário"""
    
    role: str = "authenticated"
    """Role do usuário (authenticated, anon, etc)"""
    
    exp: Optional[int] = None
    """Timestamp de expiração do token"""


# ==================== AUTH SERVICE ====================

class AuthService:
    """
    Serviço para validação de autenticação via Supabase.
    
    Métodos de validação:
    1. JWT offline (rápido - usa JWT_SECRET)
    2. Supabase API (lento - chamada HTTP)
    
    Preferência: JWT offline se JWT_SECRET estiver configurado
    """
    
    def __init__(self):
        self.jwt_secret = settings.SUPABASE_JWT_SECRET
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.auth_enabled = settings.AUTH_ENABLED
        
        # Log de configuração
        if not self.auth_enabled:
            logger.warning("Autenticação DESABILITADA - apenas para desenvolvimento!")
        elif not self.jwt_secret:
            logger.info("JWT Secret não configurado - validação será via API Supabase (mais lento)")
        else:
            logger.info("Auth configurado com validação JWT offline")
    
    def extract_token_from_header(self, authorization: Optional[str]) -> str:
        """
        Extrai token do header Authorization.
        
        Formato esperado: "Bearer <token>"
        
        Args:
            authorization: Valor do header Authorization
            
        Returns:
            Token extraído
            
        Raises:
            TokenMissingError: Se header não fornecido ou formato inválido
        """
        if not authorization:
            raise TokenMissingError()
        
        parts = authorization.split()
        
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise TokenInvalidError("Formato inválido. Use: Authorization: Bearer <token>")
        
        return parts[1]
    
    def validate_token_jwt(self, token: str) -> AuthUser:
        """
        Valida token JWT offline (rápido).
        
        Usa o JWT_SECRET do Supabase para validar a assinatura.
        Não faz chamada HTTP - validação local.
        
        Args:
            token: Token JWT
            
        Returns:
            Dados do usuário autenticado
            
        Raises:
            TokenInvalidError: Token inválido ou malformado
            TokenExpiredError: Token expirado
        """
        if not self.jwt_secret:
            raise TokenInvalidError("JWT Secret não configurado")
        
        try:
            # Decodifica e valida token
            # Supabase usa audience="authenticated" por padrão
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",  # ← IMPORTANTE: Supabase audience
                options={
                    "verify_signature": True, 
                    "verify_exp": True,
                    "verify_aud": True  # Verifica audience
                }
            )
            
            # Extrai dados do usuário
            user_id = payload.get("sub")  # subject = user_id
            email = payload.get("email")
            role = payload.get("role", "authenticated")
            exp = payload.get("exp")
            
            if not user_id:
                raise TokenInvalidError("Token não contém user_id")
            
            logger.debug(f"Token validado com sucesso", extra={"extra_data": {
                "user_id": user_id,
                "email": email
            }})
            
            return AuthUser(
                id=user_id,
                email=email,
                role=role,
                exp=exp
            )
            
        except jwt.ExpiredSignatureError:
            logger.warning("Token expirado")
            raise TokenExpiredError()
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token inválido: {e}")
            raise TokenInvalidError(f"Token inválido: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao validar token: {e}")
            raise TokenInvalidError("Erro ao processar token")
    
    def validate_token(self, token: str) -> AuthUser:
        """
        Valida token (método principal).
        
        Estratégia:
        - Se JWT_SECRET configurado: validação offline (rápido)
        - Senão: validação via API Supabase (lento - não implementado ainda)
        
        Args:
            token: Token JWT do Supabase
            
        Returns:
            Dados do usuário autenticado
            
        Raises:
            TokenInvalidError: Token inválido
            TokenExpiredError: Token expirado
        """
        if not self.auth_enabled:
            # Modo desenvolvimento: retorna usuário mock
            logger.warning("Auth desabilitado - retornando usuário mock")
            return AuthUser(
                id=str(DEV_USER_UUID),
                email="dev@mock.local",
                role="authenticated"
            )
        
        if self.jwt_secret:
            # Validação JWT offline (preferida)
            return self.validate_token_jwt(token)
        else:
            # Validação via API Supabase
            # TODO: Implementar se necessário (mais lento, mas funciona sem JWT_SECRET)
            raise TokenInvalidError(
                "Validação via API Supabase não implementada. "
                "Configure SUPABASE_JWT_SECRET no .env"
            )
    
    def get_current_user(self, authorization: Optional[str]) -> AuthUser:
        """
        Extrai e valida usuário do header Authorization.
        
        Método conveniente que combina:
        1. Extrair token do header
        2. Validar token
        3. Retornar usuário
        
        Args:
            authorization: Header Authorization
            
        Returns:
            Usuário autenticado
            
        Raises:
            AuthenticationError: Qualquer erro de autenticação
        """
        # Modo desenvolvimento sem auth
        if not self.auth_enabled:
            return AuthUser(
                id=str(DEV_USER_UUID),
                email="dev@mock.local",
                role="authenticated"
            )
        
        # Extrai token
        token = self.extract_token_from_header(authorization)
        
        # Valida e retorna user
        return self.validate_token(token)


# ==================== INSTÂNCIA GLOBAL ====================

_auth_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """
    Retorna instância singleton do AuthService.
    
    Uso:
        from app.domain.auth_service import get_auth_service
        
        auth = get_auth_service()
        user = auth.get_current_user(authorization_header)
    """
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service

