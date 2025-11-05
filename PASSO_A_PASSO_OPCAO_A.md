# 🎯 PASSO A PASSO - OPÇÃO A: Database Function

## ✅ **PASSO 1: Executar SQL no Supabase**

### 1.1 Acessar o SQL Editor
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **yiswjxgpvhjhonqnuyzp**
3. No menu lateral, clique em **SQL Editor**
4. Clique no botão **"+ New query"**

### 1.2 Copiar o SQL
Abra o arquivo:
```
backend/migrations/create_delete_user_function.sql
```

Copie **TODO o conteúdo** do arquivo.

### 1.3 Executar
1. Cole o SQL no editor
2. Clique no botão **"RUN"** (ou Ctrl+Enter)
3. Você deve ver: ✅ **"Success. No rows returned"**

---

## ✅ **PASSO 2: Reiniciar o Backend**

```bash
# Parar o backend (Ctrl+C)
# Depois iniciar novamente:
cd backend && uvicorn app.main:app --reload
```

---

## ✅ **PASSO 3: Testar**

### 3.1 Criar uma conta de teste
1. Acesse: http://localhost:5173/cadastro
2. Crie uma conta com um email temporário
3. Faça login

### 3.2 Deletar a conta
1. Vá para: http://localhost:5173/perfil
2. Role até o final da página
3. Clique em **"Excluir Minha Conta"**
4. Confirme no modal

### 3.3 Verificar
✅ Você foi deslogado automaticamente  
✅ Redirecionou para a landing page  
✅ **NÃO consegue mais fazer login** com aquele email  
✅ **Conta foi removida do Supabase**

---

## 🔍 **Como Verificar no Supabase**

1. Vá em **Authentication** → **Users**
2. Procure pelo email da conta que você deletou
3. Ela **NÃO deve aparecer mais na lista**

---

## ⚠️ **Troubleshooting**

### **Erro: "function does not exist"**
**Causa:** O SQL não foi executado no Supabase  
**Solução:** Execute o PASSO 1 novamente

### **Erro: "permission denied"**
**Causa:** A função não tem as permissões corretas  
**Solução:** Verifique se o SQL tem esta linha:
```sql
GRANT EXECUTE ON FUNCTION delete_user_data() TO authenticated;
```

### **Conta não é deletada mas não dá erro**
**Solução:** Verifique os logs do backend:
```bash
# Os logs vão mostrar o que aconteceu
# Procure por "Erro ao chamar delete_user_data"
```

---

## 📝 **O Que a Função SQL Faz**

```sql
1. Pega o ID do usuário logado (auth.uid())
2. Deleta desafios WHERE profile_id = user_id
3. Deleta submissões WHERE profile_id = user_id
4. Deleta atributos WHERE profile_id = user_id
5. Deleta o usuário de auth.users WHERE id = user_id
6. Retorna estatísticas do que foi deletado
```

---

## ✨ **Vantagens Desta Solução**

✅ **Confiável** - Roda no servidor do banco  
✅ **Atômico** - Tudo ou nada (transação)  
✅ **Seguro** - Usa auth.uid(), não pode deletar outro usuário  
✅ **Completo** - Deleta TUDO de uma vez  
✅ **Rastreável** - Retorna estatísticas do que foi deletado

---

## 🎉 **Resultado Final**

Após seguir estes passos:
- ✅ Usuário clica em "Excluir Conta"
- ✅ Todos os dados são deletados do banco
- ✅ Conta é removida do Supabase Auth
- ✅ Usuário é deslogado automaticamente
- ✅ Email fica livre para criar nova conta

**A exclusão está 100% funcional!** 🚀

