"""
Modelos de dados do banco de dados - SQLModel

Este módulo define todos os modelos de dados usando SQLModel.
SQLModel combina Pydantic (validação) com SQLAlchemy (ORM).

Modelos:
- Profile: Perfil do usuário
- Attributes: Habilidades e objetivos do usuário
- Resume: Currículos enviados pelo usuário
- ResumeAnalysis: Análise de currículos pela IA
- Challenge: Desafios técnicos
- Submission: Submissões de código
- SubmissionFeedback: Feedback da IA sobre submissões

Todas as relações entre modelos são definidas usando Relationship.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, CheckConstraint, Text, ForeignKey, String
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.types import DateTime
from sqlalchemy.sql import func

# ==================== TIPO JSONB ====================

JsonB = Any
"""
Tipo JSONB para campos JSON no PostgreSQL.

JSONB é mais eficiente que JSON para buscas e indexação.
Usado para armazenar dados estruturados como:
- Relatórios da IA
- Código submetido
- Configurações de dificuldade
- Metadados diversos
"""


# ==================== MODELO: PROFILE ====================


class Profile(SQLModel, table=True):
    """
    Perfil do usuário.
    
    Representa um usuário na plataforma. Cada usuário tem:
    - Um ID único (UUID)
    - Email (único, usado para autenticação)
    - Nome completo (opcional)
    
    Relações:
    - Um perfil pode ter vários currículos (resumes)
    - Um perfil pode ter várias submissões (submissions)
    - Um perfil tem um conjunto de atributos (attributes) - um para um
    - Um perfil pode ter vários desafios (challenges)
    """
    __tablename__ = "profiles"

    id: uuid.UUID = Field(primary_key=True)
    """
    ID único do usuário (UUID).
    
    Gerado automaticamente pelo Supabase na criação do perfil.
    """
    
    full_name: Optional[str] = None
    """
    Nome completo do usuário.
    
    Opcional: Pode ser None até o usuário preencher.
    """
    
    email: str = Field(index=True, nullable=False, unique=True)
    """
    Email do usuário.
    
    - Único: Não pode haver dois usuários com o mesmo email
    - Indexado: Buscas por email são rápidas
    - Obrigatório: Não pode ser None
    - Usado para autenticação via Supabase
    """

    resumes: List["Resume"] = Relationship(back_populates="profile")
    """
    Lista de currículos do usuário.
    
    Relação um-para-muitos: Um perfil pode ter vários currículos.
    """
    
    submissions: List["Submission"] = Relationship(back_populates="profile")
    """
    Lista de submissões do usuário.
    
    Relação um-para-muitos: Um perfil pode ter várias submissões.
    """
    
    attributes: Optional["Attributes"] = Relationship(back_populates="profile")
    """
    Atributos do usuário (habilidades, objetivos).
    
    Relação um-para-um: Cada perfil tem um conjunto de atributos.
    """
    
    challenges: List["Challenge"] = Relationship(back_populates="profile")
    """
    Lista de desafios criados pelo usuário.
    
    Relação um-para-muitos: Um perfil pode criar vários desafios.
    """


class Resume(SQLModel, table=True):
    """
    Armazena os currículos enviados por um usuário.

    Suporta dois modos:
    1. Texto puro: Usuário digita o texto do currículo diretamente
    2. Arquivo: Usuário envia arquivo (PDF, DOCX, etc) e o texto é extraído automaticamente

    Campos:
    - original_content: Texto do currículo (sempre presente)
    - original_filename: Nome do arquivo (se enviado como arquivo)
    - file_type: Tipo MIME do arquivo (application/pdf, etc)
    - file_size_bytes: Tamanho do arquivo em bytes
    - file_data: Dados binários do arquivo (apenas para arquivos pequenos <10MB)
    """
    __tablename__ = "resumes"

    id: Optional[int] = Field(default=None, primary_key=True)
    """
    ID único do currículo.
    
    Gerado automaticamente pelo banco de dados (auto-increment).
    """
    
    profile_id: uuid.UUID = Field(foreign_key="profiles.id")
    """
    ID do perfil dono do currículo.
    
    Chave estrangeira para Profile.
    """
    
    title: Optional[str] = Field(default=None, index=True)
    """
    Título do currículo (ex: "Currículo 2024", "CV Atualizado").
    
    Opcional: Se None, usa nome do arquivo ou "Currículo sem título".
    Indexado: Buscas por título são rápidas.
    """

    original_content: str
    """
    Texto extraído do currículo.
    
    Sempre presente: Seja digitado diretamente ou extraído de arquivo.
    Usado para análise pela IA.
    """

    original_filename: Optional[str] = Field(default=None)
    """
    Nome original do arquivo (se enviado como arquivo).
    
    Exemplo: "curriculo_joao.pdf"
    None se o currículo foi digitado como texto puro.
    """
    
    file_type: Optional[str] = Field(default=None)
    """
    Tipo MIME do arquivo.
    
    Exemplos:
    - "application/pdf" para PDF
    - "application/vnd.openxmlformats-officedocument.wordprocessingml.document" para DOCX
    None se o currículo foi digitado como texto puro.
    """
    
    file_size_bytes: Optional[int] = Field(default=None)
    """
    Tamanho do arquivo em bytes.
    
    None se o currículo foi digitado como texto puro.
    Útil para validação e estatísticas.
    """
    
    file_data: Optional[bytes] = Field(default=None)
    """
    Dados binários do arquivo.
    
    Apenas para arquivos pequenos (<10MB).
    Arquivos maiores devem ser armazenados em serviço de storage (S3, etc).
    None se o currículo foi digitado como texto puro ou se o arquivo é muito grande.
    """

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True),
                         server_default=func.now(), nullable=False)
    )
    """
    Data e hora de criação do currículo.
    
    Gerado automaticamente pelo banco de dados no momento da inserção.
    Timezone-aware: Inclui informação de fuso horário.
    """

    profile: Profile = Relationship(back_populates="resumes")
    """
    Perfil dono do currículo.
    
    Relação muitos-para-um: Vários currículos pertencem a um perfil.
    """
    
    analysis: Optional["ResumeAnalysis"] = Relationship(back_populates="resume")
    """
    Análise do currículo pela IA.
    
    Relação um-para-um: Cada currículo pode ter uma análise.
    None se a análise ainda não foi realizada.
    """


class Attributes(SQLModel, table=True):
    """
    Armazena as informações de habilidades e objetivos do usuário.
    
    Este modelo guarda:
    - Objetivo de carreira (career_goal)
    - Habilidades técnicas (tech_skills)
    - Habilidades interpessoais (soft_skills)
    - Habilidades fortes (strong_skills) - destaque do usuário
    
    Relação um-para-um com Profile: Cada perfil tem um conjunto de atributos.
    """
    __tablename__ = "attributes"

    id: Optional[int] = Field(default=None, primary_key=True)
    """
    ID único dos atributos.
    
    Gerado automaticamente pelo banco de dados (auto-increment).
    """
    
    user_id: uuid.UUID = Field(foreign_key="profiles.id", unique=True)
    """
    ID do usuário dono dos atributos.
    
    Chave estrangeira para Profile.
    Unique: Cada perfil tem apenas um conjunto de atributos.
    """

    career_goal: Optional[str] = Field(default=None)
    """
    Objetivo de carreira do usuário.
    
    Exemplo: "Desenvolvedor Full Stack", "Cientista de Dados", etc.
    Opcional: Pode ser None até o usuário preencher.
    """
    
    soft_skills: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    """
    Habilidades interpessoais do usuário.
    
    Formato JSON: Lista de habilidades com níveis/pontuações.
    Exemplo: {"comunicação": 8, "trabalho_equipe": 9, "liderança": 7}
    None se ainda não preenchido.
    """
    
    tech_skills: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    """
    Habilidades técnicas do usuário.
    
    Formato JSON: Lista de tecnologias/frameworks com níveis.
    Exemplo: {"python": 9, "react": 8, "postgresql": 7, "docker": 6}
    None se ainda não preenchido.
    """
    
    strong_skills: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    """
    Habilidades fortes do usuário (destaque).
    
    Formato JSON: Lista de habilidades que o usuário se destaca.
    Exemplo: ["python", "react", "comunicação"]
    None se ainda não preenchido.
    """
    
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True),
                         server_default=func.now(), nullable=False)
    )
    """
    Data e hora da última atualização dos atributos.
    
    Atualizado automaticamente quando os atributos são modificados.
    Timezone-aware: Inclui informação de fuso horário.
    """

    profile: Profile = Relationship(back_populates="attributes")
    """
    Perfil dono dos atributos.
    
    Relação um-para-um: Cada perfil tem um conjunto de atributos.
    """


class ResumeAnalysis(SQLModel, table=True):
    """
    Guarda o resultado da análise de IA para um currículo específico.
    
    Quando um usuário envia um currículo, a IA analisa e gera:
    - Pontos fortes (strengths)
    - Sugestões de melhoria (improvements)
    - Relatório completo (full_report) em JSON
    
    Relação um-para-um com Resume: Cada currículo tem uma análise.
    """
    __tablename__ = "resume_analyses"

    id: Optional[int] = Field(default=None, primary_key=True)
    """
    ID único da análise.
    
    Gerado automaticamente pelo banco de dados (auto-increment).
    """
    
    resume_id: int = Field(unique=True, foreign_key="resumes.id")
    """
    ID do currículo analisado.
    
    Chave estrangeira para Resume.
    Unique: Cada currículo tem apenas uma análise.
    """

    strengths: Optional[str] = Field(default=None)
    """
    Pontos fortes do currículo identificados pela IA.
    
    Texto em formato markdown ou texto puro.
    None se a análise ainda não foi realizada.
    """
    
    improvements: Optional[str] = Field(default=None)
    """
    Sugestões de melhoria para o currículo.
    
    Texto em formato markdown ou texto puro.
    None se a análise ainda não foi realizada.
    """
    
    full_report: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    """
    Relatório completo da análise em formato JSON.
    
    Contém todos os detalhes da análise:
    - Pontuações por seção
    - Recomendações específicas
    - Comparação com padrões da indústria
    - Etc.
    None se a análise ainda não foi realizada.
    """
    
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True),
                         server_default=func.now(), nullable=False)
    )
    """
    Data e hora de criação da análise.
    
    Gerado automaticamente pelo banco de dados no momento da inserção.
    Timezone-aware: Inclui informação de fuso horário.
    """

    resume: Resume = Relationship(back_populates="analysis")
    """
    Currículo analisado.
    
    Relação um-para-um: Cada análise pertence a um currículo.
    """


class Challenge(SQLModel, table=True):
    """
    Catálogo com todos os desafios técnicos disponíveis.
    
    Um desafio representa um exercício de programação que o usuário
    deve resolver. Pode ser gerado automaticamente pela IA ou criado
    manualmente.
    
    Campos:
    - title: Título do desafio
    - description: Descrição do desafio (formato JSON)
    - difficulty: Nível de dificuldade e tempo limite
    - category: Categoria do desafio (ex: "backend", "frontend", "dados")
    - template_code: Código template para o usuário começar
    - fs: Estrutura de arquivos (file system) do desafio
    """
    __tablename__ = "challenges"

    id: Optional[int] = Field(default=None, primary_key=True)
    """
    ID único do desafio.
    
    Gerado automaticamente pelo banco de dados (auto-increment).
    """
    
    profile_id: uuid.UUID = Field(foreign_key="profiles.id")
    """
    ID do perfil que criou o desafio.
    
    Chave estrangeira para Profile.
    Pode ser None se o desafio foi criado automaticamente pelo sistema.
    """
    
    title: str = Field(index=True)
    """
    Título do desafio.
    
    Exemplo: "Implementar API REST", "Criar componente React", etc.
    Indexado: Buscas por título são rápidas.
    """
    
    description: JsonB = Field(default=None, sa_column=Column(JSONB))
    """
    Descrição do desafio em formato JSON.
    
    Contém:
    - Enunciado do problema
    - Requisitos
    - Exemplos de entrada/saída
    - Instruções adicionais
    None se ainda não preenchido.
    """
    
    difficulty: JsonB = Field(
        sa_column=Column(
            JSONB,
            default={
                "level": "Fácil",
                "time_limit": 30
            }
        )
    )
    """
    Nível de dificuldade e tempo limite do desafio.
    
    Formato JSON:
    {
        "level": "Fácil" | "Médio" | "Difícil",
        "time_limit": 30  # Tempo em minutos
    }
    
    Default: {"level": "Fácil", "time_limit": 30}
    """
    
    fs: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    """
    Estrutura de arquivos (file system) do desafio.
    
    Formato JSON: Representa a estrutura de diretórios e arquivos
    que o usuário deve criar/resolver.
    None se o desafio não requer estrutura de arquivos específica.
    """
    
    category: Optional[str] = Field(default=None, index=True)
    """
    Categoria do desafio.
    
    Exemplos: "backend", "frontend", "fullstack", "dados", "mobile"
    Indexado: Filtros por categoria são rápidos.
    None se ainda não categorizado.
    """
    
    template_code: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    """
    Código template para o usuário começar.
    
    Formato JSON: Representa o código inicial que o usuário
    deve completar ou modificar.
    None se o desafio começa do zero.
    """
    
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True),
                         server_default=func.now(), nullable=False)
    )
    """
    Data e hora de criação do desafio.
    
    Gerado automaticamente pelo banco de dados no momento da inserção.
    Timezone-aware: Inclui informação de fuso horário.
    """

    submissions: List["Submission"] = Relationship(back_populates="challenge")
    """
    Lista de submissões para este desafio.
    
    Relação um-para-muitos: Um desafio pode ter várias submissões.
    """
    
    profile: Optional["Profile"] = Relationship(back_populates="challenges")
    """
    Perfil que criou o desafio.
    
    Relação muitos-para-um: Vários desafios podem pertencer a um perfil.
    None se o desafio foi criado automaticamente pelo sistema.
    """

    def set_difficulty(self, level: str):
        """
        Define o nível de dificuldade do desafio.
        
        Atualiza tanto o nível quanto o tempo limite baseado no nível:
        - Fácil: 30 minutos
        - Médio: 60 minutos
        - Difícil: 90 minutos
        
        Args:
            level: Nível de dificuldade ("Fácil", "Médio", "Difícil")
        """
        levels = {
            "Fácil": 30,
            "Médio": 60,
            "Difícil": 90
        }
        self.difficulty = {"level": level, "time_limit": levels.get(level, 30)}


class Submission(SQLModel, table=True):
    """
    Registra a solução de um usuário para um desafio.
    
    Uma submissão representa uma tentativa do usuário de resolver um desafio.
    O código submetido é avaliado pela IA, que gera feedback e pontuação.
    
    Status possíveis:
    - "sent": Submissão enviada, aguardando avaliação
    - "evaluating": Sendo avaliada pela IA
    - "scored": Avaliação concluída, feedback disponível
    - "error": Erro durante a avaliação
    """
    __tablename__ = "submissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    """
    ID único da submissão.
    
    Gerado automaticamente pelo banco de dados (auto-increment).
    """
    
    profile_id: uuid.UUID = Field(foreign_key="profiles.id")
    """
    ID do perfil que fez a submissão.
    
    Chave estrangeira para Profile.
    """
    
    challenge_id: int = Field(foreign_key="challenges.id")
    """
    ID do desafio submetido.
    
    Chave estrangeira para Challenge.
    """
    
    submitted_code: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    """
    Código submetido pelo usuário.
    
    Formato JSON: Representa o código completo submetido.
    Pode ser um único arquivo ou estrutura de múltiplos arquivos.
    None se a submissão ainda não foi enviada.
    """
    
    status: str = Field(default="sent")
    """
    Status da submissão.
    
    Valores possíveis:
    - "sent": Enviada, aguardando avaliação
    - "evaluating": Sendo avaliada pela IA
    - "scored": Avaliação concluída
    - "error": Erro durante a avaliação
    
    Default: "sent"
    """
    
    attempt_number: int = Field(default=1)
    """
    Número da tentativa para este desafio.
    
    Incrementa a cada nova submissão do mesmo usuário para o mesmo desafio.
    Default: 1
    """
    
    commit_message: Optional[str] = None
    """
    Mensagem de commit associada à submissão.
    
    Similar a mensagens de commit do Git.
    Opcional: Pode ser None.
    """
    
    notes: Optional[str] = None
    """
    Notas adicionais do usuário sobre a submissão.
    
    Opcional: Pode conter observações, dificuldades encontradas, etc.
    """
    
    time_taken_sec: Optional[int] = None
    """
    Tempo gasto na submissão em segundos.
    
    Calculado do momento que o desafio foi aberto até a submissão.
    None se o tempo não foi registrado.
    """
    
    submitted_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True),
                         server_default=func.now(), nullable=False)
    )
    """
    Data e hora da submissão.
    
    Gerado automaticamente pelo banco de dados no momento da inserção.
    Timezone-aware: Inclui informação de fuso horário.
    """

    profile: Profile = Relationship(back_populates="submissions")
    """
    Perfil que fez a submissão.
    
    Relação muitos-para-um: Várias submissões pertencem a um perfil.
    """
    
    challenge: Challenge = Relationship(back_populates="submissions")
    """
    Desafio submetido.
    
    Relação muitos-para-um: Várias submissões pertencem a um desafio.
    """
    
    feedback: Optional["SubmissionFeedback"] = Relationship(
        back_populates="submission")
    """
    Feedback da IA sobre a submissão.
    
    Relação um-para-um: Cada submissão pode ter um feedback.
    None se o feedback ainda não foi gerado.
    """

    __table_args__ = (CheckConstraint(
        "status IN ('sent', 'evaluating', 'scored', 'error')", name="submissions_status_chk"),)
    """
    Constraint: Status deve ser um dos valores permitidos.
    
    Garante integridade dos dados no banco.
    """


class SubmissionFeedback(SQLModel, table=True):
    """
    Armazena o feedback da IA (code review) para uma submissão.
    
    Quando uma submissão é avaliada pela IA, este modelo armazena:
    - Feedback detalhado sobre o código
    - Resumo da avaliação
    - Pontuação (0-100)
    - Métricas diversas (complexidade, performance, etc)
    - Resposta bruta da IA (para debug)
    
    Relação um-para-um com Submission: Cada submissão tem um feedback.
    """
    __tablename__ = "submission_feedbacks"

    id: Optional[int] = Field(default=None, primary_key=True)
    """
    ID único do feedback.
    
    Gerado automaticamente pelo banco de dados (auto-increment).
    """
    
    submission_id: int = Field(unique=True, foreign_key="submissions.id")
    """
    ID da submissão avaliada.
    
    Chave estrangeira para Submission.
    Unique: Cada submissão tem apenas um feedback.
    """

    feedback: str = Field(sa_column=Column("feedback", Text, nullable=False))
    """
    Feedback detalhado da IA sobre o código.
    
    Texto em formato markdown ou texto puro.
    Contém:
    - Análise do código
    - Pontos positivos
    - Pontos de melhoria
    - Sugestões específicas
    - Exemplos de código melhorado
    
    Obrigatório: Não pode ser None.
    """
    
    summary: Optional[str] = None
    """
    Resumo do feedback.
    
    Versão condensada do feedback principal.
    Útil para exibição rápida ou preview.
    None se não foi gerado resumo.
    """
    
    score: Optional[int] = None
    """
    Pontuação da submissão (0-100).
    
    - 0-40: Precisa melhorar
    - 41-70: Bom
    - 71-90: Muito bom
    - 91-100: Excelente
    
    None se a pontuação ainda não foi calculada.
    """
    
    metrics: Optional[JsonB] = Field(default=None, sa_column=Column(JSONB))
    """
    Métricas diversas da avaliação.
    
    Formato JSON: Contém métricas como:
    - Complexidade ciclomática
    - Cobertura de testes
    - Qualidade do código
    - Performance
    - Boas práticas seguidas
    - Etc.
    
    None se as métricas ainda não foram calculadas.
    """
    
    raw_ai_response: Optional[JsonB] = Field(
        default=None, sa_column=Column(JSONB))
    """
    Resposta bruta da IA antes do processamento.
    
    Útil para debug e desenvolvimento.
    Permite ver exatamente o que a IA retornou.
    None se não foi armazenado.
    """
    
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True),
                         server_default=func.now(), nullable=False)
    )
    """
    Data e hora de criação do feedback.
    
    Gerado automaticamente pelo banco de dados no momento da inserção.
    Timezone-aware: Inclui informação de fuso horário.
    """

    submission: Submission = Relationship(back_populates="feedback")
    """
    Submissão avaliada.
    
    Relação um-para-um: Cada feedback pertence a uma submissão.
    """
