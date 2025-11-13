# Correção do Fluxo de Onboarding

## 🎯 Problema Identificado

O sistema estava criando **dados mockados automaticamente** ao invés de direcionar o usuário para a tela de questionário no primeiro acesso. Isso acontecia porque:

1. O **trigger SQL** no Supabase criava `attributes` mockados automaticamente quando um novo usuário se registrava
2. O **Login** redirecionava direto para `/home` sem verificar se o usuário completou o onboarding
3. Não havia validação para diferenciar dados reais de dados mockados

## ✅ Solução Implementada

### 1. **Trigger SQL Atualizado** (Backend)
- **Arquivo**: `backend/migrations/update_profile_trigger_no_mock.sql`
- **O que faz**: Atualiza o trigger para criar **APENAS** o `profile`, sem criar `attributes` automaticamente
- **Resultado**: Novos usuários não terão attributes mockados

### 2. **Lógica de Redirecionamento no Login** (Frontend)
- **Arquivo**: `frontend/src/assets/pages/Login.jsx`
- **O que faz**: Após login bem-sucedido, verifica se o usuário tem `attributes` reais
- **Fluxo**:
  ```
  Login → Verificar attributes → 
    ├─ ❌ Não tem ou está vazio → /onboarding
    └─ ✅ Tem dados reais → /home
  ```

### 3. **Verificação no Home** (Frontend)
- **Arquivo**: `frontend/src/assets/pages/Home.jsx`
- **O que faz**: Redireciona para `/onboarding` se o usuário tentar acessar `/home` sem completar o onboarding
- **Previne**: Acesso direto à home sem dados completos

### 4. **Limpeza de Dados Mockados** (Backend)
- **Arquivo**: `backend/migrations/remove_mock_attributes.sql`
- **O que faz**: Remove `attributes` mockados de usuários existentes
- **Resultado**: Usuários antigos serão redirecionados para onboarding no próximo login

## 📋 Como Aplicar as Mudanças

### Passo 1: Atualizar o Trigger no Supabase

1. Acesse o **Supabase Dashboard** → SQL Editor
2. Execute o arquivo: `backend/migrations/update_profile_trigger_no_mock.sql`
3. Verifique se a mensagem de sucesso aparece

```sql
-- Você deve ver algo como:
-- CREATE OR REPLACE FUNCTION
-- DROP TRIGGER
-- CREATE TRIGGER
```

### Passo 2: Limpar Dados Mockados Existentes (Opcional mas Recomendado)

1. No **Supabase Dashboard** → SQL Editor
2. Execute o arquivo: `backend/migrations/remove_mock_attributes.sql`
3. Verifique quantos registros foram afetados:

```sql
SELECT COUNT(*) FROM public.attributes;
```

⚠️ **IMPORTANTE**: Se você tiver usuários com dados reais que precisam preservar, revise o script antes de executar!

### Passo 3: Frontend já está atualizado

As mudanças no frontend já foram aplicadas:
- ✅ `Login.jsx` agora verifica attributes antes de redirecionar
- ✅ `Home.jsx` redireciona para onboarding se necessário

Basta **reiniciar o servidor frontend** se estiver rodando:

```bash
cd frontend
npm run dev
```

## 🧪 Como Testar

### Teste 1: Novo Usuário

1. Registre um novo usuário em `/cadastro`
2. Confirme o email (se necessário)
3. Faça login em `/login`
4. **Esperado**: Ser redirecionado para `/onboarding`
5. Complete os questionários
6. **Esperado**: Ser redirecionado para `/home` com dados reais

### Teste 2: Usuário Existente com Dados Mockados

1. Execute a migration `remove_mock_attributes.sql`
2. Faça login com um usuário existente
3. **Esperado**: Ser redirecionado para `/onboarding`
4. Complete os questionários
5. **Esperado**: Dados mockados substituídos por dados reais

### Teste 3: Usuário com Dados Reais

1. Usuário que já completou o onboarding
2. Faça login
3. **Esperado**: Ir direto para `/home` sem passar pelo onboarding

## 🔍 Verificação no Banco de Dados

Para verificar o estado dos `attributes` no Supabase:

```sql
-- Ver todos os attributes
SELECT 
  p.full_name,
  p.email,
  CASE 
    WHEN a.user_id IS NULL THEN '❌ Sem attributes'
    ELSE '✅ Com attributes'
  END as status,
  a.career_goal,
  jsonb_array_length(a.tech_skills) as num_tech_skills,
  jsonb_array_length(a.soft_skills) as num_soft_skills
FROM public.profiles p
LEFT JOIN public.attributes a ON p.id = a.user_id
ORDER BY p.created_at DESC;
```

## 📊 Fluxo Completo do Sistema

```
┌─────────────┐
│  Cadastro   │
└──────┬──────┘
       │
       v
┌─────────────────────────┐
│ Trigger SQL             │
│ - Cria profile          │
│ - NÃO cria attributes   │
└──────┬──────────────────┘
       │
       v
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       v
┌────────────────────────┐
│ Verificar Attributes   │
└──────┬─────────────────┘
       │
       ├─── ❌ Não tem → Onboarding
       │                     │
       │                     v
       │              ┌──────────────┐
       │              │ Questionários│
       │              │ - Trilha     │
       │              │ - Hard Skills│
       │              │ - Soft Skills│
       │              └──────┬───────┘
       │                     │
       │                     v
       │              ┌──────────────┐
       │              │Criar/Atualizar│
       │              │  Attributes   │
       │              └──────┬────────┘
       │                     │
       └─── ✅ Tem ──────────┴──> Home
```

## 🚨 Troubleshooting

### Problema: Usuário continua vendo dados mockados

**Solução**:
1. Execute `remove_mock_attributes.sql` no Supabase
2. Faça logout e login novamente

### Problema: Erro 404 ao buscar attributes

**Solução**:
- Isso é esperado para novos usuários
- O frontend já trata esse erro e redireciona para onboarding

### Problema: Loop infinito entre Home e Onboarding

**Solução**:
1. Verifique se o `Onboarding.jsx` está salvando os attributes corretamente
2. Veja os logs do console do navegador
3. Verifique se a API está respondendo corretamente em `/attributes/{user_id}`

## 📝 Arquivos Modificados

### Backend
- ✅ `backend/migrations/update_profile_trigger_no_mock.sql` (novo)
- ✅ `backend/migrations/remove_mock_attributes.sql` (novo)

### Frontend
- ✅ `frontend/src/assets/pages/Login.jsx` (modificado)
- ✅ `frontend/src/assets/pages/Home.jsx` (modificado)

### Não Modificados (já funcionam corretamente)
- `frontend/src/assets/pages/Onboarding.jsx` (já implementado)
- `frontend/src/assets/pages/Cadastro.jsx` (já implementado)
- Questionários (Questionario_soft.jsx, Questionario_hard_*.jsx)

## ✨ Resultado Final

Após aplicar todas as mudanças:

1. ✅ Novos usuários são direcionados para o onboarding no primeiro login
2. ✅ Dados mockados não são mais criados automaticamente
3. ✅ Usuários existentes com dados mockados são redirecionados para onboarding
4. ✅ Sistema coleta dados reais através dos questionários
5. ✅ Attributes são alimentados com informações reais do usuário
6. ✅ Home só é acessível após completar o onboarding
