"""
Schemas de perfis - Validação e serialização

Este módulo define os schemas Pydantic para perfis de usuário.
Usado para validação de dados de entrada e serialização de saída.

Schemas:
- SessionMockIn: Dados para criar sessão mock (entrada)
- ProfileOut: Dados do perfil (saída)

Validação:
- Validação de email (EmailStr)
- Validação de tipos e campos obrigatórios
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class SessionMockIn(BaseModel):
    """
    Schema para criar sessão mock (entrada da API).
    
    Schema usado para receber dados do frontend ao criar sessão mock.
    Útil para desenvolvimento sem autenticação real.
    
    Attributes:
        email: Email do usuário mock (opcional)
        track: Track de carreira (frontend, backend, data_engineer) (opcional)
    
    Notas:
        - Se email não fornecido, gera email baseado no track
        - Se track não fornecido, usa "frontend" por padrão
        - Tracks disponíveis: "frontend", "backend", "data_engineer"
    """
    email: Optional[EmailStr] = None
    """
    Email do usuário mock.
    
    Opcional: Se None, gera email baseado no track.
    Exemplo: "frontend.mock@praxis.dev"
    """
    
    track: Optional[str] = None
    """
    Track de carreira do usuário mock.
    
    Valores aceitos: "frontend", "backend", "data_engineer"
    Opcional: Se None, usa "frontend" por padrão.
    """


class ProfileOut(BaseModel):
    """
    Schema de dados do perfil (saída da API).
    
    Schema usado para serializar perfis na resposta da API.
    Inclui dados básicos do usuário (id, nome, email).
    
    Attributes:
        id: ID único do usuário (UUID)
        full_name: Nome completo do usuário
        email: Email do usuário
    """
    id: str
    """
    ID único do usuário (UUID).
    
    Formato: UUID string (ex: "550e8400-e29b-41d4-a716-446655440000")
    """
    
    full_name: str
    """
    Nome completo do usuário.
    
    Pode ser None no banco, mas schema sempre retorna string.
    Se None no banco, retorna string vazia "".
    """
    
    email: str
    """
    Email do usuário.
    
    Único: Não pode haver dois usuários com o mesmo email.
    Usado para autenticação via Supabase.
    """

