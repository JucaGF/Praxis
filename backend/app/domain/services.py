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
from typing import Dict, List, Optional, Any
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
    skill_assessment: dict,
    dificuldade_level: str,
    tentativas: int
) -> int:
    """
    Calcula quanto uma skill deve aumentar/diminuir baseado na avaliação da IA.

    NOVA ABORDAGEM: Usa análise qualitativa da IA em vez de apenas nota numérica!

    A IA avalia:
    - Nível real demonstrado (pode ser diferente da nota)
    - Qualidade vs expectativa do nível atual
    - Boas/más práticas (não só se funciona)
    - Sinais de evolução ou estagnação
    - Complexidade da solução vs dificuldade

    Fórmula não-linear que considera:
    - Gap entre nível demonstrado e skill atual (pode ser negativo!)
    - Intensidade de progressão da IA (-1.0 a +1.0)
    - Peso da dificuldade (easy=0.7, medium=1.0, hard=1.3)
    - Curva de aprendizado (mais difícil subir quando skill já é alta)
    - Penalidade por tentativas (diminui ganho a cada nova tentativa)

    Exemplo 1 - Progressão:
    - skill_atual = 50, demonstrated = 75, intensity = 0.7
    - ganho = (75 - 50) * 0.7 * 1.0 * 0.73 * 1.0 / 15 ≈ +0.85 → +1 ponto

    Exemplo 2 - Regressão (más práticas):
    - skill_atual = 70, demonstrated = 65, intensity = -0.4
    - ganho = (65 - 70) * -0.4 * 1.0 * 0.5 * 1.0 / 15 ≈ -0.06 → -1 ponto

    Args:
        skill_atual: Nível atual da skill (0-100)
        skill_assessment: Dict da IA com skill_level_demonstrated, progression_intensity, etc
        dificuldade_level: "easy", "medium" ou "hard"
        tentativas: Número da tentativa (1, 2, 3...)

    Returns:
        Delta (variação) a aplicar na skill (pode ser negativo!)
    """
    # Extrai dados do assessment da IA
    skill_demonstrated = skill_assessment.get(
        "skill_level_demonstrated", skill_atual)
    intensity = skill_assessment.get("progression_intensity", 0.0)

    # Gap: diferença entre nível demonstrado e atual
    gap = skill_demonstrated - skill_atual

    # Pesos por dificuldade
    pesos = {"easy": 0.7, "medium": 1.0, "hard": 1.3}
    peso = pesos.get(dificuldade_level, 1.0)

    # Curva de aprendizado: mais difícil subir quando skill já é alta (>70)
    # Usa função sigmoide para criar curva suave
    curva = 1 / (1 + math.exp((skill_atual - 70) / 10))

    # Penalidade por tentativas: -10% a cada tentativa adicional (mínimo 60%)
    penal = max(0.6, 1 - 0.1 * (tentativas - 1))

    # Fórmula final: usa intensity da IA (pode amplificar ou inverter o gap!)
    # Divisor menor (15 em vez de 20) para mudanças mais perceptíveis
    ganho = gap * intensity * peso * curva * penal / 15.0

    return int(round(ganho))


