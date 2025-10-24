# backend/db.py
import os
from pathlib import Path
from sqlmodel import create_engine
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env (procura no diretório backend)
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / ".env")

# URL do Supabase (pega no painel → Project Settings → Database → Connection string)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL não encontrada no .env")

# Cria a engine conectando ao banco do Supabase
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Desabilita logs SQL verbosos
    connect_args={"connect_timeout": 10},
    pool_pre_ping=True,  # Verifica conexão antes de usar
)
