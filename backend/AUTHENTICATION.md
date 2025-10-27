# 🔐 AUTENTICAÇÃO COM SUPABASE - GUIA COMPLETO

Este documento explica como funciona a autenticação implementada no backend Praxis.

---

## 📋 O QUE FOI IMPLEMENTADO

✅ **AuthService** - Valida tokens JWT do Supabase  
✅ **get_current_user** - Dependency para obter usuário autenticado  
✅ **Exceções customizadas** - Erros claros (TokenExpiredError, TokenInvalidError, etc)  
✅ **Endpoints protegidos** - Exemplos em `/challenges/generate` e `/challenges/active`  
✅ **Configuração flexível** - Modo dev (sem auth) e modo produção (com auth)  

---

## 🔑 CONFIGURAÇÃO

### **1. Adicione as credenciais no `.env`:**

```bash
# backend/.env

# URL do projeto Supabase
SUPABASE_URL=https://xxxxx.supabase.co

# Anon/Public Key (dashboard → Project Settings → API)
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (dashboard → Project Settings → API → JWT Secret)
SUPABASE_JWT_SECRET=seu-jwt-secret-aqui

# Habilitar/desabilitar autenticação
AUTH_ENABLED=true  # true = produção, false = dev sem auth
```

### **2. Onde encontrar as credenciais:**

1. Entre no dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **⚙️ Project Settings** → **API**
4. Copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_KEY`
   - `JWT Secret` → `SUPABASE_JWT_SECRET`

---

## 🚀 COMO FUNCIONA

### **Fluxo Completo:**

```
1. FRONTEND faz login
   ↓
   POST https://xxxxx.supabase.co/auth/v1/token
   Body: { email, password }
   
2. SUPABASE valida credenciais
   ↓
   Se válido: retorna { access_token: "eyJhbGci..." }
   
3. FRONTEND armazena token
   ↓
   localStorage.setItem('token', access_token)
   
4. FRONTEND envia token em requisições
   ↓
   GET /api/challenges/generate
   Headers: { Authorization: "Bearer eyJhbGci..." }
   
5. BACKEND valida token
   ↓
   - AuthService.get_current_user(authorization_header)
   - Decodifica JWT
   - Verifica assinatura e expiração
   - Extrai user_id, email, role
   
6. BACKEND processa requisição
   ↓
   - Usa current_user.id para buscar dados do usuário
   - Garante que usuário só acessa seus próprios dados
   
7. BACKEND retorna resposta
   ↓
   200 OK com dados
   ou
   401 Unauthorized se token inválido
```

---

## 💻 COMO USAR NOS ENDPOINTS

### **Endpoint PROTEGIDO (requer autenticação):**

```python
from fastapi import APIRouter, Depends
from backend.app.deps import get_current_user
from backend.app.domain.auth_service import AuthUser

router = APIRouter()

@router.get("/meus-dados")
def get_meus_dados(current_user: AuthUser = Depends(get_current_user)):
    """
    🔒 Endpoint protegido - requer token JWT válido
    """
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }
```

**Requisição:**
```bash
curl http://localhost:8000/meus-dados \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respostas:**
- ✅ **200 OK:** Token válido
- ❌ **401 Unauthorized:** Token inválido, expirado ou ausente

---

### **Endpoint PÚBLICO (não requer autenticação):**

```python
@router.get("/healthz")
def health():
    """
    ✅ Endpoint público - qualquer um pode acessar
    """
    return {"ok": True}
```

**Requisição:**
```bash
curl http://localhost:8000/healthz
# Não precisa de token!
```

---

### **Endpoint OPCIONAL (funciona com ou sem auth):**

```python
from backend.app.deps import get_optional_user
from typing import Optional

@router.get("/feed")
def get_feed(user: Optional[AuthUser] = Depends(get_optional_user)):
    """
    📖 Endpoint que funciona com ou sem autenticação
    """
    if user:
        # Usuário autenticado: feed personalizado
        return {"type": "personalizado", "user_id": user.id}
    else:
        # Usuário anônimo: feed genérico
        return {"type": "publico"}
```

---

## 📝 EXEMPLOS DE ENDPOINTS PROTEGIDOS

### **ANTES (inseguro):**

```python
@router.post("/challenges/generate")
def generate(body: GenerateIn):  # body.profile_id pode ser qualquer um
    return service.generate_challenges(body.profile_id)

# 😈 Problema: Usuário pode mentir o profile_id
POST /challenges/generate
{
  "profile_id": "id-de-outro-usuario"  # Roubo de identidade!
}
```

