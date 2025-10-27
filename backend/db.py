# backend/db.py
"""
CONEXÃO COM BANCO DE DADOS

Usa configurações centralizadas de app.config
"""

from sqlmodel import create_engine
from backend.app.config import get_settings

# Carrega configurações centralizadas
settings = get_settings()

# Cria a engine conectando ao banco
# Todas as configs vêm de settings (validadas pelo Pydantic!)
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Logs SQL apenas se DEBUG=True
    connect_args={"connect_timeout": 10},
    pool_pre_ping=True,  # Verifica conexão antes de usar
    pool_size=settings.DATABASE_POOL_SIZE,  # ✅ Configurável!
    max_overflow=settings.DATABASE_MAX_OVERFLOW,  # ✅ Configurável!
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,  # ✅ Configurável!
)

# Para debug (opcional - descomente se quiser ver configs no início)
# if settings.DEBUG:
#     from backend.app.config import print_settings
#     print_settings()
