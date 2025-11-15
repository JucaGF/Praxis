"""
Schemas de desafios - Validação e serialização

Este módulo define os schemas Pydantic para desafios.
Usado para validação de dados de entrada e serialização de saída.

Schemas:
- Difficulty: Nível de dificuldade e tempo limite
- FS: Estrutura de arquivos (file system)
- Description: Descrição do desafio
- ChallengeOut: Desafio completo (resposta da API)
- GenerateIn: Dados para gerar desafios (entrada)

Validação:
- Normalização automática de níveis de dificuldade
- Validação de tipos e campos obrigatórios
- Conversão automática de dados JSONB
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Literal, Any
from datetime import datetime

# ==================== TIPOS E HELPERS ====================

LevelPT = Literal["Fácil", "Médio", "Difícil"]
"""
Tipo literal para níveis de dificuldade em português.
"""

LevelEN = Literal["easy", "medium", "hard"]
"""
Tipo literal para níveis de dificuldade em inglês.
"""


def normalize_level(level: str) -> str:
    """
    Normaliza nível de dificuldade para formato padrão.
    
    Converte níveis em português para inglês (easy/medium/hard).
    Aceita variações de maiúsculas e minúsculas.
    
    Args:
        level: Nível de dificuldade (Fácil, Médio, Difícil, easy, medium, hard)
    
    Returns:
        Nível normalizado (easy, medium, hard)
    """
    mapa = {
        "Fácil": "easy", "fácil": "easy", "facil": "easy",
        "Médio": "medium", "médio": "medium", "medio": "medium",
        "Difícil": "hard", "difícil": "hard", "dificil": "hard",
        "easy": "easy", "medium": "medium", "hard": "hard"
    }
    return mapa.get(level, level)

class Difficulty(BaseModel):
    """
    Nível de dificuldade e tempo limite do desafio.
    
    Armazenado como JSONB no banco de dados.
    Usado para definir a dificuldade e o tempo disponível para resolver.
    
    Attributes:
        level: Nível de dificuldade (easy, medium, hard)
        time_limit: Tempo limite em minutos (deve ser > 0)
    
    Exemplo:
        {
            "level": "medium",
            "time_limit": 45
        }
    """
    level: str = Field(description="easy|medium|hard (normalizado)")
    """
    Nível de dificuldade do desafio.
    
    Valores aceitos: "easy", "medium", "hard"
    Normalizado automaticamente pelo validador.
    """
    
    time_limit: int = Field(gt=0, description="Tempo em minutos")
    """
    Tempo limite para resolver o desafio em minutos.
    
    Deve ser maior que 0.
    Recomendado:
    - easy: 20-30 minutos
    - medium: 45-60 minutos
    - hard: 60-90 minutos
    """

    @field_validator("level", mode='before')
    def _norm_level(cls, v):
        """
        Valida e normaliza o nível de dificuldade.
        
        Converte níveis em português para inglês automaticamente.
        Chamado automaticamente pelo Pydantic antes da validação.
        """
        return normalize_level(v)


class FS(BaseModel):
    """
    Estrutura de arquivos (file system) do desafio de código.
    
    Usado para desafios do tipo "code" que requerem múltiplos arquivos.
    Define a estrutura de diretórios e arquivos que o usuário deve criar/modificar.
    
    Attributes:
        files: Lista de caminhos de arquivos
        open: Arquivo principal a ser aberto no editor
        contents: Dict com caminho -> conteúdo de cada arquivo
    
    Exemplo:
        {
            "files": ["app/main.py", "app/utils.py"],
            "open": "app/main.py",
            "contents": {
                "app/main.py": "def main():\n    pass",
                "app/utils.py": "def helper():\n    pass"
            }
        }
    """
    files: List[str] = Field(default_factory=list)
    """
    Lista de caminhos de arquivos no desafio.
    
    Exemplo: ["app/main.py", "app/utils.py", "tests/test_main.py"]
    """
    
    open: Optional[str] = None
    """
    Arquivo principal a ser aberto no editor.
    
    Geralmente o arquivo que o usuário deve modificar.
    None se não há arquivo principal.
    """
    
    contents: Dict[str, str] = Field(default_factory=dict)
    """
    Conteúdo de cada arquivo.
    
    Dict com caminho -> conteúdo (string).
    Usado para fornecer código inicial ou código bugado.
    """


class Description(BaseModel):
    """
    Descrição do desafio com metadados.
    
    Armazenado como JSONB no banco de dados.
    Contém informações sobre o enunciado, tipo, linguagem, critérios de avaliação, etc.
    
    Attributes:
        text: Texto descritivo do desafio
        type: Tipo de desafio (codigo, texto_livre, planejamento)
        language: Linguagem de programação (se aplicável)
        eval_criteria: Critérios de avaliação
        target_skill: Skill principal do desafio
        affected_skills: Skills avaliadas pelo desafio
        hints: Dicas para o usuário
        enunciado: Contexto estruturado (email, requisitos, etc)
    """
    text: str
    """
    Texto descritivo do desafio.
    
    Tom conversacional (como se fosse um chefe pedindo).
    Exemplo: "E aí! O endpoint de login tá aceitando email sem @..."
    """
    
    type: Literal["codigo", "texto_livre", "planejamento"]
    """
    Tipo de enunciado do desafio.
    
    Valores:
    - "codigo": Desafio de código (corrigir bug, implementar feature)
    - "texto_livre": Desafio de texto (responder email, redigir documento)
    - "planejamento": Desafio de planejamento (arquitetura, requisitos)
    """
    
    language: Optional[str] = None
    """
    Linguagem de programação (se aplicável).
    
    Exemplos: "python", "javascript", "sql", "markdown"
    None para desafios que não são de código.
    """
    
    eval_criteria: List[str] = Field(default_factory=list)
    """
    Critérios de avaliação do desafio.
    
    Lista de habilidades que serão avaliadas.
    Exemplo: ["FastAPI", "Validação de dados", "Tratamento de erros"]
    """
    
    target_skill: Optional[str] = None
    """
    Skill principal do desafio.
    
    Skill que o desafio foca em avaliar.
    Exemplo: "FastAPI", "React", "Comunicação"
    """
    
    affected_skills: List[str] = Field(default_factory=list)
    """
    Skills afetadas pelo desafio.
    
    Lista de skills que serão avaliadas e podem progredir.
    Inclui a target_skill e outras skills relacionadas.
    Exemplo: ["FastAPI", "Python", "Pydantic", "APIs REST"]
    """
    
    hints: List[str] = Field(default_factory=list)
    """
    Dicas para o usuário.
    
    Lista de dicas úteis para ajudar o usuário a resolver o desafio.
    Exemplo: ["Use EmailStr do pydantic", "HTTPException(status_code=400)"]
    """
    
    enunciado: Optional[Dict[str, Any]] = None
    """
    Contexto estruturado do desafio.
    
    Para tipo "texto_livre": email/ticket original
    Para tipo "planejamento": requisitos funcionais e não-funcionais
    None para desafios de código.
    """


class ChallengeOut(BaseModel):
    """
    Desafio completo (resposta da API).
    
    Schema usado para serializar desafios na resposta da API.
    Inclui todos os campos necessários para o frontend exibir o desafio.
    
    Attributes:
        id: ID único do desafio
        profile_id: ID do perfil dono do desafio
        title: Título do desafio
        description: Descrição completa do desafio
        difficulty: Nível de dificuldade e tempo limite
        fs: Estrutura de arquivos (se aplicável)
        category: Categoria do desafio (code, daily-task, organization)
        created_at: Data de criação
        template_code: Código template ou formulário (se aplicável)
    """
    id: int
    """ID único do desafio"""
    
    profile_id: str
    """ID do perfil dono do desafio"""
    
    title: str
    """Título do desafio"""
    
    description: Description
    """Descrição completa do desafio"""
    
    difficulty: Difficulty
    """Nível de dificuldade e tempo limite"""
    
    fs: Optional[FS] = None
    """
    Estrutura de arquivos (file system).
    
    None para desafios que não são de código.
    Obrigatório para desafios do tipo "code".
    """
    
    category: Optional[str] = None
    """
    Categoria do desafio.
    
    Valores: "code", "daily-task", "organization"
    None se não categorizado.
    """
    
    created_at: datetime
    """Data e hora de criação do desafio"""
    
    template_code: Optional[Dict[str, Any] | List[Dict[str, Any]]] = None
    """
    Código template ou formulário.
    
    Para desafios de código: dict com código inicial
    Para desafios de planejamento: list com estrutura de formulário
    None se não há template.
    """


class GenerateIn(BaseModel):
    """
    Dados para gerar desafios (entrada da API).
    
    Schema usado para receber dados do frontend para gerar desafios.
    Atualmente não é usado (profile_id vem do token), mas mantido para compatibilidade.
    
    Attributes:
        profile_id: ID do perfil (opcional, geralmente vem do token)
    """
    profile_id: str
    """
    ID do perfil para gerar desafios.
    
    Nota: Atualmente não é usado (profile_id vem do token JWT).
    Mantido para compatibilidade com versões antigas.
    """