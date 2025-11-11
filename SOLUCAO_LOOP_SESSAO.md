# 🚨 Solução para Loop de Sessão / Usuário Deletado

## 🔍 Problema

Você está vendo este problema:
- Apagou um usuário diretamente do Supabase (via dashboard)
- Mas ainda está "logado" na aplicação
- Fica preso em loop de redirecionamento entre `/home` → `/onboarding` → `/home`
- Não consegue fazer logout normalmente

## 🎯 Causa Raiz

Quando você apaga um usuário diretamente do Supabase:
1. O usuário é removido da tabela `auth.users`
2. **MAS** a sessão local (token JWT) ainda existe no navegador
3. O navegador envia esse token nas requisições
4. O token ainda é válido tecnicamente, mas o usuário não existe mais
5. A aplicação detecta que não há atributos → redireciona para onboarding
6. O onboarding tenta salvar → falha (usuário não existe) → loop infinito

## ✅ Soluções Implementadas

### 1. **Solução Imediata: Página de Force Logout** 🚪

Acesse diretamente no navegador:

```
http://localhost:5173/force-logout
```

Ou em produção:
```
https://seu-dominio.com/force-logout
```

**O que esta página faz:**
- ✅ Faz logout do Supabase
- ✅ Limpa `localStorage` completamente
- ✅ Limpa `sessionStorage` completamente  
- ✅ Tenta limpar cookies
- ✅ Redireciona para a landing page

**Quando usar:**
- Você apagou sua conta do Supabase diretamente
- Está preso em loop de redirecionamento
- O botão normal de "Sair" não funciona
- A sessão parece corrompida

### 2. **Detecção Automática de Usuário Deletado** 🤖

Agora a aplicação detecta automaticamente quando:
- O usuário foi deletado do Supabase
- A sessão é inválida ou corrompida
- Há erro 401 (Unauthorized)

**Arquivos modificados:**

#### `Home.jsx`
- Verifica se o usuário existe ANTES de buscar dados
- Detecta erro 401 e faz logout automático
- Evita loop de redirecionamento

#### `Onboarding.jsx`  
- Verifica se o usuário existe antes de salvar
- Trata erros de autenticação com logout automático
- Mostra botão de "Forçar Logout" em caso de erro

## 📋 Como Usar - Passo a Passo

### Para o seu problema ATUAL:

1. **Abra o navegador em modo anônimo/privado** (Ctrl+Shift+N no Chrome)
   - OU acesse: `http://localhost:5173/force-logout`

2. **Clique em "Limpar Sessão Agora"**
   - Aguarde a confirmação ✅
   - Você será redirecionado automaticamente

3. **Crie uma nova conta:**
   - Vá para `/cadastro`
   - Crie um novo usuário
   - Complete o onboarding normalmente

### Se ainda não funcionar:

**Limpar dados do navegador manualmente:**

#### Chrome/Edge:
1. Pressione `F12`
2. Vá em `Application` (ou `Aplicativo`)
3. No menu lateral: `Storage` → `Clear site data`
4. Clique em `Clear site data`

#### Firefox:
1. Pressione `F12`
2. Vá em `Storage` (ou `Armazenamento`)
3. Clique direito em cada item → `Delete All`

#### Safari:
1. Menu `Develop` → `Empty Caches`
2. `Preferences` → `Privacy` → `Manage Website Data` → Remover

## 🔐 Melhores Práticas (Para Evitar Isso)

### ❌ NUNCA faça:
```
Deletar usuário diretamente do Supabase Dashboard
```

### ✅ SEMPRE faça:
```
Use o botão "Excluir Conta" na página /perfil
```

**Por quê?**
- O endpoint `/account/delete` do backend:
  1. Deleta o perfil (trigger limpa dados relacionados)
  2. Deleta o usuário de `auth.users` via Admin API
  3. Faz logout automático localmente
  4. Redireciona para landing page
  5. Tudo isso de forma SINCRONIZADA

## 🧪 Testando

Para testar se as correções funcionam:

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn backend.app.main:app --reload

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### Cenário de Teste:

1. **Login normal** → deve funcionar ✅
2. **Deletar usuário do Supabase Dashboard** → simula o problema ⚠️
3. **Tentar acessar /home** → deve detectar e fazer logout automático ✅
4. **Ou acessar /force-logout** → deve limpar sessão manualmente ✅

## 📝 Arquivos Modificados

```
frontend/src/assets/pages/
├── Home.jsx              # Detecção automática de usuário deletado
├── Onboarding.jsx        # Tratamento de erro + botão force logout
└── ForceLogout.jsx       # ⭐ NOVO: Página de emergência

frontend/src/App.jsx      # Nova rota /force-logout
```

## 🐛 Debug

Se você ainda estiver tendo problemas, verifique o console do navegador:

```javascript
// Deve aparecer uma destas mensagens:
⚠️ Usuário não encontrado ou sessão inválida. Fazendo logout...
⚠️ Erro de autenticação detectado. Limpando sessão...
✅ Usuário autenticado: [user-id]
```

## 📞 Suporte

Se nada disso resolver:

1. Abra o console do navegador (F12)
2. Copie TODOS os logs (principalmente os que começam com ⚠️ ou ❌)
3. Verifique se há erros de rede na aba `Network`
4. Compartilhe os logs para análise

## 🎉 Resumo

### ✅ O que foi corrigido:
- Detecção automática de usuário deletado
- Logout automático em caso de erro 401
- Página de emergência para forçar logout
- Melhor tratamento de erros no onboarding

### ✅ Como resolver SEU problema AGORA:
1. Acesse `http://localhost:5173/force-logout`
2. Clique em "Limpar Sessão Agora"
3. Crie uma nova conta normalmente

### ✅ Como evitar no futuro:
- Sempre use o botão "Excluir Conta" em `/perfil`
- Nunca delete usuários diretamente do Supabase Dashboard

