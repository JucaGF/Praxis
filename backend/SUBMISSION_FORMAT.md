# Formato de Submissões

Este documento explica o formato esperado do campo `submitted_code` para cada tipo de desafio.

## 📋 Visão Geral

O campo `submitted_code` é um JSON flexível que varia de acordo com o tipo de desafio.

---

## 1️⃣ Desafio de CÓDIGO (`type: "codigo"`)

### Formato da Submissão:

```json
{
  "type": "codigo",
  "files": {
    "src/App.jsx": "import React from 'react';\n\nexport default function App() {\n  return <div>Hello</div>;\n}",
    "src/components/Button.jsx": "export default function Button() { ... }",
    "README.md": "# Documentação..."
  }
}
```

### Campos:
- **`type`** (string): `"codigo"`
- **`files`** (object): Mapa de `{caminho: conteúdo}` dos arquivos editados

### Alternativa (legado):
```json
{
  "type": "codigo",
  "content": "// Código simples em um único arquivo"
}
```

---

## 2️⃣ Desafio de TEXTO LIVRE (`type: "texto_livre"`)

### Formato da Submissão:

```json
{
  "type": "texto_livre",
  "content": "Prezado Carlos,\n\nAgradeço pelo contato e peço desculpas pelo transtorno causado...\n\nAtenciosamente,\nEquipe de Suporte"
}
```

### Campos:
- **`type`** (string): `"texto_livre"`
- **`content`** (string): Resposta em texto (email, documento, comunicação, etc)

### Observação:
O usuário está **respondendo** ao contexto fornecido em `description.enunciado.corpo` (email/ticket original).

---

## 3️⃣ Desafio de PLANEJAMENTO (`type: "planejamento"`)

### Formato da Submissão:

```json
{
  "type": "planejamento",
  "form_data": {
    "tecnologias": {
      "protocolo": "WebSocket",
      "message_broker": "Redis Pub/Sub",
      "armazenamento": "PostgreSQL"
    },
    "justificativa": {
      "porque_protocolo": "WebSocket oferece comunicação bidirecional full-duplex, ideal para notificações em tempo real...",
      "porque_broker": "Redis é extremamente rápido (in-memory) e suporta pub/sub nativamente...",
      "porque_storage": "PostgreSQL garante persistência confiável com ACID..."
    },
    "tradeoffs": {
      "limitacoes": "Custo de manter conexões WebSocket abertas; Redis consome RAM...",
      "alternativas": "Server-Sent Events seria mais simples, mas unidirecional...",
      "custos": "Médio"
    }
  }
}
```

### Campos:
- **`type`** (string): `"planejamento"`
- **`form_data`** (object): Respostas do formulário híbrido
  - Chaves de nível 1: `id` das abas (seções) do formulário
  - Chaves de nível 2: `id` dos campos dentro de cada aba
  - Valores: Respostas do usuário (string para textarea/dropdown, boolean para checkbox)

### Estrutura do `form_data`:
```
form_data
├── <aba_id_1>
│   ├── <campo_id_1>: "resposta"
│   ├── <campo_id_2>: "resposta"
│   └── <campo_id_3>: "resposta"
├── <aba_id_2>
│   └── ...
```

### Alternativa (legado):
```json
{
  "type": "planejamento",
  "content": "# Planejamento\n\n## Tecnologias\n- WebSocket\n- Redis\n..."
}
```

---

## 🔍 Como o Backend Processa

### No `ai_gemini.py` (linha 376-410):

```python
submission_type = submission.get("type", "codigo")

if submission_type == "codigo":
    files = submission.get("files", {})
    # Concatena arquivos: "// arquivo1.js\ncodigo..."
    
elif submission_type == "texto_livre":
    submitted_content = submission.get("content", "")
    
elif submission_type == "planejamento":
    form_data = submission.get("form_data", {})
    # Formata em seções: "=== TECNOLOGIAS ===\nprotocolo: WebSocket\n..."
```

### Contexto Adicional Enviado à IA:

Para **texto_livre** e **planejamento**, o prompt inclui o contexto do `enunciado`:

```
CONTEXTO - EMAIL/TICKET ORIGINAL QUE O CANDIDATO DEVERIA RESPONDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
De: cliente@empresa.com
Assunto: Problema urgente
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBMISSÃO DO CANDIDATO:
<resposta do usuário>
```

Isso permite que a IA compare a resposta do candidato com o contexto original!

---

## 📝 Resumo de Validações

### Frontend deve enviar:
```typescript
// POST /submissions
{
  "profile_id": "uuid",
  "challenge_id": 123,
  "submitted_code": {
    "type": "codigo | texto_livre | planejamento",
    // ... campos específicos do tipo
  },
  "commit_message": "opcional",
  "notes": "opcional",
  "time_taken_sec": 300
}
```

### Backend valida:
- ✅ `submitted_code` é dict/object
- ✅ `submitted_code.type` está presente
- ✅ Campos específicos existem (`files`, `content`, ou `form_data`)

### Backend retorna:
```json
{
  "submission_id": 456,
  "status": "scored",
  "score": 88,
  "metrics": {...},
  "feedback": "...",
  "target_skill": "FastAPI",
  "delta_applied": 2,
  "updated_skill_value": 75,
  "skill_reasoning": "Demonstrou domínio sólido..."
}
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Submissão de Código
```bash
curl -X POST http://localhost:8000/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "abc-123",
    "challenge_id": 1,
    "submitted_code": {
      "type": "codigo",
      "files": {
        "app/auth.py": "from fastapi import HTTPException\n..."
      }
    },
    "time_taken_sec": 1200
  }'
```

### Exemplo 2: Submissão de Texto Livre
```bash
curl -X POST http://localhost:8000/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "abc-123",
    "challenge_id": 2,
    "submitted_code": {
      "type": "texto_livre",
      "content": "Prezado cliente,\n\nAgradeço o contato..."
    },
    "time_taken_sec": 600
  }'
```

### Exemplo 3: Submissão de Planejamento
```bash
curl -X POST http://localhost:8000/submissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "abc-123",
    "challenge_id": 3,
    "submitted_code": {
      "type": "planejamento",
      "form_data": {
        "tecnologias": {
          "protocolo": "WebSocket",
          "message_broker": "Redis Pub/Sub"
        },
        "justificativa": {
          "porque": "WebSocket oferece baixa latência..."
        }
      }
    },
    "time_taken_sec": 1800
  }'
```

---

## ✅ Status das Correções

- ✅ Backend agora suporta `submitted_code.type`
- ✅ Backend extrai `files`, `content`, ou `form_data` corretamente
- ✅ IA recebe contexto do `enunciado` para avaliação
- ✅ FakeAI retorna `skill_assessment` completo
- ✅ Todos os tipos de desafio funcionam end-to-end

