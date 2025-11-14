# 🔧 Correção: Skills Não Selecionadas Aparecendo no Perfil

## 📋 Problema Identificado

O usuário reportou dois problemas relacionados:

1. **Skills não selecionadas** estão aparecendo no perfil
2. **Skill específica** "Deixo comentários claros e úteis no código" está aparecendo, mesmo não tendo sido selecionada

### Exemplo de Skills Indesejadas
- "Deixo comentários claros e úteis no código" (existe no questionário, mas não foi selecionada)
- Outras skills que não foram escolhidas durante o onboarding

## 🔍 Causa Raiz

### Problema 1: Merge de Skills Antigas (Mockadas)

**Arquivo:** `backend/app/infra/repo_sql.py` (linhas 241-249)

O código estava fazendo **merge** (mesclagem) das skills antigas com as novas:

```python
# ❌ CÓDIGO ANTIGO (PROBLEMA)
if "soft_skills" in patch and patch["soft_skills"]:
    a.soft_skills = {**(a.soft_skills or {}), **patch["soft_skills"]}
```

**O que acontecia:**
1. Usuário se cadastrava → Trigger criava atributos **mockados** automaticamente
2. Usuário completava onboarding → Skills reais eram **mescladas** com as mockadas
3. Resultado: Skills mockadas + Skills reais apareciam juntas no perfil

### Problema 2: Skill Existe no Questionário

**Arquivo:** `frontend/src/assets/pages/Questionario_soft.jsx` (linha 23)

A skill "Deixo comentários claros e úteis no código" **existe** no questionário:

```javascript
{
  categoria: "Comunicação",
  icone: "💬",
  questoes: [
    "Consigo explicar problemas técnicos para pessoas não técnicas",
    "Deixo comentários claros e úteis no código",  // ← Aqui!
    "Escrevo mensagens estruturadas em equipes de desenvolvimento",
  ],
}
```

**Possíveis causas:**
- Skill foi adicionada ao questionário **depois** que você fez o cadastro
- Você tinha atributos mockados que incluíam essa skill
- Houve merge com dados antigos

## ✅ Solução Implementada

### 1. Correção no Backend: Substituição em vez de Merge

**Arquivo:** `backend/app/infra/repo_sql.py`

**Mudança:**
```python
# ✅ CÓDIGO NOVO (CORRIGIDO)
if "soft_skills" in patch and patch["soft_skills"]:
    # ⚠️ SUBSTITUIÇÃO COMPLETA (não merge) para evitar skills mockadas antigas
    a.soft_skills = patch["soft_skills"]

if "tech_skills" in patch and patch["tech_skills"]:
    # ⚠️ SUBSTITUIÇÃO COMPLETA (não merge) para evitar skills mockadas antigas
    a.tech_skills = patch["tech_skills"]

if "strong_skills" in patch and patch["strong_skills"]:
    # ⚠️ SUBSTITUIÇÃO COMPLETA (não merge) para evitar skills mockadas antigas
    a.strong_skills = patch["strong_skills"]
```

**Impacto:**
- ✅ Novos onboardings: Skills serão **substituídas completamente**
- ✅ Não haverá mais merge com skills mockadas antigas
- ✅ Apenas as skills selecionadas no questionário aparecerão

### 2. Script SQL para Limpar Dados Existentes

**Arquivo:** `backend/migrations/fix_user_mock_skills.sql`

Criado script com **3 opções** para limpar skills mockadas:

#### Opção 1: Limpar Apenas Soft Skills Mockadas
```sql
-- Identifica soft_skills no formato mockado (array)
SELECT 
  user_id,
  jsonb_typeof(soft_skills) as soft_skills_type,
  soft_skills
FROM public.attributes
WHERE jsonb_typeof(soft_skills) = 'array';
```

#### Opção 2: Resetar Completamente os Atributos (RECOMENDADO)
```sql
-- Remove todos os atributos para refazer onboarding
DELETE FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';
```

#### Opção 3: Remover Skills Específicas (Cirúrgico)
```sql
-- Remove apenas a skill indesejada
UPDATE public.attributes
SET soft_skills = soft_skills - 'Deixo comentários claros e úteis no código'
WHERE user_id = 'SEU_USER_ID_AQUI';
```

## 🎯 Como Resolver Para o Usuário Atual

### Passo 1: Descobrir seu User ID

Execute no **Supabase SQL Editor**:

```sql
SELECT 
  p.id as user_id,
  p.email,
  p.full_name
FROM public.profiles p
ORDER BY p.email;
```

Copie o `user_id` correspondente ao seu email.

### Passo 2: Verificar Skills Atuais

