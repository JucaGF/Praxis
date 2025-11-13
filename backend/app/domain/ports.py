# backend/app/domain/ports.py
"""
PORTS = INTERFACES = CONTRATOS

Por que "Ports"?
- Na arquitetura hexagonal, "ports" são as "portas" por onde a aplicação se comunica
- São contratos que dizem "se você quiser conectar aqui, precisa ter esses métodos"

Analogia: Tomada elétrica
- A tomada é o "port" (interface)
- O plugue que você conecta é a "implementação"
- Não importa o que vem pelo fio, se encaixar na tomada, funciona!

Por que usar interfaces?
1. TESTABILIDADE: Facilita criar mocks para testes
2. FLEXIBILIDADE: Trocar implementação (SQL -> MongoDB) sem quebrar código
3. CLAREZA: Documenta quais métodos existem
4. DESACOPLAMENTO: Código não depende de tecnologia específica
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any


# ==================== REPOSITORY PORT ====================
class IRepository(ABC):
    """
    Interface (contrato) para operações de banco de dados.

    ABC = Abstract Base Class (Classe Base Abstrata)
    - Não pode ser instanciada diretamente
    - Serve apenas como "molde" para outras classes

    Qualquer classe que implemente essa interface DEVE ter todos esses métodos.
    """

    # -------------- PERFIL / SESSÃO --------------
    @abstractmethod
    def upsert_mock_profile(self, email: str, full_name: str) -> dict:
        """
        Cria ou atualiza um perfil mock (para desenvolvimento/testes).

        Args:
            email: Email do perfil
            full_name: Nome completo

        Returns:
            dict com {id, full_name, email}
        """
        pass  # "pass" = "não tem implementação aqui, quem herdar deve implementar"

    @abstractmethod
    def get_profile(self, profile_id: str) -> Optional[dict]:
        """
        Busca um perfil por ID.

        Returns:
            dict com dados do perfil ou None se não encontrar
        """
        pass

    @abstractmethod
    def create_profile(self, profile_id: str, profile_data: dict) -> dict:
        """
        Cria um novo perfil com ID específico.

        Args:
            profile_id: ID do perfil (pode ser UUID ou string para dev)
            profile_data: dict com {name, track, email, linkedin?, github?, portfolio?}

        Returns:
            dict com dados do perfil criado
        """
        pass

    # -------------- ATRIBUTOS --------------
    @abstractmethod
    def get_attributes(self, profile_id: str) -> dict:
        """
        Busca atributos (skills, career_goal) de um perfil.

        Returns:
            dict com {profile_id, career_goal, soft_skills, tech_skills, updated_at}
        """
        pass

    @abstractmethod
    def update_attributes(self, profile_id: str, patch: dict) -> dict:
        """
        Atualiza atributos parcialmente.

        Args:
            patch: dicionário com campos a atualizar

        Returns:
            dict com atributos atualizados
        """
        pass

    @abstractmethod
    def get_tech_skills(self, profile_id: str) -> Dict[str, int]:
        """
        Retorna apenas as tech_skills de um perfil.

        Returns:
            dict tipo {"React": 70, "Python": 85}
        """
        pass

    @abstractmethod
    def update_tech_skills(self, profile_id: str, tech_skills: Dict[str, int]) -> None:
        """
        Atualiza as tech_skills de um perfil.
        """
        pass

    @abstractmethod
    def get_soft_skills(self, profile_id: str) -> Dict[str, int]:
        """
        Retorna apenas as soft_skills de um perfil.

        Returns:
            dict tipo {"Comunicação": 70, "Empatia": 85}
        """
        pass

    @abstractmethod
    def update_soft_skills(self, profile_id: str, soft_skills: Dict[str, int]) -> None:
        """
        Atualiza as soft_skills de um perfil.
        """
        pass

    # -------------- CHALLENGES --------------
    @abstractmethod
    def create_challenges_for_profile(self, profile_id: str, challenges: List[dict]) -> List[dict]:
        """
        Cria múltiplos desafios para um perfil.

        Args:
            challenges: lista de dicts com dados dos desafios

        Returns:
            lista de desafios criados (com IDs)
        """
        pass

    @abstractmethod
    def delete_challenges_for_profile(self, profile_id: str) -> int:
        """
        Deleta apenas os desafios de um perfil que NÃO têm submissões.
        Mantém challenges com histórico de submissões para preservar os dados do usuário.

        Args:
            profile_id: ID do perfil

        Returns:
            Número de desafios deletados (apenas os sem submissões)
        """
        pass

    @abstractmethod
    def list_active_challenges(self, profile_id: str, limit: int = 3) -> List[dict]:
        """
        Lista desafios ativos de um perfil (mais recentes).
        """
        pass

    @abstractmethod
    def get_challenge(self, challenge_id: int) -> Optional[dict]:
        """
        Busca um desafio específico por ID.
        """
        pass

    # -------------- SUBMISSIONS --------------
    @abstractmethod
    def count_attempts(self, profile_id: str, challenge_id: int) -> int:
        """
        Conta quantas tentativas um usuário já fez em um desafio.
        """
        pass

    @abstractmethod
    def create_submission(self, payload: dict) -> dict:
        """
        Cria uma nova submissão.

        Returns:
            dict com dados da submissão criada (incluindo ID)
        """
        pass

    @abstractmethod
    def update_submission(self, submission_id: int, patch: dict) -> None:
        """
        Atualiza campos de uma submissão (ex: status).
        """
        pass

    @abstractmethod
    def get_submissions_by_profile(self, profile_id: str) -> List[Any]:
        """
        Busca todas as submissões de um perfil, ordenadas por data mais recente primeiro.
        
        Returns:
            Lista de objetos Submission ordenados por submitted_at DESC
        """
        pass
    
    @abstractmethod
    def get_submissions_with_details(
        self, 
        profile_id: str, 
        challenge_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        🚀 OTIMIZADO: Busca submissões com challenges e feedbacks em uma única query.
        
        Evita N+1 queries usando JOINs para carregar tudo de uma vez.
        
        Args:
            profile_id: ID do perfil
            challenge_id: Opcional - filtra por challenge específico
            
        Returns:
            Lista de dicts com estrutura:
            {
                'submission': Submission object,
                'challenge': dict com dados do challenge,
                'feedback': SubmissionFeedback object ou None
            }
        """
        pass

    # -------------- FEEDBACK --------------
    @abstractmethod
    def create_submission_feedback(self, payload: dict) -> dict:
        """
        Cria feedback para uma submissão.

        Returns:
            dict com dados do feedback criado
        """
        pass

    @abstractmethod
    def get_feedback_by_submission(self, submission_id: int) -> Optional[Any]:
        """
        Busca feedback de uma submissão específica.
        
        Returns:
            Objeto SubmissionFeedback ou None se não encontrado
        """
        pass


