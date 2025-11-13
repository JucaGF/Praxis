# TODO: Implementar Sistema de Progressão V2 (Múltiplas Skills)

## Status Atual ❌
- Backend processa apenas 1 skill (`target_skill`)
- Frontend mostra apenas 1 skill na progressão
- Sem diferenciação entre tech_skills e soft_skills
- Fórmula de progressão não penaliza notas baixas adequadamente

## O Que Precisa Ser Feito

### 1. Backend - Prompt de Avaliação da IA

**Arquivo:** `backend/app/infra/ai_gemini.py` (linha ~600)

**Mudar de:**
```json
{
  "skill_assessment": {
    "skill_level_demonstrated": 75,
    "progression_intensity": 0.7,
    "reasoning": "..."
  }
}
```

**Para:**
```json
{
  "skills_assessment": {
    "Python": {
      "skill_level_demonstrated": 80,
      "progression_intensity": 0.7,
      "reasoning": "Excelente uso de list comprehensions"
    },
    "FastAPI": {
      "skill_level_demonstrated": 65,
      "progression_intensity": 0.3,
      "reasoning": "Validação básica ok, faltou error handling"
    }
  }
}
```

**Instruções para a IA:**
- Avaliar TODAS as skills em `affected_skills` do desafio
- Cada skill tem seu próprio assessment independente
- Reasoning específico para cada skill

### 2. Backend - Nova Fórmula de Progressão

**Arquivo:** `backend/app/domain/services.py` (adicionar nova função)

```python
def calculate_skill_delta_v2(
    skill_atual: int,
    nota_geral: int,
    skill_assessment: dict,
    dificuldade_level: str,
    tentativas: int
) -> int:
    """
    Nova fórmula com progressão e regressão mais expressivas.
    
    REGRESSÃO (nota < 50):
    - Nota 40-49: -1 a -2 pontos
    - Nota 30-39: -2 a -4 pontos
    - Nota < 30: -4 a -8 pontos
    
    PROGRESSÃO (nota >= 50):
    - Nota 50-60: +1 a +3 pontos
    - Nota 60-75: +2 a +5 pontos
    - Nota 75-90: +4 a +8 pontos
    - Nota 90-100: +6 a +12 pontos
    """
    skill_demonstrated = skill_assessment.get("skill_level_demonstrated", skill_atual)
    intensity = skill_assessment.get("progression_intensity", 0.0)
    gap = skill_demonstrated - skill_atual
    
    # Fator baseado na nota
    if nota_geral < 50:
        # REGRESSÃO
        nota_factor = (nota_geral - 50) / 50.0  # -1.0 a 0.0
        if intensity < 0:
            nota_factor *= (1 + abs(intensity))
    else:
        # PROGRESSÃO
        if nota_geral >= 90:
            nota_factor = 2.0
        elif nota_geral >= 75:
            nota_factor = 1.5
        elif nota_geral >= 60:
            nota_factor = 1.0
        else:
            nota_factor = 0.6
    
    pesos = {"easy": 0.7, "medium": 1.0, "hard": 1.3}
    peso = pesos.get(dificuldade_level, 1.0)
    curva = 1 / (1 + math.exp((skill_atual - 70) / 10))
    penal = max(0.6, 1 - 0.1 * (tentativas - 1))
    
    ganho = gap * intensity * nota_factor * peso * curva * penal / 10.0
    
    # Garante mínimos
    if nota_geral >= 90 and 0 < ganho < 3:
        ganho = 3
    elif nota_geral < 40 and -2 < ganho < 0:
        ganho = -2
    
    return int(round(ganho))
```

### 3. Backend - Processar Múltiplas Skills

**Arquivo:** `backend/app/domain/services.py` (adicionar nova função)

