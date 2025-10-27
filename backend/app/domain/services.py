# backend/app/domain/services.py
"""
SERVICE LAYER - Camada de Serviços

O que são Services?
- Classes que contêm a LÓGICA DE NEGÓCIO da aplicação
- "Chefs" que sabem executar operações complexas
- Coordenam Repository (banco) e AI (inteligência artificial)

Por que usar Services?
1. ORGANIZAÇÃO: Endpoints ficam limpos (só recebem/retornam dados)
2. REUTILIZAÇÃO: Mesma lógica pode ser usada em vários lugares
3. TESTABILIDADE: Fácil testar lógica isoladamente
4. MANUTENÇÃO: Mudar regra de negócio = mexer só no Service

Exemplo:
- Endpoint: "Quero criar uma submissão" (simples)
- Service: "Vou criar, avaliar, calcular progressão, salvar feedback" (complexo)
"""

import math
from typing import Dict, List, Optional
from backend.app.domain.ports import IRepository, IAIService
from backend.app.domain.exceptions import (
    ProfileNotFoundError,
    ChallengeNotFoundError,
    AttributesNotFoundError,
    AIEvaluationError
)
from backend.app.logging_config import get_logger

# Logger para este módulo
logger = get_logger(__name__)


# ==================== FUNÇÕES AUXILIARES ====================
# (Essas funções vieram do deps.py - lógica de progressão de skills)

def calculate_skill_delta(
    skill_atual: int, 
    nota: int, 
    dificuldade_level: str, 
    tentativas: int
) -> int:
    """
    Calcula quanto uma skill deve aumentar/diminuir baseado na performance.
    
    Fórmula não-linear que considera:
    - Diferença entre nota e skill atual
    - Peso da dificuldade (easy=0.7, medium=1.0, hard=1.3)
    - Curva de aprendizado (mais difícil subir quando skill já é alta)
    - Penalidade por tentativas (diminui ganho a cada nova tentativa)
    
    Exemplo:
    - skill_atual = 50, nota = 85, dificuldade = medium, tentativas = 1
    - ganho = (85 - 50) * 1.0 * 0.73 * 1.0 / 20 ≈ +1.27 → +1 ponto
    
    Args:
        skill_atual: Nível atual da skill (0-100)
        nota: Nota obtida no desafio (0-100)
        dificuldade_level: "easy", "medium" ou "hard"
        tentativas: Número da tentativa (1, 2, 3...)
        
    Returns:
        Delta (variação) a aplicar na skill (pode ser negativo!)
    """
    # Pesos por dificuldade
    pesos = {"easy": 0.7, "medium": 1.0, "hard": 1.3}
    peso = pesos.get(dificuldade_level, 1.0)
    
    # Curva de aprendizado: mais difícil subir quando skill já é alta (>70)
    # Usa função sigmoide para criar curva suave
    curva = 1 / (1 + math.exp((skill_atual - 70) / 10))
    
    # Penalidade por tentativas: -10% a cada tentativa adicional (mínimo 60%)
    penal = max(0.6, 1 - 0.1 * (tentativas - 1))
    
    # Fórmula final
    ganho = (nota - skill_atual) * peso * curva * penal / 20.0
    return int(round(ganho))


def clamp_skill(value: int) -> int:
    """
    Garante que skill fique entre 0 e 100.
    
    "Clamp" = "prender/limitar" entre valores mínimo e máximo
    """
    return max(0, min(100, value))


def apply_skill_update(
    tech_skills: Dict[str, int], 
    target_skill: str | None, 
    delta: int
) -> Dict[str, int]:
    """
    Aplica o delta calculado na skill alvo.
    
    Args:
        tech_skills: Dict com todas as skills {"React": 70, "Python": 85}
        target_skill: Nome da skill a atualizar (ex: "React")
        delta: Quanto aumentar/diminuir
        
    Returns:
        Dict atualizado
    """
    if not target_skill:
        return tech_skills
    
    current_value = tech_skills.get(target_skill, 50)  # Default 50 se não existe
    new_value = clamp_skill(current_value + delta)
    tech_skills[target_skill] = new_value
    return tech_skills


# ==================== CHALLENGE SERVICE ====================

