# 🔧 Correção V2: Skills em Primeira Pessoa (Ainda Acontecendo)

## 📋 Problema Persistente

Mesmo após a correção do prompt da IA, **skills em primeira pessoa ainda aparecem** nos cards de desafios:

**Exemplo reportado:**
- "Escrevo mensagens estruturadas em equipes de desenvolvimento" ❌

## 🔍 Causa Raiz Identificada

### Problema 1: Frontend Usa `eval_criteria` em Vez de `affected_skills`

**Arquivo:** `frontend/src/assets/pages/Home.jsx` (linha 114)

```javascript
// ❌ CÓDIGO ANTIGO
if (challenge.description?.eval_criteria) {
  skills.push(...challenge.description.eval_criteria.slice(0, 2));
}
```

**Por que isso é um problema:**
- `eval_criteria` = Critérios de avaliação (podem ser frases descritivas)
- `affected_skills` = Nomes de skills objetivos (ex: "Python", "Comunicação")

### Problema 2: IA Pode Ignorar Instruções

Mesmo com o prompt corrigido, a IA pode:
1. Colocar frases em `eval_criteria`
2. Não preencher `affected_skills` corretamente
3. Misturar formatos

## ✅ Solução Implementada

### 1. Frontend Prioriza `affected_skills`

**Arquivo:** `frontend/src/assets/pages/Home.jsx`

**Mudança:**
```javascript
// ✅ CÓDIGO NOVO
// Prioridade 1: affected_skills (formato novo, nomes objetivos)
if (challenge.description?.affected_skills && challenge.description.affected_skills.length > 0) {
  skills.push(...challenge.description.affected_skills.slice(0, 3));
} 
// Fallback: eval_criteria + target_skill (formato antigo, pode ter frases)
else {
  if (challenge.description?.target_skill) {
    skills.push(challenge.description.target_skill);
  }
  if (challenge.description?.eval_criteria) {
    skills.push(...challenge.description.eval_criteria.slice(0, 2));
  }
}
```

**Impacto:**
- ✅ Novos desafios: Usa `affected_skills` (nomes objetivos)
- ✅ Desafios antigos: Fallback para `eval_criteria` (compatibilidade)
- ✅ Prioridade correta: `affected_skills` > `eval_criteria`

### 2. Prompt da IA Já Foi Corrigido (V1)

**Arquivo:** `backend/app/infra/ai_gemini.py`

Já temos as regras:
- Regra #3: `affected_skills` deve usar NOMES DE HABILIDADES
- Regra #4: `eval_criteria` deve usar SUBSTANTIVOS/NOMES TÉCNICOS
- Exemplos claros de ❌ ERRADO vs ✅ CORRETO

## 🧪 Como Testar

### 1. Gerar Novos Desafios

```bash
# Na home page, clique em "Gerar Novos Desafios"
# Aguarde a geração dos 3 desafios
```

### 2. Verificar Skills nos Cards

**Antes (❌):**
```
Skills exibidas:
- Escrevo mensagens estruturadas em equipes...
- Consigo explicar problemas técnicos...
```

**Depois (✅):**
```
Skills exibidas:
- Comunicação escrita
- Empatia
- Resolução de conflitos
```

### 3. Inspecionar Dados do Desafio

Abra o console do navegador e inspecione o objeto `challenge`:

```javascript
console.log(challenge.description.affected_skills);
// ✅ Esperado: ["Comunicação", "Empatia", "Profissionalismo"]

console.log(challenge.description.eval_criteria);
// ⚠️ Pode ter frases, mas não será usado se affected_skills existir
```

## 📊 Comparação: Antes vs Depois

### Antes (❌)

**Dados do desafio:**
```json
{
  "description": {
    "eval_criteria": [
      "Escrevo mensagens estruturadas em equipes de desenvolvimento",
      "Consigo explicar problemas técnicos para pessoas não técnicas"
    ],
    "affected_skills": ["Comunicação", "Empatia"]
  }
}
```

**Frontend exibia:**
- "Escrevo mensagens estruturadas..." (de `eval_criteria`)
- "Consigo explicar problemas..." (de `eval_criteria`)

