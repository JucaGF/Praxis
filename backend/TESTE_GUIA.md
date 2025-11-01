# 🎯 GUIA COMPLETO: Como Testar o Backend

## 📌 Situação Atual

Você tem um backend com autenticação Supabase, mas quer testar **SEM complicação** antes de integrar com o frontend.

---

## ✅ SOLUÇÃO SIMPLES: Modo Desenvolvimento (Sem Auth)

### 1️⃣ Configure o Ambiente

Abra o arquivo `.env` e adicione:

```bash
AUTH_ENABLED=false
```

**O que isso faz?**
- ✅ Desliga autenticação JWT
- ✅ Todas as rotas usam automaticamente o usuário de desenvolvimento
- ✅ Não precisa enviar token

---

### 2️⃣ Prepare o Banco de Dados

**Opção A: Via SQL (Mais Rápido)**

```bash
# Entre no PostgreSQL
psql postgresql://seu_usuario:senha@localhost:5432/seu_banco

# Ou se estiver usando Supabase local
psql postgresql://postgres:postgres@localhost:54322/postgres
```

Depois cole e execute o conteúdo do arquivo `seed_dev_user.sql`:

```sql
-- Remove dados antigos
DELETE FROM submission_feedbacks WHERE submission_id IN (SELECT id FROM submissions WHERE profile_id = '00000000-0000-0000-0000-000000000001');
DELETE FROM submissions WHERE profile_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM challenges WHERE profile_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM attributes WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';

-- Cria profile
INSERT INTO profiles (id, full_name, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Dev User (Mock)', 'dev@mock.local');

-- Cria attributes com dados mock
INSERT INTO attributes (user_id, career_goal, soft_skills, tech_skills) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Desenvolver habilidades técnicas e soft skills de forma equilibrada',
    '{"comunicacao": 50, "trabalho_em_equipe": 50, "resolucao_problemas": 50, "adaptabilidade": 50, "lideranca": 40}'::jsonb,
    '{"Python": 60, "FastAPI": 55, "React": 45, "JavaScript": 50, "SQL": 55, "Git": 60, "Docker": 40, "APIs REST": 65}'::jsonb
);
```

**Opção B: Via Endpoint (Mais Fácil)**

```bash
# Delete usuário antigo (se existir)
curl -X DELETE http://localhost:8000/dev/reset-dev-user

# Cria usuário dev com dados mock
curl -X POST http://localhost:8000/dev/create-dev-user
```

---

### 3️⃣ Teste as Rotas

Agora **TODAS** as rotas funcionam sem precisar de token!

#### ✅ Ver seus atributos:
```bash
curl http://localhost:8000/attributes
```

**Resposta esperada:**
```json
{
  "profile_id": "00000000-0000-0000-0000-000000000001",
  "career_goal": "Desenvolver habilidades técnicas e soft skills de forma equilibrada",
  "soft_skills": {
    "comunicacao": 50,
    "trabalho_em_equipe": 50,
    "resolucao_problemas": 50,
    "adaptabilidade": 50,
    "lideranca": 40
  },
  "tech_skills": {
    "Python": 60,
    "FastAPI": 55,
    "React": 45,
    "JavaScript": 50,
    "SQL": 55,
    "Git": 60,
    "Docker": 40,
    "APIs REST": 65
  }
}
```

#### ✅ Gerar desafios:
```bash
curl -X POST http://localhost:8000/challenges/generate
```

#### ✅ Listar desafios:
```bash
curl http://localhost:8000/challenges/active
```

#### ✅ Ver desafio específico:
```bash
curl http://localhost:8000/challenges/1
```

#### ✅ Submeter solução:
```bash
curl -X POST http://localhost:8000/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": 1,
    "submitted_code": {"solution": "print(\"Hello World\")"},
    "commit_message": "Primeira tentativa"
  }'
```

---

## 🔒 QUANDO ATIVAR AUTENTICAÇÃO (Produção)

### 1️⃣ Configure o `.env`

```bash
AUTH_ENABLED=true
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_anon_key
SUPABASE_JWT_SECRET=seu_jwt_secret
```

### 2️⃣ Como Testar com Autenticação

#### Passo 1: Pegue um token do Supabase

**Via Frontend (JavaScript):**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@example.com',
  password: 'senha123'
})

const token = data.session.access_token
console.log(token)
```

**Via cURL (API Supabase):**
```bash
curl -X POST https://seu-projeto.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: sua_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "senha123"
  }'
```

#### Passo 2: Use o token nas requisições

```bash
# Substitua SEU_TOKEN pelo token obtido
curl http://localhost:8000/attributes \
  -H "Authorization: Bearer SEU_TOKEN"

curl -X POST http://localhost:8000/challenges/generate \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🆘 Troubleshooting

### ❌ Erro: "Attributes não encontrados"
**Causa:** Usuário dev não foi criado no banco

**Solução:**
```bash
curl -X POST http://localhost:8000/dev/create-dev-user
```

### ❌ Erro: "Token inválido"
**Causa:** `AUTH_ENABLED=true` mas você não está enviando token

**Solução:** 
- Opção 1: Mude para `AUTH_ENABLED=false` no `.env`
- Opção 2: Obtenha um token do Supabase e envie no header

### ❌ Erro: Foreign key violation
**Causa:** Tentou criar attributes antes do profile

**Solução:** Delete tudo e recrie:
```bash
curl -X DELETE http://localhost:8000/dev/reset-dev-user
curl -X POST http://localhost:8000/dev/create-dev-user
```

---

## 📝 Resumo: Como Testar AGORA

```bash
# 1. Configure .env
echo "AUTH_ENABLED=false" >> .env

# 2. Crie usuário dev
curl -X POST http://localhost:8000/dev/create-dev-user

# 3. Teste livremente (sem token!)
curl http://localhost:8000/attributes
curl -X POST http://localhost:8000/challenges/generate
curl http://localhost:8000/challenges/active
```

**Pronto! 🎉** Agora você pode testar todas as rotas sem complicação.

---

## 🔄 Quando Integrar com Frontend

1. Mude `AUTH_ENABLED=true` no `.env`
2. Frontend faz login no Supabase
3. Frontend envia token em cada requisição
4. Backend valida automaticamente

**Nada muda no código!** Apenas a configuração.

