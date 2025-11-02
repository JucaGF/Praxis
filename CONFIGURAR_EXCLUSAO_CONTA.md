# 🔧 CONFIGURAR EXCLUSÃO DE CONTA

## ⚠️ **IMPORTANTE: Configuração Necessária**

A exclusão de conta está implementada, mas requer configuração da **Service Role Key** do Supabase.

---

## 📋 **Passo 1: Obter Service Role Key**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Project Settings** → **API**
4. Role até encontrar **Project API keys**
5. Copie a chave **`service_role`** (⚠️ NÃO é a "anon public")

**Exemplo:**
```
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

---

## 📋 **Passo 2: Adicionar no `.env`**

Abra o arquivo `backend/.env` e adicione:

```env
# Service Role Key (para operações admin - NUNCA exponha no frontend!)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Seu `.env` deve ficar assim:**
```env
DATABASE_URL="postgresql://..."
SUPABASE_URL=https://yiswjxgpvhjhonqnuyzp.supabase.co
SUPABASE_KEY=eyJhbGci...  # anon public key
SUPABASE_JWT_SECRET=U/3Ya/FpdA...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # ← ADICIONE ESTA LINHA
AUTH_ENABLED=true
```

---

## 📋 **Passo 3: Reiniciar o Backend**

```bash
# Parar o backend atual (Ctrl+C)
# Iniciar novamente
cd backend && uvicorn app.main:app --reload
```

---

## ✅ **Testar**

1. Faça login na aplicação
2. Vá para `/perfil`
3. Role até o final da página
4. Clique em **"Excluir Minha Conta"**
5. Confirme no modal
6. Verifique que:
   - Você foi deslogado
   - Não consegue mais fazer login
   - A conta foi removida do Supabase

---

## 🔐 **Como Funciona Agora**

### **Fluxo Completo:**

```
1. Usuário clica em "Excluir Minha Conta"
        ↓
2. Modal de confirmação aparece
        ↓
3. Ao confirmar → Frontend chama: DELETE /account/delete
        ↓
4. Backend (com service_role_key):
   - Deleta desafios do usuário
   - Deleta usuário do Supabase Auth
   - Retorna sucesso
        ↓
5. Frontend:
   - Faz logout local
   - Redireciona para landing page
```

### **No Backend (`/account/delete`):**
- ✅ Endpoint protegido (requer token)
- ✅ Valida que é o próprio usuário
- ✅ Deleta desafios do banco de dados
- ✅ Usa `supabase.auth.admin.delete_user()` com service role key
- ✅ Logs detalhados de cada etapa

### **No Frontend:**
- ✅ Chama o endpoint do backend via `deleteAccount()`
- ✅ Faz logout após sucesso
- ✅ Redireciona para home
- ✅ Mostra erros se algo falhar

---

## ⚠️ **Segurança**

### **Por que Service Role Key?**
A Service Role Key tem privilégios **administrativos** no Supabase:
- Pode deletar usuários
- Pode acessar qualquer dado
- Bypassa Row Level Security (RLS)

### **Proteções Implementadas:**
✅ **NUNCA exposta no frontend** - Apenas no backend  
✅ **Endpoint protegido** - Requer token JWT válido  
✅ **Validação de permissão** - Só deleta o próprio usuário  
✅ **Logs detalhados** - Auditoria de todas as exclusões

---

## 🐛 **Troubleshooting**

### **Erro: "SUPABASE_SERVICE_ROLE_KEY não configurada"**
**Solução:** Adicione a chave no `backend/.env` e reinicie o backend

### **Erro: "Erro ao deletar conta do sistema de autenticação"**
**Possíveis causas:**
1. Service Role Key incorreta
2. Usuário já foi deletado
3. Problemas de conexão com Supabase

**Solução:** Verifique os logs do backend para detalhes

### **Conta não é deletada mas não dá erro**
**Solução:** Verifique se:
1. Service Role Key está correta
2. Backend foi reiniciado após adicionar a chave
3. Logs do backend mostram algum erro

---

## 📝 **Próximos Passos (Opcional)**

1. **Adicionar soft delete:**
   - Marcar usuário como deletado
   - Deletar permanentemente após 30 dias

2. **Limpar dados órfãos:**
   - Adicionar métodos `delete_attributes()` e `delete_submissions()` no repositório
   - Deletar esses dados junto com a conta

3. **Email de confirmação:**
   - Enviar email antes de deletar
   - Permitir cancelamento

---

## ✅ **Checklist**

- [ ] Obtive a Service Role Key do Supabase
- [ ] Adicionei `SUPABASE_SERVICE_ROLE_KEY` no `backend/.env`
- [ ] Reiniciei o backend
- [ ] Testei excluir uma conta de teste
- [ ] Verifiquei que a conta foi removida do Supabase
- [ ] Verifiquei que não consigo mais fazer login

---

**Configuração criada em:** 2 de novembro de 2025  
**Status:** ⏳ Aguardando configuração da Service Role Key