class ChallengeService:
    """
    Serviço responsável por operações relacionadas a Desafios.
    
    Responsabilidades:
    - Gerar desafios personalizados usando IA
    - Validar desafios
    - Listar desafios ativos
    """
    
    def __init__(self, repository: IRepository, ai_service: IAIService):
        """
        Construtor do serviço.
        
        Args:
            repository: Implementação de IRepository (ex: SqlRepo)
            ai_service: Implementação de IAIService (ex: FakeAI)
            
        Note que usamos as INTERFACES, não as implementações concretas!
        Isso permite trocar facilmente (ex: usar MongoRepo ou GeminiAI)
        """
        self.repo = repository
        self.ai = ai_service
    
    def generate_challenges_for_profile(self, profile_id: str, count: int = 3) -> List[dict]:
        """
        Gera desafios personalizados para um perfil.
        
        Fluxo:
        1. Busca dados do perfil
        2. Busca atributos (skills, career_goal)
        3. Chama IA para gerar desafios personalizados
        4. Limita ao número solicitado
        5. Salva no banco
        6. Retorna desafios criados
        
        Args:
            profile_id: ID do perfil
            count: Quantos desafios gerar (default 3 para MVP)
            
        Returns:
            Lista de desafios criados
            
        Raises:
            ProfileNotFoundError: Se perfil não existe
        """
        # 1. Busca perfil
        profile = self.repo.get_profile(profile_id)
        if not profile:
            raise ProfileNotFoundError(profile_id)
        
        # 2. Busca atributos
        attributes = self.repo.get_attributes(profile_id)
        
        # 3. Gera desafios via IA
        generated = self.ai.generate_challenges(profile, attributes)
        
        # 4. Limita ao count solicitado
        generated = generated[:count]
        
        # 5. Salva no banco
        created = self.repo.create_challenges_for_profile(profile_id, generated)
        
        return created
    
    def get_active_challenges(self, profile_id: str, limit: int = 3) -> List[dict]:
        """
        Lista desafios ativos de um perfil.
        
        Delega ao repositório (lógica simples, não precisa de muito processamento)
        """
        return self.repo.list_active_challenges(profile_id, limit)
    
    def get_challenge_by_id(self, challenge_id: int) -> dict:
        """
        Busca um desafio específico.
        
        Raises:
            ChallengeNotFoundError: Se desafio não existe
        """
        challenge = self.repo.get_challenge(challenge_id)
        if not challenge:
            raise ChallengeNotFoundError(challenge_id)
        return challenge


# ==================== SUBMISSION SERVICE ====================

