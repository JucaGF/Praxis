# 🔧 Resolver "Olá, Usuário" e Skills Não Aparecem

## 📋 **Diagnóstico**

Você está vendo:
- ❌ "Olá, Usuário" em vez do seu nome
- ❌ Skills genéricas ou nenhuma skill
- ❌ Dados não carregam corretamente

## ✅ **Solução Rápida (Opção 1): Botão Automático**

1. **Recarregue a página** com Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
2. Se aparecer uma tela dizendo **"Dados não encontrados"**, clique no botão:
   ```
   Criar Dados Mockados
   ```
3. A página vai recarregar automaticamente com os dados criados

---

## ✅ **Solução Manual (Opção 2): Via Backend**

Se o botão não funcionar, use o terminal:

```bash
# No terminal, execute:
curl -X POST http://localhost:8000/dev/setup-mock-data \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Como pegar o token:**
1. Abra o Console do navegador (F12)
2. Cole e execute:
```javascript
(await supabase.auth.getSession()).data.session.access_token
```
3. Copie o token que aparecer
4. Substitua `SEU_TOKEN_AQUI` no comando curl

---

## ✅ **Solução Definitiva (Opção 3): Executar os Triggers SQL**

Se você **ainda não executou** os scripts SQL que criamos:

### **1. Execute o Trigger de Perfil + Atributos**

No **Supabase SQL Editor**:

```sql
-- Copie TODO o conteúdo de:
backend/migrations/create_profile_trigger.sql

-- Cole no SQL Editor e clique em Run
```

### **2. Execute o Script para Usuários Existentes**

```sql
-- Copie TODO o conteúdo de:
backend/migrations/add_mock_attributes_existing_users.sql

-- Cole no SQL Editor e clique em Run
```

---

## 🧪 **Verificar se Funcionou**

No **Supabase SQL Editor**, execute:

```sql
-- Ver seus dados
SELECT 
  p.id,
  p.full_name,
  p.email,
  a.career_goal,
  jsonb_pretty(a.tech_skills) as tech_skills
FROM public.profiles p
JOIN public.attributes a ON p.id = a.user_id
WHERE p.email = 'SEU_EMAIL_AQUI';
```

Substitua `SEU_EMAIL_AQUI` pelo seu email.

**Deve retornar:**
- ✅ Seu nome (`full_name`)
- ✅ Sua trilha de carreira (`career_goal`)
- ✅ 4 tech skills mockadas

---

## 🔍 **Se Ainda Não Funcionar**

**Abra o Console do navegador** (F12 → Console) e me envie:

1. Todas as mensagens que aparecerem
2. Especialmente as que começam com:
   - `📊 Dados recebidos da API:`
   - `✅ Dados transformados:`
   - `❌ Erro detalhado:`

---

## 📞 **Dica Rápida**

**Se você acabou de criar a conta e executou os SQLs:**
- Faça **logout**
- Crie uma **nova conta** do zero
- O trigger vai criar os dados automaticamente
- Você verá seu nome e skills corretas imediatamente

---

**Tente a Opção 1 primeiro (botão automático)!** 🚀

