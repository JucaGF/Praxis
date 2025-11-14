# Arquitetura do Sistema Praxis

## Visao Geral

Praxis e uma plataforma de desenvolvimento profissional que gera desafios personalizados para desenvolvedores, avalia suas solucoes e acompanha a progressao de habilidades ao longo do tempo.

## Stack Tecnologica

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Banco de Dados**: PostgreSQL (via Supabase)
- **ORM**: SQLModel
- **IA**: Google Gemini API
- **Autenticacao**: Supabase Auth (JWT)
- **Documentacao**: OpenAPI/Swagger

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Roteamento**: React Router v6
- **Estilizacao**: Tailwind CSS
- **Editor de Codigo**: Monaco Editor
- **Cliente HTTP**: Fetch API

### Infraestrutura
- **Containerizacao**: Docker + Docker Compose
- **Proxy Reverso**: Nginx (producao)
- **Hospedagem**: Configuravel (Docker-ready)

## Arquitetura Backend

### Estrutura de Pastas

```
backend/
├── app/
│   ├── domain/              # Logica de negocio (Domain Layer)
│   │   ├── services.py      # Servicos principais
│   │   ├── ports.py         # Interfaces (Repository, AI Service)
│   │   ├── exceptions.py    # Excecoes customizadas
│   │   └── auth_service.py  # Servico de autenticacao
│   │
│   ├── infra/               # Implementacoes (Infrastructure Layer)
│   │   ├── repo_sql.py      # Repositorio SQL (PostgreSQL)
│   │   ├── ai_gemini.py     # Integracao com Gemini
│   │   ├── document_parser.py  # Parser de curriculos
│   │   └── parser_config.py    # Configuracao do parser
│   │
│   ├── routers/             # Endpoints da API (Presentation Layer)
│   │   ├── challenges.py    # CRUD de desafios
│   │   ├── submissions.py   # Submissoes e avaliacoes
│   │   ├── attributes.py    # Perfil e habilidades
│   │   ├── profile.py       # Dados do perfil
│   │   ├── resumes.py       # Analise de curriculos
│   │   ├── session.py       # Gerenciamento de sessao
│   │   ├── account.py       # Gerenciamento de conta
│   │   ├── health.py        # Health check
│   │   └── dev.py           # Endpoints de desenvolvimento
│   │
│   ├── schemas/             # Schemas Pydantic (validacao)
│   │   ├── challenges.py
│   │   ├── submissions.py
│   │   ├── attributes.py
│   │   ├── feedbacks.py
│   │   ├── profiles.py
│   │   └── resumes.py
│   │
│   ├── datasets/            # Templates e geradores de dados
│   │   ├── templates.py     # Templates de desafios
│   │   └── generator.py     # Gerador de dados mock
│   │
│   ├── config.py            # Configuracoes (Pydantic Settings)
│   ├── deps.py              # Dependencias (DI)
│   ├── logging_config.py    # Configuracao de logs
│   └── main.py              # Entry point da aplicacao
│
├── migrations/              # Scripts SQL de migracao
├── scripts/                 # Scripts utilitarios
├── models.py                # Modelos SQLModel
├── db.py                    # Configuracao do banco
├── init_db.py               # Inicializacao do banco
└── requirements.txt         # Dependencias Python
```

### Padroes Arquiteturais

#### Clean Architecture / Hexagonal Architecture
- **Domain Layer**: Logica de negocio pura, sem dependencias externas
- **Infrastructure Layer**: Implementacoes concretas (DB, APIs externas)
- **Presentation Layer**: Controllers/Routers da API

#### Dependency Injection
- Uso de FastAPI Depends para injecao de dependencias
- Repositorios e servicos injetados via `deps.py`

#### Repository Pattern
- Interface `Repository` em `ports.py`
- Implementacao SQL em `repo_sql.py`
- Facilita testes e troca de implementacao

## Arquitetura Frontend

### Estrutura de Pastas