class SubmissionService:
    """
    Serviço responsável por operações relacionadas a Submissões.
    
    Este é o Service mais COMPLEXO do sistema!
    
    Responsabilidades:
    - Criar submissões
    - Avaliar submissões com IA
    - Calcular progressão de skills
    - Salvar feedbacks
    - Orquestrar todo o fluxo de submissão → avaliação → progressão
    """
    
    def __init__(self, repository: IRepository, ai_service: IAIService):
        self.repo = repository
        self.ai = ai_service
    
    def create_and_score_submission(self, submission_data: dict) -> dict:
        """
        Fluxo COMPLETO de submissão: criar → avaliar → progressão → feedback.
        
        Este método encapsula TODA a lógica que estava no endpoint!
        São 8 passos coordenados.
        
        Args:
            submission_data: dict com {
                profile_id: str,
                challenge_id: int,
                submitted_code: dict,
                commit_message: str (opcional),
                notes: str (opcional),
                time_taken_sec: int (opcional)
            }
            
        Returns:
            dict com {
                submission_id: int,
                status: str,
                score: int,
                metrics: dict,
                feedback: str,
                target_skill: str (opcional),
                delta_applied: int (opcional),
                updated_skill_value: int (opcional)
            }
            
        Raises:
            ChallengeNotFoundError: Se challenge não existe
            AIEvaluationError: Se avaliação da IA falhar
        """
        
        # Contexto para logs
        ctx = {
            "profile_id": submission_data.get("profile_id"),
            "challenge_id": submission_data.get("challenge_id")
        }
        
        logger.info("Iniciando processamento de submissão", extra={"extra_data": ctx})
        
        # ===== PASSO 1: Validações iniciais =====
        challenge = self.repo.get_challenge(submission_data["challenge_id"])
        if not challenge:
            logger.warning("Challenge não encontrado", extra={"extra_data": ctx})
            raise ChallengeNotFoundError(submission_data['challenge_id'])
        
        logger.debug("Challenge validado", extra={"extra_data": {**ctx, "challenge_title": challenge.get("title")}})
        
        # ===== PASSO 2: Contar tentativas =====
        attempts = self.repo.count_attempts(
            submission_data["profile_id"], 
            submission_data["challenge_id"]
        ) + 1
        
        ctx["attempt_number"] = attempts
        logger.info(f"Tentativa #{attempts}", extra={"extra_data": ctx})
        
        # ===== PASSO 3: Criar submissão (status 'sent') =====
        payload = {**submission_data}
        payload["status"] = "sent"
        payload["attempt_number"] = attempts
        submission = self.repo.create_submission(payload)
        
        ctx["submission_id"] = submission["id"]
        logger.info("Submissão criada", extra={"extra_data": ctx})
        
        # ===== PASSO 4: Marcar como 'evaluating' =====
        self.repo.update_submission(submission["id"], {"status": "evaluating"})
        logger.info("Iniciando avaliação com IA", extra={"extra_data": ctx})
        
        # ===== PASSO 5: Avaliar com IA =====
        try:
            eval_result = self.ai.evaluate_submission(
                challenge, 
                submission_data["submitted_code"]
            )
            logger.info("Avaliação completada", extra={"extra_data": ctx})
        except Exception as e:
            # Se IA falhar, marca erro e lança exceção customizada
            self.repo.update_submission(submission["id"], {"status": "error"})
            logger.error(f"Falha na avaliação IA: {e}", extra={"extra_data": ctx})
            raise AIEvaluationError(
                reason=str(e), 
                submission_id=submission["id"]
            )
        
        # Extrai dados da avaliação
        score = int(eval_result.get("nota_geral", 0))
        metrics = eval_result.get("metricas", {})
        feedback_text = eval_result.get("feedback_detalhado", "Sem detalhes")
        
        ctx["score"] = score
        logger.info(f"Nota obtida: {score}", extra={"extra_data": ctx})
        
        # ===== PASSO 6: Salvar feedback =====
        self.repo.create_submission_feedback({
            "submission_id": submission["id"],
            "feedback": feedback_text,
            "summary": None,
            "score": score,
            "metrics": metrics,
            "raw_ai_response": eval_result
        })
        
        # ===== PASSO 7: Progressão de skill (se aplicável) =====
        difficulty_level = (challenge.get("difficulty") or {}).get("level", "medium")
        target_skill = (challenge.get("description") or {}).get("target_skill")
        
        delta_applied: Optional[int] = None
        updated_value: Optional[int] = None
        
        if target_skill:
            # Busca skills atuais
            current_skills = self.repo.get_tech_skills(submission_data["profile_id"])
            skill_atual = int(current_skills.get(target_skill, 50))
            
            # Calcula quanto a skill deve mudar
            delta = calculate_skill_delta(skill_atual, score, difficulty_level, attempts)
            
            # Aplica a mudança
            new_skills = apply_skill_update(current_skills, target_skill, delta)
            self.repo.update_tech_skills(submission_data["profile_id"], new_skills)
            
            delta_applied = int(delta)
            updated_value = int(new_skills.get(target_skill, skill_atual))
        
        # ===== PASSO 8: Marcar como 'scored' e retornar =====
        self.repo.update_submission(submission["id"], {"status": "scored"})
        
        # Log final com resumo
        ctx.update({
            "status": "scored",
            "score": score,
            "skill_delta": delta_applied,
            "skill_updated": updated_value
        })
        logger.info("Submissão processada com sucesso", extra={"extra_data": ctx})
        
        return {
            "submission_id": submission["id"],
            "status": "scored",
            "score": score,
            "metrics": metrics,
            "feedback": feedback_text,
            "target_skill": target_skill,
            "delta_applied": delta_applied,
            "updated_skill_value": updated_value
        }

