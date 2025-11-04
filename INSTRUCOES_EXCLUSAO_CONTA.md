# 🗑️ Instruções para Configurar Exclusão de Conta

## ✅ **Implementação Completa**

A funcionalidade de exclusão de conta foi adicionada à página de perfil com:
- ✅ Botão "Excluir Minha Conta" na seção "Zona de Perigo"
- ✅ Modal de confirmação com aviso de ação irreversível
- ✅ Lista do que será perdido permanentemente
- ✅ Integração com Supabase

---

## 🔧 **Configuração Necessária no Supabase**

Para que a exclusão funcione completamente, você precisa executar a função SQL no Supabase:

### **Passo 1: Acessar o SQL Editor**
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral

### **Passo 2: Executar o SQL**
Copie e execute o conteúdo do arquivo:
```
backend/migrations/add_delete_user_function.sql
```

### **Passo 3: Testar**
1. Faça login na aplicação
2. Vá para a página de perfil
3. Role até o final
4. Clique em "Excluir Minha Conta"
5. Confirme a exclusão
6. Verifique que a conta foi deletada do banco

---

## 🎯 **Como Funciona**

### **Frontend (`Profile.jsx`):**
```javascript
1. Usuário clica em "Excluir Minha Conta"
2. Modal de confirmação aparece
3. Ao confirmar:
   - Chama função `handleDeleteAccount()`
   - Executa `supabase.rpc('delete_user')`
   - Faz logout automático
   - Redireciona para landing page
```

### **Backend (Função SQL):**
```sql
1. Verifica se usuário está autenticado
2. Deleta dados relacionados:
   - Atributos (attributes)
   - Submissões (submissions)
   - Desafios (challenges)
3. Deleta o usuário da tabela auth.users
```

---

## ⚠️ **Comportamento Alternativo**

Se a função SQL **NÃO** estiver instalada:
- A conta será **marcada para exclusão** nos metadados
- O usuário será deslogado normalmente
- Uma mensagem informará que a solicitação foi registrada
- Você pode processar essas solicitações manualmente depois

---

## 🔐 **Segurança**

### **Proteções Implementadas:**
✅ **Modal de confirmação** - Evita exclusões acidentais  
✅ **Lista clara do que será perdido** - Usuário sabe exatamente o impacto  
✅ **Validação de autenticação** - Só o próprio usuário pode deletar  
✅ **Função SECURITY DEFINER** - Executa com privilégios seguros  
✅ **auth.uid()** - Garante que só deleta o próprio usuário

### **O que é deletado:**
- ❌ Conta do Supabase Auth
- ❌ Todos os atributos/skills
- ❌ Histórico de submissões
- ❌ Desafios criados
- ❌ Dados de perfil

---

## 🎨 **UI/UX**

### **Seção "Zona de Perigo":**
- Visualmente destacada em vermelho
- Título claro: "Ações irreversíveis"
- Aviso explícito sobre permanência
- Botão vermelho com hover

### **Modal de Confirmação:**
- Título dramático: "Tem certeza absoluta?"
- Lista em bullet points do que será perdido
- Texto enfatizando irreversibilidade
- Dois botões:
  - Cancelar (cinza) - Fecha o modal
  - Confirmar (vermelho) - Executa a exclusão

---

## 📝 **Ajustes Recomendados**

Se você tiver mais tabelas relacionadas ao usuário, adicione-as na função SQL:

```sql
-- Exemplo: Se você tiver uma tabela de favoritos
DELETE FROM favorites WHERE user_id = current_user_id;

-- Exemplo: Se você tiver uma tabela de notificações
DELETE FROM notifications WHERE user_id = current_user_id;
```

---

## 🧪 **Testando**

### **Teste 1: Exclusão Bem-Sucedida**
1. Crie uma conta de teste
2. Complete alguns desafios
3. Vá para o perfil
4. Clique em "Excluir Minha Conta"
5. Confirme
6. Verifique:
   - Redirecionou para `/`
   - Não consegue mais fazer login
   - Dados foram removidos do banco

### **Teste 2: Cancelamento**
1. Vá para o perfil
2. Clique em "Excluir Minha Conta"
3. Clique em "Cancelar"
4. Verifique:
   - Modal fechou
   - Nada foi deletado
   - Continua logado

### **Teste 3: Sem Função SQL**
1. Não execute o SQL de criação da função
2. Tente excluir a conta
3. Verifique:
   - Mensagem de "solicitação registrada"
   - Metadados foram atualizados com `account_deletion_requested: true`
   - Usuário foi deslogado

---

## 🚀 **Melhorias Futuras (Opcional)**

1. **Período de Graça:**
   - Marcar para exclusão por 30 dias
   - Permitir cancelamento antes da exclusão final
   - Email de confirmação

2. **Exportar Dados:**
   - Permitir download dos dados antes de deletar
   - Conformidade com LGPD/GDPR

3. **Confirmação por Email:**
   - Enviar email com link de confirmação
   - Deletar somente após clicar no link

4. **Audit Log:**
   - Registrar quem e quando solicitou exclusão
   - Útil para compliance e auditoria

---

## ✅ **Checklist de Implementação**

- [x] Botão de exclusão adicionado ao perfil
- [x] Modal de confirmação implementado
- [x] Função `handleDeleteAccount` criada
- [x] Integração com Supabase
- [x] Fallback para marcação de exclusão
- [x] Redirecionamento após exclusão
- [x] Arquivo SQL criado
- [ ] SQL executado no Supabase ← **VOCÊ PRECISA FAZER ISSO**
- [ ] Testado em ambiente de desenvolvimento
- [ ] Testado em ambiente de produção

---

**Implementado em:** 2 de novembro de 2025  
**Status:** ✅ Frontend completo | ⏳ Backend aguardando SQL