```
frontend/src/
├── assets/
│   ├── components/          # Componentes reutilizaveis
│   │   ├── challenges/      # Componentes de desafios
│   │   │   ├── CodeChallenge.jsx
│   │   │   ├── DailyTaskChallenge.jsx
│   │   │   ├── OrganizationChallenge.jsx
│   │   │   ├── ChallengeCardHome.jsx
│   │   │   └── EvaluationLoading.jsx
│   │   ├── ui/              # Componentes UI genericos
│   │   │   └── Toast.jsx
│   │   ├── ui.jsx           # Componentes base (Button, Card, etc)
│   │   ├── PraxisLogo.jsx
│   │   └── LoadingSpinner.jsx
│   │
│   ├── pages/               # Paginas principais
│   │   ├── Landing.jsx      # Pagina inicial publica
│   │   ├── Login.jsx        # Login
│   │   ├── Cadastro.jsx     # Cadastro
│   │   ├── Onboarding.jsx   # Onboarding de novos usuarios
│   │   ├── Home.jsx         # Dashboard principal
│   │   ├── Profile.jsx      # Perfil do usuario
│   │   ├── Challenge.jsx    # Pagina de desafio individual
│   │   ├── ChallengeResult.jsx  # Resultado da avaliacao
│   │   └── Questionario_*.jsx   # Questionarios de habilidades
│   │
│   ├── hooks/               # Custom React Hooks
│   │   ├── useAuth.js       # Hook de autenticacao
│   │   └── useChallengeTimer.js  # Hook de timer de desafios
│   │
│   ├── lib/                 # Integracoes externas
│   │   ├── api.js           # Cliente da API backend
│   │   └── supabaseClient.js  # Cliente Supabase
│   │
│   └── utils/               # Funcoes utilitarias
│       ├── errorMessages.js # Mapeamento de erros
│       ├── logger.js        # Sistema de logs
│       └── submissionHelpers.js  # Helpers de submissao
│
├── App.jsx                  # Componente raiz
├── main.jsx                 # Entry point
└── index.css                # Estilos globais
```

### Fluxo de Dados

1. **Autenticacao**:
   - Usuario faz login via Supabase Auth
   - Token JWT armazenado no localStorage
   - Hook `useAuth` gerencia estado de autenticacao

2. **Geracao de Desafios**:
   - Backend consulta perfil do usuario (habilidades, nivel)
   - IA Gemini gera 3 desafios personalizados
   - Streaming SSE para feedback em tempo real
   - Desafios salvos no banco com timer

3. **Resolucao de Desafios**:
   - Usuario resolve desafio (codigo, texto, planejamento)
   - Timer persistido em localStorage
   - Submissao enviada ao backend

4. **Avaliacao**:
   - IA Gemini avalia submissao baseada em criterios
   - Sistema calcula progressao de habilidades
   - Feedback detalhado retornado ao usuario
   - Habilidades atualizadas no perfil

## Modelo de Dados

### Entidades Principais

#### Profile
- Dados basicos do usuario
- Conectado ao Supabase Auth via `user_id`

#### Attributes
- Habilidades tecnicas (`tech_skills`)
- Habilidades comportamentais (`soft_skills`)
- Habilidades fortes (`strong_skills`)
- Objetivo de carreira (`career_goal`)

#### Challenge
- Desafio gerado pela IA
- Categoria: `code`, `daily-task`, `organization`
- Dificuldade: `easy`, `medium`, `hard`
- Descricao estruturada (JSON)
- Timer e status

#### Submission
- Solucao enviada pelo usuario
- Codigo/texto da resposta
- Tempo gasto
- Status: `pending`, `scored`, `failed`

#### Feedback
- Avaliacao da IA
- Nota geral (0-100)
- Progressao de habilidades
- Comentarios detalhados

#### Resume
- Curriculo do usuario
- Analise de habilidades pela IA
- Sugestoes de melhoria

## Sistema de Progressao de Habilidades

### Formula de Progressao

```python
delta = base_delta * difficulty_mult * performance_mult * level_mult * attempt_penalty
```

**Fatores**:
- `base_delta`: 5-15 pontos base
- `difficulty_mult`: 0.8 (easy), 1.0 (medium), 1.3 (hard)
- `performance_mult`: Baseado na nota (0.5 a 2.0)
- `level_mult`: Maior ganho em niveis baixos
- `attempt_penalty`: Reducao por tentativas multiplas

### Mapeamento de Habilidades

- Desafios afetam multiplas habilidades simultaneamente
- Sistema de mapeamento inteligente para soft skills
- Validacao para evitar criacao de habilidades inexistentes

## Seguranca

- **Autenticacao**: JWT via Supabase Auth
- **Autorizacao**: Row Level Security (RLS) no Supabase
- **Validacao**: Pydantic schemas no backend
- **Rate Limiting**: Configuravel por endpoint
- **CORS**: Configurado para dominios permitidos

## Monitoramento e Logs

- **Backend**: Logs estruturados via `logging_config.py`
- **Frontend**: Sistema de logs via `logger.js`
- **Erros**: Tratamento centralizado com mensagens amigaveis
- **Health Check**: Endpoint `/health` para monitoramento

## Deployment

Ver `DEPLOYMENT.md` para instrucoes detalhadas de deploy.

## Proximos Passos

- Implementar sistema de notificacoes
- Adicionar gamificacao (badges, streaks)
- Dashboard de analytics para usuarios
- Sistema de recomendacao de desafios
- Integracao com plataformas de codigo (GitHub, GitLab)



