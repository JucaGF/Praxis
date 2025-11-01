# backend/ai_fake.py
from typing import List, Dict

# ✅ Importa a interface que vamos implementar
from backend.app.domain.ports import IAIService

def _front():
    return [
        {
          "title": "Corrigir evento de clique no login",
          "description": {
            "text": "Olá! Temos um problema urgente: o botão de login não está disparando o evento de submit quando clicado. Os usuários estão reclamando que não conseguem entrar no sistema. Você pode dar uma olhada e corrigir isso mantendo a acessibilidade?",
            "type": "codigo",
            "language": "javascript",
            "eval_criteria": ["onClick funcional","sem regressão","legibilidade"],
            "target_skill": "React",
            "hints": []
          },
          "difficulty": {"level": "medium", "time_limit": 30},
          "fs": {
            "files": ["src/App.jsx","src/components/Button.jsx","README.md"],
            "open": "src/components/Button.jsx",
            "contents": {
              "src/App.jsx": "export default function App(){return <div>Login</div>}",
              "src/components/Button.jsx": "export default function Button({onClick}){return <button>// onClick</button>}",
              "README.md": "# Dica\nAtive o handler onClick."
            }
          },
          "category": "bugfix",
          "template_code": None
        },
        {
          "title": "Responder ticket de bug crítico",
          "description": {
            "text": "Oi! O cliente VIP da empresa XYZ reportou erro 500 ao finalizar a compra no checkout. Ele está bem chateado. Preciso que você responda o ticket dele com empatia e peça os dados necessários para investigarmos (logs, horário, navegador, etc).",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["empatia","dados solicitados","clareza"],
            "target_skill": "comunicacao",
            "hints": [],
            "enunciado": {
              "type": "email",
              "de": "rodrigo.silva@xyz.com.br",
              "assunto": "URGENTE: Erro 500 no Checkout - Perdendo Vendas!",
              "data": "2024-11-01",
              "corpo": "Prezados,\n\nEstou tentando finalizar uma compra há 2 horas e continuo recebendo erro 500. Já tentei 3 cartões diferentes. Isso é inaceitável! Estou perdendo tempo e o prazo para usar meu cupom de desconto está acabando. Preciso de uma solução IMEDIATA ou vou cancelar meu plano Premium.\n\nAguardo retorno urgente."
            }
          },
          "difficulty": {"level": "easy", "time_limit": 20},
          "fs": None,
          "category": "comunicacao",
          "template_code": None
        },
        {
          "title": "Planejar notificações em tempo real",
          "description": {
            "text": "Fala! Precisamos implementar um sistema de notificações em tempo real para o dashboard. Teremos cerca de 10k usuários online simultaneamente. Você pode desenhar o fluxo e as tecnologias que usaríamos? Pensa em escalabilidade e performance!",
            "type": "planejamento",
            "language": "markdown",
            "eval_criteria": ["tecnologias adequadas","escalabilidade","clareza"],
            "target_skill": "arquitetura",
            "hints": ["Considere WebSocket/Redis"],
            "enunciado": {
              "type": "requisitos",
              "funcionais": [
                "Notificar usuários sobre novos eventos (likes, comentários, mensagens)",
                "Exibir badge com contador de notificações não lidas",
                "Histórico de notificações dos últimos 30 dias",
                "Marcar notificações individuais como lidas"
              ],
              "nao_funcionais": [
                "Suportar 10k usuários simultâneos",
                "Latência máxima de 2 segundos para entrega",
                "Disponibilidade de 99.9%"
              ]
            }
          },
          "difficulty": {"level": "hard", "time_limit": 45},
          "fs": None,
          "category": "planejamento",
          "template_code": [
            {
              "id": "tecnologias",
              "label": "Tecnologias Principais",
              "fields": [
                {"id": "protocolo", "label": "Protocolo de Comunicação", "type": "dropdown", "options": ["WebSocket", "Server-Sent Events (SSE)", "Long Polling"]},
                {"id": "message_broker", "label": "Message Broker", "type": "dropdown", "options": ["Redis Pub/Sub", "RabbitMQ", "Kafka", "Não usar"]},
                {"id": "armazenamento", "label": "Armazenamento", "type": "dropdown", "options": ["PostgreSQL", "MongoDB", "Redis"]}
              ]
            },
            {
              "id": "justificativa",
              "label": "Justificativa",
              "fields": [
                {"id": "porque", "label": "Por que escolheu essas tecnologias?", "type": "textarea"}
              ]
            },
            {
              "id": "tradeoffs",
              "label": "Trade-offs",
              "fields": [
                {"id": "limitacoes", "label": "Principais limitações da solução", "type": "textarea"}
              ]
            }
          ]
        }
    ]

