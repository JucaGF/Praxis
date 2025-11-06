# Feature: Análise de Currículo com IA 📄🤖

## Visão Geral

Esta feature permite que os usuários façam upload de seus currículos e recebam feedback personalizado da IA baseado na trilha de conhecimento escolhida (Frontend, Backend, Data Engineer, Full Stack).

## Arquitetura

### Backend

#### 1. **Models** (`backend/models.py`)
- `Resume`: Armazena os currículos enviados
  - `id`: ID do currículo
  - `profile_id`: ID do perfil (FK)
  - `title`: Título do currículo
  - `original_content`: Conteúdo original do currículo
  - `created_at`: Data de criação

- `ResumeAnalysis`: Armazena as análises geradas pela IA
  - `id`: ID da análise
  - `resume_id`: ID do currículo (FK única)
  - `strengths`: Pontos fortes (texto)
  - `improvements`: Melhorias sugeridas (texto)
  - `full_report`: Relatório completo (JSONB)
  - `created_at`: Data da análise

#### 2. **Schemas** (`backend/app/schemas/resumes.py`)
- `ResumeUpload`: Schema para upload
- `ResumeResponse`: Schema de resposta de currículo
- `ResumeAnalysisResponse`: Schema de resposta de análise
- `ResumeWithAnalysis`: Schema combinado

#### 3. **Repository** (`backend/app/infra/repo_sql.py`)
Métodos adicionados:
- `create_resume()`: Cria um novo currículo
- `get_resumes()`: Lista currículos do usuário
- `get_resume()`: Busca currículo específico
- `create_resume_analysis()`: Cria análise de currículo
- `get_resume_analysis()`: Busca análise de currículo

#### 4. **AI Service** (`backend/app/infra/ai_gemini.py`)
- `analyze_resume()`: Analisa currículo usando Gemini AI
  - Detecta track automaticamente baseado no `career_goal`
  - Gera análise personalizada com:
    - Pontos fortes
    - Gaps técnicos
    - Sugestões de melhoria
    - Nota geral (0-100)
    - Resumo executivo
    - Habilidades evidenciadas
    - Próximos passos

#### 5. **Router** (`backend/app/routers/resumes.py`)
Endpoints:
- `POST /resumes/upload`: Upload de currículo
- `GET /resumes/`: Lista currículos do usuário
- `GET /resumes/{resume_id}`: Busca currículo com análise
- `POST /resumes/{resume_id}/analyze`: Analisa currículo
- `DELETE /resumes/{resume_id}`: Deleta currículo

### Frontend

#### 1. **API Client** (`frontend/src/assets/lib/api.js`)
Funções adicionadas:
- `uploadResume(resumeData)`
- `listResumes()`
- `getResumeWithAnalysis(resumeId)`
- `analyzeResume(resumeId)`
- `deleteResume(resumeId)`

#### 2. **UI Component** (`frontend/src/assets/pages/Home.jsx`)
Seção adicionada com:
- **Formulário de Upload**:
  - Campo de título (opcional)
  - Textarea para conteúdo do currículo
  - Botão de envio

- **Lista de Currículos**:
  - Mostra todos os currículos do usuário
  - Indica se já foi analisado
  - Botão para analisar/ver análise

- **Resultado da Análise**:
  - Nota geral (0-100)
  - Resumo executivo
  - Pontos fortes
  - Gaps técnicos
  - Sugestões de melhoria
  - Habilidades evidenciadas (com gráfico)
  - Próximos passos

## Como Usar

### 1. Upload de Currículo

```bash
# Via frontend: 
# - Acesse a Home
# - Clique em "Mostrar" na seção "Análise de Currículo"
# - Cole seu currículo no textarea
# - Clique em "Enviar Currículo"

# Via API:
curl -X POST "http://localhost:8000/resumes/upload" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meu Currículo 2024",
    "content": "# João Silva\n\nDesenvolvedor Frontend..."
  }'
```

### 2. Análise do Currículo

```bash
# Via frontend:
# - Clique em "Analisar com IA" no currículo desejado
# - Aguarde a análise (leva ~10-30 segundos)
# - Veja o resultado detalhado

# Via API:
curl -X POST "http://localhost:8000/resumes/1/analyze" \
  -H "Authorization: Bearer TOKEN"
```

### 3. Ver Análise Existente

```bash
# Via frontend:
# - Currículos com análise mostram badge "✓ Analisado"
# - Clique em "Ver Análise" para visualizar novamente

# Via API:
curl "http://localhost:8000/resumes/1" \
  -H "Authorization: Bearer TOKEN"
```

## Lógica de Análise

A análise é personalizada baseada no `career_goal` do usuário:

### Frontend Developer
- **Habilidades esperadas**: React, Vue, TypeScript, CSS, HTML5, Acessibilidade
- **Foco**: UI/UX, componentes, responsividade, performance
- **Gaps comuns**: Testes, acessibilidade, otimização

