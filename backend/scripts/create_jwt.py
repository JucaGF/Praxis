"""
Script para criar token JWT de teste

Este script cria um token JWT válido para testes locais.
Útil para testar endpoints protegidos sem fazer login no Supabase.

Funcionalidades:
- Lê SUPABASE_JWT_SECRET do ambiente ou arquivo .env
- Cria token JWT com payload de teste
- Token válido por 1 hora (3600 segundos)
- Usa usuário mock de desenvolvimento

Uso:
    python scripts/create_jwt.py
    
    Ou:
    python -m backend.scripts.create_jwt

Retorna:
    Token JWT válido para usar em requisições de teste
    
Exemplo:
    TOKEN=$(python scripts/create_jwt.py)
    curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/profile
"""

import os, time, re, json

try:
    # Try environment first
    secret = os.environ.get('SUPABASE_JWT_SECRET')
    if not secret:
        # Fallback: read backend/.env
        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
        with open(env_path, 'r', encoding='utf-8') as f:
            text = f.read()
        m = re.search(r"SUPABASE_JWT_SECRET\s*=\s*\"?(.*?)\"?\s*$", text, flags=re.M)
        if m:
            secret = m.group(1)
    if not secret:
        raise SystemExit('SUPABASE_JWT_SECRET not found in env or .env')
    
    import jwt
    
    # Payload do token (usuário mock de desenvolvimento)
    payload = {
        'sub': '00000000-0000-0000-0000-000000000001',  # UUID do usuário dev
        'email': 'test@local',  # Email de teste
        'role': 'authenticated',  # Role do usuário
        'aud': 'authenticated',  # Audience (Supabase)
        'exp': int(time.time()) + 3600  # Expira em 1 hora
    }
    
    # Cria token JWT
    token = jwt.encode(payload, secret, algorithm='HS256')
    
    # PyJWT may return bytes in older versions
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    
    # Imprime token (para usar em requisições)
    print(token)
    
except Exception as e:
    print('ERROR:', e)
    raise
