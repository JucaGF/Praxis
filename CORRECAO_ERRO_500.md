# Correção do Erro 500 ao Fazer Login

## 🐛 Problema

Ao fazer login com uma conta nova (após aplicar o trigger que não cria attributes automaticamente), o sistema estava:
1. Tentando buscar `attributes` no backend
2. Backend retornava **erro 500** (ao invés de 404)
3. Frontend tratava como erro de autenticação e fazia logout forçado
4. Resultado: **loop infinito** e mensagem confusa "Usuário não encontrado. Sessão limpa."

## 🔍 Causa Raiz

1. **Backend** (`repo_sql.py`): 
   - Lançava `ValueError` quando attributes não existia
   - Isso era tratado como erro 500 no endpoint
   
2. **Frontend** (`api.js`):
   - Tratava erro 500 como erro crítico de autenticação
   - Fazia logout automático e limpava sessão
   
3. **Frontend** (`Home.jsx`):
   - Não esperava erro 404, esperava que attributes sempre existisse
   - Não redirecionava corretamente para onboarding

## ✅ Solução Implementada

### 1. Backend - Retornar 404 ao invés de 500

**Arquivo**: `backend/app/infra/repo_sql.py`

```python
# ANTES (linha 179-180):
if not a:
    raise ValueError(
        f"Attributes não encontrados para profile_id: {profile_id}")

# DEPOIS:
if not a:
    from backend.app.domain.exceptions import AttributesNotFoundError
    raise AttributesNotFoundError(profile_id)
```

**Resultado**: Backend agora retorna **HTTP 404** quando attributes não existe (correto para recurso não encontrado)

### 2. Frontend - Tratar 404 corretamente

**Arquivo**: `frontend/src/assets/lib/api.js`

- Removido tratamento de erro 500 que fazia logout automático
- Adicionado tratamento específico para 404 (não é erro crítico)
- 404 agora lança erro normal, não `AuthenticationError`

```javascript
// 404: Recurso não encontrado (pode ser usuário novo sem attributes)
if (response.status === 404) {
  console.warn("⚠️ Recurso não encontrado (404):", errorMessage);
  const notFoundError = new Error(errorMessage);
  notFoundError.status = 404;
  throw notFoundError;
}
```

### 3. Frontend - Redirecionar para Onboarding no Home

**Arquivo**: `frontend/src/assets/pages/Home.jsx`

- Busca atributos dentro de try-catch específico
- Se receber 404, redireciona para `/onboarding`
- Não tenta mais fazer operações com attributes inexistente

```javascript
try {
  attributes = await fetchUser();
} catch (attrError) {
  // Se erro 404, redireciona para onboarding
  if (attrError.status === 404 || ...) {
    console.warn("⚠️ Attributes não encontrados (404). Redirecionando para onboarding...");
    navigate("/onboarding");
    return;
  }
  throw attrError;
}
```

## 🎯 Fluxo Corrigido

```
Novo Usuário
    ↓
Faz Login (Login.jsx)
    ↓
Verifica attributes via API
    ↓
Backend retorna 404 ✅
    ↓
Frontend detecta 404
    ↓
Redireciona para /onboarding ✅
    ↓
Usuário completa questionários
    ↓
Attributes são criados
    ↓
Redireciona para /home ✅
```

## 🧪 Como Testar

### 1. Aplicar as mudanças no backend

```bash
# Reiniciar o backend para carregar as mudanças no repo_sql.py
cd backend
# Se estiver usando Docker:
docker-compose restart backend

# Se estiver rodando localmente:
# Ctrl+C para parar o servidor
uvicorn app.main:app --reload
```

### 2. Aplicar o trigger no Supabase (se ainda não fez)

Execute no Supabase SQL Editor:
```sql
-- backend/migrations/update_profile_trigger_no_mock.sql
```

### 3. Testar com usuário novo

1. Registre um novo usuário em `/cadastro`
2. Confirme o email
3. Faça login em `/login`
4. **Esperado**: 
   - ✅ Ver log no console: "⚠️ Attributes não encontrados (404)"
   - ✅ Ser redirecionado para `/onboarding`
   - ❌ NÃO deve ver erro "Usuário não encontrado. Sessão limpa."
   - ❌ NÃO deve fazer logout automático

### 4. Testar com usuário que tem attributes

1. Complete o onboarding
2. Faça logout e login novamente
3. **Esperado**:
   - ✅ Ir direto para `/home`
   - ✅ Ver seus dados carregados normalmente

## 📊 Códigos HTTP Usados Corretamente

| Status | Significado | Quando usar |
|--------|-------------|-------------|
| 401 | Unauthorized | Token inválido ou ausente |
| 403 | Forbidden | Sem permissão (acessar dados de outro usuário) |
| 404 | Not Found | Recurso não existe (attributes não criado ainda) ✅ |
| 500 | Internal Error | Erro inesperado no servidor |

## 🔧 Arquivos Modificados

### Backend
- ✅ `backend/app/infra/repo_sql.py` - Usa `AttributesNotFoundError` ao invés de `ValueError`

### Frontend
- ✅ `frontend/src/assets/lib/api.js` - Tratamento correto de 404
- ✅ `frontend/src/assets/pages/Home.jsx` - Redireciona para onboarding em caso de 404
- ✅ `frontend/src/assets/pages/Login.jsx` - Verifica attributes antes de redirecionar

## ✨ Resultado Final

Após aplicar todas as correções:

1. ✅ **Novo usuário**: Login → Onboarding (sem erros)
2. ✅ **Usuário existente sem attributes**: Login → Onboarding
3. ✅ **Usuário com attributes**: Login → Home
4. ✅ **Sem mais loops infinitos**
5. ✅ **Sem logout automático indevido**
6. ✅ **Mensagens de erro claras no console**
7. ✅ **Códigos HTTP corretos (404 ao invés de 500)**
