"""
Script de inicialização do banco de dados

Este script cria todas as tabelas no banco de dados PostgreSQL
baseado nos modelos definidos em models.py.

Uso:
    python init_db.py

Ou como módulo:
    python -m backend.init_db

IMPORTANTE:
- Este script cria as tabelas se não existirem
- Se as tabelas já existirem, não faz nada (safe)
- Use migrations para alterações em tabelas existentes
"""

from sqlmodel import SQLModel
from backend.db import engine
from backend.models import (
    Profile,
    Attributes,
    Resume,
    ResumeAnalysis,
    Challenge,
    Submission,
    SubmissionFeedback
)

def init_db():
    """
    Cria todas as tabelas no banco de dados.
    
    Usa SQLModel.metadata.create_all() para criar todas as tabelas
    definidas nos modelos importados.
    
    Esta função é idempotente: se as tabelas já existirem, não faz nada.
    
    Raises:
        Exception: Se houver erro ao conectar ou criar tabelas
    """
    print("🚀 Criando tabelas no banco Supabase...")
    SQLModel.metadata.create_all(engine)
    print("✅ Tabelas criadas com sucesso!")

if __name__ == "__main__":
    """
    Executa init_db() quando o script é executado diretamente.
    """
    init_db()