### Backend Developer
- **Habilidades esperadas**: Python/Node, APIs, SQL, Docker, Segurança
- **Foco**: Arquitetura, escalabilidade, segurança
- **Gaps comuns**: Microserviços, message brokers, testes de integração

### Data Engineer
- **Habilidades esperadas**: SQL, Python, Airflow, Spark, ETL, Cloud
- **Foco**: Pipelines, modelagem, processamento distribuído
- **Gaps comuns**: Orquestração, cloud platforms, data quality

### Full Stack
- **Habilidades esperadas**: React + Backend + SQL
- **Foco**: Visão holística, end-to-end
- **Gaps comuns**: Especialização profunda, DevOps

## Estrutura da Análise

```json
{
  "pontos_fortes": [
    "Experiência sólida com React e componentes modernos",
    "Conhecimento de TypeScript e boas práticas",
    "Portfolio com projetos relevantes"
  ],
  "gaps_tecnicos": [
    "Experiência com testes automatizados (Jest, Testing Library)",
    "Conhecimento em acessibilidade (WCAG, ARIA)",
    "Performance web (lazy loading, code splitting)"
  ],
  "sugestoes_melhoria": [
    "Adicionar métricas de impacto nos projetos (ex: 'Reduziu tempo de carregamento em 40%')",
    "Incluir certificações relevantes",
    "Destacar contribuições open source"
  ],
  "nota_geral": 78,
  "resumo_executivo": "Currículo sólido para Frontend Developer com experiência clara em React. Recomenda-se aprofundar em testes e acessibilidade para destacar-se no mercado.",
  "habilidades_evidenciadas": {
    "React": 85,
    "TypeScript": 75,
    "CSS": 70,
    "JavaScript": 80
  },
  "proximos_passos": [
    "Criar projeto demonstrando testes E2E com Cypress",
    "Obter certificação em acessibilidade web",
    "Contribuir em projeto open source de UI library"
  ]
}
```

## Considerações de Performance

- **IA Real (Gemini)**: ~10-30 segundos por análise
- **IA Fake**: ~1 segundo (para desenvolvimento)
- **Cache**: Uma vez analisado, a análise é salva no banco
- **Re-análise**: Possível a qualquer momento (sobrescreve análise anterior)

## Testes

### Teste Manual
1. Faça login na aplicação
2. Vá para a Home
3. Clique em "Mostrar" na seção de Análise de Currículo
4. Cole um currículo de exemplo
5. Clique em "Enviar Currículo"
6. Clique em "Analisar com IA"
7. Verifique se a análise foi gerada corretamente

### Teste com cURL

```bash
# 1. Login (pegue o token)
TOKEN="seu_token_aqui"

# 2. Upload
curl -X POST "http://localhost:8000/resumes/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste",
    "content": "# João Silva\n\nDesenvolvedor Frontend com 3 anos de experiência em React."
  }'

# 3. Analisar (use o ID retornado)
curl -X POST "http://localhost:8000/resumes/1/analyze" \
  -H "Authorization: Bearer $TOKEN"

# 4. Ver resultado
curl "http://localhost:8000/resumes/1" \
  -H "Authorization: Bearer $TOKEN"
```

## Próximas Melhorias

- [ ] Upload de arquivo PDF/DOCX (parsing automático)
- [ ] Comparação entre currículos (antes/depois)
- [ ] Sugestões de reescrita usando IA
- [ ] Análise de compatibilidade com vagas específicas
- [ ] Exportação da análise em PDF
- [ ] Histórico de versões do currículo
- [ ] Feedback em tempo real (conforme digita)

## Troubleshooting

### Erro: "Attributes não encontrados"
- **Causa**: Usuário sem `career_goal` definido
- **Solução**: Configurar atributos primeiro ou usar endpoint `/dev/setup-mock-data`

### Erro: "Currículo não encontrado"
- **Causa**: ID inválido ou currículo de outro usuário
- **Solução**: Verificar se o ID está correto e pertence ao usuário logado

### Análise demora muito
- **Causa**: IA real (Gemini) leva tempo para processar
- **Solução**: Normal. Pode levar até 30 segundos. Use IA fake para dev.

### Análise retorna erro 500
- **Causa**: Erro na API do Gemini ou conteúdo inválido
- **Solução**: Verificar logs do backend. Tentar novamente.

## Segurança

- ✅ Autenticação obrigatória (JWT)
- ✅ Autorização: Usuário só acessa seus próprios currículos
- ✅ Validação de inputs (Pydantic)
- ✅ Sanitização de conteúdo (sem execução de código)
- ⚠️ **Atenção**: Currículos podem conter informações sensíveis. Garantir GDPR/LGPD compliance.

## Licença e Privacidade

- Currículos são armazenados de forma segura no banco de dados
- Análises são geradas pela IA e armazenadas localmente
- Não compartilhamos currículos com terceiros
- Usuário pode deletar seus currículos a qualquer momento
