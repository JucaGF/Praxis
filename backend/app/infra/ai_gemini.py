"""
Serviço de IA usando Google Gemini API

Este módulo implementa a interface IAIService usando o Google Gemini.
Fornece funcionalidades de geração de desafios, avaliação de submissões
e análise de currículos usando IA generativa.

Funcionalidades principais:
- Geração de desafios personalizados por track (Frontend, Backend, Data Engineer)
- Avaliação de submissões com análise qualitativa e skill assessment
- Análise de currículos com identificação de gaps e sugestões
- Streaming de respostas para feedback em tempo real
- Retry automático com backoff exponencial
- Tratamento robusto de erros (rate limits, timeouts, etc)

Arquitetura:
- Implementa IAIService (interface definida em domain/ports.py)
- Usa Google Generative AI SDK
- Suporta streaming para respostas longas
- Validação e recuperação de JSON malformado

Configuração:
- GEMINI_API_KEY: API key do Google Gemini (obrigatória)
- GEMINI_MODEL: Modelo a usar (default: gemini-2.5-flash)
- AI_MAX_RETRIES: Número máximo de tentativas (default: 5)
- AI_TIMEOUT: Timeout por requisição em segundos (default: 60)
"""

import json
import time
from typing import List, Dict, Optional
from backend.app.domain.ports import IAIService
from backend.app.logging_config import get_logger

logger = get_logger(__name__)

try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
    try:
        from google.api_core.exceptions import (
            ResourceExhausted,
            ServiceUnavailable,
            InternalServerError,
            TooManyRequests
        )
    except ImportError:
        ResourceExhausted = None
        ServiceUnavailable = None
        InternalServerError = None
        TooManyRequests = None
except ImportError:
    logger.warning(
        "google-generativeai não instalado. Instale com: pip install google-generativeai")
    genai = None
    ResourceExhausted = None
    ServiceUnavailable = None
    InternalServerError = None
    TooManyRequests = None


