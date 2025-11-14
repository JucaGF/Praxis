# 🔧 Correção: Skills Não Existentes Sendo Criadas

## 📋 Problema Confirmado

O usuário completou um desafio de **comunicação** e o sistema alterou skills que **não existem** no perfil:

### Skills do Usuário (Corretas)
- ✅ Comunicação (33%)
- ✅ Organização (30%)
- ✅ Resolução de Problemas (50%)

### Skills Alteradas pelo Sistema (Incorretas)
- ❌ Comunicação em equipe (+7.0) → **NÃO EXISTE!**
- ❌ Comunicação técnica (+6.0) → **NÃO EXISTE!**
- ❌ Empatia (+9.0) → **NÃO EXISTE!**
- ❌ Resolução de problemas (+8.0) → **EXISTE** (mas nome diferente: "Resolução de Problemas")

**Resultado:** O sistema **criou 3 skills novas** automaticamente!

## 🔍 Causa Raiz

### Problema 1: Sem Validação Pós-IA

**Arquivo:** `backend/app/domain/services.py` (linha 620)

A IA retornava `skills_assessment` com skills que **não estavam** em `affected_skills`:

```python
# ❌ CÓDIGO ANTIGO
if affected_skills and skills_assessment:
    skills_progression = process_multiple_skills(
        profile_id,
        affected_skills,
        skills_assessment,  # ⚠️ Pode ter skills extras!
        ...
    )
```

**Exemplo:**
- `affected_skills`: `["Comunicação", "Empatia"]`
- `skills_assessment`: `{"Comunicação em equipe": {...}, "Comunicação técnica": {...}, "Empatia": {...}}`
- ❌ "Comunicação em equipe" e "Comunicação técnica" **não estão** em `affected_skills`!

### Problema 2: Criação Automática de Skills

**Arquivo:** `backend/app/domain/services.py` (linha 276)

```python
# ❌ CÓDIGO ANTIGO
skill_atual = current_skills.get(skill_name, 50)  # Default 50 se não existe
```

**O que acontecia:**
1. IA avaliava "Comunicação em equipe"
2. Sistema verificava: usuário tem essa skill? **NÃO**
3. Sistema criava automaticamente com valor 50
4. Sistema aplicava o delta
5. **Skill nova aparecia no perfil!**

## ✅ Solução Implementada

### 1. Validação Pós-IA (Filtro de Skills Inválidas)

**Arquivo:** `backend/app/domain/services.py` (linhas 622-632)

```python
# ✅ CÓDIGO NOVO
# VALIDAÇÃO PÓS-IA: Remove skills que não estão em affected_skills
validated_assessment = {}
for skill_name, assessment in skills_assessment.items():
    if skill_name in affected_skills:
        validated_assessment[skill_name] = assessment
    else:
        logger.warning(
            f"IA avaliou skill '{skill_name}' que não está em affected_skills. "
            f"Ignorando. Esperado: {affected_skills}",
            extra={"extra_data": {**ctx, "invalid_skill": skill_name}}
        )

skills_progression = process_multiple_skills(
    profile_id,
    affected_skills,
    validated_assessment,  # ✅ Usa assessment validado
    ...
)
```

**Impacto:**
- ✅ Filtra skills que a IA inventou
- ✅ Apenas skills especificadas em `affected_skills` são processadas
- ✅ Logs claros de skills ignoradas

### 2. Validação Estrita (Não Cria Skills Novas)

**Arquivo:** `backend/app/domain/services.py` (linhas 276-282)

```python
# ✅ CÓDIGO NOVO
# VALIDAÇÃO ESTRITA: Pula se usuário não possui essa skill
if skill_name not in current_skills:
    logger.warning(
        f"Skill '{skill_name}' não existe no perfil do usuário (profile_id={profile_id}). "
        f"Pulando atualização. Skills disponíveis ({skill_type}): {list(current_skills.keys())}"
    )
    continue

skill_atual = current_skills.get(skill_name)  # Agora garantido que existe
```

**Impacto:**
- ✅ **NÃO cria** skills novas automaticamente
- ✅ Apenas atualiza skills que o usuário **já possui**
- ✅ Logs claros de skills puladas

## 🎯 Fluxo Completo: Antes vs Depois

### Antes (❌)

