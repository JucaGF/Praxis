#!/usr/bin/env python3
"""
Script para verificar se feedbacks estão avaliando skills que não existem
ou que o usuário não possui.

Este script analisa:
1. Submissions com feedback
2. Skills avaliadas no feedback (raw_ai_response.skills_assessment)
3. Skills do desafio (challenge.description.affected_skills)
4. Skills do usuário (attributes.tech_skills e soft_skills)

E reporta:
- Skills avaliadas que não existem no desafio
- Skills avaliadas que o usuário não possui
- Skills do desafio que não foram avaliadas
"""

import os
import sys
import json
from sqlmodel import Session, select, create_engine
from typing import Dict, List, Set
from dotenv import load_dotenv

# Adiciona o diretório backend ao path e muda para ele
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

# Carrega variáveis de ambiente do .env
load_dotenv()

from app.config import Settings
from models import Submission, SubmissionFeedback, Challenge, Attributes

# Cria instância de settings
settings = Settings()

def analyze_skill_mismatches():
    """Analisa mismatches entre skills avaliadas, do desafio e do usuário."""
    
    engine = create_engine(str(settings.DATABASE_URL))
    
    with Session(engine) as session:
        # Busca todas as submissions com feedback
        submissions = session.exec(
            select(Submission)
            .where(Submission.status == "scored")
        ).all()
        
        print(f"\n🔍 Analisando {len(submissions)} submissions avaliadas...\n")
        print("=" * 80)
        
        total_mismatches = 0
        total_missing_skills = 0
        total_extra_skills = 0
        
        for sub in submissions:
            # Busca feedback
            feedback = session.exec(
                select(SubmissionFeedback)
                .where(SubmissionFeedback.submission_id == sub.id)
            ).first()
            
            if not feedback or not feedback.raw_ai_response:
                continue
            
            # Busca desafio
            challenge = session.exec(
                select(Challenge)
                .where(Challenge.id == sub.challenge_id)
            ).first()
            
            if not challenge:
                continue
            
            # Busca atributos do usuário
            attributes = session.exec(
                select(Attributes)
                .where(Attributes.user_id == sub.profile_id)
            ).first()
            
            if not attributes:
                continue
            
            # Extrai skills
            skills_assessed = set()
            raw_response = feedback.raw_ai_response
            
            # Novo formato: skills_assessment (plural)
            if isinstance(raw_response, dict) and "skills_assessment" in raw_response:
                skills_assessed = set(raw_response["skills_assessment"].keys())
            # Formato antigo: skill_assessment (singular)
            elif isinstance(raw_response, dict) and "skill_assessment" in raw_response:
                # No formato antigo, só tinha uma skill (target_skill)
                target = challenge.description.get("target_skill") if challenge.description else None
                if target:
                    skills_assessed.add(target)
            
            # Skills do desafio
            skills_expected = set()
            if challenge.description:
                affected = challenge.description.get("affected_skills", [])
                if affected:
                    skills_expected = set(affected)
                else:
                    # Fallback: target_skill
                    target = challenge.description.get("target_skill")
                    if target:
                        skills_expected.add(target)
            
            # Skills do usuário
            user_tech_skills = set(attributes.tech_skills.keys()) if attributes.tech_skills else set()
            user_soft_skills = set(attributes.soft_skills.keys()) if attributes.soft_skills else set()
            user_all_skills = user_tech_skills | user_soft_skills
            
            # Detecta problemas
            has_issues = False
            
            # 1. Skills avaliadas que não estão no desafio
            extra_skills = skills_assessed - skills_expected
            if extra_skills:
                has_issues = True
                total_extra_skills += len(extra_skills)
            
            # 2. Skills do desafio que não foram avaliadas
            missing_skills = skills_expected - skills_assessed
            if missing_skills:
                has_issues = True
                total_missing_skills += len(missing_skills)
            
            # 3. Skills avaliadas que o usuário não possui
            skills_not_owned = skills_assessed - user_all_skills
            if skills_not_owned:
                has_issues = True
            
            if has_issues:
                total_mismatches += 1
                print(f"\n❌ SUBMISSION #{sub.id} (Challenge #{sub.challenge_id})")
                print(f"   Título: {challenge.title if challenge else 'N/A'}")
                print(f"   Categoria: {challenge.category if challenge else 'N/A'}")
                print(f"   Usuário: {sub.profile_id}")
                
                if extra_skills:
                    print(f"\n   ⚠️  Skills AVALIADAS mas NÃO estão no desafio:")
                    for skill in extra_skills:
                        print(f"      • {skill}")
                
                if missing_skills:
                    print(f"\n   ⚠️  Skills do DESAFIO que NÃO foram avaliadas:")
                    for skill in missing_skills:
                        print(f"      • {skill}")
                
                if skills_not_owned:
                    print(f"\n   ⚠️  Skills AVALIADAS que o usuário NÃO possui:")
                    for skill in skills_not_owned:
                        in_tech = skill in user_tech_skills
                        in_soft = skill in user_soft_skills
                        print(f"      • {skill} (tech: {in_tech}, soft: {in_soft})")
                
                print(f"\n   📊 Resumo:")
                print(f"      Skills esperadas: {', '.join(skills_expected) if skills_expected else 'Nenhuma'}")
                print(f"      Skills avaliadas: {', '.join(skills_assessed) if skills_assessed else 'Nenhuma'}")
                print(f"      Skills do usuário (tech): {len(user_tech_skills)}")
                print(f"      Skills do usuário (soft): {len(user_soft_skills)}")
                
                print("-" * 80)
        
        # Resumo final
        print("\n" + "=" * 80)
        print("📊 RESUMO FINAL")
        print("=" * 80)
        print(f"Total de submissions analisadas: {len(submissions)}")
        print(f"Submissions com problemas: {total_mismatches}")
        print(f"Skills extras avaliadas (não no desafio): {total_extra_skills}")
        print(f"Skills do desafio não avaliadas: {total_missing_skills}")
        
        if total_mismatches == 0:
            print("\n✅ Nenhum problema encontrado! Todas as skills estão corretas.")
        else:
            print(f"\n⚠️  Encontrados {total_mismatches} casos com problemas de skills.")
            print("\nPossíveis causas:")
            print("1. IA avaliando skills não especificadas no desafio")
            print("2. IA criando nomes de skills diferentes dos esperados")
            print("3. Desafios antigos sem 'affected_skills' definido")
            print("4. Skills do usuário não sincronizadas com o desafio")

if __name__ == "__main__":
    try:
        analyze_skill_mismatches()
    except Exception as e:
        print(f"\n❌ Erro ao executar análise: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

