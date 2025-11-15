"""
Conexão com banco de dados - SQLModel Engine

Este módulo configura a conexão com o banco de dados PostgreSQL usando SQLModel.
Todas as configurações vêm do módulo app.config (settings centralizados).

A engine é uma instância global compartilhada por toda a aplicação.
Usa connection pooling para melhor performance.

Configurações:
- DATABASE_URL: URL de conexão (obrigatória)
- DATABASE_POOL_SIZE: Tamanho do pool de conexões
- DATABASE_MAX_OVERFLOW: Conexões extras além do pool
- DATABASE_POOL_TIMEOUT: Timeout ao aguardar conexão
- DEBUG: Se True, loga todas as queries SQL
"""

from sqlmodel import create_engine
from backend.app.config import get_settings

# Carrega configurações centralizadas
settings = get_settings()

# ==================== ENGINE DO BANCO ====================

engine = create_engine(
    settings.DATABASE_URL,  # URL de conexão (obrigatória)
    # Se True, loga todas as queries SQL no console
    # Útil para debug, mas verboso em produção
    echo=settings.DEBUG,
    # Argumentos adicionais para conexão
    # connect_timeout: Timeout de 10 segundos ao conectar
    connect_args={"connect_timeout": 10},
    # Verifica se a conexão está viva antes de usar
    # Se a conexão foi fechada pelo servidor, tenta reconectar
    # Útil para conexões de longa duração
    pool_pre_ping=True,
    # Tamanho do pool de conexões
    # Número de conexões mantidas abertas permanentemente
    # Default: 5 (configurável via settings)
    pool_size=settings.DATABASE_POOL_SIZE,
    # Conexões extras além do pool quando necessário
    # Se todas as conexões do pool estiverem em uso, cria conexões extras
    # até este limite. Default: 10 (configurável via settings)
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    # Timeout ao aguardar conexão disponível
    # Se todas as conexões estiverem em uso, aguarda até este tempo (segundos)
    # antes de lançar erro. Default: 30 (configurável via settings)
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
)

# Para debug (opcional - descomente se quiser ver configs no início)
# if settings.DEBUG:
#     from backend.app.config import print_settings
#     print_settings()
