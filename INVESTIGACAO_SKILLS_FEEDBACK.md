# 🔍 Investigação: Skills Avaliadas no Feedback

## 📋 Problema Reportado

O usuário suspeita que os feedbacks dos desafios estão:
1. **Avaliando skills que o usuário não possui**
2. **Avaliando skills que nem existem em geral**

## 🎯 O Que Pode Estar Acontecendo

### Cenário 1: IA Criando Skills Novas
A IA pode estar **inventando nomes de skills** diferentes dos especificados no desafio.

**Exemplo:**
- Desafio especifica: `["Python", "FastAPI", "SQL"]`
- IA avalia: `["Python", "APIs REST", "Banco de dados"]` ❌

### Cenário 2: IA Avaliando Skills Não Especificadas
A IA pode estar avaliando skills que **não estão** em `affected_skills` do desafio.

**Exemplo:**
- Desafio especifica: `["Python", "FastAPI"]`
- IA avalia: `["Python", "FastAPI", "Docker", "Git"]` ❌

### Cenário 3: Desafios Antigos Sem `affected_skills`
Desafios criados antes da atualização podem não ter `affected_skills` definido.

**Exemplo:**
```json
{
  "description": {
    "target_skill": "Python",
    "affected_skills": null  // ❌ Não definido
  }
}
```

### Cenário 4: Skills Avaliadas Não Pertencem ao Usuário
A IA avalia uma skill que **não existe** no perfil do usuário (`tech_skills` ou `soft_skills`).

**Exemplo:**
- Usuário tem: `{"Python": 70, "JavaScript": 60}`
- IA avalia: `{"Python": 80, "TypeScript": 75}` ❌ (TypeScript não existe)

## 🔍 Como o Sistema Funciona Atualmente

### 1. Geração do Desafio
```python
# backend/app/infra/ai_gemini.py (linha 241)
"affected_skills": ["Skill1", "Skill2", "Skill3"]
```

A IA **deve** gerar 2-4 skills que o desafio avalia.

### 2. Avaliação da Submissão
```python
# backend/app/infra/ai_gemini.py (linhas 636-718)
affected_skills_str = ", ".join(affected_skills)

assessment_instructions = f"""
O desafio avalia estas skills: {affected_skills_str}

DEVE avaliar TODAS as skills em: {affected_skills_str}
"""
```

A IA **recebe** a lista de skills que deve avaliar.

### 3. Processamento da Progressão
```python
# backend/app/domain/services.py (linhas 270-276)
for skill_name in affected_skills:
    if skill_name not in skills_assessment:
        logger.warning(f"Skill '{skill_name}' não tem assessment da IA, pulando")
        continue
    
    skill_atual = current_skills.get(skill_name, 50)  # ⚠️ Default 50 se não existe!
```

**Problema identificado:** Se a skill **não existe** no perfil do usuário, o sistema usa **valor padrão 50** e **cria a skill automaticamente**!

## ⚠️ Problema Confirmado

Na **linha 276** de `backend/app/domain/services.py`:

```python
skill_atual = current_skills.get(skill_name, 50)  # Default 50 se não existe
```

E na **linha 290**:

```python
current_skills[skill_name] = new_value  # ⚠️ CRIA a skill se não existir!
```

**Isso significa:**
- ✅ Se a IA avaliar uma skill que o usuário **não possui**, ela será **criada automaticamente** com valor inicial 50
- ❌ Não há validação se a skill avaliada faz sentido para o usuário
- ❌ Não há validação se a skill avaliada está em `affected_skills`

## 🧪 Como Investigar

### Script de Análise

Criei o script `backend/scripts/check_skill_mismatches.py` que verifica:

1. ✅ Skills avaliadas que **não estão** no desafio (`affected_skills`)
2. ✅ Skills do desafio que **não foram avaliadas** pela IA
3. ✅ Skills avaliadas que o usuário **não possui**

### Como Executar

```bash
cd /home/joaquim/Projects/Praxis

# Ativar ambiente virtual (se usar)
# source venv/bin/activate

# Executar script
python backend/scripts/check_skill_mismatches.py
```

### Output Esperado

```
🔍 Analisando 15 submissions avaliadas...

================================================================================

❌ SUBMISSION #42 (Challenge #12)
   Título: Corrigir Bug no Login
   Categoria: code
   Usuário: abc-123-def

   ⚠️  Skills AVALIADAS mas NÃO estão no desafio:
      • Debugging
      • Testes unitários

   ⚠️  Skills do DESAFIO que NÃO foram avaliadas:
      • FastAPI

   ⚠️  Skills AVALIADAS que o usuário NÃO possui:
      • Debugging (tech: False, soft: False)

   📊 Resumo:
      Skills esperadas: Python, FastAPI, Pydantic
      Skills avaliadas: Python, Pydantic, Debugging, Testes unitários
      Skills do usuário (tech): 8
      Skills do usuário (soft): 9

--------------------------------------------------------------------------------

================================================================================
📊 RESUMO FINAL
================================================================================
Total de submissions analisadas: 15
Submissions com problemas: 3
Skills extras avaliadas (não no desafio): 5
Skills do desafio não avaliadas: 2

⚠️  Encontrados 3 casos com problemas de skills.
```