```sql
-- Ver soft_skills
SELECT 
  user_id,
  jsonb_pretty(soft_skills) as soft_skills,
  jsonb_typeof(soft_skills) as tipo
FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';

-- Ver tech_skills
SELECT 
  user_id,
  jsonb_pretty(tech_skills) as tech_skills
FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';
```

### Passo 3: Limpar Atributos Mockados

**Recomendação: OPÇÃO 2 (Resetar Tudo)**

```sql
DELETE FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';
```

### Passo 4: Refazer Onboarding

1. Faça logout da aplicação
2. Faça login novamente
3. Você será redirecionado automaticamente para `/onboarding`
4. Complete os questionários novamente
5. Desta vez, **apenas as skills selecionadas** serão salvas (sem merge!)

## 📊 Comparação: Antes vs Depois

### Antes (❌)
```json
{
  "soft_skills": {
    // Skills mockadas (do trigger antigo)
    "Comunicação": 50,
    "Trabalho em Equipe": 70,
    "Adaptabilidade": 40,
    
    // Skills reais (do questionário)
    "Consigo explicar problemas técnicos...": 80,
    "Divido tarefas em pequenas etapas...": 65
  }
}
```

### Depois (✅)
```json
{
  "soft_skills": {
    // APENAS skills reais (do questionário)
    "Consigo explicar problemas técnicos...": 80,
    "Divido tarefas em pequenas etapas...": 65,
    "Planejo minhas atividades semanalmente": 70
  }
}
```

## 🧪 Como Testar

### 1. Testar com Novo Usuário
```bash
# Criar novo usuário
# Completar onboarding
# Verificar que apenas skills selecionadas aparecem
```

### 2. Testar com Usuário Existente
```bash
# Limpar atributos via SQL (Passo 3 acima)
# Fazer login
# Refazer onboarding
# Verificar que apenas skills selecionadas aparecem
```

### 3. Verificar no Frontend
- Abrir `/profile`
- Verificar seção "Habilidades Interpessoais"
- Confirmar que **não há** skills não selecionadas
- Confirmar que **não há** "Deixo comentários claros e úteis no código" (se você não selecionou)

## 📝 Notas Técnicas

### Por que o Merge Era Usado?

O merge foi implementado inicialmente para permitir **atualizações parciais** de skills:
- Usuário poderia atualizar apenas algumas skills sem perder as outras
- Útil para updates incrementais via API

**Problema:** Não distinguia entre skills mockadas e reais.

### Por que Mudamos para Substituição?

1. **Onboarding é completo**: O questionário sempre envia **todas** as skills de uma vez
2. **Não há updates parciais**: Usuário não atualiza skills individualmente via UI
3. **Evita contaminação**: Skills mockadas não se misturam com reais

### E se Precisarmos de Updates Parciais no Futuro?

Se no futuro implementarmos uma feature de "editar skills individualmente":

**Opção A:** Adicionar flag no payload
```python
if patch.get("merge_mode", False):
    a.soft_skills = {**(a.soft_skills or {}), **patch["soft_skills"]}
else:
    a.soft_skills = patch["soft_skills"]
```

**Opção B:** Endpoint separado
```python
@router.patch("/{profile_id}/skills/add")  # Merge
@router.put("/{profile_id}/skills")        # Replace
```

## 🔄 Impacto em Outros Sistemas

### Geração de Desafios
- ✅ Não afetado
- Desafios são gerados com base nas skills existentes
- Com skills limpas, desafios serão mais relevantes

### Avaliação de Submissões
- ✅ Não afetado
- Avaliações atualizam skills existentes (via `update_tech_skills`/`update_soft_skills`)
- Não criam skills novas

### Profile Display
- ✅ Melhorado
- Apenas skills reais serão exibidas
- UI mais limpa e precisa

## 📚 Arquivos Modificados

```
backend/app/infra/repo_sql.py
  - Linhas 241-249: Mudança de merge para substituição completa

backend/migrations/fix_user_mock_skills.sql
  - Novo arquivo: Script SQL para limpar skills mockadas de usuários existentes
```

## 🚀 Próximos Passos

### Para o Usuário Atual (Joaquim)
1. ✅ Executar script SQL para limpar atributos
2. ✅ Refazer onboarding
3. ✅ Verificar que skills estão corretas

### Para Novos Usuários
- ✅ Correção já aplicada
- ✅ Novos cadastros não terão o problema

### Para Usuários Existentes (Se Houver)
- ⏳ Avaliar se há outros usuários afetados
- ⏳ Executar script de limpeza em massa (se necessário)
- ⏳ Notificar usuários para refazer onboarding (se aplicável)

---

**Status:** ✅ Implementado  
**Data:** 2024-11-14  
**Testado:** ⏳ Pendente (aguardando limpeza de dados do usuário)

