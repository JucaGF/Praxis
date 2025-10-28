# 🤖 Configuração da IA Real (Google Gemini)

Este guia explica como configurar e usar a IA real (Google Gemini) no Praxis.

---

## 📋 **Índice**

1. [Pré-requisitos](#pré-requisitos)
2. [Como obter API Key do Gemini](#como-obter-api-key-do-gemini)
3. [Configuração](#configuração)
4. [Uso](#uso)
5. [Troubleshooting](#troubleshooting)
6. [Custos e Limites](#custos-e-limites)

---

## 🛠️ **Pré-requisitos**

- Python 3.10+
- Conta Google (gratuita)
- Acesso à internet

---

## 🔑 **Como obter API Key do Gemini**

### **Passo 1: Acessar o AI Studio**

Acesse: https://aistudio.google.com/app/apikey

### **Passo 2: Fazer login**

Faça login com sua conta Google.

### **Passo 3: Criar API Key**

1. Clique em **"Create API Key"**
2. Selecione um projeto Google Cloud (ou crie um novo - é grátis)
3. Copie a API key gerada (começa com `AIzaSy...`)

⚠️ **IMPORTANTE**: Guarde essa chave em local seguro! Ela dá acesso à sua conta.

---

## ⚙️ **Configuração**

### **1. Instalar dependência**

```bash
cd backend
pip install google-generativeai
```

Ou instale todas as dependências:

```bash
pip install -r requirements.txt
```

### **2. Configurar variáveis de ambiente**

Crie ou edite o arquivo `backend/.env`:

```bash
# ==================== IA ====================

# Provedor de IA ("fake" para dev, "gemini" para produção)
AI_PROVIDER=gemini

# API Key do Google Gemini (obrigatória se AI_PROVIDER=gemini)
GEMINI_API_KEY=AIzaSyA...sua_chave_aqui

# Modelo a usar (opcional, default: gemini-1.5-flash)
GEMINI_MODEL=gemini-1.5-flash

# Configurações avançadas (opcional)
AI_MAX_RETRIES=3
AI_TIMEOUT=30
```

### **3. Verificar configuração**

Teste se está tudo OK:

```bash
cd backend
python -m app.config
```

Você deve ver:

```
==================================================
📋 CONFIGURAÇÕES CARREGADAS
==================================================
...
AI_PROVIDER: gemini
GEMINI_MODEL: gemini-1.5-flash
GEMINI_API_KEY: AIzaSyA...xyz
==================================================
```

---

## 🚀 **Uso**

### **Modo Desenvolvimento (FakeAI)**

Para desenvolvimento, use IA fake (rápido, sem custo):

```bash
# backend/.env
AI_PROVIDER=fake
```

### **Modo Produção (Gemini)**

Para usar IA real:

```bash
# backend/.env
AI_PROVIDER=gemini
GEMINI_API_KEY=sua_chave_aqui
```

### **Trocar entre modos**

Basta alterar `AI_PROVIDER` no `.env` e reiniciar o servidor:

```bash
# Parar servidor (Ctrl+C)
# Editar .env
# Reiniciar servidor
uvicorn app.main:app --reload
```

O sistema **automaticamente** usa a IA correta! 🎉

---

## 🔬 **Testando a IA**

### **1. Gerar desafios**

```bash
curl -X POST http://localhost:8000/challenges/generate/user123
```

Com IA real, você verá desafios **personalizados** baseados no perfil!

### **2. Avaliar submissão**

```bash
curl -X POST http://localhost:8000/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "user123",
    "challenge_id": 1,
    "submitted_code": {"text": "function add(a,b){return a+b}"}
  }'
```

A IA vai analisar o código e retornar:
- Nota geral
- Métricas detalhadas
- Pontos positivos/negativos
- Skill assessment inteligente
- Sugestões de melhoria

---

## 🎯 **Tracks Suportados**

A IA detecta automaticamente o track baseado no `career_goal` do usuário e gera desafios específicos:

| Track | Detectado por | Tipos de Desafio |
|-------|---------------|------------------|
| **Data Engineer** | "data engineer", "pipeline", "etl", "airflow", "spark" | data-exploration, data-pipeline, performance-tuning |
| **Frontend** | "frontend", "front", "react", "vue", "angular", "ui/ux" | bugfix, feature, ui-ux, performance |
| **Backend** | "backend", "back", "api", "server", "node", "python" | api-design, bugfix, performance, security |
| **Fullstack** | "fullstack", "full-stack" ou não especificado | **Mix embaralhado de front + back!** 🔄 |

### **Comportamento Fullstack** 🔄

Quando o usuário tem `career_goal` contendo "fullstack" ou não especifica uma área, a IA:

✅ **Mistura desafios** de frontend e backend  
✅ Gera **pelo menos 1 desafio de Frontend**  
✅ Gera **pelo menos 1 desafio de Backend**  
✅ O 3º desafio pode ser de qualquer área  
✅ **Embaralha a ordem** (aleatório)

**Exemplo:**
```json
{
  "career_goal": "Desenvolvedor Full Stack"
}
```

**Resultado:**
- Desafio 1: Implementar endpoint REST (Backend - Python)
- Desafio 2: Corrigir bug no componente React (Frontend - JavaScript)
- Desafio 3: Planejar arquitetura de autenticação (Fullstack)

---

## 🐛 **Troubleshooting**

### **Erro: "GEMINI_API_KEY não configurada"**

**Causa**: Variável de ambiente não definida.

**Solução**:
1. Verifique se o arquivo `.env` existe em `backend/.env`
2. Confirme que tem a linha: `GEMINI_API_KEY=sua_chave`
3. Reinicie o servidor

### **Erro: "google-generativeai não instalado"**

**Causa**: Pacote não instalado.

**Solução**:
```bash
pip install google-generativeai
```

### **Erro: "API key inválida"**

**Causa**: API key errada ou expirada.

**Solução**:
1. Gere uma nova API key no AI Studio
2. Atualize o `.env`
3. Reinicie o servidor

### **Erro: "Rate limit exceeded"**

**Causa**: Muitas requisições em curto período.

**Solução**:
- **Grátis**: 60 requisições/minuto
- Aguarde 1 minuto e tente novamente
- Ou considere upgrade para quota maior

### **Erro: Resposta muito lenta**

**Causa**: Prompt complexo ou API sobrecarregada.

**Solução**:
- Aumente `AI_TIMEOUT` no `.env`: `AI_TIMEOUT=60`
- Use modelo Flash em vez de Pro (mais rápido)

### **Erro: JSON inválido na resposta**

**Causa**: IA retornou formato inesperado.

**Solução**:
- Sistema já tem retry automático
- Se persistir, verifique os logs em `backend/logs/`
- Reporte o issue com o log completo

---

## 💰 **Custos e Limites**

### **Tier Gratuito (Free)**

O Google oferece uso gratuito generoso:

- ✅ **60 requisições/minuto**
- ✅ **1,500 requisições/dia**
- ✅ **1 milhão de tokens/mês**
- ✅ **Sem cartão de crédito necessário**

Para o Praxis MVP, isso é **mais que suficiente**!

### **Modelos Disponíveis**

| Modelo | Velocidade | Inteligência | Recomendação |
|--------|-----------|--------------|--------------|
| `gemini-1.5-flash` | ⚡ Rápido | ⭐⭐⭐ Boa | ✅ **Usar este** |
| `gemini-1.5-pro` | 🐌 Lento | ⭐⭐⭐⭐⭐ Excelente | Apenas se necessário |

**Flash** é perfeito para:
- Gerar desafios
- Avaliar código
- Análise de texto

Use **Pro** apenas se precisar de:
- Análise extremamente profunda
- Raciocínio complexo multi-step

### **Estimativa de Consumo**

Para referência:

| Operação | Tokens (aprox) | Requisições/dia (100 usuários) |
|----------|----------------|-------------------------------|
| Gerar 3 desafios | ~2,000 | 100 |
| Avaliar submissão | ~1,500 | 300 |
| **TOTAL** | | ~400 req/dia |

**Conclusão**: Tier gratuito aguenta **~375 usuários ativos/dia**! 🎉

---

## 📊 **Monitoramento**

### **Ver logs da IA**

Os logs incluem informações de uso:

```bash
tail -f backend/logs/app.log | grep -i gemini
```

Você verá:

```json
{
  "message": "Gemini API call successful",
  "extra_data": {
    "input_tokens": 1234,
    "output_tokens": 567,
    "attempt": 1
  }
}
```

### **Dashboard do Google**

Acesse: https://aistudio.google.com/app/apikey

Clique em **"View API usage"** para ver:
- Requisições por dia
- Tokens consumidos
- Erros
- Latência

---

## 🔐 **Segurança**

### **Proteja sua API Key**

❌ **NUNCA faça isso:**

```bash
# ❌ Não commite a chave no git!
git add backend/.env
```

✅ **Faça isso:**

```bash
# ✅ .env já está no .gitignore
# ✅ Use variáveis de ambiente em produção
# ✅ Rotacione a chave periodicamente
```

### **Produção (Railway, Heroku, etc)**

Configure como variável de ambiente:

```bash
# Railway CLI
railway variables set GEMINI_API_KEY=sua_chave

# Heroku CLI
heroku config:set GEMINI_API_KEY=sua_chave

# Ou pelo dashboard web de cada plataforma
```

---

## 🎯 **Melhores Práticas**

### **Desenvolvimento**

```bash
AI_PROVIDER=fake  # Rápido, sem custos, sem rate limits
```

### **Staging/Homologação**

```bash
AI_PROVIDER=gemini  # Testar IA real antes de prod
GEMINI_MODEL=gemini-1.5-flash  # Modelo rápido
```

### **Produção**

```bash
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-1.5-flash  # Ou pro se necessário
AI_MAX_RETRIES=3  # Retry em caso de erro
AI_TIMEOUT=60  # Timeout maior
```

---

## 📚 **Recursos Adicionais**

- 📖 **Documentação oficial**: https://ai.google.dev/docs
- 💬 **Discord da comunidade**: https://discord.gg/google-ai
- 🐛 **Reportar bugs**: https://github.com/google/generative-ai-python/issues

---

## 🎉 **Pronto!**

Sua IA real está configurada! 🚀

O Praxis agora pode:
- ✅ Gerar desafios personalizados por track (Frontend, Backend, Data Engineer)
- ✅ Avaliar código/texto com análise qualitativa
- ✅ Calcular progressão de skills inteligentemente
- ✅ Fornecer feedback construtivo e detalhado

**Aproveite!** 🎯


