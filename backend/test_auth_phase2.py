#!/usr/bin/env python3
"""
Script de teste de autenticação - FASE 2

Testa se os endpoints /attributes e /submissions estão protegidos
"""

import requests
import sys

BASE_URL = "http://localhost:8000"

# Token do usuário (cole aqui o token que você obteve)
TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkZsTDdJSTl0Nis5azNQd2YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3lpc3dqeGdwdmhqaG9ucW51eXpwLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiZDgzOTgzMS0yYjY3LTQ3MTAtYTkxNi0wYzM4MDZlOWIyYTYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYyMDQ1Mzc1LCJpYXQiOjE3NjIwNDE3NzUsImVtYWlsIjoianVjYWdmYnJAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Imp1Y2FnZmJyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub21lIjoiSm9hcXVpbSBHZXJtYW5vIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm9maXNzYW8iOiJEZXNlbnZvbHZlZG9yIEZyb250ZW5kIiwic3ViIjoiYmQ4Mzk4MzEtMmI2Ny00NzEwLWE5MTYtMGMzODA2ZTliMmE2In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjIwNDE3NzV9XSwic2Vzc2lvbl9pZCI6ImYxZTU0ZmQ3LWI5MmEtNGFiYi05NGY4LWRmNzdjNjk5NjM5MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.todiuDI1FybtVSroII5nocOZ2Uae_9ek6Uej5nN7-d0"

USER_ID = "bd839831-2b67-4710-a916-0c3806e9b2a6"  # ID do token acima
OTHER_USER_ID = "00000000-0000-0000-0000-000000000001"  # ID de outro usuário

def test_attributes_without_token():
    """Teste: /attributes SEM token deve retornar 401"""
    print("\n" + "="*60)
    print("🧪 TESTE 1: GET /attributes/{profile_id} SEM token")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/attributes/{USER_ID}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 401:
        print("✅ PASSOU: Retornou 401 (não autorizado)")
        return True
    else:
        print(f"❌ FALHOU: Esperava 401, recebeu {response.status_code}")
        print(f"Resposta: {response.text}")
        return False


def test_attributes_with_own_token():
    """Teste: /attributes COM token próprio deve funcionar"""
    print("\n" + "="*60)
    print("🧪 TESTE 2: GET /attributes/{profile_id} COM token próprio")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.get(f"{BASE_URL}/attributes/{USER_ID}", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code in [200, 404]:  # 404 é OK se perfil não tiver atributos ainda
        print(f"✅ PASSOU: Acesso permitido (status {response.status_code})")
        if response.status_code == 200:
            print(f"Dados: {response.json()}")
        return True
    else:
        print(f"❌ FALHOU: Esperava 200 ou 404, recebeu {response.status_code}")
        print(f"Resposta: {response.text}")
        return False


def test_attributes_with_other_user():
    """Teste: /attributes de outro usuário deve retornar 403"""
    print("\n" + "="*60)
    print("🧪 TESTE 3: GET /attributes/{profile_id} de OUTRO usuário")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    response = requests.get(f"{BASE_URL}/attributes/{OTHER_USER_ID}", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 403:
        print("✅ PASSOU: Retornou 403 (proibido)")
        print(f"Mensagem: {response.json()}")
        return True
    else:
        print(f"❌ FALHOU: Esperava 403, recebeu {response.status_code}")
        print(f"Resposta: {response.text}")
        return False


def test_submissions_without_token():
    """Teste: POST /submissions SEM token deve retornar 401"""
    print("\n" + "="*60)
    print("🧪 TESTE 4: POST /submissions SEM token")
    print("="*60)
    
    payload = {
        "challenge_id": 1,
        "profile_id": USER_ID,
        "code": "teste",
        "reflection": "teste"
    }
    
    response = requests.post(f"{BASE_URL}/submissions", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 401:
        print("✅ PASSOU: Retornou 401 (não autorizado)")
        return True
    else:
        print(f"❌ FALHOU: Esperava 401, recebeu {response.status_code}")
        print(f"Resposta: {response.text}")
        return False


def main():
    print("\n" + "="*60)
    print("🔐 TESTE DE AUTENTICAÇÃO - FASE 2")
    print("="*60)
    print("Testando proteção de /attributes e /submissions")
    
    # Verifica se backend está rodando
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Backend está rodando")
    except Exception as e:
        print(f"❌ Backend não está rodando!")
        print(f"   Inicie o backend primeiro: cd backend && uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Executa testes
    results = []
    results.append(("Attributes sem token → 401", test_attributes_without_token()))
    results.append(("Attributes com token próprio → 200/404", test_attributes_with_own_token()))
    results.append(("Attributes de outro usuário → 403", test_attributes_with_other_user()))
    results.append(("Submissions sem token → 401", test_submissions_without_token()))
    
    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO DOS TESTES - FASE 2")
    print("="*60)
    for name, passed in results:
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"{status}: {name}")
    
    print("="*60)
    
    if all(r[1] for r in results):
        print("\n🎉 FASE 2 COMPLETA! Todos os endpoints estão protegidos!")
        print("\n📌 Próxima etapa: FASE 3 - Melhorias no frontend")
    else:
        print("\n⚠️ Alguns testes falharam. Verifique os endpoints.")
        sys.exit(1)


if __name__ == "__main__":
    main()

