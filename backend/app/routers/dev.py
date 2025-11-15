"""
Router de desenvolvimento - Endpoints mock

Este router fornece endpoints para desenvolvimento e testes.
⚠️ NUNCA deve ser usado em produção!

Endpoints:
- POST /dev/setup-mock-data: Cria dados mock para usuário autenticado
- POST /dev/create-dev-user: Cria usuário mock de desenvolvimento
- GET /dev/health: Verifica se router está ativo
- POST /dev/reset-attributes-from-resume: Reseta attributes baseado em currículo

⚠️ SEGURANÇA:
- Desabilitado automaticamente em produção
- Use apenas em ambiente de desenvolvimento
- Não expor em produção (risco de segurança)
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel

from backend.app.deps import get_repo, get_current_user
from backend.app.domain.ports import IRepository
from backend.app.domain.auth_service import AuthUser
from backend.app.config import get_settings, DEV_USER_UUID

router = APIRouter(prefix="/dev", tags=["desenvolvimento"])

settings = get_settings()


class MockDataResponse(BaseModel):
    """Resposta com dados mock criados."""
    message: str
    profile_id: str
    profile_created: bool
    attributes_created: bool


def create_mock_profile_data(user_id: str, email: str) -> dict:
    """
    Cria dados de profile mockados para um usuário.

    Estes são dados fictícios mas realistas, usados para:
    - Testes de desenvolvimento
    - Novos usuários antes do relatório de currículo

    Returns:
        dict com dados do profile
    """
    return {
        "name": f"Usuário Teste ({email.split('@')[0]})",
        "track": "backend",  # Pode ser: backend, frontend, fullstack
        "email": email,
        "linkedin": None,
        "github": None,
        "portfolio": None,
    }


def create_mock_attributes_data() -> dict:
    """
    Cria atributos mockados para um usuário.

    Valores médios para permitir geração de desafios balanceados.
    Em produção, virão do relatório de currículo.

    Returns:
        dict com atributos
    """
    return {
        "career_goal": "Desenvolvedor Backend Pleno - Evoluir em arquitetura de sistemas, testes automatizados e otimização de performance em APIs REST com Python/FastAPI",
        "soft_skills": {
            "comunicacao": 55,
            "trabalho_em_equipe": 60,
            "resolucao_problemas": 65,
            "adaptabilidade": 55,
            "lideranca": 45,
        },
        "tech_skills": {
            "Python": 70,
            "FastAPI": 65,
            "SQL": 60,
            "PostgreSQL": 55,
            "APIs REST": 70,
            "Git": 65,
            "Docker": 50,
            "Testes Unitários": 45,
            "Arquitetura de Software": 40,
        }
    }


@router.post("/setup-mock-data", response_model=MockDataResponse)
def setup_mock_data_for_current_user(
    current_user: AuthUser = Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Cria dados mock para o usuário autenticado atual.

    **Quando usar:**
    - Você fez login com Supabase mas não tem dados no banco ainda
    - Quer testar o sistema sem passar pelo relatório de currículo

    **O que faz:**
    1. Verifica se profile existe, se não cria com dados mock
    2. Verifica se attributes existe, se não cria com dados mock
    3. Retorna sucesso

    **Exemplo:**
    ```bash
    # Com token Supabase
    curl -X POST http://localhost:8000/dev/setup-mock-data \\
      -H "Authorization: Bearer SEU_TOKEN"
    ```

    **⚠️ IMPORTANTE:**
    - Use apenas em desenvolvimento!
    - Em produção, dados virão do relatório de currículo
    """
    profile_created = False
    attributes_created = False

    # 1. Verificar/criar profile
    profile = repo.get_profile(current_user.id)
    if not profile:
        # Profile não existe, criar
        profile_data = create_mock_profile_data(
            current_user.id, current_user.email)
        profile = repo.create_profile(current_user.id, profile_data)
        profile_created = True

    # 2. Verificar/criar attributes (só se profile existir)
    try:
        attributes = repo.get_attributes(current_user.id)
        # Se chegou aqui, attributes já existe
    except Exception:
        # Attributes não existe, criar
        attributes_data = create_mock_attributes_data()
        attributes = repo.update_attributes(current_user.id, attributes_data)
        attributes_created = True

    return MockDataResponse(
        message="Dados mock configurados com sucesso! Agora você pode gerar desafios.",
        profile_id=current_user.id,
        profile_created=profile_created,
        attributes_created=attributes_created
    )