def calculate_skill_delta_v2(
    skill_atual: int,
    nota_geral: int,
    skill_assessment: dict,
    dificuldade_level: str,
    tentativas: int
) -> int:
    """
    Nova fórmula com progressão e regressão baseadas na nota geral.
    
    REGRESSÃO (nota < 50):
    - Nota 40-49: -1 a -2 pontos
    - Nota 30-39: -2 a -4 pontos
    - Nota < 30: -4 a -8 pontos
    
    PROGRESSÃO (nota >= 50):
    - Nota 50-60: +1 a +3 pontos (ganho leve)
    - Nota 60-75: +2 a +5 pontos (ganho moderado)
    - Nota 75-90: +4 a +8 pontos (ganho bom)
    - Nota 90-100: +6 a +12 pontos (ganho excelente)
    
    Args:
        skill_atual: Nível atual da skill (0-100)
        nota_geral: Nota geral do desafio (0-100)
        skill_assessment: Dict da IA com skill_level_demonstrated, progression_intensity
        dificuldade_level: "easy", "medium" ou "hard"
        tentativas: Número da tentativa (1, 2, 3...)
    
    Returns:
        Delta (variação) a aplicar na skill (pode ser negativo!)
    """
    # Extrai dados do assessment da IA
    skill_demonstrated = skill_assessment.get("skill_level_demonstrated", skill_atual)
    intensity = skill_assessment.get("progression_intensity", 0.0)
    
    # Gap: diferença entre nível demonstrado e atual
    gap = skill_demonstrated - skill_atual
    
    # Fator baseado na nota geral
    if nota_geral < 50:
        # REGRESSÃO: nota baixa = perda de pontos
        # Quanto pior a nota, maior a perda
        nota_factor = (nota_geral - 50) / 50.0  # -1.0 a 0.0
        # Amplifica perda se intensity for negativo (más práticas)
        if intensity < 0:
            nota_factor *= (1 + abs(intensity))
    else:
        # PROGRESSÃO: nota boa = ganho de pontos
        # Notas altas ganham mais
        if nota_geral >= 90:
            nota_factor = 2.0  # Ganho dobrado
        elif nota_geral >= 75:
            nota_factor = 1.5  # Ganho 50% maior
        elif nota_geral >= 60:
            nota_factor = 1.0  # Ganho normal
        else:  # 50-59
            nota_factor = 0.6  # Ganho reduzido
    
    # Pesos por dificuldade
    pesos = {"easy": 0.7, "medium": 1.0, "hard": 1.3}
    peso = pesos.get(dificuldade_level, 1.0)
    
    # Curva de aprendizado: mais difícil subir quando skill já é alta (>70)
    curva = 1 / (1 + math.exp((skill_atual - 70) / 10))
    
    # Penalidade por tentativas: -10% a cada tentativa adicional (mínimo 60%)
    penal = max(0.6, 1 - 0.1 * (tentativas - 1))
    
    # Fórmula final
    # Divisor menor (10) para mudanças mais perceptíveis
    ganho = gap * intensity * nota_factor * peso * curva * penal / 10.0
    
    # Garante mínimos de mudança para notas extremas
    if nota_geral >= 90 and ganho > 0 and ganho < 3:
        ganho = 3  # Mínimo +3 para notas excelentes
    elif nota_geral < 40 and ganho < 0 and ganho > -2:
        ganho = -2  # Mínimo -2 para notas ruins
    
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

    current_value = tech_skills.get(
        target_skill, 50)  # Default 50 se não existe
    new_value = clamp_skill(current_value + delta)
    tech_skills[target_skill] = new_value
    return tech_skills


def map_skill_to_user_skill(skill_name: str, user_skills: Dict[str, int], is_soft_skill: bool) -> Optional[str]:
    """
    Mapeia uma skill avaliada pela IA para a skill real do usuário.
    
    Para soft skills, faz matching inteligente baseado em palavras-chave.
    Para tech skills, busca match exato ou parcial.
    
    Args:
        skill_name: Nome da skill avaliada pela IA
        user_skills: Dict com as skills do usuário
        is_soft_skill: Se True, usa mapeamento de soft skills
    
    Returns:
        Nome da skill do usuário que corresponde, ou None se não encontrar
    """
    # Match exato (prioridade máxima)
    if skill_name in user_skills:
        return skill_name
    
    # Para soft skills, usa mapeamento baseado em palavras-chave
    if is_soft_skill:
        skill_lower = skill_name.lower()
        
        # Mapeamento de palavras-chave para soft skills padrão
        comunicacao_keywords = ["comunicação", "comunicacao", "comunicar", "explicar", "escrever", "mensagem", "email", "técnica", "tecnica", "equipe"]
        organizacao_keywords = ["organização", "organizacao", "organizar", "planejar", "planejamento", "priorizar", "gerenciar", "gestão", "gestao"]
        resolucao_keywords = ["resolução", "resolucao", "resolver", "problema", "debugar", "debug", "investigar", "análise", "analise"]
        
        # Verifica cada skill do usuário
        for user_skill in user_skills.keys():
            user_skill_lower = user_skill.lower()
            
            # Se a skill avaliada contém palavras-chave de Comunicação
            if any(keyword in skill_lower for keyword in comunicacao_keywords):
                if any(keyword in user_skill_lower for keyword in comunicacao_keywords):
                    logger.info(f"Mapeamento soft skill: '{skill_name}' → '{user_skill}'")
                    return user_skill
            
            # Se a skill avaliada contém palavras-chave de Organização
            if any(keyword in skill_lower for keyword in organizacao_keywords):
                if any(keyword in user_skill_lower for keyword in organizacao_keywords):
                    logger.info(f"Mapeamento soft skill: '{skill_name}' → '{user_skill}'")
                    return user_skill
            
            # Se a skill avaliada contém palavras-chave de Resolução de Problemas
            if any(keyword in skill_lower for keyword in resolucao_keywords):
                if any(keyword in user_skill_lower for keyword in resolucao_keywords):
                    logger.info(f"Mapeamento soft skill: '{skill_name}' → '{user_skill}'")
                    return user_skill
    
    # Para tech skills, tenta match parcial (case-insensitive)
    else:
        skill_lower = skill_name.lower()
        for user_skill in user_skills.keys():
            if skill_lower in user_skill.lower() or user_skill.lower() in skill_lower:
                logger.info(f"Mapeamento tech skill: '{skill_name}' → '{user_skill}'")
                return user_skill
    
    # Não encontrou correspondência
    logger.warning(f"Skill '{skill_name}' não pôde ser mapeada para nenhuma skill do usuário: {list(user_skills.keys())}")
    return None