class GeminiAI(IAIService):
    """
    Implementação do serviço de IA usando Google Gemini.
    
    Esta classe implementa a interface IAIService usando o Google Gemini API.
    Fornece métodos para gerar desafios, avaliar submissões e analisar currículos.
    
    Características:
    - Validação automática de tokens e respostas
    - Retry com backoff exponencial para erros temporários
    - Backoff mais longo para erros 503 (serviço sobrecarregado)
    - Streaming de respostas para feedback em tempo real
    - Recuperação de JSON malformado
    - Validação de desafios gerados
    
    Attributes:
        api_key: Chave da API do Google Gemini
        model_name: Nome do modelo (default: gemini-2.5-flash)
        max_retries: Número máximo de tentativas em caso de erro (default: 5)
        timeout: Timeout em segundos para cada chamada (default: 60)
        safety_settings: Configurações de segurança (permite conteúdo técnico)
        generation_config: Configuração de geração (temperature, tokens, etc)
    """

    def __init__(
        self,
        api_key: str,
        model_name: str = "models/gemini-2.5-flash",
        max_retries: int = 5,  # Aumentado de 3 para 5
        timeout: int = 60
    ):
        """
        Inicializa o cliente Gemini.

        Args:
            api_key: API key do Google Gemini
            model_name: Modelo a usar (gemini-1.5-flash ou gemini-1.5-pro)
            max_retries: Quantas vezes retentar em caso de erro
            timeout: Timeout por request em segundos

        Raises:
            ValueError: Se API key não fornecida ou SDK não instalado
        """
        if not genai:
            raise ValueError(
                "SDK do Google Gemini não instalado. "
                "Execute: pip install google-generativeai"
            )

        if not api_key:
            raise ValueError("GEMINI_API_KEY é obrigatória!")

        self.api_key = api_key
        self.model_name = model_name
        self.max_retries = max_retries
        self.timeout = timeout

        # Configura o SDK
        genai.configure(api_key=api_key)

        # Configurações de segurança (permite conteúdo técnico)
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        # Configuração de geração
        self.generation_config = {
            "temperature": 0.9,  # Aumentado para forçar mais variação nas dificuldades
            "top_p": 0.95,
            "top_k": 50,
            "max_output_tokens": 8192,  # Aumentado para permitir respostas maiores
        }

        logger.info(f"GeminiAI inicializado com modelo {model_name}")

    def _detect_track(self, attributes: dict) -> str:
        """
        Detecta o track de carreira baseado no career_goal.

        Args:
            attributes: Atributos do perfil com career_goal

        Returns:
            "frontend", "backend", "data_engineer" ou "fullstack"
        """
        goal = (attributes.get("career_goal") or "").lower()

        # Keywords para Data Engineer
        de_keywords = ["data engineer", "data", "pipeline", "etl", "elt",
                       "airflow", "spark", "dbt", "analytics engineer"]
        if any(k in goal for k in de_keywords):
            return "data_engineer"

        # Keywords para Fullstack (explícito)
        fs_keywords = ["fullstack", "full-stack", "full stack"]
        if any(k in goal for k in fs_keywords):
            return "fullstack"

        # Keywords para Frontend
        fe_keywords = ["frontend", "front-end", "front", "react", "vue",
                       "angular", "ui", "ux"]
        if any(k in goal for k in fe_keywords):
            return "frontend"

        # Keywords para Backend
        be_keywords = ["backend", "back-end", "back", "api", "server",
                       "node", "python", "java", "microservice"]
        if any(k in goal for k in be_keywords):
            return "backend"

        # Default: fullstack (quando não identifica especificamente)
        return "fullstack"

    def _build_challenge_prompt(self, profile: dict, attributes: dict, track: str) -> str:
        """
        Constrói o prompt para geração de desafios baseado no track.

        Args:
            profile: Dados do perfil
            attributes: Skills e career_goal
            track: Track detectado

        Returns:
            Prompt formatado
        """
        tech_skills = attributes.get("tech_skills", {})
        soft_skills = attributes.get("soft_skills", {})
        career_goal = attributes.get(
            "career_goal", "Desenvolver habilidades técnicas")

        # Tech Skills formatadas
        if isinstance(tech_skills, list):
            tech_skills_text = "\n".join(
                [f"  - {skill['name']}: {skill['percentage']}/100" for skill in tech_skills])
        else:
            # Formato dict (atual)
            tech_skills_text = "\n".join(
                [f"  - {skill}: {level}/100" for skill, level in tech_skills.items()])

        # Soft Skills formatadas
        if isinstance(soft_skills, dict):
            soft_skills_text = "\n".join(
                [f"  - {skill}: {level}/100" for skill, level in soft_skills.items()])
        else:
            soft_skills_text = "Não avaliado"

        # Prompt base com TODAS as skills
        base_prompt = f"""Você é um AI Career Coach. Gere 3 desafios personalizados.

PERFIL DO USUÁRIO:
- Track: {track.upper()}
- Objetivo: {career_goal}

TECH SKILLS (use para desafios de code/organization):
{tech_skills_text or "  - Iniciante"}

SOFT SKILLS (use para desafios de daily-task):
{soft_skills_text}

"""

        # Prompts específicos por track (simplificados)
        if track == "data_engineer":
            track_prompt = """
Gere 3 desafios de DATA ENGINEER:
- Tipos: SQL/Python (code), Pipeline (organization), Comunicação (daily-task)
- Categorias válidas: code, daily-task, organization
- Skills alvo: SQL, Python, Airflow, Spark
"""
        elif track == "frontend":
            track_prompt = """
Gere 3 desafios de FRONTEND:
- Tipos: Bugfix/Feature (code), Comunicação (daily-task), Planejamento (organization)
- Categorias válidas: code, daily-task, organization
- Skills alvo: React, Vue, JavaScript, TypeScript, CSS
"""
        elif track == "fullstack":
            track_prompt = """
Gere 3 desafios de FULLSTACK:
- OBRIGATÓRIO: 1 FRONTEND + 1 BACKEND + 1 qualquer
- Tipos: Código (code), Planejamento (organization), Comunicação (daily-task)
- Categorias válidas: code, daily-task, organization
- Skills alvo: React, Python, JavaScript, FastAPI, SQL
"""
        else:  # backend
            track_prompt = """
Gere 3 desafios de BACKEND:
- Tipos: API/Bugfix (code), Performance (organization), Comunicação (daily-task)
- Categorias válidas: code, daily-task, organization
- Skills alvo: Python, Node.js, FastAPI, SQL
"""

        json_schema = """
FORMATO JSON (retorne APENAS o JSON, sem texto extra):

ESTRUTURA DE CADA DESAFIO:
{
  "title": "Título do desafio",
  "description": {
    "text": "Descrição conversacional (chefe pedindo) 2-3 linhas",
    "type": "codigo|texto_livre|planejamento",
    "language": "python|javascript|sql|markdown",
    "eval_criteria": ["critério1", "critério2", "critério3"],
    "target_skill": "Skill principal do perfil",
    "affected_skills": ["Skill1", "Skill2", "Skill3"],
    "hints": ["dica útil 1", "dica útil 2"],
    "enunciado": null
  },
  "difficulty": {"level": "easy|medium|hard", "time_limit": 20-90},
  "category": "code|daily-task|organization",
  "fs": {
    "files": ["caminho/arquivo1.ext", "caminho/arquivo2.ext"],
    "open": "caminho/arquivo1.ext",
    "contents": {
      "caminho/arquivo1.ext": "código bugado ou incompleto (15-30 linhas)",
      "caminho/arquivo2.ext": "código auxiliar relevante"
    }
  },
  "template_code": null
}

⚠️ IMPORTANTE: NÃO confunda "description.type" com "category"!
- description.type: tipo de ENUNCIADO (codigo|texto_livre|planejamento) - campo interno
- category: tipo de DESAFIO (code|daily-task|organization) - campo que define a tela do frontend

REGRAS OBRIGATÓRIAS:
1. Retorne array com exatamente 3 desafios
2. target_skill DEVE existir nas skills do usuário (skill principal)
3. affected_skills: array com 2-4 skills do perfil que o desafio avalia (DEVE incluir target_skill)
   - Para code: skills técnicas relacionadas (ex: ["Python", "FastAPI", "SQL"])
   - Para daily-task: soft skills (ex: ["Comunicação", "Empatia", "Resolução de Conflitos"])
   - Para organization: skills de arquitetura (ex: ["Arquitetura", "Escalabilidade", "Trade-offs"])
   - Use nomes objetivos de habilidades (substantivos)
4. eval_criteria: Array com 3-4 habilidades que serão avaliadas
   - Use nomes objetivos (ex: "Python", "FastAPI", "Comunicação", "Resolução de problemas")
5. ⚠️ TIPOS DE DESAFIOS (REGRA CRÍTICA):
   - Gere EXATAMENTE 1 desafio de cada tipo: 1 code, 1 daily-task, 1 organization
   - ❌ PROIBIDO: 2 code + 1 organization (falta daily-task)
   - ❌ PROIBIDO: 3 code (falta daily-task e organization)
   - ❌ PROIBIDO: 2 daily-task + 1 code (falta organization)
   - ✅ OBRIGATÓRIO: Sempre 1 code + 1 daily-task + 1 organization
6. ⚠️ DIFICULDADE DOS DESAFIOS (REGRA CRÍTICA):
   - Gere exatamente 1 desafio EASY, 1 MEDIUM e 1 HARD
   - ❌ PROIBIDO: organization=hard, daily-task=medium, code=easy (padrão fixo)
   - ✅ OBRIGATÓRIO: Varie a distribuição a cada geração
   - Exemplos de distribuições VÁLIDAS:
     * code=hard, daily-task=easy, organization=medium
     * organization=easy, code=medium, daily-task=hard
     * daily-task=medium, organization=easy, code=hard
     * code=easy, organization=hard, daily-task=medium
   - Se você gerar organization=hard, daily-task=medium, code=easy, a resposta será REJEITADA
7. description.text: Tom conversacional (chefe falando)
8. SEMPRE adicione 2-4 hints úteis e práticas
9. Para type="codigo" → category="code":
   - fs é OBRIGATÓRIO (não null!)
   - fs.files: 2-4 caminhos realistas
   - fs.open: arquivo principal
   - fs.contents: TODOS os arquivos com código real (15-30 linhas)
   - Código deve ser bugado, incompleto ou precisar refatoração
   - enunciado: null
   - template_code: null
10. Para type="texto_livre" → category="daily-task":
   - fs: null
   - enunciado: OBRIGATÓRIO - simule um e-mail/ticket realista
     Formato: {"type": "email", "de": "nome@empresa.com", "assunto": "assunto do email", "data": "2024-11-15", "corpo": "texto do email (3-5 linhas)"}
   - template_code: null
11. Para type="planejamento" → category="organization":
   - fs: null
   - enunciado: OBRIGATÓRIO - requisitos estruturados
     Formato: {"type": "requisitos", "funcionais": ["req1", "req2", "req3"], "nao_funcionais": ["req1", "req2"]}
   - template_code: OBRIGATÓRIO - array de abas/campos do formulário
     Formato: [{"id": "aba1", "label": "Nome da Aba", "fields": [{"id": "campo1", "label": "Label do Campo", "type": "dropdown|textarea|checkbox", "options": ["op1", "op2"]}]}]
     Crie 2-3 abas relevantes (ex: "Tecnologias", "Justificativa", "Trade-offs")

EXEMPLOS COMPLETOS:

// Exemplo 1: type="codigo"
{
  "title": "Corrigir Validação no Login",
  "description": {
    "text": "E aí! O endpoint de login tá aceitando email sem @ e retornando 500. Os clientes tão reclamando. Pode corrigir pra retornar 400 com mensagem clara?",
    "type": "codigo",
    "language": "python",
    "eval_criteria": ["FastAPI", "Validação de dados", "Tratamento de erros"],
    "target_skill": "FastAPI",
    "affected_skills": ["FastAPI", "Python", "Pydantic", "APIs REST"],
    "hints": ["Use EmailStr do pydantic", "HTTPException(status_code=400)", "Adicione try-except na rota"],
    "enunciado": null
  },
  "difficulty": {"level": "easy", "time_limit": 25},
  "category": "code",
  "fs": {
    "files": ["app/auth.py", "app/models.py", "app/main.py"],
    "open": "app/auth.py",
    "contents": {
      "app/auth.py": "from fastapi import APIRouter, HTTPException\\nfrom app.models import LoginRequest\\n\\nrouter = APIRouter()\\n\\n@router.post('/login')\\ndef login(data: LoginRequest):\\n    # BUG: não valida email\\n    user = find_user(data.email)\\n    if not user:\\n        raise Exception('Erro')  # BUG: status 500\\n    return {'token': create_token(user)}",
      "app/models.py": "from pydantic import BaseModel\\n\\nclass LoginRequest(BaseModel):\\n    email: str  # BUG: aceita qualquer string\\n    password: str",
      "app/main.py": "from fastapi import FastAPI\\nfrom app.auth import router\\n\\napp = FastAPI()\\napp.include_router(router)"
    }
  },
  "template_code": null
}

// Exemplo 2: type="texto_livre"
{
  "title": "Responder Cliente sobre Atraso",
  "description": {
    "text": "Oi! Temos um cliente insatisfeito com atraso na entrega. Ele enviou um email meio áspero. Pode redigir uma resposta profissional explicando o ocorrido e oferecendo compensação?",
    "type": "texto_livre",
    "language": "markdown",
    "eval_criteria": ["Comunicação escrita", "Empatia", "Resolução de conflitos"],
    "target_skill": "Comunicação",
    "affected_skills": ["Comunicação", "Empatia", "Gestão de crises", "Profissionalismo"],
    "hints": ["Reconheça o problema primeiro", "Explique sem fazer desculpas", "Ofereça algo concreto"],
    "enunciado": {
      "type": "email",
      "de": "carlos.souza@cliente.com.br",
      "assunto": "Re: Pedido #12345 - ATRASO INACEITÁVEL",
      "data": "2024-11-15",
      "corpo": "Bom dia,\\n\\nComprei o produto há 3 semanas e AINDA não recebi. O prazo era 10 dias úteis. Já entrei em contato 2 vezes e só recebi respostas automáticas. Preciso de uma solução URGENTE ou vou cancelar e pedir reembolso.\\n\\nAguardo retorno HOJE."
    }
  },
  "difficulty": {"level": "medium", "time_limit": 30},
  "category": "daily-task",
  "fs": null,
  "template_code": null
}

// Exemplo 3: type="planejamento" (mas category="organization")
{
  "title": "Planejar Sistema de Notificações em Tempo Real",
  "description": {
    "text": "Fala! Vamos implementar notificações em tempo real no app (likes, comentários, mensagens). Preciso que você planeje a arquitetura: quais tecnologias usar, como escalar, trade-offs, etc.",
    "type": "planejamento",
    "language": "markdown",
    "eval_criteria": ["Arquitetura de software", "Escalabilidade", "Análise de trade-offs"],
    "target_skill": "Arquitetura",
    "affected_skills": ["Arquitetura", "WebSockets", "Redis", "Escalabilidade"],
    "hints": ["Pense em WebSocket vs SSE vs Polling", "Como armazenar notificações não lidas?", "Redis pode ajudar na performance"],
    "enunciado": {
      "type": "requisitos",
      "funcionais": [
        "Notificar usuário sobre novos likes, comentários e mensagens",
        "Usuário deve ver badge com número de notificações não lidas",
        "Histórico de notificações dos últimos 30 dias",
        "Marcar notificação como lida"
      ],
      "nao_funcionais": [
        "Suportar 10 mil usuários simultâneos",
        "Latência máxima de 2 segundos",
        "Disponibilidade de 99.9%"
      ]
    }
  },
  "difficulty": {"level": "hard", "time_limit": 60},
  "category": "organization",
  "fs": null,
  "template_code": [
    {
      "id": "tecnologias",
      "label": "Tecnologias Principais",
      "fields": [
        {"id": "protocolo", "label": "Protocolo de Comunicação", "type": "dropdown", "options": ["WebSocket", "Server-Sent Events (SSE)", "Long Polling", "Firebase Cloud Messaging"]},
        {"id": "message_broker", "label": "Message Broker", "type": "dropdown", "options": ["Redis Pub/Sub", "RabbitMQ", "Apache Kafka", "Não usar"]},
        {"id": "armazenamento", "label": "Armazenamento de Notificações", "type": "dropdown", "options": ["PostgreSQL", "MongoDB", "Redis", "DynamoDB"]}
      ]
    },
    {
      "id": "justificativa",
      "label": "Justificativa Técnica",
      "fields": [
        {"id": "porque_protocolo", "label": "Por que escolheu esse protocolo?", "type": "textarea"},
        {"id": "porque_broker", "label": "Por que escolheu esse message broker?", "type": "textarea"},
        {"id": "porque_storage", "label": "Por que escolheu esse armazenamento?", "type": "textarea"}
      ]
    },
    {
      "id": "tradeoffs",
      "label": "Trade-offs e Desafios",
      "fields": [
        {"id": "limitacoes", "label": "Quais as principais limitações da sua solução?", "type": "textarea"},
        {"id": "alternativas", "label": "Que alternativas você considerou?", "type": "textarea"},
        {"id": "custos", "label": "Como seria o custo/complexidade?", "type": "dropdown", "options": ["Baixo", "Médio", "Alto"]}
      ]
    }
  ]
}
"""

        return base_prompt + track_prompt + json_schema

    def _build_evaluation_prompt(self, challenge: dict, submission: dict, track: str) -> str:
        """
        Constrói o prompt para avaliação de submissão.

        Args:
            challenge: Dados do desafio
            submission: Código/texto submetido
            track: Track do usuário

        Returns:
            Prompt formatado
        """
        ch_desc = challenge.get("description", {})
        ch_diff = challenge.get("difficulty", {})

        # Extrai dados da submissão de acordo com o tipo
        submission_type = (submission.get("type") or "codigo").lower()
        submitted_content = ""
        template_code = challenge.get("template_code") or []

        if submission_type in {"codigo", "code"}:
            # Para código: extrai arquivos
            files = submission.get("files", {})
            if files:
                submitted_content = "\n\n".join([
                    f"// {filename}\n{content}"
                    for filename, content in files.items()
                ])
            else:
                submitted_content = submission.get("content", "")

        elif submission_type in {"texto_livre", "daily_task", "texto", "text"}:
            # Para texto livre: extrai o conteúdo textual
            submitted_content = submission.get("content", "")

        elif submission_type in {"organization", "planejamento", "planning"}:
            # Para planejamento/organization: agrupa respostas por seção com rótulos
            sections_data = submission.get("sections") or submission.get("form_data") or {}
            implementation_text = submission.get(
                "implementation") or submission.get("content") or ""

            if sections_data:
                field_lookup: Dict[str, Dict[str, str]] = {}
                if isinstance(template_code, list):
                    for section in template_code:
                        section_label = section.get(
                            "label") or section.get("id") or "Seção"
                        for field in section.get("fields", []):
                            field_id = field.get("id")
                            if not field_id:
                                continue
                            field_lookup[field_id] = {
                                "section_label": section_label,
                                "field_label": field.get("label") or field_id
                            }

                grouped: Dict[str, List[tuple[str, str]]] = {}
                for field_id, answer in sections_data.items():
                    if answer is None:
                        continue
                    answer_text = answer if isinstance(
                        answer, str) else json.dumps(answer, ensure_ascii=False, indent=2)

                    info = field_lookup.get(field_id)
                    section_label = info["section_label"] if info else "Seção Geral"
                    field_label = info["field_label"] if info else field_id

                    grouped.setdefault(section_label, []).append(
                        (field_label, answer_text))

                parts = []
                for section_label, fields in grouped.items():
                    parts.append(f"### {section_label}")
                    for field_label, answer_text in fields:
                        parts.append(f"- {field_label}: {answer_text}")
                    parts.append("")

                submitted_content = "\n".join(parts).strip()

            if implementation_text:
                impl_block = implementation_text if isinstance(
                    implementation_text, str) else json.dumps(implementation_text, ensure_ascii=False, indent=2)
                if submitted_content:
                    submitted_content = f"{submitted_content}\n\n=== PLANO DE IMPLEMENTAÇÃO ===\n{impl_block}"
                else:
                    submitted_content = f"=== PLANO DE IMPLEMENTAÇÃO ===\n{impl_block}"

            if not submitted_content:
                # Fallback se nada foi preenchido
                submitted_content = submission.get("content", "")

        # Adiciona contexto do enunciado se existir
        enunciado_context = ""
        enunciado = ch_desc.get('enunciado')
        if enunciado:
            enunciado_type = enunciado.get('type')
            if enunciado_type == 'email':
                # Para texto_livre: mostra o email/ticket original
                enunciado_context = f"""
CONTEXTO - EMAIL/TICKET ORIGINAL QUE O CANDIDATO DEVERIA RESPONDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
De: {enunciado.get('de', 'N/A')}
Assunto: {enunciado.get('assunto', 'N/A')}
Data: {enunciado.get('data', 'N/A')}

{enunciado.get('corpo', '')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""
            elif enunciado_type == 'requisitos':
                # Para organization: mostra os requisitos
                funcionais = enunciado.get('funcionais', [])
                nao_funcionais = enunciado.get('nao_funcionais', [])
                enunciado_context = f"""