def _back():
    return [
        {
          "title": "Corrigir validação no endpoint de login",
          "description": {
            "text": "E aí! O endpoint de login está aceitando qualquer coisa como email e senha. Preciso que você corrija a validação e retorne os status HTTP apropriados (400 para dados inválidos, 401 para credenciais erradas). Tá deixando passar até email sem @!",
            "type": "codigo",
            "language": "python",
            "eval_criteria": ["status corretos","validação robusta","legibilidade"],
            "target_skill": "FastAPI",
            "hints": []
          },
          "difficulty": {"level": "medium", "time_limit": 35},
          "fs": {
            "files": ["app/main.py","app/auth.py","README.md"],
            "open": "app/auth.py",
            "contents": {
              "app/main.py": "from fastapi import FastAPI\napp = FastAPI()",
              "app/auth.py": "# TODO: validar",
              "README.md": "# Contexto\nValide campos e retorne 400/401."
            }
          },
          "category": "bugfix",
          "template_code": None
        },
        {
          "title": "Responder incidente de lentidão",
          "description": {
            "text": "Oi! O time de suporte abriu um incidente reportando que a API está lenta desde às 14h. Vários clientes reclamando. Preciso que você responda o ticket pedindo as métricas necessárias para investigar (latência, logs, endpoints afetados, horário dos picos, etc).",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["clareza","priorização","dados solicitados"],
            "target_skill": "comunicacao",
            "hints": [],
            "enunciado": {
              "type": "email",
              "de": "suporte@empresa.com.br",
              "assunto": "INC-4567: Lentidão na API - Múltiplos Clientes Afetados",
              "data": "2024-11-01",
              "corpo": "Olá equipe de backend,\n\nEstamos recebendo múltiplas reclamações de clientes sobre lentidão na API desde às 14h. Os clientes reportam timeouts e respostas demoradas. Já temos 12 tickets abertos. Conseguem investigar com urgência?\n\nAguardo retorno."
            }
          },
          "difficulty": {"level": "easy", "time_limit": 20},
          "fs": None,
          "category": "comunicacao",
          "template_code": None
        },
        {
          "title": "Projetar cache para endpoint crítico",
          "description": {
            "text": "Fala! O endpoint /api/products está recebendo 10k requisições/minuto e sobrecarregando o banco. Preciso que você desenhe uma estratégia de cache para ele (TTL, invalidação, onde cachear). Pensa em Redis e em como garantir que os dados não fiquem desatualizados!",
            "type": "planejamento",
            "language": "markdown",
            "eval_criteria": ["coerência","invalidação","escalabilidade"],
            "target_skill": "arquitetura",
            "hints": ["Considere Redis"],
            "enunciado": {
              "type": "requisitos",
              "funcionais": [
                "Cachear resposta do endpoint /api/products",
                "Invalidar cache quando produto for atualizado/criado/deletado",
                "Suportar filtros e paginação no cache",
                "Cache deve ser compartilhado entre múltiplas instâncias da API"
              ],
              "nao_funcionais": [
                "Reduzir latência de 800ms para <100ms",
                "Suportar 10k requisições/minuto",
                "Garantir consistência eventual (máximo 5 segundos de atraso)"
              ]
            }
          },
          "difficulty": {"level": "hard", "time_limit": 45},
          "fs": None,
          "category": "planejamento",
          "template_code": [
            {
              "id": "estrategia",
              "label": "Estratégia de Cache",
              "fields": [
                {"id": "onde", "label": "Onde implementar o cache?", "type": "dropdown", "options": ["Redis", "Memcached", "Application Memory", "CDN"]},
                {"id": "ttl", "label": "TTL (Time To Live)", "type": "dropdown", "options": ["30 segundos", "5 minutos", "1 hora", "Sem TTL"]},
                {"id": "pattern", "label": "Padrão de Cache", "type": "dropdown", "options": ["Cache-Aside", "Write-Through", "Write-Behind"]}
              ]
            },
            {
              "id": "invalidacao",
              "label": "Invalidação",
              "fields": [
                {"id": "quando", "label": "Como invalidar o cache?", "type": "textarea"},
                {"id": "granularidade", "label": "Granularidade", "type": "dropdown", "options": ["Cache completo", "Por produto", "Por categoria"]}
              ]
            },
            {
              "id": "tradeoffs",
              "label": "Trade-offs",
              "fields": [
                {"id": "problemas", "label": "Problemas potenciais dessa estratégia", "type": "textarea"}
              ]
            }
          ]
        }
    ]