def process_multiple_skills(
    profile_id: str,
    affected_skills: List[str],
    skills_assessment: Dict[str, dict],
    nota_geral: int,
    difficulty_level: str,
    attempts: int,
    category: str,
    repo: IRepository
) -> Dict[str, Any]:
    """
    Processa progressão de múltiplas skills de uma vez.
    
    Diferencia automaticamente entre tech_skills e soft_skills baseado na categoria.
    Faz mapeamento inteligente entre skills avaliadas e skills do usuário.
    
    Args:
        profile_id: ID do perfil
        affected_skills: Lista de skills que o desafio avalia
        skills_assessment: Dict com assessment individual de cada skill
        nota_geral: Nota geral do desafio (0-100)
        difficulty_level: "easy", "medium" ou "hard"
        attempts: Número da tentativa
        category: "code", "daily-task" ou "organization"
        repo: Repositório para acessar/atualizar skills
    
    Returns:
        {
            "skills_updated": ["Python", "FastAPI"],
            "deltas": {"Python": +5, "FastAPI": +2},
            "new_values": {"Python": 75, "FastAPI": 62},
            "skill_type": "tech_skills" ou "soft_skills"
        }
    """
    # Determina se atualiza tech_skills ou soft_skills
    is_soft_skill = category == "daily-task"
    skill_type = "soft_skills" if is_soft_skill else "tech_skills"
    
    # Busca skills atuais
    if is_soft_skill:
        current_skills = repo.get_soft_skills(profile_id)
    else:
        current_skills = repo.get_tech_skills(profile_id)
    
    deltas = {}
    new_values = {}
    
    # Processa cada skill avaliada pela IA
    for assessed_skill_name in skills_assessment.keys():
        assessment = skills_assessment[assessed_skill_name]
        
        # ✅ MAPEAMENTO INTELIGENTE: Mapeia skill avaliada para skill do usuário
        user_skill_name = map_skill_to_user_skill(assessed_skill_name, current_skills, is_soft_skill)
        
        if user_skill_name is None:
            # Skill não pôde ser mapeada para nenhuma skill do usuário
            logger.warning(
                f"Skill avaliada '{assessed_skill_name}' não corresponde a nenhuma skill do usuário. "
                f"Skills disponíveis ({skill_type}): {list(current_skills.keys())}"
            )
            continue
        
        # Evita processar a mesma skill do usuário múltiplas vezes
        if user_skill_name in deltas:
            logger.info(
                f"Skill '{user_skill_name}' já foi processada (mapeada de '{assessed_skill_name}'). "
                f"Usando apenas a primeira avaliação."
            )
            continue
        
        skill_atual = current_skills[user_skill_name]
        
        # Calcula delta com nova fórmula
        delta = calculate_skill_delta_v2(
            skill_atual,
            nota_geral,
            assessment,
            difficulty_level,
            attempts
        )
        
        # Aplica mudança
        new_value = clamp_skill(skill_atual + delta)
        current_skills[user_skill_name] = new_value
        
        deltas[user_skill_name] = delta
        new_values[user_skill_name] = new_value
        
        logger.info(
            f"Skill atualizada: '{user_skill_name}' "
            f"(avaliada como '{assessed_skill_name}'): "
            f"{skill_atual} → {new_value} (delta: {delta:+d})"
        )
    
    # Salva no banco
    if is_soft_skill:
        repo.update_soft_skills(profile_id, current_skills)
    else:
        repo.update_tech_skills(profile_id, current_skills)
    
    return {
        "skills_updated": list(deltas.keys()),
        "deltas": deltas,
        "new_values": new_values,
        "skill_type": skill_type
    }


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
        3. **DELETA desafios antigos do usuário**
        4. Chama IA para gerar desafios personalizados
        5. Limita ao número solicitado
        6. Salva no banco
        7. Retorna desafios criados

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

        # 3. Deleta desafios antigos SEM submissões (preserva histórico)
        # Challenges com submissões são mantidos para preservar o histórico do usuário
        deleted_count = self.repo.delete_challenges_for_profile(profile_id)
        if deleted_count > 0:
            logger.info(
                f"Deletados {deleted_count} desafios sem submissões do perfil {profile_id}")

        # 4. Gera desafios via IA
        generated = self.ai.generate_challenges(profile, attributes)

        # 5. Limita ao count solicitado
        generated = generated[:count]

        # 6. Salva no banco
        created = self.repo.create_challenges_for_profile(
            profile_id, generated)

        logger.info(
            f"Gerados {len(created)} novos desafios para perfil {profile_id}")

        return created

    async def generate_challenges_for_profile_streaming(self, profile_id: str):
        """
        Gera desafios personalizados com streaming SSE.

        Fluxo:
        1. Busca dados do perfil
        2. Busca atributos (skills, career_goal)
        3. **DELETA desafios antigos SEM submissões (preserva histórico)**
        4. Chama IA streaming para gerar desafios progressivamente
        5. Salva cada desafio no banco assim que é gerado
        6. Yielda eventos SSE (start, progress, challenge, complete, error)

        Args:
            profile_id: ID do perfil

        Yields:
            Dicionários com eventos SSE

        Raises:
            ProfileNotFoundError: Se perfil não existe
        """
        # 1. Busca perfil
        profile = self.repo.get_profile(profile_id)
        if not profile:
            raise ProfileNotFoundError(profile_id)

        # 2. Busca atributos
        attributes = self.repo.get_attributes(profile_id)

        # 3. Deleta desafios antigos SEM submissões (preserva histórico)
        # Challenges com submissões são mantidos para preservar o histórico do usuário
        deleted_count = self.repo.delete_challenges_for_profile(profile_id)
        if deleted_count > 0:
            logger.info(
                f"🗑️ Deletados {deleted_count} desafios sem submissões do perfil {profile_id}")

        # 4. Streaming da IA
        async for event in self.ai.generate_challenges_streaming(profile, attributes):

            # Se é um desafio completo, salvar no banco
            if event.get("type") == "challenge":
                challenge_data = event.get("data")
                if challenge_data:
                    # Salvar no banco
                    saved_challenges = self.repo.create_challenges_for_profile(
                        profile_id,
                        [challenge_data]
                    )

                    if saved_challenges:
                        # Atualizar evento com dados do banco (incluindo ID)
                        event["data"] = saved_challenges[0]
                        logger.info(
                            f"💾 Desafio salvo com ID {saved_challenges[0]['id']}")

            # Propagar evento para o cliente
            yield event

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

        logger.info("Iniciando processamento de submissão",
                    extra={"extra_data": ctx})

        # ===== PASSO 1: Validações iniciais =====
        challenge = self.repo.get_challenge(submission_data["challenge_id"])
        if not challenge:
            logger.warning("Challenge não encontrado",
                           extra={"extra_data": ctx})
            raise ChallengeNotFoundError(submission_data['challenge_id'])

        logger.debug("Challenge validado", extra={"extra_data": {
                     **ctx, "challenge_title": challenge.get("title")}})

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
            logger.error(f"Falha na avaliação IA: {e}", extra={
                         "extra_data": ctx})
            raise AIEvaluationError(
                reason=str(e),
                submission_id=submission["id"]
            )

        # Extrai dados da avaliação
        score = int(eval_result.get("nota_geral", 0))
        metrics = eval_result.get("metricas", {})
        feedback_text = eval_result.get("feedback_detalhado", "Sem detalhes")
        
        # Novo formato: skills_assessment (múltiplas skills)
        skills_assessment = eval_result.get("skills_assessment", {})
        # Fallback: formato antigo skill_assessment (singular) para compatibilidade
        skill_assessment_old = eval_result.get("skill_assessment", {})

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

        # ===== PASSO 7: Progressão de skills (NOVO SISTEMA - MÚLTIPLAS SKILLS) =====
        difficulty_level = (challenge.get("difficulty") or {}).get("level", "medium")
        category = challenge.get("category", "code")
        affected_skills = (challenge.get("description") or {}).get("affected_skills", [])
        
        # Fallback: se não tiver affected_skills, usa target_skill (compatibilidade)
        if not affected_skills:
            target_skill = (challenge.get("description") or {}).get("target_skill")
            if target_skill:
                affected_skills = [target_skill]

        skills_progression = None
        # Variáveis antigas para compatibilidade
        delta_applied: Optional[int] = None
        updated_value: Optional[int] = None
        target_skill_name: Optional[str] = None

        # NOVO SISTEMA: Múltiplas skills
        if affected_skills and skills_assessment:
            try:
                # ✅ VALIDAÇÃO PÓS-IA: Remove skills que não estão em affected_skills
                validated_assessment = {}
                for skill_name, assessment in skills_assessment.items():
                    if skill_name in affected_skills:
                        validated_assessment[skill_name] = assessment
                    else:
                        logger.warning(
                            f"IA avaliou skill '{skill_name}' que não está em affected_skills. "
                            f"Ignorando. Esperado: {affected_skills}",
                            extra={"extra_data": {**ctx, "invalid_skill": skill_name}}
                        )
                
                skills_progression = process_multiple_skills(
                    submission_data["profile_id"],
                    affected_skills,
                    validated_assessment,  # Usa assessment validado
                    score,
                    difficulty_level,
                    attempts,
                    category,
                    self.repo
                )
                
                # Mantém compatibilidade: pega primeira skill para campos antigos
                if skills_progression["deltas"]:
                    first_skill = list(skills_progression["deltas"].keys())[0]
                    delta_applied = skills_progression["deltas"][first_skill]
                    updated_value = skills_progression["new_values"][first_skill]
                    target_skill_name = first_skill
                
                logger.info(
                    f"Skills atualizadas: {skills_progression['skills_updated']}",
                    extra={"extra_data": {**ctx, "deltas": skills_progression["deltas"]}}
                )
            except Exception as e:
                logger.warning(
                    f"Não foi possível atualizar skills: {e}",
                    extra={"extra_data": ctx}
                )
        
        # FALLBACK: Sistema antigo (1 skill) para compatibilidade
        elif affected_skills and skill_assessment_old:
            try:
                target_skill_name = affected_skills[0] if affected_skills else None
                if target_skill_name:
                    current_skills = self.repo.get_tech_skills(submission_data["profile_id"])
                    skill_atual = int(current_skills.get(target_skill_name, 50))
                    
                    delta = calculate_skill_delta(
                        skill_atual, skill_assessment_old, difficulty_level, attempts)
                    
                    new_skills = apply_skill_update(current_skills, target_skill_name, delta)
                    self.repo.update_tech_skills(submission_data["profile_id"], new_skills)
                    
                    delta_applied = int(delta)
                    updated_value = int(new_skills.get(target_skill_name, skill_atual))
            except Exception as e:
                logger.warning(
                    f"Não foi possível atualizar skills (fallback): {e}",
                    extra={"extra_data": ctx}
                )

        # ===== PASSO 8: Marcar como 'scored' e retornar =====
        self.repo.update_submission(submission["id"], {"status": "scored"})

        # Log final com resumo
        ctx.update({
            "status": "scored",
            "score": score,
            "skills_progression": skills_progression
        })
        logger.info("Submissão processada com sucesso",
                    extra={"extra_data": ctx})

        return {
            "submission_id": submission["id"],
            "status": "scored",
            "score": score,
            "metrics": metrics,
            "feedback": feedback_text,
            # Novo formato (múltiplas skills)
            "skills_progression": skills_progression,
            # Mantém formato antigo para compatibilidade
            "target_skill": target_skill_name,
            "delta_applied": delta_applied,
            "updated_skill_value": updated_value
        }
