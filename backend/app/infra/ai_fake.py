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
            "text": "Fala! Precisamos implementar um sistema de notificações em tempo real para o dashboard. Teremos cerca de 10k usuários online simultaneamente. Você pode desenhar o fluxo e as tecnologias que usaríamos? Pensa em escalabilidade e performance!",
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
            "text": "Fala! O endpoint /api/products está recebendo 10k requisições/minuto e sobrecarregando o banco. Preciso que você desenhe uma estratégia de cache para ele (TTL, invalidação, onde cachear). Pensa em Redis e em como garantir que os dados não fiquem desatualizados!",
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
            "text": "E aí! O time de produto pediu uma análise do dataset de vendas (colunas: date, product, category, revenue, region). Preciso que você gere pelo menos 3 insights acionáveis com números concretos e sugira 1 ação para cada insight. Se puder, inclua trechos de SQL ou Python!",
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
            "text": "Fala! Precisamos criar um pipeline batch diário para ingerir dados de uma API externa (ingestão → staging → curado). Você pode desenhar a arquitetura usando Airflow? Lembra de pensar em idempotência, particionamento e monitoramento. O volume esperado é de 500k registros/dia.",
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
            "text": "Oi! O DAG principal de vendas atrasou 4 horas hoje e isso impactou os dashboards do time de negócio. Eles estão perguntando o que aconteceu. Preciso que você escreva uma comunicação breve explicando o atraso, o impacto, o ETA de normalização e os próximos passos. Seja transparente mas tranquilizador!",
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
        if ch_type == "codigo" and submission.get("files"): 
            base = 88
        if ch_type == "planejamento": 
            base = 78
        
        # Métricas detalhadas
        metrics = (
            {"resolveu_problema": base, "qualidade_codigo": base-3, "boas_praticas": base-5}
            if ch_type == "codigo" else
            {"comunicacao": base-2, "conteudo_tecnico": base-3, "completude": base}
        )
        
        # ===== SKILL ASSESSMENT - Lógica Inteligente =====
        skill_assessment = self._assess_skill_progression(
            nota=base,
            ch_type=ch_type,
            difficulty=difficulty,
            metrics=metrics,
            submission=submission
        )
        
        return {
            "nota_geral": base,
            "metricas": metrics,
            "pontos_positivos": ["Estrutura clara"],
            "pontos_negativos": ["Cobertura de casos de erro limitada"] if ch_type=="codigo" else ["Faltaram exemplos numéricos"],
            "sugestoes_melhoria": ["Adicionar testes básicos"] if ch_type=="codigo" else ["Detalhar amostragem e limitações"],
            "feedback_detalhado": "Bom caminho. Pequenos ajustes elevam a qualidade.",
            "skill_assessment": skill_assessment
        }
    
    def _assess_skill_progression(
        self, 
        nota: int, 
        ch_type: str, 
        difficulty: str,
        metrics: dict,
        submission: dict
    ) -> dict:
        """
        Avalia se a skill deve progredir/regredir e com qual intensidade.
        
        Simula análise qualitativa considerando:
        - Qualidade vs expectativa do nível
        - Boas/más práticas (métricas)
        - Complexidade da solução
        - Sinais de evolução ou estagnação
        """
        import random
        random.seed(hash(str(submission)) % 10000)  # Determinístico por submissão
        
        # 1. Nível demonstrado base (pode ser diferente da nota!)
        skill_demonstrated = nota
        
        # 2. Ajustes baseados em métricas de qualidade
        if ch_type == "codigo":
            boas_praticas = metrics.get("boas_praticas", nota)
            qualidade = metrics.get("qualidade_codigo", nota)
            
            # Más práticas puxam o nível demonstrado pra baixo
            if boas_praticas < 75:
                skill_demonstrated -= 8
            elif boas_praticas < 80:
                skill_demonstrated -= 3
            
            # Qualidade baixa também afeta
            if qualidade < nota - 5:
                skill_demonstrated -= 5
        
        # 3. Ajuste por dificuldade (expectativa mais alta em challenges fáceis)
        if difficulty == "easy" and nota < 85:
            skill_demonstrated -= 5  # Esperava-se mais em easy
        elif difficulty == "hard" and nota >= 75:
            skill_demonstrated += 3  # Bom desempenho em hard vale mais
        
        # 4. Determina se deve progredir
        should_progress = skill_demonstrated >= 70  # Threshold mínimo
        
        # 5. Intensidade de progressão (-1.0 a +1.0)
        if skill_demonstrated >= 90:
            intensity = 0.9  # Excelente
        elif skill_demonstrated >= 85:
            intensity = 0.7  # Muito bom
        elif skill_demonstrated >= 80:
            intensity = 0.5  # Bom
        elif skill_demonstrated >= 75:
            intensity = 0.3  # Satisfatório
        elif skill_demonstrated >= 70:
            intensity = 0.1  # Mínimo
        elif skill_demonstrated >= 60:
            intensity = -0.2  # Regressão leve
        else:
            intensity = -0.5  # Regressão significativa
        
        # 6. Variação aleatória para simular nuances (±10%)
        intensity += random.uniform(-0.1, 0.1)
        intensity = max(-1.0, min(1.0, intensity))  # Clamp
        
        # 7. Reasoning (explicação)
        if intensity > 0.6:
            reasoning = "Demonstrou domínio sólido com boas práticas. Progressão clara."
        elif intensity > 0.3:
            reasoning = "Boa execução, mas há espaço para melhorias técnicas."
        elif intensity > 0:
            reasoning = "Solução funcional, porém básica para o nível esperado."
        elif intensity > -0.3:
            reasoning = "Solução com falhas significativas ou más práticas detectadas."
        else:
            reasoning = "Abordagem inadequada ou demonstrou desconhecimento de conceitos fundamentais."
        
        return {
            "skill_level_demonstrated": int(skill_demonstrated),
            "should_progress": bool(should_progress),
            "progression_intensity": round(float(intensity), 2),
            "reasoning": reasoning
        }
