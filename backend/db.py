# backend/db.py
import os
from sqlmodel import create_engine
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

# URL do Supabase (pega no painel → Project Settings → Database → Connection string)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL não encontrada no .env")

# Cria a engine conectando ao banco do Supabase
engine = create_engine(DATABASE_URL, echo=True)