### **DEPOIS (seguro):**

```python
@router.post("/challenges/generate")
def generate(current_user: AuthUser = Depends(get_current_user)):
    # current_user.id vem do token JWT (Supabase garante!)
    return service.generate_challenges(current_user.id)

# ✅ Solução: Impossível mentir! Supabase garante identidade
POST /challenges/generate
Headers: { Authorization: Bearer <token> }
# Token contém user_id assinado pelo Supabase
```

---

## 🧪 TESTANDO A AUTENTICAÇÃO

### **1. Modo Desenvolvimento (sem auth):**

```bash
# backend/.env
AUTH_ENABLED=false
```

Endpoints funcionam **sem token** (útil para desenvolvimento).

---

### **2. Modo Produção (com auth):**

```bash
# backend/.env
AUTH_ENABLED=true
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=...
SUPABASE_JWT_SECRET=...
```

#### **a) Obter token (via Supabase):**

```bash
# Login no Supabase
curl -X POST https://xxxxx.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: SEU_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'

# Resposta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### **b) Usar token no backend:**

```bash
# Endpoint protegido
curl http://localhost:8000/challenges/generate \
  -X POST \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ✅ Sucesso: 200 OK
# ❌ Token inválido: 401 Unauthorized
```

---

## 🛡️ SEGURANÇA

### **O que o backend valida:**

✅ **Assinatura do token** - Apenas Supabase pode gerar tokens válidos  
✅ **Expiração** - Tokens expirados são rejeitados  
✅ **Estrutura** - Token deve ter formato JWT válido  
✅ **Presença de user_id** - Todo token deve ter `sub` (user_id)  

### **O que o backend NÃO aceita:**

❌ Token modificado (assinatura inválida)  
❌ Token expirado  
❌ Token malformado  
❌ Token sem user_id  
❌ Requisição sem token (em endpoints protegidos)  

---

## 🔄 ATUALIZANDO ENDPOINTS EXISTENTES

### **Padrão de migração:**

**ANTES:**
```python
@router.post("/resource")
def create_resource(body: ResourceIn, repo = Depends(get_repo)):
    profile_id = body.profile_id  # ❌ Cliente pode mentir
    return repo.create(profile_id, body.data)
```

**DEPOIS:**
```python
@router.post("/resource")
def create_resource(
    body: ResourceIn,  # Remove profile_id do schema
    current_user: AuthUser = Depends(get_current_user),  # ✅ Adiciona auth
    repo = Depends(get_repo)
):
    profile_id = current_user.id  # ✅ Do token JWT (confiável)
    return repo.create(profile_id, body.data)
```

---

## 📊 ENDPOINTS QUE DEVEM SER PROTEGIDOS

| Endpoint | Status | Prioridade |
|----------|--------|------------|
| `POST /challenges/generate` | ✅ Protegido | Alta |
| `GET /challenges/active` | ✅ Protegido | Alta |
| `GET /challenges/{id}` | ⏳ Pendente | Média |
| `POST /submissions` | ⏳ Pendente | **CRÍTICA** |
| `GET /attributes/{id}` | ⏳ Pendente | Alta |
| `PATCH /attributes/{id}` | ⏳ Pendente | Alta |
| `GET /healthz` | ✅ Público | - |
| `POST /session/mock` | ✅ Público (dev only) | - |

---

## ❓ FAQ

### **1. Por que validar offline (JWT) ao invés de chamar API Supabase?**

✅ **Mais rápido** (sem chamada HTTP)  
✅ **Mais escalável** (não sobrecarrega Supabase)  
✅ **Mais confiável** (funciona mesmo se Supabase estiver lento)  

### **2. E se não tiver JWT_SECRET configurado?**

O sistema tenta validar via API Supabase (mais lento, mas funciona).

### **3. Posso usar em desenvolvimento sem Supabase?**

Sim! Configure `AUTH_ENABLED=false` no `.env`.

### **4. Como testar sem criar usuários no Supabase?**

Use o endpoint `/session/mock` (apenas em desenvolvimento).

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Instalar `supabase-py` e `pyjwt`
2. ✅ Configurar `.env` com credenciais
3. ✅ Proteger endpoint de exemplo (`/challenges/generate`)
4. ⏳ Proteger demais endpoints críticos
5. ⏳ Testar com token real do Supabase
6. ⏳ Remover endpoint `/session/mock` em produção

---

**Dúvidas?** Consulte a documentação do Supabase Auth:  
https://supabase.com/docs/guides/auth

