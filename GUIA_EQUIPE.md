# 👥 Guia para Equipes Cross-Platform

Este guia é para equipes trabalhando com **Linux + Windows** juntos.

---

## 🎯 Por que Docker?

Sem Docker, vocês teriam problemas como:
- ❌ Versões diferentes de Python/Node entre Linux e Windows
- ❌ Caminhos de arquivos diferentes (`/` vs `\`)
- ❌ Dependências do sistema incompatíveis
- ❌ "Funciona no meu PC, mas não no seu"

**Com Docker:** ✅ **TODOS rodam exatamente o mesmo ambiente!**

---

## 🚀 Setup Inicial (TODOS os membros)

### **1. Instalar Docker**

**Windows:**
- Baixe [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Instale e reinicie o PC
- Verifique: `docker --version`

**Linux:**
- Siga o [guia oficial](https://docs.docker.com/engine/install/)
- Adicione seu usuário ao grupo docker: `sudo usermod -aG docker $USER`
- Faça logout/login
- Verifique: `docker --version`

### **2. Clonar o repositório**

```bash
git clone <url-do-repositorio>
cd Praxis
```

### **3. Criar arquivo `.env`**

Crie um arquivo `.env` na **raiz** do projeto com:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon
SUPABASE_JWT_SECRET=seu-jwt-secret

# Database
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres

# AI
GEMINI_API_KEY=sua-chave-gemini
AI_PROVIDER=gemini
```

**⚠️ IMPORTANTE:** Peça as credenciais para o líder da equipe!

---

## 💻 Desenvolvimento Diário

### **Iniciar ambiente de desenvolvimento**

```bash
# Opção 1: Makefile (Linux/Mac/Git Bash no Windows)
make dev

# Opção 2: Docker direto (funciona em todos)
docker-compose -f docker-compose.dev.yml up
```

**Aguarde ~2 minutos no primeiro build!**

### **Acessar a aplicação**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Docs API**: http://localhost:8000/docs

### **Parar o ambiente**

```bash
# Opção 1
make down

# Opção 2
docker-compose -f docker-compose.dev.yml down
```

---

## 🔄 Hot-Reload (Atualização automática)

**✅ Você edita o código → O container atualiza automaticamente!**

**Backend**: Qualquer mudança em `backend/**/*.py` reinicia o servidor  
**Frontend**: Qualquer mudança em `frontend/src/**/*` atualiza a página

**Não precisa rebuild!** 🎉

---

## 📦 Quando fazer rebuild?

Faça rebuild **APENAS** quando:
- Adicionar nova dependência no `requirements.txt` (backend)
- Adicionar novo pacote no `package.json` (frontend)
- Alguém atualizar os Dockerfiles

```bash
# Rebuild
docker-compose -f docker-compose.dev.yml up --build
```

---

## 🐛 Problemas Comuns

### **1. "Port is already allocated"**

Alguém já está usando a porta (você ou outro programa).

**Solução:**
```bash
# Parar containers antigos
docker-compose -f docker-compose.dev.yml down

# Linux: Matar processo na porta
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9

# Windows: Matar processo na porta (PowerShell como Admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
```

### **2. "ERROR: No module named 'backend'"**

O container não encontra o código. Rebuild:

```bash
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### **3. "Cannot connect to Supabase"**

Verifique o arquivo `.env`:

```bash
# Ver variáveis do container
docker-compose -f docker-compose.dev.yml exec backend env | grep SUPABASE
```

### **4. Mudanças não aparecem (Hot-reload não funciona)**

**Windows:** Docker Desktop tem um bug com file watching. Solução:

1. Abra Docker Desktop → Settings → Resources → File Sharing
2. Adicione a pasta do projeto
3. Restart containers:

```bash
docker-compose -f docker-compose.dev.yml restart
```

### **5. Container continua reiniciando**

Veja os logs para identificar o erro:

```bash
docker-compose -f docker-compose.dev.yml logs -f backend
# ou
docker-compose -f docker-compose.dev.yml logs -f frontend
```

---

## 📋 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.dev.yml logs -f

# Ver apenas backend
docker-compose -f docker-compose.dev.yml logs -f backend

# Ver apenas frontend
docker-compose -f docker-compose.dev.yml logs -f frontend

# Listar containers rodando
docker ps

# Entrar no container do backend (debug)
docker-compose -f docker-compose.dev.yml exec backend bash

# Entrar no container do frontend
docker-compose -f docker-compose.dev.yml exec frontend sh

# Limpar tudo (cuidado!)
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a
```

---

## 🔄 Workflow Diário

**1. Começar o dia:**
```bash
git pull
docker-compose -f docker-compose.dev.yml up
```

**2. Desenvolver:**
- Edite os arquivos normalmente
- As mudanças aparecem automaticamente
- Veja logs no terminal

**3. Terminar o dia:**
```bash
docker-compose -f docker-compose.dev.yml down
git add .
git commit -m "Descrição das mudanças"
git push
```

---

## 🎓 Onboarding Novo Membro

1. Instalar Docker
2. Clonar repositório
3. Pegar arquivo `.env` com o time
4. Rodar `docker-compose -f docker-compose.dev.yml up --build`
5. Pronto! ✅

**Tempo estimado: 10-15 minutos**

---

## 🆘 Suporte

**Algo não funcionou?**

1. Veja os logs: `docker-compose -f docker-compose.dev.yml logs -f`
2. Pergunte no chat da equipe
3. Rebuild do zero: `docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up --build`

---

## 📊 Resumo de Comandos Rápidos

```bash
# Iniciar
docker-compose -f docker-compose.dev.yml up

# Parar
docker-compose -f docker-compose.dev.yml down

# Rebuild
docker-compose -f docker-compose.dev.yml up --build

# Logs
docker-compose -f docker-compose.dev.yml logs -f

# Limpar tudo
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a
```

---

**Boa codificação! 🚀**