## ✅ Soluções Propostas

### Solução 1: Validação Estrita (RECOMENDADA)

**Arquivo:** `backend/app/domain/services.py`

```python
# Linha 270 - Adicionar validação
for skill_name in affected_skills:
    # Pula se não tiver assessment da IA para essa skill
    if skill_name not in skills_assessment:
        logger.warning(f"Skill '{skill_name}' não tem assessment da IA, pulando")
        continue
    
    # ✅ NOVA VALIDAÇÃO: Pula se usuário não possui essa skill
    if skill_name not in current_skills:
        logger.warning(
            f"Skill '{skill_name}' não existe no perfil do usuário, pulando. "
            f"Skills disponíveis: {list(current_skills.keys())}"
        )
        continue
    
    skill_atual = current_skills.get(skill_name)  # Agora garantido que existe
```

**Vantagens:**
- ✅ Não cria skills novas automaticamente
- ✅ Apenas atualiza skills que o usuário já possui
- ✅ Logs claros quando há mismatch

**Desvantagens:**
- ⚠️ Se o desafio especificar uma skill que o usuário não tem, ela não será atualizada

### Solução 2: Validação no Prompt da IA

**Arquivo:** `backend/app/infra/ai_gemini.py`

Adicionar ao prompt de avaliação:

```python
# Linha 640 - Buscar skills do usuário
user_tech_skills = repo.get_tech_skills(profile_id)
user_soft_skills = repo.get_soft_skills(profile_id)
user_all_skills = list(user_tech_skills.keys()) + list(user_soft_skills.keys())

assessment_instructions = f"""
TAREFA DE AVALIAÇÃO:

⚠️ IMPORTANTE: O usuário possui as seguintes skills:
{', '.join(user_all_skills)}

Você DEVE avaliar APENAS as skills que:
1. Estão em affected_skills: {affected_skills_str}
2. E existem no perfil do usuário

NÃO invente nomes novos de skills!
NÃO avalie skills que o usuário não possui!
"""
```

**Vantagens:**
- ✅ IA recebe contexto completo
- ✅ Menos chance de criar skills novas
- ✅ Validação preventiva

**Desvantagens:**
- ⚠️ Aumenta tamanho do prompt
- ⚠️ IA ainda pode ignorar instruções

### Solução 3: Validação Pós-IA

**Arquivo:** `backend/app/domain/services.py`

```python
# Linha 620 - Após receber skills_assessment da IA
if affected_skills and skills_assessment:
    # ✅ VALIDAÇÃO: Remove skills que não estão em affected_skills
    validated_assessment = {}
    for skill_name, assessment in skills_assessment.items():
        if skill_name in affected_skills:
            validated_assessment[skill_name] = assessment
        else:
            logger.warning(
                f"IA avaliou skill '{skill_name}' que não está em affected_skills. "
                f"Ignorando. Esperado: {affected_skills}"
            )
    
    skills_assessment = validated_assessment
```

**Vantagens:**
- ✅ Filtra skills inválidas antes de processar
- ✅ Logs claros de skills ignoradas
- ✅ Não depende da IA seguir instruções

**Desvantagens:**
- ⚠️ Pode descartar avaliações úteis se houver typo

### Solução 4: Criar Skill com Confirmação

**Arquivo:** `backend/app/domain/services.py`

```python
# Linha 276 - Permitir criar skill, mas com log claro
if skill_name not in current_skills:
    logger.info(
        f"🆕 Criando nova skill '{skill_name}' para usuário {profile_id} "
        f"com valor inicial 50 (desafio #{challenge_id})"
    )
    skill_atual = 50
else:
    skill_atual = current_skills[skill_name]
```

**Vantagens:**
- ✅ Permite progressão em skills novas
- ✅ Logs claros de quando skills são criadas
- ✅ Útil para usuários que aprendem skills novas

**Desvantagens:**
- ⚠️ Pode "poluir" perfil com skills não selecionadas no onboarding

## 🎯 Recomendação Final

**Implementar SOLUÇÃO 1 + SOLUÇÃO 3:**

1. **Validação Pós-IA** (Solução 3): Filtra skills que não estão em `affected_skills`
2. **Validação Estrita** (Solução 1): Só atualiza skills que o usuário já possui

**Fluxo:**
```
IA avalia → Filtra (só affected_skills) → Filtra (só skills do usuário) → Atualiza
```

**Resultado:**
- ✅ Apenas skills válidas são atualizadas
- ✅ Não cria skills novas automaticamente
- ✅ Logs claros de problemas
- ✅ Sistema mais robusto

## 📝 Próximos Passos

1. ✅ Executar script `check_skill_mismatches.py` para confirmar o problema
2. ⏳ Implementar Solução 1 + Solução 3
3. ⏳ Testar com submissions existentes
4. ⏳ Verificar se problema foi resolvido
5. ⏳ (Opcional) Limpar skills inválidas criadas anteriormente

---

**Status:** 🔍 Investigação em andamento  
**Data:** 2024-11-14  
**Script criado:** `backend/scripts/check_skill_mismatches.py`