# ==================== AI SERVICE PORT ====================
class IAIService(ABC):
    """
    Interface (contrato) para serviços de IA.

    Por que separar isso?
    - Agora você pode trocar facilmente de FakeAI para IA real (Gemini, GPT, etc)
    - Pode criar mocks para testes
    - O resto do código não precisa saber qual IA está sendo usada
    """

    @abstractmethod
    def generate_challenges(self, profile: dict, attributes: dict) -> List[dict]:
        """
        Gera desafios personalizados com base no perfil e atributos do usuário.

        Args:
            profile: dados do perfil {id, email, full_name}
            attributes: {career_goal, tech_skills, soft_skills}

        Returns:
            lista de desafios gerados (máximo 3 no MVP)
        """
        pass

    @abstractmethod
    def evaluate_submission(self, challenge: dict, submission: dict) -> dict:
        """
        Avalia uma submissão e retorna feedback estruturado.

        Args:
            challenge: dados do desafio
            submission: código/texto submetido

        Returns:
            dict com {
                "nota_geral": int (0-100),
                "metricas": dict,
                "pontos_positivos": list[str],
                "pontos_negativos": list[str],
                "sugestoes_melhoria": list[str],
                "feedback_detalhado": str,
                "skill_assessment": {
                    "skill_level_demonstrated": int (0-100),
                    "should_progress": bool,
                    "progression_intensity": float (-1.0 a +1.0),
                    "reasoning": str
                }
            }
        """
        pass

    @abstractmethod
    def analyze_resume(self, resume_content: str, career_goal: str) -> dict:
        """
        Analisa um currículo baseado no objetivo de carreira do usuário.

        Args:
            resume_content: Conteúdo do currículo em texto
            career_goal: Objetivo de carreira (ex: "Frontend Developer")

        Returns:
            dict com {
                "pontos_fortes": list[str],
                "gaps_tecnicos": list[str],
                "sugestoes_melhoria": list[str],
                "nota_geral": int (0-100),
                "resumo_executivo": str,
                "habilidades_evidenciadas": dict[str, int],
                "proximos_passos": list[str]
            }
        """
        pass