CONTEXTO - REQUISITOS DO PROJETO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Requisitos Funcionais:
{chr(10).join('  • ' + req for req in funcionais)}

Requisitos Não-Funcionais:
{chr(10).join('  • ' + req for req in nao_funcionais)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""

        base_prompt = f"""Você é um avaliador técnico sênior especializado em {track.upper()}.

DESAFIO PROPOSTO:
Título: {challenge.get('title')}
Descrição: {ch_desc.get('text')}
Tipo: {ch_desc.get('type')}
Dificuldade: {ch_diff.get('level', 'medium')}
Critérios de avaliação: {', '.join(ch_desc.get('eval_criteria', []))}
{enunciado_context}
SUBMISSÃO DO CANDIDATO:
```{ch_desc.get('language', 'text')}
{submitted_content}
```

"""

        # Critérios específicos por track
        if track == "data_engineer":
            criteria = """
CRITÉRIOS DE AVALIAÇÃO PARA DATA ENGINEER:

Para CÓDIGO (SQL/Python):
- Corretude: resolve o problema?
- Performance: considera índices, partições, otimizações?
- Reprodutibilidade: código pode ser executado novamente?
- Tratamento de dados: lida com nulos, duplicados, edge cases?
- Boas práticas: código limpo, comentado, mantível?

Para PLANEJAMENTO (Pipelines/Arquitetura):
- Orquestração: DAGs claros, dependências bem definidas?
- Idempotência: reruns são seguros?
- Monitoramento: métricas, alertas, observabilidade?
- Escalabilidade: design aguenta crescimento de dados?
- Tratamento de falhas: retries, dead letter queues?

Para COMUNICAÇÃO:
- Clareza técnica: explica bem?
- Contexto de negócio: entende impacto?
- Acionabilidade: propõe soluções concretas?
"""
        elif track == "frontend":
            criteria = """
CRITÉRIOS DE AVALIAÇÃO PARA FRONTEND:

Para CÓDIGO (React/Vue/JS):
- Funcionalidade: componente funciona corretamente?
- UI/UX: interface intuitiva e responsiva?
- Performance: evita re-renders desnecessários?
- Acessibilidade: semantic HTML, ARIA labels?
- Boas práticas: componentes reutilizáveis, código limpo?

Para PLANEJAMENTO (Arquitetura):
- Componentização: divisão lógica de componentes?
- Estado: gerenciamento adequado (local vs global)?
- Performance: lazy loading, code splitting?
- Manutenibilidade: código escalável?

Para COMUNICAÇÃO:
- Clareza: explica decisões técnicas?
- Justificativa: fundamenta escolhas de design?
"""
        else:  # backend
            criteria = """
CRITÉRIOS DE AVALIAÇÃO PARA BACKEND:

Para CÓDIGO (API/Endpoints):
- Funcionalidade: endpoint funciona corretamente?
- Validação: valida inputs adequadamente?
- Segurança: autenticação, autorização, sanitização?
- Performance: queries otimizadas, cache apropriado?
- Boas práticas: código limpo, tratamento de erros?

Para PLANEJAMENTO (Arquitetura):
- Design: endpoints bem estruturados?
- Escalabilidade: aguenta carga crescente?
- Manutenibilidade: código modular e testável?
- Monitoramento: logs, métricas, alertas?

Para COMUNICAÇÃO:
- Clareza técnica: explica problemas bem?
- Contexto: entende impacto em sistema?
"""

        # Extrai affected_skills do desafio para avaliar múltiplas skills
        affected_skills = (ch_desc.get("affected_skills") or [ch_desc.get("target_skill")] or [])
        affected_skills_str = ", ".join(affected_skills) if affected_skills else "skill principal"
        
        assessment_instructions = f"""
TAREFA DE AVALIAÇÃO:

1. Analise a submissão profundamente considerando os critérios acima
2. Atribua uma nota geral (0-100)
3. Avalie métricas específicas por critério
4. IMPORTANTE: Faça SKILLS ASSESSMENT (MÚLTIPLAS SKILLS):
   
   O desafio avalia estas skills: {affected_skills_str}
   
   Para CADA skill, avalie:
   
   a) skill_level_demonstrated (0-100):
      - NÃO é igual à nota geral!
      - Considere: nota + qualidade + práticas + complexidade ESPECÍFICOS dessa skill
      - Exemplo: nota geral 85, mas Python=90 (excelente), SQL=70 (básico)
   
   b) progression_intensity (-1.0 a +1.0):
      - Positivo: submissão mostra domínio/evolução nessa skill
        * +0.9: excelente, domínio claro
        * +0.7: muito bom, boas práticas
        * +0.5: bom, competente
        * +0.3: satisfatório, funcional
        * +0.1: mínimo aceitável
      - Negativo: submissão mostra problemas/desconhecimento
        * -0.2: falhas leves, más práticas
        * -0.5: falhas significativas, desconhecimento
      
   c) reasoning (string):
      - Explique POR QUÊ essa skill específica deve progredir/regredir
      - Seja específico sobre o uso DESSA skill na submissão
      - Mencione pontos fortes E fracos

FORMATO DE SAÍDA (JSON ESTRITO):
Retorne APENAS JSON neste formato:

{{
  "nota_geral": 85,
  "metricas": {{
    "criterio1": 90,
    "criterio2": 85,
    "criterio3": 80
  }},
  "pontos_positivos": [
    "Ponto forte 1",
    "Ponto forte 2"
  ],
  "pontos_negativos": [
    "Ponto a melhorar 1",
    "Ponto a melhorar 2"
  ],
  "sugestoes_melhoria": [
    "Sugestão específica 1",
    "Sugestão específica 2"
  ],
  "feedback_detalhado": "Análise detalhada em 2-4 linhas explicando a avaliação geral",
  "skills_assessment": {{
    "{affected_skills[0] if affected_skills else 'SkillName1'}": {{
      "skill_level_demonstrated": 90,
      "progression_intensity": 0.8,
      "reasoning": "Excelente uso de recursos avançados, código limpo e bem estruturado"
    }},
    "{affected_skills[1] if len(affected_skills) > 1 else 'SkillName2'}": {{
      "skill_level_demonstrated": 75,
      "progression_intensity": 0.5,
      "reasoning": "Implementação funcional mas poderia ser mais robusta"
    }}
  }}
}}

REGRAS CRÍTICAS:
- Retorne APENAS o JSON, sem texto antes ou depois
- DEVE avaliar TODAS as skills em: {affected_skills_str}
- Cada skill tem seu próprio assessment independente
- Seja justo mas rigoroso
- Valorize boas práticas mesmo que funcione
- Penalize más práticas mesmo que funcione
- skill_level_demonstrated de cada skill deve ser calculado individualmente
"""

        return base_prompt + criteria + assessment_instructions

    def _call_gemini(self, prompt: str, response_mime_type: str = "application/json") -> str:
        """
        Chama a API do Gemini com retry logic.

        Args:
            prompt: Prompt a enviar
            response_mime_type: Tipo de resposta esperada

        Returns:
            Resposta da API como string

        Raises:
            Exception: Se falhar após todas as tentativas
        """
        model = genai.GenerativeModel(
            model_name=self.model_name,
            safety_settings=self.safety_settings,
            generation_config={
                **self.generation_config,
                "response_mime_type": response_mime_type
            }
        )

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(
                    f"Chamando Gemini (tentativa {attempt}/{self.max_retries})")

                response = model.generate_content(
                    prompt,
                    request_options={
                        "timeout": self.timeout,
                        "retry": None  # desativa retry automático do SDK
                    }
                )

                # Log de uso (para monitorar custos)
                if hasattr(response, 'usage_metadata'):
                    logger.info(
                        "Gemini API call successful",
                        extra={"extra_data": {
                            "input_tokens": getattr(response.usage_metadata, 'prompt_token_count', 0),
                            "output_tokens": getattr(response.usage_metadata, 'candidates_token_count', 0),
                            "attempt": attempt
                        }}
                    )

                return response.text

            except Exception as e:
                last_error = e
                error_str = str(e)
                error_code = getattr(e, "code", None) or getattr(e, "status_code", None)
                
                # Detecta erro 503 (Service Unavailable / Model Overloaded)
                is_503 = (
                    "503" in error_str or
                    "overloaded" in error_str.lower() or
                    "service unavailable" in error_str.lower() or
                    (ServiceUnavailable is not None and isinstance(e, ServiceUnavailable)) or
                    error_code == 503
                )
                
                logger.warning(
                    f"Gemini API error (tentativa {attempt}/{self.max_retries}): {e}",
                    extra={"extra_data": {
                        "error": str(e),
                        "error_code": error_code,
                        "is_503": is_503,
                        "attempt": attempt
                    }}
                )

                # Backoff exponencial
                if attempt < self.max_retries:
                    # Para erros 503, usa backoff mais longo e com jitter
                    if is_503:
                        # Backoff mais agressivo com jitter: 15s, 20s, 30s, 40s, 40s
                        # Adiciona jitter aleatório de 0-5s para evitar "thundering herd"
                        import random
                        base_wait = [15, 20, 30, 40, 40][min(attempt - 1, 4)]
                        jitter = random.uniform(0, 5)
                        wait_time = base_wait + jitter
                    else:
                        # Backoff padrão: 2s, 4s, 8s, 16s, 30s
                        wait_time = min(2 ** attempt, 30)

                    retry_delay_seconds = None
                    # Tenta extrair retry_delay de ResourceExhausted (429) ou TooManyRequests
                    if ResourceExhausted is not None and isinstance(e, ResourceExhausted):
                        retry_delay = getattr(e, "retry_delay", None)
                        if retry_delay:
                            if hasattr(retry_delay, "total_seconds"):
                                retry_delay_seconds = retry_delay.total_seconds()
                            elif hasattr(retry_delay, "seconds"):
                                retry_delay_seconds = retry_delay.seconds
                    elif TooManyRequests is not None and isinstance(e, TooManyRequests):
                        retry_delay = getattr(e, "retry_delay", None)
                        if retry_delay:
                            if hasattr(retry_delay, "total_seconds"):
                                retry_delay_seconds = retry_delay.total_seconds()
                            elif hasattr(retry_delay, "seconds"):
                                retry_delay_seconds = retry_delay.seconds
                    
                    # Fallback: tenta extrair retry_delay diretamente do erro
                    if not retry_delay_seconds and hasattr(e, "retry_delay") and e.retry_delay:
                        retry_delay = e.retry_delay
                        if hasattr(retry_delay, "total_seconds"):
                            retry_delay_seconds = retry_delay.total_seconds()
                        elif hasattr(retry_delay, "seconds"):
                            retry_delay_seconds = retry_delay.seconds

                    if retry_delay_seconds:
                        wait_time = max(wait_time, float(retry_delay_seconds))

                    logger.info(
                        f"Aguardando {wait_time:.1f}s antes de retentar... (erro 503: {is_503})")
                    time.sleep(wait_time)

        # Se chegou aqui, falhou todas as tentativas
        error_msg = f"Falha ao chamar Gemini após {self.max_retries} tentativas: {last_error}"
        logger.error(error_msg)
        raise Exception(error_msg)

    def _parse_json_response(self, response_text: str, fallback: Optional[dict] = None) -> dict:
        """
        Parseia resposta JSON da API com tratamento de erros e tentativas de recuperação.

        Args:
            response_text: Texto da resposta
            fallback: Valor padrão se parsing falhar

        Returns:
            Dict parseado ou fallback
        """
        try:
            # Remove possíveis markdown code blocks
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON inválido, tentando recuperar: {e}")

            # Tenta recuperar extraindo apenas os objetos completos
            try:
                # Se for uma lista, tenta extrair objetos válidos
                if cleaned.startswith("["):
                    # Encontra todos os objetos completos (começam com { e terminam com })
                    import re
                    objects = []
                    depth = 0
                    current_obj = ""
                    in_string = False
                    escape_next = False

                    for char in cleaned:
                        if escape_next:
                            current_obj += char
                            escape_next = False
                            continue

                        if char == '\\':
                            escape_next = True
                            current_obj += char
                            continue

                        if char == '"':
                            in_string = not in_string

                        if not in_string:
                            if char == '{':
                                if depth == 0:
                                    current_obj = "{"
                                else:
                                    current_obj += char
                                depth += 1
                            elif char == '}':
                                depth -= 1
                                current_obj += char
                                if depth == 0 and current_obj:
                                    try:
                                        obj = json.loads(current_obj)
                                        objects.append(obj)
                                        current_obj = ""
                                    except:
                                        current_obj = ""
                            elif depth > 0:
                                current_obj += char
                        else:
                            current_obj += char

                    if objects:
                        logger.info(
                            f"Recuperados {len(objects)} objetos válidos de JSON malformado")
                        return objects
            except Exception as recovery_error:
                logger.error(f"Falha ao recuperar JSON: {recovery_error}")

            logger.error(
                f"Erro ao parsear JSON: {e}\nResposta: {response_text[:200]}")
            if fallback:
                return fallback
            raise

    # ==================== MÉTODOS DA INTERFACE ====================

    def _validate_challenge(self, challenge: dict) -> bool:
        """
        Valida se um desafio tem todos os campos obrigatórios.

        Args:
            challenge: Desafio a validar

        Returns:
            True se válido, False caso contrário
        """
        # Log do desafio completo para debug
        challenge_title = challenge.get("title", "SEM TÍTULO")
        logger.debug(f"🔍 Validando desafio: '{challenge_title}'")
        logger.debug(f"   Campos presentes: {list(challenge.keys())}")
        
        required_fields = ["title", "description", "difficulty", "category"]

        # Valida campos de primeiro nível
        for field in required_fields:
            if field not in challenge:
                logger.warning(f"❌ DESAFIO REJEITADO: Campo '{field}' não existe no desafio '{challenge_title}'")
                logger.debug(f"   Desafio completo: {challenge}")
                return False
            
            if not challenge[field]:
                logger.warning(f"❌ DESAFIO REJEITADO: Campo '{field}' está vazio no desafio '{challenge_title}'")
                logger.debug(f"   Valor de '{field}': {challenge[field]}")
                return False

        # Valida description
        description = challenge["description"]
        if not isinstance(description, dict):
            logger.warning(f"❌ DESAFIO REJEITADO: 'description' não é um dict (é {type(description)}) no desafio '{challenge_title}'")
            logger.debug(f"   Valor de 'description': {description}")
            return False

        if "text" not in description:
            logger.warning(f"❌ DESAFIO REJEITADO: 'description.text' não existe no desafio '{challenge_title}'")
            logger.debug(f"   Campos em 'description': {list(description.keys())}")
            return False
            
        if not description["text"]:
            logger.warning(f"❌ DESAFIO REJEITADO: 'description.text' está vazio no desafio '{challenge_title}'")
            return False

        # Valida difficulty
        difficulty = challenge["difficulty"]
        if not isinstance(difficulty, dict):
            logger.warning(f"❌ DESAFIO REJEITADO: 'difficulty' não é um dict (é {type(difficulty)}) no desafio '{challenge_title}'")
            logger.debug(f"   Valor de 'difficulty': {difficulty}")
            return False

        if "level" not in difficulty:
            logger.warning(f"❌ DESAFIO REJEITADO: 'difficulty.level' não existe no desafio '{challenge_title}'")
            logger.debug(f"   Campos em 'difficulty': {list(difficulty.keys())}")
            return False
            
        if not difficulty["level"]:
            logger.warning(f"❌ DESAFIO REJEITADO: 'difficulty.level' está vazio no desafio '{challenge_title}'")
            return False

        if "time_limit" not in difficulty:
            logger.warning(f"❌ DESAFIO REJEITADO: 'difficulty.time_limit' não existe no desafio '{challenge_title}'")
            logger.debug(f"   Campos em 'difficulty': {list(difficulty.keys())}")
            return False
            
        if not difficulty["time_limit"]:
            logger.warning(f"❌ DESAFIO REJEITADO: 'difficulty.time_limit' está vazio no desafio '{challenge_title}'")
            return False

        logger.debug(f"✅ Desafio '{challenge_title}' validado com sucesso")
        return True

    def _extract_partial_fields(self, json_buffer: str) -> List[dict]:
        """
        Extrai campos parciais dos desafios (title, description) durante streaming.
        
        Returns:
            Lista de dicts com campos parciais: [{index: 0, title: "...", description: "..."}]
        """
        import re
        partial_challenges = []
        
        try:
            # Tentar encontrar títulos parciais com regex
            # Procura por padrões como: "title": "texto aqui"
            title_pattern = r'"title"\s*:\s*"([^"]*)"'
            titles = re.findall(title_pattern, json_buffer)
            
            # Procura por descrições parciais
            desc_pattern = r'"description"\s*:\s*\{[^}]*"text"\s*:\s*"([^"]*)"'
            descriptions = re.findall(desc_pattern, json_buffer)
            
            # Procura por categorias
            category_pattern = r'"category"\s*:\s*"([^"]*)"'
            categories = re.findall(category_pattern, json_buffer)
            
            # Combina os campos encontrados
            for i in range(max(len(titles), len(descriptions), len(categories))):
                partial = {"index": i}
                if i < len(titles):
                    partial["title"] = titles[i]
                if i < len(descriptions):
                    partial["description"] = descriptions[i]
                if i < len(categories):
                    partial["category"] = categories[i]
                
                if len(partial) > 1:  # Tem pelo menos um campo além do index
                    partial_challenges.append(partial)
            
            return partial_challenges
        except Exception as e:
            logger.debug(f"Erro ao extrair campos parciais: {e}")
            return []
    
    def _extract_complete_challenges(self, json_buffer: str) -> List[dict]:
        """
        Extrai desafios completos de um JSON parcialmente recebido (streaming).

        Args:
            json_buffer: String JSON parcial ou completa

        Returns:
            Lista de desafios completos encontrados
        """
        try:
            # Limpar buffer (remover markdown se existir)
            cleaned = json_buffer.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            # Tenta parsear como array completo
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                logger.info(
                    f"✅ JSON completo parseado: {len(parsed)} desafios")
                return parsed
            elif isinstance(parsed, dict) and "challenges" in parsed:
                logger.info(
                    f"✅ JSON completo parseado (dict): {len(parsed['challenges'])} desafios")
                return parsed["challenges"]
            return []
        except json.JSONDecodeError as e:
            # JSON incompleto, tentar extrair objetos completos
            logger.debug(
                f"⚠️ JSON incompleto, tentando extração incremental: {str(e)[:100]}")
            challenges = []

            # Estratégia mais robusta: procurar por arrays parciais
            # Tenta encontrar: [ {...}, {...}, ...
            import re

            # Primeiro, tenta encontrar o início do array
            array_start = json_buffer.find('[')
            if array_start == -1:
                return []

            # Pega tudo a partir do [
            partial_array = json_buffer[array_start:]

            # Tenta adicionar ] no final e parsear
            try:
                test_json = partial_array.rstrip() + ']'
                parsed = json.loads(test_json)
                if isinstance(parsed, list) and len(parsed) > 0:
                    logger.info(
                        f"✅ Extração incremental: {len(parsed)} desafios parciais")
                    return parsed
            except:
                pass

            return challenges

    async def generate_challenges_streaming(self, profile: dict, attributes: dict):
        """
        Gera desafios usando Gemini streaming e yielda eventos SSE progressivamente.

        Args:
            profile: Dados do perfil
            attributes: Skills e career_goal

        Yields:
            Dicionários com eventos SSE:
            - {"type": "start", "message": "..."}
            - {"type": "progress", "percent": 0-100, "message": "..."}
            - {"type": "challenge", "data": {...}, "number": 1-3}
            - {"type": "complete", "total": 3}
            - {"type": "error", "message": "..."}
        """
        try:
            track = self._detect_track(attributes)
            logger.info(f"🎬 Iniciando geração streaming para track: {track}")

            yield {
                "type": "start",
                "message": f"🧠 Analisando perfil {track}..."
            }

            prompt = self._build_challenge_prompt(profile, attributes, track)

            # Configurar modelo com streaming
            generation_config = self.generation_config.copy()
            generation_config["max_output_tokens"] = 16384  # Aumentado para garantir que o JSON complete
            generation_config["response_mime_type"] = "application/json"  # Força a IA a retornar JSON válido
            # Nota: response_mime_type força JSON mode, garantindo que a IA complete o JSON antes de parar

            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=self.safety_settings
            )

            # Progresso inicial simulado (5% -> 40%) otimizado
            import asyncio
            progress_steps = [
                (5, "🧠 Analisando seu perfil..."),
                (10, "🎯 Identificando skills relevantes..."),
                (15, "📊 Avaliando nível de experiência..."),
                (20, "🔍 Buscando desafios compatíveis..."),
                (25, "💡 Personalizando conteúdo..."),
                (30, "⚙️ Configurando geradores..."),
                (35, "⏳ Preparando contexto para IA..."),
                (40, "🤖 Iniciando geração...")
            ]
            
            for percent, message in progress_steps:
                yield {
                    "type": "progress",
                    "percent": percent,
                    "message": message
                }
                await asyncio.sleep(2.0)  # 2 segundos entre updates

            # Streaming do Gemini
            response = model.generate_content(prompt, stream=True)

            buffer = ""
            challenges_sent = 0
            last_progress = 40
            chunk_count = 0
            last_extracted_length = 0  # Para detectar novo conteúdo nos chunks
            sent_chunks = {}  # Rastreia chunks já enviados por desafio: {index: {title: "...", desc: "..."}}

            logger.info("📡 Aguardando chunks do Gemini...")

            import time
            start_time = time.time()

            for chunk in response:
                chunk_count += 1
                elapsed = time.time() - start_time
                
                # Verificar se o chunk tem texto antes de processar
                # finish_reason: 1 (STOP) significa que a geração terminou normalmente
                if not chunk.text:
                    logger.info(f"📦 Chunk {chunk_count} sem texto (finish_reason: {chunk.candidates[0].finish_reason if chunk.candidates else 'unknown'})")
                    continue
                    
                buffer += chunk.text
                logger.info(
                    f"📦 Chunk {chunk_count} (+{elapsed:.2f}s): +{len(chunk.text)} chars (total: {len(buffer)})")

                # Atualizar progresso baseado no tamanho do buffer
                # Estimativa: ~10k chars = 3 desafios completos
                estimated_progress = min(85, 40 + (len(buffer) / 10000) * 45)

                # Só envia progresso se mudou significativamente (evita spam)
                if estimated_progress - last_progress >= 5:
                    yield {
                        "type": "progress",
                        "percent": int(estimated_progress),
                        "message": f"🤖 Gerando desafios... ({len(buffer)} caracteres)"
                    }
                    last_progress = estimated_progress

                # Extrair e enviar campos parciais (para efeito typewriter no frontend)
                if len(buffer) > last_extracted_length + 50:  # Só processa se tiver conteúdo novo significativo
                    partial_fields = self._extract_partial_fields(buffer)
                    
                    for partial in partial_fields:
                        challenge_idx = partial.get("index", 0)
                        
                        # Inicializa rastreamento deste desafio se necessário
                        if challenge_idx not in sent_chunks:
                            sent_chunks[challenge_idx] = {}
                        
                        # Envia novos campos ou campos que mudaram
                        for field in ["title", "description", "category"]:
                            if field in partial:
                                current_value = partial[field]
                                last_value = sent_chunks[challenge_idx].get(field, "")
                                
                                # Só envia se há novo conteúdo
                                if len(current_value) > len(last_value):
                                    yield {
                                        "type": "challenge_chunk",
                                        "challenge_index": challenge_idx,
                                        "field": field,
                                        "content": current_value,
                                        "is_complete": False
                                    }
                                    sent_chunks[challenge_idx][field] = current_value
                                    logger.debug(f"📝 Chunk parcial enviado: desafio {challenge_idx}, campo {field}, {len(current_value)} chars")
                    
                    last_extracted_length = len(buffer)

                # Tentar extrair desafios completos
                current_challenges = self._extract_complete_challenges(buffer)

                # Enviar apenas novos desafios (que ainda não foram enviados)
                for challenge in current_challenges[challenges_sent:]:
                    if self._validate_challenge(challenge):
                        challenges_sent += 1

                        yield {
                            "type": "challenge",
                            "data": challenge,
                            "number": challenges_sent,
                            "total": 3
                        }

                        progress_percent = 10 + (challenges_sent / 3) * 80
                        yield {
                            "type": "progress",
                            "percent": int(progress_percent),
                            "message": f"✅ Desafio {challenges_sent}/3 gerado!"
                        }

                        logger.info(
                            f"✅ Desafio {challenges_sent}/3 enviado: {challenge.get('title', 'sem título')}")

            # Final: garantir que temos todos os desafios
            final_challenges = self._extract_complete_challenges(buffer)

            # Enviar desafios que podem ter ficado faltando
            for challenge in final_challenges[challenges_sent:]:
                if self._validate_challenge(challenge):
                    challenges_sent += 1

                    yield {
                        "type": "challenge",
                        "data": challenge,
                        "number": challenges_sent,
                        "total": 3
                    }

                    logger.info(
                        f"✅ Desafio final {challenges_sent}/3 enviado: {challenge.get('title', 'sem título')}")

            # Verificar se temos pelo menos 1 desafio
            if challenges_sent == 0:
                raise ValueError("Nenhum desafio válido foi gerado")

            yield {
                "type": "complete",
                "total": challenges_sent,
                "message": f"🎉 {challenges_sent} desafio(s) gerado(s) com sucesso!"
            }

            logger.info(
                f"🎉 Geração streaming concluída: {challenges_sent} desafios")

        except Exception as e:
            logger.exception("❌ Erro na geração streaming de desafios")
            yield {
                "type": "error",
                "message": f"Erro ao gerar desafios: {str(e)}"
            }

    def generate_challenges(self, profile: dict, attributes: dict) -> List[dict]:
        """
        Gera desafios personalizados usando Gemini com retry automático.

        Args:
            profile: Dados do perfil
            attributes: Skills e career_goal

        Returns:
            Lista de 3 desafios personalizados
        """
        track = self._detect_track(attributes)
        logger.info(f"Gerando desafios para track: {track}")

        prompt = self._build_challenge_prompt(profile, attributes, track)

        # Tenta até 5 vezes para evitar padrão fixo
        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                response_text = self._call_gemini(
                    prompt, response_mime_type="application/json")
                challenges = self._parse_json_response(response_text)

                # Valida que é uma lista
                if not isinstance(challenges, list):
                    logger.warning(
                        "Resposta não é uma lista, tentando extrair...")
                    if isinstance(challenges, dict) and "challenges" in challenges:
                        challenges = challenges["challenges"]
                    else:
                        raise ValueError("Formato de resposta inválido")

                # Valida cada desafio
                valid_challenges = []
                for i, challenge in enumerate(challenges):
                    if self._validate_challenge(challenge):
                        valid_challenges.append(challenge)
                    else:
                        logger.warning(f"Desafio {i} inválido, descartando")

                # Verifica se temos pelo menos 1 desafio válido
                if not valid_challenges:
                    if attempt < max_attempts - 1:
                        logger.warning(
                            f"Nenhum desafio válido na tentativa {attempt + 1}, tentando novamente...")
                        continue
                    else:
                        raise ValueError(
                            "Nenhum desafio válido retornado pelo Gemini após todas as tentativas")

                # Limita a 3 desafios
                valid_challenges = valid_challenges[:3]
                
                # ⚠️ VALIDAÇÃO ANTI-PADRÃO FIXO
                if len(valid_challenges) == 3:
                    # Extrai dificuldades por categoria
                    difficulty_map = {}
                    for ch in valid_challenges:
                        category = ch.get("category", "")
                        difficulty = ch.get("difficulty", {}).get("level", "")
                        difficulty_map[category] = difficulty
                    
                    # Verifica se é o padrão fixo proibido
                    is_fixed_pattern = (
                        difficulty_map.get("organization") == "hard" and
                        difficulty_map.get("daily-task") == "medium" and
                        difficulty_map.get("code") == "easy"
                    )
                    
                    if is_fixed_pattern:
                        logger.warning(
                            f"⚠️ PADRÃO FIXO DETECTADO (organization=hard, daily-task=medium, code=easy) "
                            f"na tentativa {attempt + 1}. Rejeitando e regenerando..."
                        )
                        if attempt < max_attempts - 1:
                            continue
                        else:
                            logger.error("❌ Padrão fixo persistiu após todas as tentativas!")
                            # Continua mesmo assim para não bloquear o usuário
                    else:
                        logger.info(
                            f"✅ Distribuição de dificuldades válida: {difficulty_map}"
                        )

                logger.info(
                    f"Gerados {len(valid_challenges)} desafios válidos (de {len(challenges)} retornados) na tentativa {attempt + 1}")
                return valid_challenges

            except json.JSONDecodeError as e:
                if attempt < max_attempts - 1:
                    logger.warning(
                        f"JSON inválido na tentativa {attempt + 1}, tentando novamente...")
                    time.sleep(1)  # Pequeno delay antes do retry
                    continue
                else:
                    logger.error(
                        f"Erro ao parsear JSON após {max_attempts} tentativas: {e}")
                    raise
            except Exception as e:
                logger.error(
                    f"Erro ao gerar desafios na tentativa {attempt + 1}: {e}")
                if attempt < max_attempts - 1:
                    logger.warning("Tentando novamente...")
                    time.sleep(1)
                    continue
                else:
                    raise

    def evaluate_submission(self, challenge: dict, submission: dict) -> dict:
        """
        Avalia submissão usando Gemini com skill assessment inteligente.

        Args:
            challenge: Dados do desafio
            submission: Código/texto submetido

        Returns:
            Dict com nota, métricas, feedback e skill_assessment
        """
        # Detecta track baseado na skill target (ou usa genérico)
        target_skill = (challenge.get("description")
                        or {}).get("target_skill", "")
        track = "fullstack"  # Default
        if any(s in target_skill.lower() for s in ["sql", "airflow", "spark", "dbt"]):
            track = "data_engineer"
        elif any(s in target_skill.lower() for s in ["react", "vue", "angular", "css"]):
            track = "frontend"
        elif any(s in target_skill.lower() for s in ["python", "node", "fastapi", "api"]):
            track = "backend"

        logger.info(f"Avaliando submissão (track: {track})")

        prompt = self._build_evaluation_prompt(challenge, submission, track)

        try:
            response_text = self._call_gemini(
                prompt, response_mime_type="application/json")
            evaluation = self._parse_json_response(response_text)

            # Valida campos obrigatórios
            required_fields = ["nota_geral", "metricas", "skill_assessment"]
            for field in required_fields:
                if field not in evaluation:
                    logger.warning(
                        f"Campo obrigatório '{field}' ausente, adicionando default")
                    if field == "nota_geral":
                        evaluation[field] = 70
                    elif field == "metricas":
                        evaluation[field] = {}
                    elif field == "skill_assessment":
                        evaluation[field] = {
                            "skill_level_demonstrated": 70,
                            "should_progress": True,
                            "progression_intensity": 0.3,
                            "reasoning": "Avaliação automática"
                        }

            logger.info(
                f"Avaliação completa: nota={evaluation.get('nota_geral')}")
            return evaluation

        except Exception as e:
            logger.error(f"Erro ao avaliar submissão: {e}")
            raise

    def _build_resume_analysis_prompt(self, resume_content: str, career_goal: str, track: str) -> str:
        """
        Constrói o prompt para análise de currículo baseado na trilha do usuário.

        Args:
            resume_content: Conteúdo do currículo
            career_goal: Objetivo de carreira do usuário
            track: Track detectado (frontend, backend, data_engineer, fullstack)

        Returns:
            Prompt formatado
        """
        base_prompt = f"""Você é um recrutador técnico sênior especializado em {track.upper()}.

PERFIL DO CANDIDATO:
- Objetivo de carreira: {career_goal}
- Trilha: {track.upper()}

CURRÍCULO SUBMETIDO:
```
{resume_content}
```

"""

        # Habilidades e requisitos específicos por track
        if track == "data_engineer":
            track_skills = """
HABILIDADES ESPERADAS PARA DATA ENGINEER:

Técnicas Fundamentais:
- SQL avançado (CTEs, Window Functions, Otimização)
- Python para manipulação de dados (Pandas, PySpark)
- Modelagem de dados (dimensional, normalização)
- ETL/ELT pipelines

Ferramentas Comuns:
- Orquestração: Airflow, Dagster, Prefect
- Processing: Spark, Dask, Databricks
- Cloud: AWS (S3, Redshift, Glue), GCP (BigQuery), Azure
- Versionamento de dados: dbt, Great Expectations

Soft Skills:
- Comunicação com stakeholders de negócio
- Documentação técnica clara
- Colaboração com Data Scientists e Analistas
"""
        elif track == "frontend":
            track_skills = """
HABILIDADES ESPERADAS PARA FRONTEND:

Técnicas Fundamentais:
- JavaScript/TypeScript moderno (ES6+)
- Frameworks: React, Vue, Angular
- HTML5 semântico e acessibilidade (ARIA)
- CSS moderno (Flexbox, Grid, animações)
- Responsive Design

Ferramentas Comuns:
- Build tools: Vite, Webpack, esbuild
- State management: Redux, Zustand, Pinia
- Testing: Jest, Vitest, Testing Library
- UI frameworks: Tailwind, Material-UI, Shadcn

Soft Skills:
- Colaboração com designers (UI/UX)
- Atenção a detalhes visuais
- Performance e otimização
"""
        elif track == "backend":
            track_skills = """
HABILIDADES ESPERADAS PARA BACKEND:

Técnicas Fundamentais:
- APIs RESTful e/ou GraphQL
- Autenticação e autorização (JWT, OAuth)
- Bancos de dados (SQL e NoSQL)
- Arquitetura de microserviços
- Segurança (SQL Injection, XSS, CSRF)

Ferramentas Comuns:
- Frameworks: FastAPI, Express, Django, Spring
- Bancos: PostgreSQL, MongoDB, Redis
- Message brokers: RabbitMQ, Kafka
- Containerização: Docker, Kubernetes
- CI/CD: GitHub Actions, GitLab CI

Soft Skills:
- Documentação de APIs
- Code review
- Resolução de problemas complexos
"""
        else:  # fullstack
            track_skills = """
HABILIDADES ESPERADAS PARA FULLSTACK:

Técnicas Fundamentais:
- Frontend: React/Vue + HTML/CSS/JS
- Backend: APIs (Node.js, Python, Java)
- Bancos de dados (SQL e NoSQL)
- Autenticação e segurança
- Deploy e DevOps básico

Ferramentas Comuns:
- Frontend: React, Vue, Tailwind
- Backend: FastAPI, Express, Django
- Bancos: PostgreSQL, MongoDB
- Cloud: Vercel, AWS, Heroku
- Version control: Git, GitHub

Soft Skills:
- Visão holística de produto
- Comunicação entre front e back
- Resolução de problemas end-to-end
"""

        analysis_instructions = """
TAREFA DE ANÁLISE:

Analise o currículo profundamente considerando as habilidades esperadas para a trilha do candidato.

Avalie:
1. **Alinhamento com a trilha**: O currículo mostra experiência relevante para o objetivo?
2. **Profundidade técnica**: As habilidades são apenas citadas ou há evidências de uso (projetos, resultados)?
3. **Gaps críticos**: Quais habilidades essenciais estão faltando?
4. **Pontos fortes**: O que se destaca positivamente?
5. **Oportunidades de melhoria**: Como o currículo poderia ser mais competitivo?

FORMATO DE SAÍDA (JSON ESTRITO):
Retorne APENAS JSON neste formato:

{
  "pontos_fortes": [
    "Ponto forte 1 - seja específico e mencione exemplos do currículo",
    "Ponto forte 2",
    "Ponto forte 3"
  ],
  "gaps_tecnicos": [
    "Skill/tecnologia ausente 1 que é importante para {track}",
    "Skill/tecnologia ausente 2",
    "Skill/tecnologia ausente 3"
  ],
  "sugestoes_melhoria": [
    "Sugestão específica 1 para melhorar o currículo",
    "Sugestão específica 2",
    "Sugestão específica 3"
  ],
  "nota_geral": 75,
  "resumo_executivo": "Análise geral em 2-4 linhas sobre como o currículo se posiciona para a trilha escolhida",
  "habilidades_evidenciadas": {
    "Skill 1": 85,
    "Skill 2": 70,
    "Skill 3": 60
  },
  "proximos_passos": [
    "Ação concreta 1 que o candidato pode tomar",
    "Ação concreta 2",
    "Ação concreta 3"
  ]
}

REGRAS:
- Retorne APENAS o JSON, sem texto antes ou depois
- Seja específico e cite exemplos do currículo
- nota_geral: 0-100 (considerando alinhamento com trilha)
- habilidades_evidenciadas: máximo 5 skills com nota 0-100
- Seja construtivo mas honesto
- Foque em gaps RELEVANTES para a trilha
"""

        return base_prompt + track_skills + analysis_instructions

    def analyze_resume(self, resume_content: str, career_goal: str) -> dict:
        """
        Analisa um currículo baseado no objetivo de carreira do usuário.

        Args:
            resume_content: Conteúdo do currículo em texto
            career_goal: Objetivo de carreira (ex: "Frontend Developer")

        Returns:
            Dict com análise detalhada:
            - pontos_fortes: Lista de pontos fortes
            - gaps_tecnicos: Habilidades faltantes
            - sugestoes_melhoria: Sugestões para melhorar
            - nota_geral: Nota de 0-100
            - resumo_executivo: Resumo da análise
            - habilidades_evidenciadas: Dict com skills e níveis
            - proximos_passos: Ações concretas
        """
        # Detecta track baseado no career_goal
        track = self._detect_track({"career_goal": career_goal})

        logger.info(f"Analisando currículo para track: {track}")

        prompt = self._build_resume_analysis_prompt(
            resume_content, career_goal, track)

        try:
            response_text = self._call_gemini(
                prompt, response_mime_type="application/json")
            analysis = self._parse_json_response(response_text)

            # Valida campos obrigatórios
            required_fields = ["pontos_fortes", "gaps_tecnicos",
                               "sugestoes_melhoria", "nota_geral", "resumo_executivo"]
            for field in required_fields:
                if field not in analysis:
                    logger.warning(
                        f"Campo obrigatório '{field}' ausente, adicionando default")
                    if field == "pontos_fortes":
                        analysis[field] = ["Análise não disponível"]
                    elif field == "gaps_tecnicos":
                        analysis[field] = ["Análise não disponível"]
                    elif field == "sugestoes_melhoria":
                        analysis[field] = ["Análise não disponível"]
                    elif field == "nota_geral":
                        analysis[field] = 70
                    elif field == "resumo_executivo":
                        analysis[field] = "Análise em processamento"

            logger.info(
                f"Análise de currículo completa: nota={analysis.get('nota_geral')}")
            return analysis

        except Exception as e:
            logger.error(f"Erro ao analisar currículo: {e}")
            raise

    def _extract_partial_resume_fields(self, json_buffer: str) -> dict:
        """
        Extrai campos parciais da análise de currículo durante streaming.
        
        Returns:
            Dict com campos parciais: {resumo_executivo: "...", pontos_fortes: [...], etc}
        """
        import re
        partial_fields = {}
        
        try:
            # Tenta encontrar resumo executivo
            resumo_pattern = r'"resumo_executivo"\s*:\s*"([^"]*)"'
            resumo_match = re.search(resumo_pattern, json_buffer)
            if resumo_match:
                partial_fields["resumo_executivo"] = resumo_match.group(1)
            
            # Tenta encontrar nota geral
            nota_pattern = r'"nota_geral"\s*:\s*(\d+)'
            nota_match = re.search(nota_pattern, json_buffer)
            if nota_match:
                partial_fields["nota_geral"] = int(nota_match.group(1))
            
            # Tenta encontrar arrays (pontos fortes, gaps, sugestões)
            # Pontos fortes
            pontos_pattern = r'"pontos_fortes"\s*:\s*\[(.*?)\]'
            pontos_match = re.search(pontos_pattern, json_buffer, re.DOTALL)
            if pontos_match:
                items_str = pontos_match.group(1)
                items = re.findall(r'"([^"]*)"', items_str)
                if items:
                    partial_fields["pontos_fortes"] = items
            
            # Gaps técnicos
            gaps_pattern = r'"gaps_tecnicos"\s*:\s*\[(.*?)\]'
            gaps_match = re.search(gaps_pattern, json_buffer, re.DOTALL)
            if gaps_match:
                items_str = gaps_match.group(1)
                items = re.findall(r'"([^"]*)"', items_str)
                if items:
                    partial_fields["gaps_tecnicos"] = items
            
            # Sugestões de melhoria
            sugestoes_pattern = r'"sugestoes_melhoria"\s*:\s*\[(.*?)\]'
            sugestoes_match = re.search(sugestoes_pattern, json_buffer, re.DOTALL)
            if sugestoes_match:
                items_str = sugestoes_match.group(1)
                items = re.findall(r'"([^"]*)"', items_str)
                if items:
                    partial_fields["sugestoes_melhoria"] = items
            
            return partial_fields
        except Exception as e:
            logger.debug(f"Erro ao extrair campos parciais de currículo: {e}")
            return {}

    async def analyze_resume_streaming(self, resume_content: str, career_goal: str):
        """
        Analisa currículo com streaming e yielda eventos SSE progressivamente.
        
        Args:
            resume_content: Conteúdo do currículo
            career_goal: Objetivo de carreira
            
        Yields:
            Dicionários com eventos SSE:
            - {"type": "start", "message": "..."}
            - {"type": "progress", "percent": 0-100, "message": "..."}
            - {"type": "field_chunk", "field": "resumo_executivo", "content": "..."}
            - {"type": "complete", "analysis": {...}}
            - {"type": "error", "message": "..."}
        """
        try:
            track = self._detect_track({"career_goal": career_goal})
            logger.info(f"🎬 Iniciando análise streaming para track: {track}")
            
            yield {
                "type": "start",
                "message": f"📄 Analisando currículo para {track}..."
            }
            
            prompt = self._build_resume_analysis_prompt(
                resume_content, career_goal, track)
            
            # Configurar modelo com streaming
            generation_config = self.generation_config.copy()
            generation_config["max_output_tokens"] = 8192
            
            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
                safety_settings=self.safety_settings
            )
            
            # Progresso inicial simulado (5% → 40%) otimizado
            import asyncio
            progress_steps = [
                (5, "📄 Lendo currículo..."),
                (10, "🔍 Identificando habilidades..."),
                (15, "💼 Avaliando experiências..."),
                (20, "🎓 Analisando formação..."),
                (25, "💡 Verificando projetos..."),
                (30, "📊 Comparando com mercado..."),
                (35, "🎯 Gerando sugestões..."),
                (40, "🤖 Iniciando análise detalhada...")
            ]
            
            for percent, message in progress_steps:
                yield {
                    "type": "progress",
                    "percent": percent,
                    "message": message
                }
                await asyncio.sleep(2.0)  # 2 segundos entre updates
            
            # Streaming do Gemini
            response = model.generate_content(prompt, stream=True)
            
            buffer = ""
            last_progress = 40
            chunk_count = 0
            last_extracted_length = 0
            sent_fields = {}  # Rastreia campos já enviados
            
            logger.info("📡 Aguardando chunks do Gemini para análise...")
            
            import time
            start_time = time.time()
            
            for chunk in response:
                chunk_count += 1
                elapsed = time.time() - start_time
                
                # Verificar se o chunk tem texto antes de processar
                if not chunk.text:
                    logger.info(f"📦 Chunk {chunk_count} sem texto (finish_reason: {chunk.candidates[0].finish_reason if chunk.candidates else 'unknown'})")
                    continue
                    
                buffer += chunk.text
                logger.info(
                    f"📦 Chunk {chunk_count} (+{elapsed:.2f}s): +{len(chunk.text)} chars (total: {len(buffer)})")
                
                # Atualizar progresso baseado no tamanho do buffer
                estimated_progress = min(90, 40 + (len(buffer) / 5000) * 50)
                
                if estimated_progress - last_progress >= 5:
                    yield {
                        "type": "progress",
                        "percent": int(estimated_progress),
                        "message": f"🤖 Analisando... ({len(buffer)} caracteres)"
                    }
                    last_progress = estimated_progress
                
                # Extrair e enviar campos parciais
                if len(buffer) > last_extracted_length + 100:
                    partial_fields = self._extract_partial_resume_fields(buffer)
                    
                    for field, content in partial_fields.items():
                        last_value = sent_fields.get(field)
                        
                        # Para strings, só envia se mudou
                        if isinstance(content, str):
                            if content and (not last_value or len(content) > len(str(last_value))):
                                yield {
                                    "type": "field_chunk",
                                    "field": field,
                                    "content": content,
                                    "is_complete": False
                                }
                                sent_fields[field] = content
                                logger.debug(f"📝 Campo parcial enviado: {field}, {len(content)} chars")
                        
                        # Para arrays, só envia se cresceu
                        elif isinstance(content, list):
                            if content and (not last_value or len(content) > len(last_value)):
                                yield {
                                    "type": "field_chunk",
                                    "field": field,
                                    "content": content,
                                    "is_complete": False
                                }
                                sent_fields[field] = content
                                logger.debug(f"📝 Campo parcial enviado: {field}, {len(content)} items")
                        
                        # Para números, sempre envia se mudou
                        elif isinstance(content, (int, float)):
                            if content != last_value:
                                yield {
                                    "type": "field_chunk",
                                    "field": field,
                                    "content": content,
                                    "is_complete": False
                                }
                                sent_fields[field] = content
                                logger.debug(f"📝 Campo parcial enviado: {field} = {content}")
                    
                    last_extracted_length = len(buffer)
            
            # Parse final
            analysis = self._parse_json_response(buffer)
            
            # Valida campos obrigatórios
            required_fields = ["pontos_fortes", "gaps_tecnicos",
                             "sugestoes_melhoria", "nota_geral", "resumo_executivo"]
            for field in required_fields:
                if field not in analysis:
                    logger.warning(f"Campo '{field}' ausente, adicionando default")
                    if field in ["pontos_fortes", "gaps_tecnicos", "sugestoes_melhoria"]:
                        analysis[field] = ["Análise não disponível"]
                    elif field == "nota_geral":
                        analysis[field] = 70
                    elif field == "resumo_executivo":
                        analysis[field] = "Análise em processamento"
            
            yield {
                "type": "complete",
                "analysis": analysis,
                "message": "🎉 Análise completa!"
            }
            
            logger.info(f"🎉 Análise streaming concluída: nota={analysis.get('nota_geral')}")
            
        except Exception as e:
            logger.exception("❌ Erro na análise streaming de currículo")
            yield {
                "type": "error",
                "message": f"Erro ao analisar currículo: {str(e)}"
            }