```python
def process_multiple_skills(
    profile_id: str,
    affected_skills: List[str],
    skills_assessment: Dict[str, dict],
    nota_geral: int,
    difficulty_level: str,
    attempts: int,
    category: str,
    repo: IRepository
) -> Dict[str, Any]:
    """
    Processa progressão de múltiplas skills.
    
    Returns:
        {
            "skills_updated": ["Python", "FastAPI"],
            "deltas": {"Python": +5, "FastAPI": +2},
            "new_values": {"Python": 75, "FastAPI": 62}
        }
    """
    # Determina se atualiza tech_skills ou soft_skills
    is_soft_skill = category == "daily-task"
    
    if is_soft_skill:
        current_skills = repo.get_soft_skills(profile_id)
    else:
        current_skills = repo.get_tech_skills(profile_id)
    
    deltas = {}
    new_values = {}
    
    for skill_name in affected_skills:
        # Pula se não tiver assessment da IA
        if skill_name not in skills_assessment:
            continue
        
        skill_atual = current_skills.get(skill_name, 50)
        assessment = skills_assessment[skill_name]
        
        delta = calculate_skill_delta_v2(
            skill_atual,
            nota_geral,
            assessment,
            difficulty_level,
            attempts
        )
        
        new_value = clamp_skill(skill_atual + delta)
        current_skills[skill_name] = new_value
        
        deltas[skill_name] = delta
        new_values[skill_name] = new_value
    
    # Salva no banco
    if is_soft_skill:
        repo.update_soft_skills(profile_id, current_skills)
    else:
        repo.update_tech_skills(profile_id, current_skills)
    
    return {
        "skills_updated": list(deltas.keys()),
        "deltas": deltas,
        "new_values": new_values
    }
```

### 4. Backend - Atualizar Service

**Arquivo:** `backend/app/domain/services.py` (substituir PASSO 7)

```python
# ===== PASSO 7: Progressão de múltiplas skills =====
difficulty_level = (challenge.get("difficulty") or {}).get("level", "medium")
affected_skills = (challenge.get("description") or {}).get("affected_skills", [])
category = challenge.get("category", "code")

# Se não tiver affected_skills, usa target_skill (compatibilidade)
if not affected_skills:
    target_skill = (challenge.get("description") or {}).get("target_skill")
    if target_skill:
        affected_skills = [target_skill]

skills_progression = None

if affected_skills and eval_result.get("skills_assessment"):
    try:
        skills_progression = process_multiple_skills(
            submission_data["profile_id"],
            affected_skills,
            eval_result["skills_assessment"],
            score,
            difficulty_level,
            attempts,
            category,
            self.repo
        )
    except Exception as e:
        logger.warning(
            f"Não foi possível atualizar skills: {e}",
            extra={"extra_data": ctx}
        )

# ===== PASSO 8: Retornar =====
return {
    "submission_id": submission["id"],
    "status": "scored",
    "score": score,
    "metrics": metrics,
    "feedback": feedback_text,
    "skills_progression": skills_progression  # NOVO: múltiplas skills
}
```

### 5. Backend - Métodos para Soft Skills

**Arquivo:** `backend/app/infra/repo_sql.py`

Adicionar:
```python
def get_soft_skills(self, profile_id: str) -> Dict[str, int]:
    # Similar a get_tech_skills mas retorna soft_skills
    
def update_soft_skills(self, profile_id: str, soft_skills: Dict[str, int]) -> None:
    # Similar a update_tech_skills mas atualiza soft_skills
```

### 6. Frontend - Mostrar Múltiplas Skills

**Arquivo:** `frontend/src/assets/pages/ChallengeResult.jsx`

**Mudar de:**
```javascript
const skill_changes = [];
if (result.target_skill && result.delta_applied !== null) {
  skill_changes.push({
    skill_name: result.target_skill,
    old_value: ...,
    new_value: ...
  });
}
```

**Para:**
```javascript
const skill_changes = [];
if (result.skills_progression) {
  const { deltas, new_values } = result.skills_progression;
  
  Object.keys(deltas).forEach(skill_name => {
    const delta = deltas[skill_name];
    const new_value = new_values[skill_name];
    const old_value = new_value - delta;
    
    skill_changes.push({
      skill_name,
      old_value,
      new_value
    });
  });
}
```

## Estimativa de Tempo

- Implementação completa: ~2-3 horas
- Testes: ~1 hora
- **Total: 3-4 horas**

## Riscos

- Mudança no formato de resposta da IA pode quebrar desafios antigos
- Precisa migração/compatibilidade com dados existentes
- Requer testes extensivos

## Recomendação

Implementar em etapas:
1. ✅ Adicionar `affected_skills` no prompt de geração (FEITO)
2. ⏳ Atualizar prompt de avaliação para retornar `skills_assessment`
3. ⏳ Implementar nova fórmula e processamento
4. ⏳ Atualizar frontend para mostrar múltiplas skills
5. ⏳ Testar extensivamente

**Quer continuar agora ou prefere fazer em outra sessão?**