### Depois (✅)

**Mesmos dados do desafio:**
```json
{
  "description": {
    "eval_criteria": [
      "Escrevo mensagens estruturadas...",
      "Consigo explicar problemas..."
    ],
    "affected_skills": ["Comunicação", "Empatia"]
  }
}
```

**Frontend exibe:**
- "Comunicação" (de `affected_skills`)
- "Empatia" (de `affected_skills`)

## 🎯 Por Que Isso Resolve

### Separação de Responsabilidades

1. **`affected_skills`** (para exibição):
   - Nomes curtos e objetivos
   - Usados nos cards
   - Fáceis de ler

2. **`eval_criteria`** (para avaliação):
   - Critérios detalhados
   - Usados pela IA durante avaliação
   - Podem ser mais descritivos

### Compatibilidade

- ✅ Novos desafios: Usam `affected_skills`
- ✅ Desafios antigos: Fallback para `eval_criteria`
- ✅ Não quebra nada existente

## 🔄 Fluxo Completo

### Geração do Desafio

```
1. IA gera desafio
   ↓
2. Preenche affected_skills: ["Python", "FastAPI"]
   ↓
3. Preenche eval_criteria: ["Validação de dados", "Tratamento de erros"]
   ↓
4. Backend salva no banco
```

### Exibição no Frontend

```
1. Frontend recebe desafio
   ↓
2. Verifica se tem affected_skills?
   ├─ SIM: Usa affected_skills ✅
   └─ NÃO: Usa eval_criteria (fallback)
   ↓
3. Exibe nos cards
```

### Avaliação da Submissão

```
1. IA avalia submissão
   ↓
2. Usa eval_criteria como referência
   ↓
3. Gera skills_assessment para cada affected_skill
   ↓
4. Backend atualiza skills do usuário
```

## 📝 Notas Técnicas

### Por Que Não Remover `eval_criteria`?

1. **Compatibilidade**: Desafios antigos só têm `eval_criteria`
2. **Avaliação**: IA usa `eval_criteria` durante avaliação
3. **Flexibilidade**: Permite critérios mais detalhados

### Por Que `affected_skills` É Melhor para Exibição?

1. **Nomes curtos**: Cabem melhor nos cards
2. **Objetivos**: Fáceis de entender
3. **Consistentes**: Sempre no mesmo formato
4. **Mapeiam para perfil**: Correspondem às skills do usuário

## 🚀 Próximos Passos

### Se o Problema Persistir

Se ainda aparecerem frases em primeira pessoa:

**Opção A: Validação Backend**

Adicionar validação no backend para rejeitar `affected_skills` com mais de 3 palavras:

```python
# backend/app/infra/ai_gemini.py
for skill in affected_skills:
    if len(skill.split()) > 3:
        logger.warning(f"Skill muito longa: '{skill}'. Esperado nome curto.")
        # Rejeitar ou truncar
```

**Opção B: Post-Processing**

Criar função para "limpar" skills longas:

```javascript
// frontend/src/assets/pages/Home.jsx
function cleanSkillName(skill) {
  // Se tiver mais de 30 caracteres, é provavelmente uma frase
  if (skill.length > 30) {
    // Extrai palavras-chave
    return skill.split(' ').slice(0, 3).join(' ');
  }
  return skill;
}
```

**Opção C: Aumentar Temperature**

Se a IA estiver muito "criativa":

```python
# backend/app/infra/ai_gemini.py
self.generation_config = {
    "temperature": 0.5,  # Reduzir de 0.9 para 0.5 (mais determinístico)
}
```

## 📚 Arquivos Modificados

```
frontend/src/assets/pages/Home.jsx
  - Linhas 108-123: Prioriza affected_skills sobre eval_criteria
```

## ✅ Status

- ✅ Frontend corrigido (prioriza `affected_skills`)
- ✅ Prompt da IA corrigido (V1)
- ⏳ Aguardando teste com novos desafios gerados

---

**Status:** ✅ Implementado  
**Data:** 2024-11-14  
**Versão:** V2 (correção adicional no frontend)

