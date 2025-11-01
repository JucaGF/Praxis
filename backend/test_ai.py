#!/usr/bin/env python3
"""
Script de teste para o sistema de IA do Praxis.

Este script testa:
1. FakeAI (mock, sem custos)
2. GeminiAI (IA real, se configurada)
3. Geração de desafios por track
4. Sistema de skill assessment
"""

import sys
import os

# Adiciona o diretório pai ao path para importar os módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.infra.ai_fake import FakeAI
from backend.app.config import get_settings


def print_separator(title: str):
    """Imprime separador visual."""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")


def print_challenge(challenge: dict, index: int):
    """Imprime um desafio formatado."""
    print(f"📋 DESAFIO {index}")
    print(f"   Título: {challenge.get('title')}")
    print(f"   Categoria: {challenge.get('category')}")
    print(f"   Dificuldade: {challenge.get('difficulty', {}).get('level')}")
    print(f"   Tempo estimado: {challenge.get('difficulty', {}).get('time_limit')}min")
    print(f"   Target skill: {challenge.get('description', {}).get('target_skill')}")
    print(f"\n   📝 Descrição (estilo 'chefe falando'):")
    print(f"   {challenge.get('description', {}).get('text')}\n")


def test_fake_ai():
    """Testa a FakeAI com diferentes tracks."""
    print_separator("TESTE 1: FakeAI (Mock para Desenvolvimento)")
    
    fake_ai = FakeAI()
    
    # Perfil de exemplo
    profile = {
        "id": "test123",
        "full_name": "Desenvolvedor Teste",
        "email": "dev@teste.com"
    }
    
    # Testa cada track
    tracks = {
        "Frontend": {
            "career_goal": "Frontend Developer",
            "tech_skills": {"React": 65, "JavaScript": 70, "CSS": 60}
        },
        "Backend": {
            "career_goal": "Backend Developer",
            "tech_skills": {"Python": 75, "FastAPI": 60, "SQL": 70}
        },
        "Data Engineer": {
            "career_goal": "Data Engineer",
            "tech_skills": {"SQL": 80, "Python": 75, "Airflow": 55}
        },
        "Fullstack": {
            "career_goal": "Desenvolvedor Full Stack",
            "tech_skills": {"React": 65, "Python": 70, "JavaScript": 68}
        }
    }
    
    for track_name, attributes in tracks.items():
        print(f"\n🎯 Track: {track_name}")
        print(f"   Career goal: {attributes['career_goal']}")
        print(f"   Skills: {attributes['tech_skills']}\n")
        
        challenges = fake_ai.generate_challenges(profile, attributes)
        
        for i, challenge in enumerate(challenges, 1):
            print_challenge(challenge, i)
        
        print("-" * 70)


def test_skill_assessment():
    """Testa o sistema de skill assessment."""
    print_separator("TESTE 2: Sistema de Skill Assessment")
    
    fake_ai = FakeAI()
    
    # Desafio de exemplo
    challenge = {
        "title": "Corrigir bug no login",
        "description": {
            "type": "codigo",
            "target_skill": "React"
        },
        "difficulty": {
            "level": "medium"
        }
    }
    
    # Submissão de exemplo
    submission = {
        "text": "function Button() { return <button onClick={handleClick}>Login</button> }",
        "files": {
            "Button.jsx": "function Button() { return <button onClick={handleClick}>Login</button> }"
        }
    }
    
    print("📊 Avaliando submissão de exemplo...\n")
    
    evaluation = fake_ai.evaluate_submission(challenge, submission)
    
    print(f"✅ Nota geral: {evaluation.get('nota_geral')}/100")
    print(f"\n📈 Métricas:")
    for metric, value in evaluation.get('metricas', {}).items():
        print(f"   - {metric}: {value}")
    
    print(f"\n💡 Pontos positivos:")
    for point in evaluation.get('pontos_positivos', []):
        print(f"   ✓ {point}")
    
    print(f"\n⚠️  Pontos negativos:")
    for point in evaluation.get('pontos_negativos', []):
        print(f"   ✗ {point}")
    
    print(f"\n🎯 Skill Assessment:")
    assessment = evaluation.get('skill_assessment', {})
    print(f"   - Nível demonstrado: {assessment.get('skill_level_demonstrated')}/100")
    print(f"   - Deve progredir: {assessment.get('should_progress')}")
    print(f"   - Intensidade: {assessment.get('progression_intensity')}")
    print(f"   - Reasoning: {assessment.get('reasoning')}")