def _de():
    return [
        {
          "title": "Encontrar 3 insights acionáveis no dataset de vendas",
          "description": {
            "text": "E aí! O time de produto pediu uma análise do dataset de vendas (colunas: date, product, category, revenue, region). Preciso que você gere pelo menos 3 insights acionáveis com números concretos e sugira 1 ação para cada insight. Se puder, inclua trechos de SQL ou Python!",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["corretude","metodologia","reprodutibilidade","clareza/ação"],
            "target_skill": "SQL",
            "hints": ["Se possível, inclua trechos de SQL ou Python"],
            "enunciado": {
              "type": "email",
              "de": "maria.produto@empresa.com.br",
              "assunto": "Análise de Vendas Q3 - Urgente",
              "data": "2024-11-01",
              "corpo": "Oi time de dados!\n\nPrecisamos de insights sobre o dataset de vendas do Q3 para a reunião de estratégia de amanhã. O que está vendendo bem? Onde estamos perdendo dinheiro? Tem alguma região problemática?\n\nPreciso de 3 insights acionáveis com números concretos até o fim do dia. Dataset está em: data/sales_q3.csv\n\nObrigada!"
            }
          },
          "difficulty": {"level": "medium", "time_limit": 40},
          "fs": None,
          "category": "data-exploration",
          "template_code": None
        },
        {
          "title": "Desenhar pipeline batch de ingestão",
          "description": {
            "text": "Fala! Precisamos criar um pipeline batch diário para ingerir dados de uma API externa (ingestão → staging → curado). Você pode desenhar a arquitetura usando Airflow? Lembra de pensar em idempotência, particionamento e monitoramento. O volume esperado é de 500k registros/dia.",
            "type": "planejamento",
            "language": "markdown",
            "eval_criteria": ["orquestração","idempotência","particionamento","monitoramento"],
            "target_skill": "Airflow",
            "hints": ["Considere DAG diária e retries"],
            "enunciado": {
              "type": "requisitos",
              "funcionais": [
                "Ingerir dados diários de API externa (endpoint: /api/v1/orders)",
                "Pipeline: bronze (raw) → silver (staging) → gold (curado)",
                "Dados devem ser particionados por data",
                "Pipeline deve ser idempotente (reruns não duplicam dados)"
              ],
              "nao_funcionais": [
                "Volume: 500k registros/dia (~20GB)",
                "Janela de execução: 00:00 às 06:00",
                "SLA: 95% de sucesso nos últimos 30 dias"
              ]
            }
          },
          "difficulty": {"level": "easy", "time_limit": 30},
          "fs": None,
          "category": "data-pipeline",
          "template_code": [
            {
              "id": "orquestracao",
              "label": "Orquestração",
              "fields": [
                {"id": "ferramenta", "label": "Ferramenta de Orquestração", "type": "dropdown", "options": ["Apache Airflow", "Prefect", "Dagster", "Cron Jobs"]},
                {"id": "schedule", "label": "Schedule", "type": "dropdown", "options": ["Diário 00:00", "Diário 06:00", "A cada 6 horas"]},
                {"id": "retries", "label": "Retries em caso de falha", "type": "dropdown", "options": ["0", "2", "3", "5"]}
              ]
            },
            {
              "id": "idempotencia",
              "label": "Idempotência",
              "fields": [
                {"id": "estrategia", "label": "Como garantir idempotência?", "type": "textarea"}
              ]
            },
            {
              "id": "monitoramento",
              "label": "Monitoramento",
              "fields": [
                {"id": "alertas", "label": "Quando alertar?", "type": "textarea"},
                {"id": "metricas", "label": "Métricas principais", "type": "textarea"}
              ]
            }
          ]
        },
        {
          "title": "Comunicar incidente de atraso no DAG principal",
          "description": {
            "text": "Oi! O DAG principal de vendas atrasou 4 horas hoje e isso impactou os dashboards do time de negócio. Eles estão perguntando o que aconteceu. Preciso que você escreva uma comunicação breve explicando o atraso, o impacto, o ETA de normalização e os próximos passos. Seja transparente mas tranquilizador!",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["clareza","transparência","plano de ação"],
            "target_skill": "comunicacao",
            "hints": ["Inclua métricas: atraso estimado, SLAs"],
            "enunciado": {
              "type": "email",
              "de": "joao.negocio@empresa.com.br",
              "assunto": "Dashboards de vendas desatualizados - O que está acontecendo?",
              "data": "2024-11-01",
              "corpo": "Oi pessoal,\n\nOs dashboards de vendas não estão atualizando desde às 10h. Tenho uma apresentação importante às 16h e preciso dos dados mais recentes. Conseguem resolver isso urgentemente e me explicar o que aconteceu?\n\nEstou preocupado que isso vire rotina.\n\nAguardo retorno."
            }
          },
          "difficulty": {"level": "hard", "time_limit": 25},
          "fs": None,
          "category": "comunicacao",
          "template_code": None
        }
    ]