```
1. Desafio especifica: affected_skills = ["Comunicação", "Empatia"]
   ↓
2. IA avalia e retorna:
   skills_assessment = {
     "Comunicação em equipe": {...},  ❌ Nome diferente!
     "Comunicação técnica": {...},    ❌ Nome diferente!
     "Empatia": {...}                 ✅ Correto
   }
   ↓
3. Sistema processa TODAS as 3 skills
   ↓
4. Usuário tem: ["Comunicação", "Organização", "Resolução de Problemas"]
   ↓
5. Sistema cria:
   - "Comunicação em equipe" (nova!) ❌
   - "Comunicação técnica" (nova!)  ❌
   - "Empatia" (nova!)              ❌
   ↓
6. Perfil fica com 6 skills (3 originais + 3 novas indesejadas)
```

### Depois (✅)

```
1. Desafio especifica: affected_skills = ["Comunicação", "Empatia"]
   ↓
2. IA avalia e retorna:
   skills_assessment = {
     "Comunicação em equipe": {...},  ❌ Nome diferente!
     "Comunicação técnica": {...},    ❌ Nome diferente!
     "Empatia": {...}                 ✅ Correto
   }
   ↓
3. ✅ VALIDAÇÃO PÓS-IA: Filtra skills não em affected_skills
   validated_assessment = {
     "Empatia": {...}  ✅ Único que está em affected_skills
   }
   ⚠️ Log: "IA avaliou 'Comunicação em equipe' que não está em affected_skills. Ignorando."
   ⚠️ Log: "IA avaliou 'Comunicação técnica' que não está em affected_skills. Ignorando."
   ↓
4. Sistema processa apenas: ["Empatia"]
   ↓
5. Usuário tem: ["Comunicação", "Organização", "Resolução de Problemas"]
   ↓
6. ✅ VALIDAÇÃO ESTRITA: "Empatia" não existe no perfil
   ⚠️ Log: "Skill 'Empatia' não existe no perfil. Pulando. Skills disponíveis: [...]"
   ↓
7. ✅ NENHUMA skill é atualizada (todas foram filtradas/puladas)
   ↓
8. Perfil permanece com 3 skills originais (nenhuma skill nova criada)
```

## 📊 Impacto da Correção

### Cenário 1: IA Inventa Nomes
- **Antes:** Skills novas criadas ❌
- **Depois:** Skills filtradas, logs gerados ✅

### Cenário 2: IA Usa Nome Exato
- **Antes:** Skill atualizada ✅
- **Depois:** Skill atualizada ✅

### Cenário 3: IA Avalia Skill Não Especificada
- **Antes:** Skill criada se não existir ❌
- **Depois:** Skill filtrada na validação pós-IA ✅

### Cenário 4: Desafio Especifica Skill Que Usuário Não Tem
- **Antes:** Skill criada automaticamente ❌
- **Depois:** Skill pulada, log gerado ✅

## 🧪 Como Testar

### 1. Completar um Desafio

```bash
# Fazer um desafio de comunicação
# Submeter solução
# Verificar resultado
```

### 2. Verificar Logs do Backend

```bash
# No terminal do backend, procurar por:
⚠️  IA avaliou skill 'X' que não está em affected_skills. Ignorando.
⚠️  Skill 'X' não existe no perfil do usuário. Pulando.
```

### 3. Verificar Perfil

**Antes da correção:**
- ❌ Skills novas aparecem no perfil
- ❌ Skills com nomes diferentes dos selecionados no onboarding

**Depois da correção:**
- ✅ Apenas skills originais no perfil
- ✅ Nenhuma skill nova criada

## 🔄 Casos de Uso

### Caso 1: IA Respeita Tudo Perfeitamente

```python
affected_skills = ["Comunicação", "Empatia"]
skills_assessment = {
    "Comunicação": {...},
    "Empatia": {...}
}
current_skills = {"Comunicação": 50, "Empatia": 60, "Organização": 40}
```

**Resultado:**
- ✅ Validação pós-IA: Passa (ambas estão em affected_skills)
- ✅ Validação estrita: Passa (ambas existem no perfil)
- ✅ "Comunicação" atualizada
- ✅ "Empatia" atualizada

### Caso 2: IA Inventa Nomes

```python
affected_skills = ["Comunicação", "Empatia"]
skills_assessment = {
    "Comunicação escrita": {...},  # ❌ Nome diferente
    "Empatia": {...}
}
current_skills = {"Comunicação": 50, "Empatia": 60}
```

