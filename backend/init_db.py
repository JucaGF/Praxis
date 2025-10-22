# backend/init_db.py
from sqlmodel import SQLModel
from backend.db import engine
from backend.models import Profile, Attributes, Resume, ResumeAnalysis, Challenge, Submission, SubmissionFeedback

def init_db():
    print("🚀 Criando tabelas no banco Supabase...")
    SQLModel.metadata.create_all(engine)
    print("✅ Tabelas criadas com sucesso!")

if __name__ == "__main__":
    init_db()