class FakeAI(IAIService):
    """
    Implementação fake/mock do serviço de IA.
    
    Herda de IAIService, cumprindo o contrato:
    - Implementa generate_challenges()
    - Implementa evaluate_submission()
    
    Usado para:
    - Desenvolvimento (sem gastar API calls de IA real)
    - Testes automatizados
    - Demonstrações
    
    No futuro, criaremos GeminiAI(IAIService) com IA real!
    """
    def _track(self, attributes: dict) -> str:
        goal = (attributes.get("career_goal") or "").lower()
        
        # Data Engineer
        if any(k in goal for k in ["data", "etl", "pipeline", "airflow"]):
            return "data_engineer"
        
        # Fullstack explícito
        if any(k in goal for k in ["fullstack", "full-stack", "full stack"]):
            return "fullstack"
        
        # Frontend
        if "front" in goal:
            return "frontend"
        
        # Backend
        if "back" in goal:
            return "backend"
        
        # Default: fullstack
        return "fullstack"

    def generate_challenges(self, profile: dict, attributes: dict) -> List[dict]:
        import random
        
        t = self._track(attributes)
        
        if t == "frontend":
            return _front()
        elif t == "backend":
            return _back()
        elif t == "data_engineer":
            return _de()
        else:  # fullstack
            # Mistura desafios de frontend e backend
            front_challenges = _front()
            back_challenges = _back()
            
            # Pega 2 de front e 1 de back (ou vice-versa, aleatório)
            if random.random() > 0.5:
                # 2 frontend + 1 backend
                mixed = [
                    front_challenges[0],
                    front_challenges[1],
                    back_challenges[0]
                ]
            else:
                # 1 frontend + 2 backend
                mixed = [
                    front_challenges[0],
                    back_challenges[0],
                    back_challenges[1]
                ]
            
            # Embaralha para não ter ordem fixa
            random.shuffle(mixed)
            return mixed

    def evaluate_submission(self, challenge: dict, submission: dict) -> dict:
        """
        Avalia submissão com análise inteligente de progressão de skill.
        
        A lógica fake simula cenários realistas:
        - Nota alta + boas práticas → progressão forte
        - Nota alta + más práticas → progressão fraca ou regressão
        - Código funcional mas simples demais → progressão mínima
        - Sinais de evolução mesmo com nota média → progressão moderada
        """
        ch_type = (challenge.get("description") or {}).get("type")
        difficulty = (challenge.get("difficulty") or {}).get("level", "medium")
        
        # Nota base varia por tipo de desafio
        base = 82
        if ch_type == "codigo" and submission.get("files"): base = 88
        if ch_type == "planejamento": base = 78
        if ch_type == "texto_livre": base = 85
        
        metrics = (
            {"resolveu_problema": base, "qualidade_codigo": base-3, "boas_praticas": base-5}
            if ch_type == "codigo" else
            {"comunicacao": base-2, "conteudo_tecnico": base-3, "completude": base}
        )
        
        # Determina skill_level_demonstrated e progression_intensity
        # Para o fake, usa lógica simples baseada na nota
        skill_demonstrated = base + 3  # Ligeiramente acima da nota
        should_progress = skill_demonstrated >= 70
        
        if base >= 90:
            intensity = 0.9
            reasoning = "Excelente execução! Demonstrou domínio sólido da skill."
        elif base >= 80:
            intensity = 0.7
            reasoning = "Boa solução com práticas adequadas. Demonstrou competência clara."
        elif base >= 70:
            intensity = 0.5
            reasoning = "Solução funcional e adequada. Demonstrou conhecimento satisfatório."
        elif base >= 60:
            intensity = 0.3
            reasoning = "Solução básica mas funcional. Ainda há espaço para crescimento."
        else:
            intensity = -0.2
            should_progress = False
            reasoning = "Solução apresenta falhas significativas. Recomenda-se revisar conceitos fundamentais."
        
        return {
            "nota_geral": base,
            "metricas": metrics,
            "pontos_positivos": ["Estrutura clara", "Abordagem adequada"],
            "pontos_negativos": ["Cobertura de casos de erro limitada"] if ch_type=="codigo" else ["Faltaram exemplos numéricos"],
            "sugestoes_melhoria": ["Adicionar testes básicos"] if ch_type=="codigo" else ["Detalhar amostragem e limitações"],
            "feedback_detalhado": "Bom caminho. Pequenos ajustes elevam a qualidade.",
            "skill_assessment": {
                "skill_level_demonstrated": skill_demonstrated,
                "should_progress": should_progress,
                "progression_intensity": intensity,
                "reasoning": reasoning
            }
        }