def test_gemini_ai():
    """Testa a GeminiAI (se configurada)."""
    print_separator("TESTE 3: GeminiAI (IA Real)")
    
    settings = get_settings()
    
    if settings.AI_PROVIDER != "gemini":
        print("⚠️  GeminiAI não está configurada.")
        print(f"   AI_PROVIDER atual: {settings.AI_PROVIDER}")
        print("\nPara testar com IA real:")
        print("1. Configure no .env:")
        print("   AI_PROVIDER=gemini")
        print("   GEMINI_API_KEY=sua_chave_aqui")
        print("2. Execute este script novamente")
        return
    
    if not settings.GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY não configurada!")
        print("\nObtenha sua chave em: https://aistudio.google.com/app/apikey")
        print("Depois adicione no .env: GEMINI_API_KEY=sua_chave")
        return
    
    print("✅ GeminiAI configurada!")
    print(f"   Modelo: {settings.GEMINI_MODEL}")
    print(f"   API Key: {settings.GEMINI_API_KEY[:10]}...{settings.GEMINI_API_KEY[-4:]}")
    
    try:
        from backend.app.infra.ai_gemini import GeminiAI
        
        gemini_ai = GeminiAI(
            api_key=settings.GEMINI_API_KEY,
            model_name=settings.GEMINI_MODEL,
            max_retries=settings.AI_MAX_RETRIES,
            timeout=settings.AI_TIMEOUT
        )
        
        print("\n🚀 Testando geração de desafios com IA real...\n")
        
        profile = {
            "id": "test123",
            "full_name": "Desenvolvedor Teste",
            "email": "dev@teste.com"
        }
        
        attributes = {
            "career_goal": "Desenvolvedor Full Stack",
            "tech_skills": {
                "React": 65,
                "Python": 70,
                "JavaScript": 68,
                "FastAPI": 60
            }
        }
        
        print(f"🎯 Career goal: {attributes['career_goal']}")
        print(f"   Skills: {attributes['tech_skills']}\n")
        print("⏳ Gerando desafios (pode levar 10-30 segundos)...\n")
        
        challenges = gemini_ai.generate_challenges(profile, attributes)
        
        print(f"✅ {len(challenges)} desafios gerados com sucesso!\n")
        
        for i, challenge in enumerate(challenges, 1):
            print_challenge(challenge, i)
        
    except ImportError:
        print("❌ Erro ao importar GeminiAI")
        print("   Instale: uv pip install google-generativeai")
    except Exception as e:
        print(f"❌ Erro ao testar GeminiAI: {e}")


def main():
    """Função principal."""
    print("\n" + "🤖 " * 20)
    print("\n   PRAXIS - TESTE DO SISTEMA DE IA")
    print("   Testando geração de desafios e skill assessment\n")
    print("🤖 " * 20)
    
    try:
        # Teste 1: FakeAI (sempre funciona)
        test_fake_ai()
        
        # Teste 2: Skill Assessment
        test_skill_assessment()
        
        # Teste 3: GeminiAI (se configurada)
        test_gemini_ai()
        
        print_separator("TESTES CONCLUÍDOS!")
        print("✅ Sistema funcionando corretamente!\n")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário.")
    except Exception as e:
        print(f"\n\n❌ Erro durante os testes: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

