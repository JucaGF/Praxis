# 🐳 Docker - Guia Completo Praxis

## 🎯 Quando usar Docker?

**✅ USE Docker se:**
- Trabalha em equipe com ambientes diferentes (Linux + Windows + Mac)
- Quer garantir que todos rodem o mesmo ambiente
- Vai fazer deploy em produção
- Novo membro entrando no time

**❌ Não precisa de Docker se:**
- Trabalha sozinho
- Todos da equipe usam o mesmo OS
- Prefere rodar localmente

---

## 📋 Pré-requisitos

1. **Docker** instalado ([Download](https://www.docker.com/get-started))
2. **Docker Compose** instalado (geralmente vem com Docker Desktop)
3. Arquivo `.env` configurado na raiz do projeto

**⚠️ Equipes:** Leia o `GUIA_EQUIPE.md` para setup colaborativo!

---

## 🚀 Como usar

### **1. Configurar variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# Ambiente
ENVIRONMENT=production
DEBUG=False

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# AI Provider
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key

# Frontend
VITE_API_URL=http://localhost:8000
```

### **2. Iniciar todos os serviços**

#### **Produção** (otimizado, sem hot-reload):

```bash
# Build e iniciar (primeira vez)
docker-compose up --build

# Iniciar em background (daemon)
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

#### **Desenvolvimento** (com hot-reload):

```bash
# Build e iniciar modo desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Iniciar em background
docker-compose -f docker-compose.dev.yml up -d

# Parar
docker-compose -f docker-compose.dev.yml down
```

**Diferenças:**
- **Produção**: Nginx servindo build otimizado do React
- **Desenvolvimento**: Vite dev server com hot-reload, código montado do host

### **3. Acessar a aplicação**

#### **Produção**:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

#### **Desenvolvimento**:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

---

## ⚡ Atalhos - 2 opções

### **Opção 1: Makefile** (recomendado)

```bash
# Ver todos os comandos disponíveis
make help

# Desenvolvimento
make dev          # Inicia ambiente de desenvolvimento
make build-dev    # Build containers de dev
make up-dev       # Inicia dev em background
make down-dev     # Para dev
make logs-dev     # Ver logs de dev

# Produção
make prod         # Inicia ambiente de produção
make build-prod   # Build containers de produção
make up-prod      # Inicia prod em background
make down-prod    # Para prod
make logs-prod    # Ver logs de prod

# Utilitários
make logs         # Ver logs
make ps           # Lista containers
make clean        # Limpa tudo
make backend-shell    # Abre shell no backend
make frontend-shell   # Abre shell no frontend
```

### **Opção 2: Script Shell** (se não tiver Make)

```bash
# Ver ajuda
./docker.sh help

# Comandos
./docker.sh dev          # Desenvolvimento
./docker.sh prod         # Produção
./docker.sh build-dev    # Build dev
./docker.sh build-prod   # Build prod
./docker.sh up-dev       # Sobe dev em background
./docker.sh up-prod      # Sobe prod em background
./docker.sh down         # Para tudo
./docker.sh logs         # Ver logs
./docker.sh clean        # Limpa tudo
./docker.sh ps           # Lista containers
```

---

## 🛠️ Comandos úteis (Docker direto)

### **Ver logs**

```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs apenas do backend
docker-compose logs -f backend

# Logs apenas do frontend
docker-compose logs -f frontend
```

### **Reconstruir containers**

```bash
# Rebuild específico
docker-compose build backend
docker-compose build frontend

# Rebuild tudo
docker-compose build --no-cache
```

### **Executar comandos dentro do container**

```bash
# Entrar no container do backend
docker-compose exec backend bash

# Rodar migrações (se houver)
docker-compose exec backend alembic upgrade head

# Instalar nova dependência
docker-compose exec backend pip install nova-lib
```

### **Ver containers rodando**

```bash
docker ps

# Ver todos (incluindo parados)
docker ps -a
```

---

## 📦 Estrutura Docker

```
Praxis/
├── docker-compose.yml          # Orquestra backend + frontend
├── backend/
│   ├── Dockerfile             # Build do backend FastAPI
│   └── .dockerignore          # Ignora __pycache__, .venv, etc
└── frontend/
    ├── Dockerfile             # Build do frontend React/Vite
    ├── nginx.conf             # Configuração do servidor web
    └── .dockerignore          # Ignora node_modules, etc
```

---

## 🔧 Resumo dos arquivos Docker

```
Praxis/
├── docker-compose.yml          # ⚡ PRODUÇÃO - Otimizado, build final
├── docker-compose.dev.yml      # 🛠️ DESENVOLVIMENTO - Hot-reload
├── .dockerignore               # Ignora arquivos na raiz
├── backend/
│   ├── Dockerfile             # Build backend (produção)
│   ├── requirements.txt       # Dependências Python
│   └── .dockerignore          # Ignora __pycache__, .venv, etc
└── frontend/
    ├── Dockerfile             # Build frontend (produção - Nginx)
    ├── Dockerfile.dev         # Build frontend (dev - Vite)
    ├── nginx.conf             # Config Nginx para produção
    └── .dockerignore          # Ignora node_modules, etc
```

**Use `docker-compose.yml` para produção e `docker-compose.dev.yml` para desenvolvimento!**

---

## 🐛 Troubleshooting

### **Erro: "port is already allocated"**

Alguma aplicação já está usando a porta. Pare o processo ou mude a porta no `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Muda de 8000 para 8001
```

### **Erro: "No space left on device"**

Limpar imagens/containers antigos:

```bash
# Limpar tudo que não está em uso
docker system prune -a

# Limpar volumes também
docker system prune -a --volumes
```

### **Backend não conecta no Supabase**

Verifique se as variáveis de ambiente estão corretas no `.env`:

```bash
# Ver variáveis do container
docker-compose exec backend env | grep SUPABASE
```

### **Frontend não carrega**

1. Verifica logs: `docker-compose logs frontend`
2. Rebuild: `docker-compose build --no-cache frontend`
3. Acesse: http://localhost

---

## 🚀 Deploy

### **Docker Hub** (compartilhar imagens)

```bash
# Tag das imagens
docker tag praxis-backend:latest seu-usuario/praxis-backend:latest
docker tag praxis-frontend:latest seu-usuario/praxis-frontend:latest

# Push para Docker Hub
docker push seu-usuario/praxis-backend:latest
docker push seu-usuario/praxis-frontend:latest
```

### **Servidor remoto**

1. Copie `docker-compose.yml` e `.env` para o servidor
2. No servidor:

```bash
docker-compose pull
docker-compose up -d
```

---

## 📊 Monitoramento

### **Ver uso de recursos**

```bash
docker stats
```

### **Inspecionar container**

```bash
docker inspect praxis-backend
```

---

## ✅ Checklist de Deploy

- [ ] Arquivo `.env` configurado com variáveis de produção
- [ ] `DEBUG=False` no `.env`
- [ ] `ENVIRONMENT=production` no `.env`
- [ ] Credenciais do Supabase corretas
- [ ] API Key do Gemini configurada
- [ ] Portas 80 e 8000 liberadas no firewall
- [ ] SSL/HTTPS configurado (nginx reverse proxy ou Cloudflare)

---

## 📚 Recursos

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [FastAPI Docker Guide](https://fastapi.tiangolo.com/deployment/docker/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

#### 1. Erro de Permissão (EACCES ou Permission Denied)

**Sintomas:**
```
npm error code EACCES
PermissionError: Permission denied (os error 13)
```

**Solução:**
Os containers estão configurados para rodar com UID/GID 1000 (padrão Linux). Se seu usuário tem um UID diferente, ajuste no `docker-compose.dev.yml`:

```bash
# Descubra seu UID
id -u  # Ex: 1001

# Edite docker-compose.dev.yml e altere:
user: "1001:1001"  # Use seu UID:GID
```

#### 2. Porta Já em Uso

**Sintomas:**
```
address already in use
```

**Solução:**
Pare os servidores locais antes de usar Docker:

```bash
# Linux/Mac
killall uvicorn node

# Ou altere as portas no docker-compose.dev.yml:
ports:
  - "8001:8000"  # Backend na porta 8001
  - "5174:5173"  # Frontend na porta 5174
```

#### 3. ModuleNotFoundError no Backend

**Sintomas:**
```
ModuleNotFoundError: No module named 'backend'
```

**Solução:**
Certifique-se de que o `working_dir` está correto e o volume está montado:
- Deve ser `/workspace` (não `/app`)
- O comando deve ser `uvicorn backend.app.main:app`

#### 4. Alterações Não Aparecem (Hot Reload)

**Desenvolvimento:**
- Backend: Alterações em `.py` devem recarregar automaticamente
- Frontend: Alterações em `.jsx` devem recarregar automaticamente

Se não funcionar:
```bash
# Rebuild containers
make clean
make build-dev
make dev
```

### Comandos Úteis de Debug

```bash
# Ver logs detalhados
docker-compose -f docker-compose.dev.yml logs -f

# Acessar shell do backend
make shell-be
# ou
docker exec -it praxis-backend-dev /bin/bash

# Acessar shell do frontend
make shell-fe
# ou
docker exec -it praxis-frontend-dev /bin/sh

# Ver processos em execução
docker-compose -f docker-compose.dev.yml ps

# Inspecionar um container
docker inspect praxis-backend-dev

# Ver uso de recursos
docker stats
```

### Reset Completo

Se nada funcionar, faça um reset completo:

```bash
# Para e remove tudo
make clean

# Rebuild sem cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Inicia novamente
make dev
```

---

## 🆘 Suporte

Se tiver problemas persistentes:
1. Veja os logs: `docker-compose logs -f`
2. Rebuild: `docker-compose build --no-cache`
3. Restart: `docker-compose restart`
4. Clean slate: `docker-compose down -v && docker-compose up --build`
5. Verifique seu UID: `id -u` e ajuste no `docker-compose.dev.yml`

---

**Pronto!** 🎉 Sua aplicação Praxis está dockerizada e pronta para rodar em qualquer lugar!

