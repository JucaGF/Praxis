# backend/app/infra/ai_gemini.py
"""
GEMINI AI - Implementação real usando Google Gemini API

Esta implementação substitui o FakeAI por IA generativa real.

Funcionalidades:
- Gera desafios personalizados por track (Frontend, Backend, Data Engineer)
- Avalia submissões com análise qualitativa
- Retorna skill assessment inteligente
- Tratamento robusto de erros
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
except ImportError:
    logger.warning("google-generativeai não instalado. Instale com: pip install google-generativeai")
    genai = None


class GeminiAI(IAIService):
    """
    Implementação real da IA usando Google Gemini.
    
    Attributes:
        api_key: Chave da API do Gemini
        model_name: Nome do modelo (default: gemini-1.5-flash)
        max_retries: Número máximo de tentativas em caso de erro
        timeout: Timeout em segundos para cada chamada
    """
    
    def __init__(
        self, 
        api_key: str,
        model_name: str = "models/gemini-2.5-flash",
        max_retries: int = 3,
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
            "temperature": 0.7,  # Criatividade moderada
            "top_p": 0.9,
            "top_k": 40,
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
        career_goal = attributes.get("career_goal", "Desenvolver habilidades técnicas")
        
        # Skills formatadas
        skills_text = "\n".join([f"  - {skill}: {level}/100" for skill, level in tech_skills.items()])
        
        # Prompt base simplificado
        base_prompt = f"""Você é um AI Career Coach. Gere 3 desafios personalizados.

PERFIL:
- Track: {track.upper()}
- Objetivo: {career_goal}
- Skills: {skills_text or "Iniciante"}

"""
        
        # Prompts específicos por track (simplificados)
        if track == "data_engineer":
            track_prompt = """
Gere 3 desafios de DATA ENGINEER:
- Tipos: SQL/Python (código), Pipeline (planejamento), Comunicação
- Categorias: data-exploration, data-pipeline, data-modeling, performance-tuning, comunicacao
- Skills alvo: SQL, Python, Airflow, Spark
"""
        elif track == "frontend":
            track_prompt = """
Gere 3 desafios de FRONTEND:
- Tipos: Bugfix (código), Feature (código), UI/UX ou Comunicação
- Categorias: bugfix, feature, ui-ux, comunicacao, planejamento
- Skills alvo: React, Vue, JavaScript, TypeScript, CSS
"""
        elif track == "fullstack":
            track_prompt = """
Gere 3 desafios de FULLSTACK:
- OBRIGATÓRIO: 1 FRONTEND + 1 BACKEND + 1 qualquer
- Tipos: Código (front/back), Planejamento, Comunicação
- Categorias: bugfix, feature, api-design, ui-ux, performance, comunicacao
- Skills alvo: React, Python, JavaScript, FastAPI, SQL
"""
        else:  # backend
            track_prompt = """
Gere 3 desafios de BACKEND:
- Tipos: API/Bugfix (código), Performance (planejamento), Comunicação
- Categorias: bugfix, api-design, performance, comunicacao, planejamento
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
    "target_skill": "Skill do perfil",
    "hints": ["dica útil 1", "dica útil 2"],
    "enunciado": null  // NOVO: objeto estruturado (veja regras abaixo)
  },
  "difficulty": {"level": "easy|medium|hard", "time_limit": 20-90},
  "category": "bugfix|feature|api-design|ui-ux|performance|comunicacao|planejamento",
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

REGRAS OBRIGATÓRIAS:
1. Retorne array com exatamente 3 desafios
2. target_skill DEVE existir nas skills do usuário
3. Varie dificuldade: 1 easy, 1 medium, 1 hard
4. description.text: Tom conversacional (chefe falando)
5. SEMPRE adicione 2-4 hints úteis e práticas
6. Para type="codigo":
   - fs é OBRIGATÓRIO (não null!)
   - fs.files: 2-4 caminhos realistas
   - fs.open: arquivo principal
   - fs.contents: TODOS os arquivos com código real (15-30 linhas)
   - Código deve ser bugado, incompleto ou precisar refatoração
   - enunciado: null
   - template_code: null
