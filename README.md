# Praxis

Plataforma de desenvolvimento profissional que utiliza IA para gerar desafios personalizados, avaliar solucoes e acompanhar a progressao de habilidades de desenvolvedores.

## Sobre o Projeto

Praxis e uma plataforma que ajuda desenvolvedores a evoluirem suas habilidades tecnicas e comportamentais atraves de:

1. **Desafios Personalizados**: Sistema de IA que gera desafios adaptados ao nivel e objetivos do usuario
2. **Avaliacao Inteligente**: Feedback detalhado sobre codigo, comunicacao e planejamento
3. **Progressao de Habilidades**: Acompanhamento da evolucao em multiplas competencias
4. **Analise de Curriculo**: Sugestoes de melhoria baseadas em IA

## Funcionalidades Principais

- Geracao automatica de 3 tipos de desafios: codigo, comunicacao e planejamento
- Sistema de timer para simular pressao de ambiente real
- Avaliacao com IA (Google Gemini) e feedback detalhado
- Dashboard com historico de desafios e progressao
- Analise de curriculo com sugestoes personalizadas
- Sistema de autenticacao seguro (Supabase Auth + GitHub OAuth)

## Tecnologias Utilizadas

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Banco de Dados**: PostgreSQL via Supabase
- **ORM**: SQLModel
- **IA**: Google Gemini 2.5 Flash
- **Autenticacao**: Supabase Auth (JWT)

### Frontend
- **Framework**: React 18 com Vite
- **Estilizacao**: Tailwind CSS
- **Roteamento**: React Router v6
- **Editor de Codigo**: Monaco Editor
- **Notificacoes**: Sistema de Toast customizado

### Infraestrutura
- **Containerizacao**: Docker + Docker Compose
- **Proxy**: Nginx (producao)

## Como Rodar Localmente

### Pre-requisitos

- Docker e Docker Compose (recomendado)
- OU Node.js 18+ e Python 3.11+
- Conta no Supabase
- API Key do Google Gemini

### Opcao 1: Com Docker (Recomendado)

```bash
# Clonar repositorio
git clone <repository-url>
cd Praxis

# Configurar variaveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar os arquivos .env com suas credenciais

# Iniciar servicos
docker-compose up -d

# Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Docs API: http://localhost:8000/docs
```

Ver `README_DOCKER.md` para detalhes.

### Opcao 2: Sem Docker

#### Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env (ver backend/.env.example)
# Executar migracoes no Supabase (ver backend/migrations/)

# Iniciar servidor
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env (ver frontend/.env.example)

# Iniciar dev server
npm run dev
```

## Estrutura do Projeto

```
Praxis/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── domain/         # Logica de negocio
│   │   ├── infra/          # Implementacoes (DB, IA)
│   │   ├── routers/        # Endpoints da API
│   │   └── schemas/        # Validacao Pydantic
│   ├── migrations/         # Scripts SQL
│   └── requirements.txt
├── frontend/               # App React
│   ├── src/
│   │   ├── assets/
│   │   │   ├── components/ # Componentes React
│   │   │   ├── pages/      # Paginas
│   │   │   ├── hooks/      # Custom hooks
│   │   │   └── utils/      # Utilitarios
│   │   └── App.jsx
│   └── package.json
└── docker-compose.yml      # Orquestracao Docker
```

## Documentacao

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitetura detalhada do sistema
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia de deploy e configuracao
- **[README_DOCKER.md](README_DOCKER.md)** - Instrucoes Docker
- **[backend/AI_SETUP.md](backend/AI_SETUP.md)** - Configuracao do Gemini
- **[backend/AUTHENTICATION.md](backend/AUTHENTICATION.md)** - Sistema de autenticacao
- **[backend/README_DEV.md](backend/README_DEV.md)** - Guia de desenvolvimento

## Licenca

Este projeto foi desenvolvido como projeto academico.