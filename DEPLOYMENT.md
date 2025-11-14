# Guia de Deployment - Praxis

## Requisitos

### Software Necessario
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Conta no Supabase (para banco de dados e autenticacao)
- API Key do Google Gemini

### Recursos Minimos
- **Desenvolvimento**: 4GB RAM, 2 CPU cores
- **Producao**: 8GB RAM, 4 CPU cores, 50GB disco

## Configuracao Inicial

### 1. Clonar o Repositorio

```bash
git clone <repository-url>
cd Praxis
```

### 2. Configurar Variaveis de Ambiente

#### Backend (.env no diretorio backend/)

Crie um arquivo `.env` em `backend/`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Database
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres

# Google Gemini AI
GEMINI_API_KEY=sua-api-key-do-gemini

# Configuracoes da Aplicacao
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Opcional: Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

#### Frontend (.env no diretorio frontend/)

Crie um arquivo `.env` em `frontend/`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
VITE_API_URL=https://api.seu-dominio.com
```

### 3. Configurar Supabase

#### 3.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves de API

#### 3.2. Executar Migrations

Execute os scripts SQL em `backend/migrations/` na ordem:

1. `create_profile_trigger.sql` ou `update_profile_trigger_no_mock.sql`
2. `add_strong_skills_to_attributes.sql`
3. `add_file_support_resumes.sql`
4. Outros scripts conforme necessario

#### 3.3. Configurar Row Level Security (RLS)

No Supabase SQL Editor, execute:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- Politicas basicas (ajuste conforme necessario)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Repita para outras tabelas...
```

#### 3.4. Configurar Autenticacao

No Supabase Dashboard:
1. Va em Authentication > Providers
2. Habilite Email/Password
3. (Opcional) Configure GitHub OAuth:
   - Crie OAuth App no GitHub
   - Adicione credenciais no Supabase
   - Configure redirect URL: `https://seu-projeto.supabase.co/auth/v1/callback`

### 4. Obter API Key do Google Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API key
3. Adicione ao `.env` do backend

## Deployment com Docker

### Desenvolvimento

```bash
# Iniciar todos os servicos
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicos
docker-compose down
```

Acessar:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Docs API: http://localhost:8000/docs

### Producao

#### Usando Docker Compose

1. Ajustar `docker-compose.yml` para producao:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile  # Usar Dockerfile de producao
    environment:
      - ENVIRONMENT=production
    restart: always
    ports:
      - "8000:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile  # Usar Dockerfile de producao
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # Certificados SSL
```

2. Build e deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Usando Servicos Cloud

##### Backend (Exemplo: Render, Railway, Fly.io)

1. Conectar repositorio Git
2. Configurar variaveis de ambiente
3. Definir comando de start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Deploy automatico via Git push

##### Frontend (Exemplo: Vercel, Netlify)

1. Conectar repositorio Git
2. Configurar variaveis de ambiente
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy automatico via Git push

## Configuracao de Nginx (Producao)

Exemplo de configuracao para proxy reverso:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoramento

### Health Check

Endpoint: `GET /health`

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-14T12:00:00Z"
}
```

### Logs

#### Backend
```bash
# Docker
docker-compose logs -f backend

# Producao (se usando arquivo)
tail -f backend.log
```

#### Frontend
- Logs no browser console
- Erros enviados para sistema de monitoramento (se configurado)

## Backup

### Banco de Dados

O Supabase faz backup automatico. Para backup manual:

```bash
# Exportar via Supabase CLI
supabase db dump -f backup.sql

# Ou via pg_dump
pg_dump -h db.seu-projeto.supabase.co -U postgres -d postgres > backup.sql
```

### Restaurar Backup

```bash
psql -h db.seu-projeto.supabase.co -U postgres -d postgres < backup.sql
```

## Troubleshooting

### Backend nao inicia

1. Verificar variaveis de ambiente
2. Verificar conexao com banco de dados
3. Verificar logs: `docker-compose logs backend`

### Frontend nao conecta ao backend

1. Verificar `VITE_API_URL` no `.env`
2. Verificar CORS no backend
3. Verificar rede Docker

### Erros de autenticacao

1. Verificar chaves do Supabase
2. Verificar RLS policies
3. Verificar token JWT no localStorage

### IA nao gera desafios

1. Verificar `GEMINI_API_KEY`
2. Verificar quota da API
3. Verificar logs de erro da IA

## Atualizacoes

### Atualizar Codigo

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Executar Novas Migrations

1. Adicionar script SQL em `backend/migrations/`
2. Executar no Supabase SQL Editor
3. Documentar no historico de migrations

## Seguranca

### Checklist de Seguranca

- [ ] Variaveis de ambiente nao commitadas no Git
- [ ] HTTPS habilitado em producao
- [ ] RLS configurado no Supabase
- [ ] CORS restrito a dominios conhecidos
- [ ] Rate limiting habilitado
- [ ] Senhas fortes no banco de dados
- [ ] API keys rotacionadas periodicamente
- [ ] Logs de acesso habilitados

### Rotacao de Chaves

1. Gerar novas chaves no Supabase/Gemini
2. Atualizar variaveis de ambiente
3. Reiniciar servicos
4. Revogar chaves antigas apos confirmacao

## Escalabilidade

### Horizontal Scaling

- Backend: Adicionar mais instancias do container
- Load Balancer: Nginx, HAProxy, ou cloud load balancer
- Database: Supabase escala automaticamente

### Vertical Scaling

- Aumentar recursos do container (CPU, RAM)
- Ajustar workers do Uvicorn: `--workers 4`

## Custos Estimados

### Desenvolvimento
- Supabase: Free tier
- Gemini API: Free tier (limite de requisicoes)
- Total: $0/mes

### Producao (estimativa)
- Supabase Pro: $25/mes
- Gemini API: ~$50/mes (dependendo do uso)
- Hospedagem Backend: $10-50/mes
- Hospedagem Frontend: $0-20/mes
- Total: ~$85-145/mes

## Suporte

Para problemas ou duvidas:
1. Verificar logs
2. Consultar documentacao tecnica
3. Revisar issues conhecidos
4. Contatar equipe de desenvolvimento