7. Para type="texto_livre":
   - fs: null
   - enunciado: OBRIGATÓRIO - simule um e-mail/ticket realista
     Formato: {"type": "email", "de": "nome@empresa.com", "assunto": "assunto do email", "data": "2024-11-15", "corpo": "texto do email (3-5 linhas)"}
   - template_code: null
8. Para type="planejamento":
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
    "eval_criteria": ["Status HTTP 400", "Validação de email", "Mensagem clara"],
    "target_skill": "FastAPI",
    "hints": ["Use EmailStr do pydantic", "HTTPException(status_code=400)", "Adicione try-except na rota"],
    "enunciado": null
  },
  "difficulty": {"level": "easy", "time_limit": 25},
  "category": "bugfix",
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
    "eval_criteria": ["Tom profissional", "Empatia", "Solução proposta", "Clareza"],
    "target_skill": "Comunicação",
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
  "category": "comunicacao",
  "fs": null,
  "template_code": null
}

// Exemplo 3: type="planejamento"
{
  "title": "Planejar Sistema de Notificações em Tempo Real",
  "description": {
    "text": "Fala! Vamos implementar notificações em tempo real no app (likes, comentários, mensagens). Preciso que você planeje a arquitetura: quais tecnologias usar, como escalar, trade-offs, etc.",
    "type": "planejamento",
    "language": "markdown",
    "eval_criteria": ["Escolha de tecnologias", "Escalabilidade", "Justificativa técnica", "Trade-offs"],
    "target_skill": "Arquitetura",
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
  "category": "planejamento",
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
        submission_type = submission.get("type", "codigo")
        submitted_content = ""
        
        if submission_type == "codigo":
            # Para código: extrai arquivos
            files = submission.get("files", {})
            if files:
                submitted_content = "\n\n".join([
                    f"// {filename}\n{content}" 
                    for filename, content in files.items()
                ])
            else:
                submitted_content = submission.get("content", "")
        
        elif submission_type == "texto_livre":
            # Para texto livre: extrai o conteúdo textual
            submitted_content = submission.get("content", "")
        
        elif submission_type == "planejamento":
            # Para planejamento: extrai form_data (respostas do formulário)
            form_data = submission.get("form_data", {})
            if form_data:
                # Formata as respostas do formulário de forma legível
                parts = []
                for section_id, fields in form_data.items():
                    parts.append(f"=== {section_id.upper()} ===")
                    if isinstance(fields, dict):
                        for field_id, value in fields.items():
                            parts.append(f"{field_id}: {value}")
                    parts.append("")
                submitted_content = "\n".join(parts)
            else:
                # Fallback para content se form_data não existir
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
                # Para planejamento: mostra os requisitos
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
        
        assessment_instructions = """
TAREFA DE AVALIAÇÃO:

1. Analise a submissão profundamente considerando os critérios acima
2. Atribua uma nota geral (0-100)
3. Avalie métricas específicas por critério
4. IMPORTANTE: Faça SKILL ASSESSMENT inteligente:
   
   a) skill_level_demonstrated (0-100):
      - NÃO é igual à nota!
      - Considere: nota + qualidade + práticas + complexidade
      - Exemplo: nota 88 mas código com más práticas → demonstrated=75
      - Exemplo: nota 75 mas excelente arquitetura → demonstrated=82
   
   b) should_progress (true/false):
      - true se demonstrated >= 70
      - false caso contrário
   
   c) progression_intensity (-1.0 a +1.0):
      - Positivo: submissão mostra evolução
        * +0.9: excelente, domínio claro
        * +0.7: muito bom, boas práticas
        * +0.5: bom, competente
        * +0.3: satisfatório, funcional
        * +0.1: mínimo aceitável
      - Negativo: submissão mostra problemas
        * -0.2: falhas leves, más práticas
        * -0.5: falhas significativas, desconhecimento
      
   d) reasoning (string):
      - Explique POR QUÊ a skill deve progredir/regredir
      - Seja específico e construtivo
      - Mencione pontos fortes E fracos

FORMATO DE SAÍDA (JSON ESTRITO):
Retorne APENAS JSON neste formato:

{
  "nota_geral": 85,
  "metricas": {
    "criterio1": 90,
    "criterio2": 85,
    "criterio3": 80
  },
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
  "skill_assessment": {
    "skill_level_demonstrated": 88,
    "should_progress": true,
    "progression_intensity": 0.7,
    "reasoning": "Demonstrou domínio sólido com boas práticas. Query otimizada com índices apropriados, mas poderia considerar particionamento para escalabilidade futura."
  }
}

REGRAS:
- Retorne APENAS o JSON, sem texto antes ou depois
- Seja justo mas rigoroso
- Valorize boas práticas mesmo que funcione
- Penalize más práticas mesmo que funcione
- skill_level_demonstrated deve ser calculado holisticamente
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
                logger.info(f"Chamando Gemini (tentativa {attempt}/{self.max_retries})")
                
                response = model.generate_content(
                    prompt,
                    request_options={"timeout": self.timeout}
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
                logger.warning(
                    f"Gemini API error (tentativa {attempt}/{self.max_retries}): {e}",
                    extra={"extra_data": {"error": str(e), "attempt": attempt}}
                )
                
                # Backoff exponencial
                if attempt < self.max_retries:
                    wait_time = 2 ** attempt  # 2s, 4s, 8s
                    logger.info(f"Aguardando {wait_time}s antes de retentar...")
                    time.sleep(wait_time)
        
        # Se chegou aqui, falhou todas as tentativas
        error_msg = f"Falha ao chamar Gemini após {self.max_retries} tentativas: {last_error}"
        logger.error(error_msg)
        raise Exception(error_msg)
    
    def _parse_json_response(self, response_text: str, fallback: Optional[dict] = None) -> dict:
        """
        Parseia resposta JSON da API com tratamento de erros.
        
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
            logger.error(f"Erro ao parsear JSON: {e}\nResposta: {response_text[:200]}")
            if fallback:
                return fallback
            raise
    
    # ==================== MÉTODOS DA INTERFACE ====================
    
    def generate_challenges(self, profile: dict, attributes: dict) -> List[dict]:
        """
        Gera desafios personalizados usando Gemini.
        
        Args:
            profile: Dados do perfil
            attributes: Skills e career_goal
            
        Returns:
            Lista de 3 desafios personalizados
        """
        track = self._detect_track(attributes)
        logger.info(f"Gerando desafios para track: {track}")
        
        prompt = self._build_challenge_prompt(profile, attributes, track)
        
        try:
            response_text = self._call_gemini(prompt, response_mime_type="application/json")
            challenges = self._parse_json_response(response_text)
            
            # Valida que é uma lista
            if not isinstance(challenges, list):
                logger.warning("Resposta não é uma lista, tentando extrair...")
                if isinstance(challenges, dict) and "challenges" in challenges:
                    challenges = challenges["challenges"]
                else:
                    raise ValueError("Formato de resposta inválido")
            
            # Limita a 3 desafios
            challenges = challenges[:3]
            
            logger.info(f"Gerados {len(challenges)} desafios com sucesso")
            return challenges
            
        except Exception as e:
            logger.error(f"Erro ao gerar desafios: {e}")
            # Fallback: retorna lista vazia ou poderia retornar desafios do FakeAI
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
        target_skill = (challenge.get("description") or {}).get("target_skill", "")
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
            response_text = self._call_gemini(prompt, response_mime_type="application/json")
            evaluation = self._parse_json_response(response_text)
            
            # Valida campos obrigatórios
            required_fields = ["nota_geral", "metricas", "skill_assessment"]
            for field in required_fields:
                if field not in evaluation:
                    logger.warning(f"Campo obrigatório '{field}' ausente, adicionando default")
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
            
            logger.info(f"Avaliação completa: nota={evaluation.get('nota_geral')}")
            return evaluation
            
        except Exception as e:
            logger.error(f"Erro ao avaliar submissão: {e}")
            raise
        