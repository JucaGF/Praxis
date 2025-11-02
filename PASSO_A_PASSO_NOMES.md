# 🔧 Guia: Corrigir Problema de Nomes Não Salvos

## 📋 **Resumo do Problema**

Quando um usuário se cadastra, o nome é enviado para o Supabase Auth (`auth.users.raw_user_meta_data`), mas não é copiado automaticamente para a tabela `profiles.full_name`.

---

## ✅ **Solução**

Criar um **trigger SQL** que automaticamente cria e preenche o perfil quando um novo usuário se registra.

---

## 🚀 **Passos para Resolver**

### **1️⃣ Criar o Trigger (para novos usuários)**

**Arquivo:** `backend/migrations/create_profile_trigger.sql`

1. Abra o **Supabase SQL Editor**
2. Copie **TODO** o conteúdo de `backend/migrations/create_profile_trigger.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou Ctrl+Enter)

✅ **O que isso faz:**
- Cria um trigger que executa automaticamente quando alguém se registra
- Copia o nome de `auth.users.raw_user_meta_data` para `profiles.full_name`
- Novos usuários terão perfis criados automaticamente

---

### **2️⃣ Corrigir Usuários Existentes (sem perfil)**

**Arquivo:** `backend/migrations/fix_existing_users.sql`

1. No **Supabase SQL Editor**
2. Copie o conteúdo de `backend/migrations/fix_existing_users.sql`
3. Cole e clique em **Run**

✅ **O que isso faz:**
- Cria perfis para usuários que existem em `auth.users` mas não em `profiles`
- Útil se você tem usuários antigos sem perfil

---

### **3️⃣ Atualizar Nomes Vazios (perfis existentes)**

**Arquivo:** `backend/migrations/update_empty_names.sql`

1. No **Supabase SQL Editor**
2. Copie o conteúdo de `backend/migrations/update_empty_names.sql`
3. Cole e clique em **Run**

✅ **O que isso faz:**
- Atualiza perfis que já existem mas têm `full_name` NULL ou vazio
- Pega o nome de `auth.users.raw_user_meta_data` e copia para `profiles.full_name`

---

## 🧪 **Testar**

### **Teste 1: Cadastro Novo**
1. Crie uma nova conta no frontend
2. Preencha o nome no formulário
3. Verifique no Supabase:
   - Tabela `profiles` → deve ter um registro com `full_name` preenchido

### **Teste 2: Usuários Existentes**
1. Verifique os usuários antigos no Supabase
2. Tabela `profiles` → todos devem ter `full_name` preenchido

---

## 📊 **Verificar no Supabase**

No **Supabase SQL Editor**, execute:

```sql
-- Ver todos os perfis e seus nomes
SELECT 
  p.id,
  p.full_name,
  p.email,
  u.raw_user_meta_data->>'full_name' AS metadata_full_name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.email;
```

---

## ⚠️ **Ordem de Execução**

**IMPORTANTE:** Execute os scripts nesta ordem:

1. ✅ `create_profile_trigger.sql` (cria o trigger)
2. ✅ `fix_existing_users.sql` (corrige usuários sem perfil)
3. ✅ `update_empty_names.sql` (atualiza nomes vazios)

---

## 🎯 **Resultado Final**

Depois de executar todos os scripts:

- ✅ Novos cadastros criarão perfis automaticamente com o nome
- ✅ Usuários existentes terão perfis criados
- ✅ Nomes vazios serão preenchidos
- ✅ O problema está 100% resolvido

---

**Me avise quando executar os scripts para confirmarmos que está tudo funcionando!** 🚀