**Resultado:**
- ❌ Validação pós-IA: "Comunicação escrita" filtrada (não está em affected_skills)
- ✅ Validação pós-IA: "Empatia" passa
- ✅ Validação estrita: "Empatia" existe no perfil
- ✅ Apenas "Empatia" atualizada
- ⚠️ Log: "IA avaliou 'Comunicação escrita' que não está em affected_skills"

### Caso 3: Desafio Especifica Skill Não Existente

```python
affected_skills = ["Comunicação", "Liderança"]  # Usuário não tem "Liderança"
skills_assessment = {
    "Comunicação": {...},
    "Liderança": {...}
}
current_skills = {"Comunicação": 50, "Empatia": 60}
```

**Resultado:**
- ✅ Validação pós-IA: Ambas passam (estão em affected_skills)
- ✅ Validação estrita: "Comunicação" existe, atualizada
- ❌ Validação estrita: "Liderança" não existe, pulada
- ⚠️ Log: "Skill 'Liderança' não existe no perfil. Skills disponíveis: ['Comunicação', 'Empatia']"

## 📝 Notas Técnicas

### Por Que Duas Validações?

1. **Validação Pós-IA** (Filtro):
   - Garante que apenas skills especificadas no desafio são processadas
   - Protege contra IA "criativa" que avalia skills extras

2. **Validação Estrita** (Existência):
   - Garante que apenas skills do perfil são atualizadas
   - Protege contra criação acidental de skills novas

### E Se o Desafio Estiver Errado?

Se `affected_skills` especificar uma skill que o usuário não tem:
- ✅ Sistema **não cria** a skill
- ✅ Log claro é gerado
- ✅ Outras skills válidas são atualizadas normalmente

**Exemplo:**
```
affected_skills = ["Python", "Docker"]  # Usuário não tem "Docker"
→ "Python" é atualizado ✅
→ "Docker" é pulado ⚠️
→ Log: "Skill 'Docker' não existe no perfil"
```

### Compatibilidade

- ✅ Desafios antigos: Continuam funcionando (fallback para `target_skill`)
- ✅ Desafios novos: Usam `affected_skills` com validação
- ✅ Não quebra nada existente

## 🚀 Próximos Passos

### 1. Limpar Skills Inválidas Criadas Anteriormente

Se você já tem skills inválidas no perfil, pode usar o script SQL:

```sql
-- Ver suas soft_skills atuais
SELECT 
  user_id,
  jsonb_pretty(soft_skills) as soft_skills
FROM public.attributes
WHERE user_id = 'SEU_USER_ID';

-- Remover skills específicas
UPDATE public.attributes
SET 
  soft_skills = soft_skills 
    - 'Comunicação em equipe'
    - 'Comunicação técnica'
    - 'Empatia',
  updated_at = NOW()
WHERE user_id = 'SEU_USER_ID';
```

### 2. Melhorar Matching de Skills

Se a IA frequentemente usa nomes diferentes, podemos adicionar "fuzzy matching":

```python
# Exemplo: "Comunicação escrita" → "Comunicação"
def find_closest_skill(skill_name, available_skills):
    # Implementar matching por similaridade
    pass
```

### 3. Validar `affected_skills` na Geração

Adicionar validação no backend para garantir que `affected_skills` só contém skills que o usuário possui:

```python
# backend/app/domain/services.py
def validate_affected_skills(affected_skills, user_skills):
    valid_skills = [s for s in affected_skills if s in user_skills]
    if len(valid_skills) < len(affected_skills):
        logger.warning(f"Algumas affected_skills não existem no perfil")
    return valid_skills
```

## 📚 Arquivos Modificados

```
backend/app/domain/services.py
  - Linhas 622-632: Validação pós-IA (filtro de skills inválidas)
  - Linhas 276-282: Validação estrita (não cria skills novas)
```

## ✅ Status

- ✅ Validação pós-IA implementada
- ✅ Validação estrita implementada
- ✅ Logs detalhados adicionados
- ⏳ Aguardando teste com próximo desafio

---

**Status:** ✅ Implementado  
**Data:** 2024-11-14  
**Problema:** Skills não existentes sendo criadas automaticamente  
**Solução:** Dupla validação (pós-IA + estrita)

