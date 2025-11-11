# Formato dos Attributes (tech_skills e soft_skills)

## 📋 Formato Atual Correto

### Backend (Python)
```python
# Dict[str, int] - Dicionário onde a chave é o nome da skill e o valor é a porcentagem (0-100)
{
  "tech_skills": {
    "Python": 80,
    "FastAPI": 70,
    "Docker": 60
  },
  "soft_skills": {
    "Comunicação": 90,
    "Trabalho em Equipe": 85,
    "Resolução de Problemas": 75
  }
}
```

### Frontend (JavaScript)
```javascript
// Objeto simples {skill_name: percentage}
const attributes = {
  tech_skills: {
    "Python": 80,
    "FastAPI": 70,
    "Docker": 60
  },
  soft_skills: {
    "Comunicação": 90,
    "Trabalho em Equipe": 85,
    "Resolução de Problemas": 75
  }
}
```

## ✅ Arquivos Corrigidos

### Frontend
- ✅ `frontend/src/assets/pages/Login.jsx` - Validação usa `Object.keys().length`
- ✅ `frontend/src/assets/pages/Home.jsx` - Validação e uso corretos
- ✅ `frontend/src/assets/pages/Profile.jsx` - Exibição com `Object.entries()`
- ✅ `frontend/src/assets/pages/Onboarding.jsx` - Envia objetos corretamente

### Backend
- ✅ `backend/app/schemas/attributes.py` - Schema usa `Dict[str, int]`
- ✅ `backend/app/infra/repo_sql.py` - `_attributes_out` retorna objetos
- ✅ `backend/app/infra/ai_gemini.py` - Trata ambos formatos (compatibilidade)

## 🔧 Como Trabalhar com Skills

### Verificar se tem skills
```javascript
// ❌ ERRADO (tratando como array)
if (attributes.tech_skills.length > 0)

// ✅ CORRETO (tratando como objeto)
if (attributes.tech_skills && Object.keys(attributes.tech_skills).length > 0)
```

### Iterar sobre skills
```javascript
// ❌ ERRADO
attributes.tech_skills.map(skill => skill.name)

// ✅ CORRETO - Pegar apenas nomes
Object.keys(attributes.tech_skills)

// ✅ CORRETO - Pegar nomes e porcentagens
Object.entries(attributes.tech_skills).map(([name, percentage]) => ({
  name,
  percentage
}))
```

### Contar skills
```javascript
// ❌ ERRADO
attributes.tech_skills.length

// ✅ CORRETO
Object.keys(attributes.tech_skills).length
```

### Adicionar/Atualizar skill
```javascript
// Backend (Python)
tech_skills["Nova Skill"] = 75

// Frontend (JavaScript)
setAttributes({
  ...attributes,
  tech_skills: {
    ...attributes.tech_skills,
    "Nova Skill": 75
  }
})
```

## 🚨 Lugares que Podem Precisar Atenção

### Se você criar novos componentes ou telas:

1. **Sempre use `Object.keys()` para verificar tamanho**
   ```javascript
   Object.keys(attributes.tech_skills).length
   ```

2. **Use `Object.entries()` para iterar**
   ```javascript
   Object.entries(attributes.tech_skills).map(([name, value]) => ...)
   ```

3. **Inicialize como objeto vazio, não array**
   ```javascript
   const [attributes, setAttributes] = useState({
     tech_skills: {}, // ✅ Correto
     soft_skills: {}  // ✅ Correto
   })
   
   // ❌ ERRADO
   // tech_skills: []
   // soft_skills: []
   ```

## 📝 Por que Mudamos de Array para Objeto?

### Antes (Array) ❌
```javascript
tech_skills: [
  { name: "Python", percentage: 80 },
  { name: "FastAPI", percentage: 70 }
]
```

**Problemas:**
- Mais complexo para atualizar uma skill específica
- Dificulta busca por nome
- Mais verboso

### Depois (Objeto) ✅
```javascript
tech_skills: {
  "Python": 80,
  "FastAPI": 70
}
```

**Vantagens:**
- Acesso direto por nome: `tech_skills["Python"]`
- Atualização simples: `tech_skills["Python"] = 85`
- Menos dados trafegados na rede
- Mais compatível com formato dict do Python
- Formato usado pelos questionários

## 🔍 Como Detectar Problemas

Se você ver erros como:
- `tech_skills.map is not a function` → Está tratando objeto como array
- `tech_skills.length is undefined` → Está tratando objeto como array
- `Cannot read property 'name' of undefined` → Está esperando array de objetos

**Solução:** Use `Object.keys()`, `Object.values()` ou `Object.entries()`

## 📊 Compatibilidade

O backend em `ai_gemini.py` mantém compatibilidade com ambos os formatos:
```python
if isinstance(tech_skills, list):
    # Formato antigo (array)
    skills_text = "\n".join([f"  - {skill['name']}: {skill['percentage']}/100" for skill in tech_skills])
else:
    # Formato novo (dict) ✅
    skills_text = "\n".join([f"  - {skill}: {level}/100" for skill, level in tech_skills.items()])
```

Isso garante que funcione com dados antigos caso existam no banco.
