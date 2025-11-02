#!/usr/bin/env python3
"""
Script de teste de autenticação - FASE 1

Testa se o backend valida corretamente tokens do Supabase.
"""

import requests
import sys

# URL do backend
BASE_URL = "http://localhost:8000"

def test_without_token():
    """Teste 1: Acessar endpoint protegido SEM token (deve dar 401)"""
    print("\n" + "="*60)
    print("🧪 TESTE 1: Acessar endpoint protegido SEM token")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/challenges/active")
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.json()}")
        
        if response.status_code == 401:
            print("✅ PASSOU: Retornou 401 como esperado")
            return True
        else:
            print("❌ FALHOU: Deveria retornar 401")
            return False
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False


def test_with_token(token: str):
    """Teste 2: Acessar endpoint protegido COM token válido (deve funcionar)"""
    print("\n" + "="*60)
    print("🧪 TESTE 2: Acessar endpoint protegido COM token válido")
    print("="*60)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/challenges/active", headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PASSOU: Autenticação funcionou!")
            print(f"Resposta: {data}")
            return True
        elif response.status_code == 401:
            print(f"❌ FALHOU: Token inválido ou expirado")
            print(f"Resposta: {response.json()}")
            return False
        else:
            print(f"⚠️ Status inesperado: {response.status_code}")
            print(f"Resposta: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False


def test_attributes_endpoint(token: str):
    """Teste 3: Verificar se /attributes está protegido"""
    print("\n" + "="*60)
    print("🧪 TESTE 3: Verificar proteção do /attributes")
    print("="*60)
    
    # Sem token
    print("\n3a) SEM token:")
    try:
        response = requests.get(f"{BASE_URL}/attributes")
        print(f"Status: {response.status_code}")
        if response.status_code == 401:
            print("✅ Protegido corretamente")
        else:
            print("⚠️ NÃO está protegido (qualquer um pode acessar)")
    except Exception as e:
        print(f"❌ ERRO: {e}")
    
    # Com token
    print("\n3b) COM token:")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/attributes", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Acesso permitido com autenticação")
        else:
            print(f"Resposta: {response.json()}")
    except Exception as e:
        print(f"❌ ERRO: {e}")


def main():
    print("\n" + "="*60)
    print("🔐 TESTE DE AUTENTICAÇÃO - FASE 1")
    print("="*60)
    
    # Verifica se backend está rodando
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Backend está rodando: {response.json()}")
    except Exception as e:
        print(f"❌ Backend não está rodando!")
        print(f"   Erro: {e}")
        print(f"\n💡 Inicie o backend primeiro:")
        print(f"   cd backend && uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Teste 1: Sem token
    test1_passed = test_without_token()
    
    # Solicita token do usuário
    print("\n" + "="*60)
    print("📝 OBTER TOKEN DO FRONTEND")
    print("="*60)
    print("""
Para obter o token:

1. Abra o frontend (http://localhost:5173)
2. Faça login
3. Abra o Console (F12 → Console)
4. Cole este comando:

   (await supabase.auth.getSession()).data.session.access_token

5. Copie o token que aparecer
6. Cole aqui quando solicitado
    """)
    
    token = input("\n🔑 Cole o token aqui (ou Enter para pular): ").strip()
    
    if not token:
        print("\n⚠️ Pulando testes com token")
        return
    
    # Teste 2: Com token
    test2_passed = test_with_token(token)
    
    # Teste 3: Attributes
    test_attributes_endpoint(token)
    
    # Resumo
    print("\n" + "="*60)
    print("📊 RESUMO DOS TESTES")
    print("="*60)
    print(f"Teste 1 (Sem token → 401): {'✅ PASSOU' if test1_passed else '❌ FALHOU'}")
    if token:
        print(f"Teste 2 (Com token → 200): {'✅ PASSOU' if test2_passed else '❌ FALHOU'}")
    print("="*60)


if __name__ == "__main__":
    main()

