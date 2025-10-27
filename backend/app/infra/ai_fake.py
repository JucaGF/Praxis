# backend/ai_fake.py
from typing import List, Dict

# ✅ Importa a interface que vamos implementar
from backend.app.domain.ports import IAIService

def _front():
    return [
        {
          "title": "Corrigir evento de clique no login",
          "description": {
            "text": "O botão não dispara submit ao clicar. Corrija mantendo acessibilidade.",
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
            "text": "Cliente VIP relatou erro 500 ao finalizar compra. Responda com empatia e peça dados.",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["empatia","dados solicitados","clareza"],
            "target_skill": "comunicacao",
            "hints": []
          },
          "difficulty": {"level": "easy", "time_limit": 20},
          "fs": None,
          "category": "comunicacao",
          "template_code": None
        },
        {
          "title": "Planejar notificações em tempo real",
          "description": {
            "text": "Desenhe fluxo e tecnologias para notificações realtime (10k usuários online).",
            "type": "planejamento",
            "language": "markdown",
            "eval_criteria": ["tecnologias adequadas","escalabilidade","clareza"],
            "target_skill": "arquitetura",
            "hints": ["Considere WebSocket/Redis"]
          },
          "difficulty": {"level": "hard", "time_limit": 45},
          "fs": None,
          "category": "planejamento",
          "template_code": None
        }
    ]

def _back():
    return [
        {
          "title": "Corrigir validação no endpoint de login",
          "description": {
            "text": "Corrija a validação de email/senha e retorne status apropriados.",
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
            "text": "Responda um incidente pedindo métricas (latência, logs, endpoints afetados).",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["clareza","priorização","dados solicitados"],
            "target_skill": "comunicacao",
            "hints": []
          },
          "difficulty": {"level": "easy", "time_limit": 20},
          "fs": None,
          "category": "comunicacao",
          "template_code": None
        },
        {
          "title": "Projetar cache para endpoint crítico",
          "description": {
            "text": "Desenhe cache (TTL, invalidação) para reduzir carga de leitura.",
            "type": "planejamento",
            "language": "markdown",
            "eval_criteria": ["coerência","invalidação","escalabilidade"],
            "target_skill": "arquitetura",
            "hints": ["Considere Redis"]
          },
          "difficulty": {"level": "hard", "time_limit": 45},
          "fs": None,
          "category": "planejamento",
          "template_code": None
        }
    ]

def _de():
    return [
        {
          "title": "Encontrar 3 insights acionáveis no dataset de vendas",
          "description": {
            "text": "Analise o dataset (date, product, category, revenue, region). Gere 3+ insights com números e 1 ação por insight.",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["corretude","metodologia","reprodutibilidade","clareza/ação"],
            "target_skill": "SQL",
            "hints": ["Se possível, inclua trechos de SQL ou Python"]
          },
          "difficulty": {"level": "medium", "time_limit": 40},
          "fs": None,
          "category": "data-exploration",
          "template_code": None
        },
        {
          "title": "Desenhar pipeline batch de ingestão",
          "description": {
            "text": "Desenhe um pipeline diário (ingestão -> staging -> curado) com orquestração.",
            "type": "planejamento",
            "language": "markdown",
            "eval_criteria": ["orquestração","idempotência","particionamento","monitoramento"],
            "target_skill": "Airflow",
            "hints": ["Considere DAG diária e retries"]
          },
          "difficulty": {"level": "easy", "time_limit": 30},
          "fs": None,
          "category": "data-pipeline",
          "template_code": None
        },
        {
          "title": "Comunicar incidente de atraso no DAG principal",
          "description": {
            "text": "Escreva uma comunicação breve explicando atraso, impacto, ETAs e próximos passos.",
            "type": "texto_livre",
            "language": "markdown",
            "eval_criteria": ["clareza","transparência","plano de ação"],
            "target_skill": "comunicacao",
            "hints": ["Inclua métricas: atraso estimado, SLAs"]
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
        if "front" in goal: return "frontend"
        if "back" in goal: return "backend"
        if "data" in goal: return "data_engineer"
        return "frontend"

    def generate_challenges(self, profile: dict, attributes: dict) -> List[dict]:
        t = self._track(attributes)
        if t == "frontend": return _front()
        if t == "backend": return _back()
        return _de()

    def evaluate_submission(self, challenge: dict, submission: dict) -> dict:
        ch_type = (challenge.get("description") or {}).get("type")
        base = 82
        if ch_type == "codigo" and submission.get("files"): base = 88
        if ch_type == "planejamento": base = 78
        metrics = (
            {"resolveu_problema": base, "qualidade_codigo": base-3, "boas_praticas": base-5}
            if ch_type == "codigo" else
            {"comunicacao": base-2, "conteudo_tecnico": base-3, "completude": base}
        )
        return {
            "nota_geral": base,
            "metricas": metrics,
            "pontos_positivos": ["Estrutura clara"],
            "pontos_negativos": ["Cobertura de casos de erro limitada"] if ch_type=="codigo" else ["Faltaram exemplos numéricos"],
            "sugestoes_melhoria": ["Adicionar testes básicos"] if ch_type=="codigo" else ["Detalhar amostragem e limitações"],
            "feedback_detalhado": "Bom caminho. Pequenos ajustes elevam a qualidade."
        }