@router.post("/create-dev-user", response_model=MockDataResponse)
def create_dev_user(repo: IRepository = Depends(get_repo)):
    """
    Cria o usuário mock de desenvolvimento no banco.

    **Quando usar:**
    - Primeira vez que vai usar AUTH_ENABLED=false
    - Usuário de desenvolvimento não existe no banco

    **O que faz:**
    1. Cria profile com UUID fixo de desenvolvimento
    2. Cria attributes para esse usuário
    3. Permite desenvolvimento sem autenticação

    **Exemplo:**
    ```bash
    curl -X POST http://localhost:8000/dev/create-dev-user
    ```

    **⚠️ IMPORTANTE:**
    - Use apenas uma vez (ou quando resetar banco)
    - ID fixo: 00000000-0000-0000-0000-000000000001
    - Email: "dev@mock.local"
    """
    # UUID fixo usado no modo AUTH_ENABLED=false
    dev_user_id = str(DEV_USER_UUID)
    dev_email = "dev@mock.local"

    profile_created = False
    attributes_created = False

    # 1. Criar/verificar profile
    profile = repo.get_profile(dev_user_id)
    if not profile:
        # Profile não existe, criar
        profile_data = create_mock_profile_data(dev_user_id, dev_email)
        profile = repo.create_profile(dev_user_id, profile_data)
        profile_created = True

    # 2. Criar/verificar attributes (só se profile existir)
    try:
        attributes = repo.get_attributes(dev_user_id)
        # Se chegou aqui, attributes já existe
    except Exception:
        # Attributes não existe, criar
        attributes_data = create_mock_attributes_data()
        attributes = repo.update_attributes(dev_user_id, attributes_data)
        attributes_created = True

    return MockDataResponse(
        message="Usuário dev mock criado! Agora você pode usar AUTH_ENABLED=false",
        profile_id=dev_user_id,
        profile_created=profile_created,
        attributes_created=attributes_created
    )


@router.get("/health")
def dev_health():
    """
    Verifica se o router de dev está ativo.

    **⚠️ SEGURANÇA:**
    Em produção, este router deve ser DESABILITADO!
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=403,
            detail="Endpoints de desenvolvimento desabilitados em produção"
        )

    return {
        "status": "ok",
        "message": "Endpoints de desenvolvimento ativos",
        "environment": settings.ENVIRONMENT,
        "auth_enabled": settings.AUTH_ENABLED
    }

    return {
        "status": "ok",
        "message": "Endpoints de desenvolvimento ativos",
        "environment": settings.ENVIRONMENT,
        "auth_enabled": settings.AUTH_ENABLED
    }


@router.post("/reset-attributes-from-resume")
def reset_attributes_from_resume(
    current_user: AuthUser = Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Reseta os attributes do usuário baseado APENAS no currículo mais recente.

    🔒 ENDPOINT PROTEGIDO - Requer autenticação

    Útil quando:
    - Dados mockados antigos estão interferindo
    - Quer recalcular skills baseado apenas no currículo
    """
    try:
        # Busca currículo mais recente
        resumes = repo.get_resumes(current_user.id)
        if not resumes or len(resumes) == 0:
            raise HTTPException(
                status_code=404, detail="Nenhum currículo encontrado")

        # Busca análise do currículo mais recente
        latest_resume = resumes[0]
        analysis = repo.get_resume_analysis(latest_resume["id"])

        if not analysis:
            raise HTTPException(
                status_code=404, detail="Análise não encontrada")

        # Extrai skills da análise
        full_report = analysis.get("full_report", {})
        tech_skills = full_report.get("tech_skills", [])
        soft_skills = full_report.get("soft_skills", [])
        career_goal = full_report.get("career_goal", "fullstack")

        # SUBSTITUI completamente os attributes (não faz merge)
        repo.update_attributes(
            current_user.id,
            {
                "tech_skills": tech_skills,
                "soft_skills": soft_skills,
                "career_goal": career_goal
            },
            replace=True  # 🔥 FORÇA SUBSTITUIÇÃO COMPLETA
        )

        return {
            "message": "Attributes resetados com sucesso!",
            "tech_skills_count": len(tech_skills),
            "soft_skills_count": len(soft_skills),
            "career_goal": career_goal,
            "tech_skills": tech_skills,
            "soft_skills": soft_skills
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao resetar attributes: {str(e)}")
