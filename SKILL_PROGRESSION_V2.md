# Sistema de Progressão de Skills V2

## Mudanças Principais

### 1. Múltiplas Skills por Desafio

**Antes:**
- Desafio tinha apenas `target_skill`
- Apenas 1 skill era atualizada

**Depois:**
- Desafio tem `target_skill` (principal) + `affected_skills` (array com 2-4 skills)
- Todas as `affected_skills` são avaliadas e atualizadas individualmente

**Exemplo:**
```json
{
  "description": {
    "target_skill": "Python",
    "affected_skills": ["Python", "FastAPI", "SQL", "Boas Práticas"]
  }
}
```

### 2. Avaliação Individual por Skill

**IA retorna:**
```json
{
  "nota_geral": 75,
  "skills_assessment": {
    "Python": {
      "skill_level_demonstrated": 80,
      "progression_intensity": 0.7,
      "reasoning": "Excelente uso de list comprehensions e type hints"
    },
    "FastAPI": {
      "skill_level_demonstrated": 65,
      "progression_intensity": 0.3,
      "reasoning": "Validação básica ok, mas faltou tratamento de erros"
    },
    "SQL": {
      "skill_level_demonstrated": 55,
      "progression_intensity": -0.2,
      "reasoning": "Query funciona mas sem índices, performance ruim"
    }
  }
}
```

### 3. Nova Fórmula de Progressão

```python
def calculate_skill_delta_v2(
    skill_atual: int,
    nota_geral: int,
    skill_assessment: dict,
    dificuldade_level: str,
    tentativas: int
) -> int:
    """
    Fórmula melhorada com ganhos e perdas mais expressivos.
    
    PROGRESSÃO (nota >= 50):
    - Nota 50-60: ganho leve (+1 a +3)
    - Nota 60-75: ganho moderado (+2 a +5)
    - Nota 75-90: ganho bom (+4 a +8)
    - Nota 90-100: ganho excelente (+6 a +12)
    
    REGRESSÃO (nota < 50):
    - Nota 40-49: perda leve (-1 a -2)
    - Nota 30-39: perda moderada (-2 a -4)
    - Nota < 30: perda significativa (-4 a -8)
    
    Fatores considerados:
    - Gap entre skill demonstrada e atual
    - Nota geral do desafio
    - Intensity da IA (-1.0 a +1.0)
    - Dificuldade (easy=0.7, medium=1.0, hard=1.3)
    - Curva de aprendizado (mais difícil subir em skills altas)
    - Penalidade por tentativas
    """
    
    skill_demonstrated = skill_assessment.get("skill_level_demonstrated", skill_atual)
    intensity = skill_assessment.get("progression_intensity", 0.0)
    
    # Gap entre demonstrado e atual
    gap = skill_demonstrated - skill_atual
    
    # Fator baseado na nota geral
    if nota_geral < 50:
        # REGRESSÃO: nota baixa = perda de pontos
        # Quanto pior a nota, maior a perda
        nota_factor = (nota_geral - 50) / 50.0  # -1.0 a 0.0
        # Amplifica perda se intensity for negativo
        if intensity < 0:
            nota_factor *= (1 + abs(intensity))
    else:
        # PROGRESSÃO: nota boa = ganho de pontos
        # Notas altas ganham mais
        if nota_geral >= 90:
            nota_factor = 2.0  # Ganho dobrado
        elif nota_geral >= 75:
            nota_factor = 1.5  # Ganho 50% maior
        elif nota_geral >= 60:
            nota_factor = 1.0  # Ganho normal
        else:  # 50-59
            nota_factor = 0.6  # Ganho reduzido
    
    # Pesos por dificuldade
    pesos = {"easy": 0.7, "medium": 1.0, "hard": 1.3}
    peso = pesos.get(dificuldade_level, 1.0)
    
    # Curva de aprendizado
    curva = 1 / (1 + math.exp((skill_atual - 70) / 10))
    
    # Penalidade por tentativas
    penal = max(0.6, 1 - 0.1 * (tentativas - 1))
    
    # Fórmula final
    # Divisor menor (10) para mudanças mais perceptíveis
    ganho = gap * intensity * nota_factor * peso * curva * penal / 10.0
    
    # Garante mínimo de mudança se nota muito alta ou muito baixa
    if nota_geral >= 90 and ganho > 0 and ganho < 3:
        ganho = 3  # Mínimo +3 para notas excelentes
    elif nota_geral < 40 and ganho < 0 and ganho > -2:
        ganho = -2  # Mínimo -2 para notas ruins
    
    return int(round(ganho))
```

### 4. Tech Skills vs Soft Skills

**Regra:**
- `category === "daily-task"` → atualiza `soft_skills`
- `category === "code"` ou `"organization"` → atualiza `tech_skills`

### 5. Processamento de Múltiplas Skills

```python
def apply_multiple_skills_update(
    current_skills: Dict[str, int],
    skills_assessment: Dict[str, dict],
    nota_geral: int,
    difficulty_level: str,
    attempts: int
) -> Dict[str, Dict[str, int]]:
    """
    Aplica progressão em múltiplas skills de uma vez.
    
    Returns:
        {
            "updated_skills": {"Python": 75, "FastAPI": 63, ...},
            "deltas": {"Python": +5, "FastAPI": +3, ...}
        }
    """
    updated_skills = {**current_skills}
    deltas = {}
    
    for skill_name, assessment in skills_assessment.items():
        if skill_name not in current_skills:
            current_skills[skill_name] = 50  # Cria se não existe
        
        skill_atual = current_skills[skill_name]
        delta = calculate_skill_delta_v2(
            skill_atual, 
            nota_geral, 
            assessment, 
            difficulty_level, 
            attempts
        )
        
        new_value = clamp_skill(skill_atual + delta)
        updated_skills[skill_name] = new_value
        deltas[skill_name] = delta
    
    return {
        "updated_skills": updated_skills,
        "deltas": deltas
    }
```

## Implementação

### Arquivos a modificar:

1. ✅ `backend/app/infra/ai_gemini.py` - Prompt de geração (affected_skills)
2. ⏳ `backend/app/infra/ai_gemini.py` - Prompt de avaliação (skills_assessment)
3. ⏳ `backend/app/domain/services.py` - Nova função calculate_skill_delta_v2
4. ⏳ `backend/app/domain/services.py` - Função apply_multiple_skills_update
5. ⏳ `backend/app/domain/services.py` - Atualizar create_and_score_submission
6. ⏳ `backend/app/infra/repo_sql.py` - Métodos para soft_skills
7. ⏳ `backend/app/schemas/submissions.py` - Atualizar response schema

### Status: 🚧 EM PROGRESSO

Próximo passo: Atualizar prompt de avaliação para retornar skills_assessment com múltiplas skills.

