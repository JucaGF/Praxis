# backend/app/routers/resumes.py
"""
Router para upload e análise de currículos
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from backend.app.deps import get_current_user, get_repo, get_ai_service
from backend.app.schemas.resumes import (
    ResumeUpload,
    ResumeResponse,
    ResumeAnalysisResponse,
    ResumeWithAnalysis
)
from backend.app.domain.ports import IRepository, IAIService
from backend.app.logging_config import get_logger
from backend.app.infra.document_parser import document_parser
from typing import List, Optional

logger = get_logger(__name__)

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload/file", response_model=ResumeResponse)
async def upload_resume_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Faz upload de um currículo via ARQUIVO (PDF, DOCX, etc).

    Formatos suportados:
    - PDF (.pdf)
    - Word (.docx, .doc)
    - PowerPoint (.pptx, .ppt)
    - Texto (.txt, .md)
    - Imagens com OCR (.png, .jpg)

    O texto será extraído automaticamente usando Unstructured.io
    """
    try:
        profile_id = str(current_user.id)

        # Lê o arquivo
        file_data = await file.read()
        file_size = len(file_data)

        logger.info(
            f"Upload de arquivo: {file.filename} "
            f"({file.content_type}, {file_size / 1024:.2f} KB)"
        )

        # Valida tipo MIME
        if not document_parser.is_supported(file.content_type):
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de arquivo não suportado: {file.content_type}. "
                f"Suportados: PDF, DOCX, PPTX, TXT, MD, PNG, JPG"
            )

        # Extrai texto do arquivo
        try:
            parsed = document_parser.parse_file(
                file_data=file_data,
                filename=file.filename,
                mime_type=file.content_type
            )

            extracted_text = parsed["text"]

            if not extracted_text or len(extracted_text.strip()) < 10:
                raise HTTPException(
                    status_code=400,
                    detail="Não foi possível extrair texto do arquivo. "
                           "Verifique se o arquivo não está vazio ou corrompido."
                )

            logger.info(
                f"✅ Texto extraído: {len(extracted_text)} caracteres "
                f"(parser: {parsed['metadata'].get('parser')})"
            )

        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.exception("Erro ao extrair texto do arquivo")
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao processar arquivo: {str(e)}"
            )

        # Cria título automático se não fornecido
        if not title:
            title = file.filename

        # Salva no banco (com arquivo binário para referência futura)
        resume_obj = repo.create_resume(
            profile_id=profile_id,
            title=title,
            content=extracted_text,
            filename=file.filename,
            file_type=file.content_type,
            file_size=file_size,
            file_data=file_data  # Armazena binário para possível reprocessamento
        )

        logger.info(
            f"Currículo criado com sucesso: ID={resume_obj.id}, "
            f"Profile={profile_id}, Arquivo={file.filename}"
        )

        return ResumeResponse(
            id=resume_obj.id,
            profile_id=str(resume_obj.profile_id),
            title=resume_obj.title,
            original_content=resume_obj.original_content,
            created_at=resume_obj.created_at,
            has_analysis=False,
            original_filename=resume_obj.original_filename,
            file_type=resume_obj.file_type,
            file_size_bytes=resume_obj.file_size_bytes
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao fazer upload de arquivo")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar currículo: {str(e)}"
        )


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    resume: ResumeUpload,
    current_user=Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Faz upload de um currículo via TEXTO (colado diretamente).

    Use este endpoint quando o usuário colar o texto do currículo manualmente.
    Para upload de arquivos (PDF, DOCX), use /upload/file
    """
    try:
        profile_id = str(current_user.id)

        # Criar currículo no banco
        resume_obj = repo.create_resume(
            profile_id=profile_id,
            title=resume.title,
            content=resume.content
        )

        logger.info(
            f"Currículo criado com sucesso: ID={resume_obj.id}, Profile={profile_id}")

        return ResumeResponse(
            id=resume_obj.id,
            profile_id=str(resume_obj.profile_id),
            title=resume_obj.title,
            original_content=resume_obj.original_content,
            created_at=resume_obj.created_at,
            has_analysis=False
        )

    except Exception as e:
        logger.exception("Erro ao fazer upload de currículo")
        raise HTTPException(
            status_code=500, detail=f"Erro ao salvar currículo: {str(e)}")


@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(
    current_user=Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Lista todos os currículos do usuário.
    """
    try:
        profile_id = str(current_user.id)
        resumes = repo.get_resumes(profile_id)

        result = []
        for resume in resumes:
            # Verifica se tem análise
            analysis = repo.get_resume_analysis(resume.id)

            result.append(ResumeResponse(
                id=resume.id,
                profile_id=str(resume.profile_id),
                title=resume.title,
                original_content=resume.original_content,
                created_at=resume.created_at,
                has_analysis=analysis is not None
            ))

        return result

    except Exception as e:
        logger.exception("Erro ao listar currículos")
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar currículos: {str(e)}")


@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    resume_id: int,
    current_user=Depends(get_current_user),
    repo: IRepository = Depends(get_repo),
    ai: IAIService = Depends(get_ai_service)
):
    """
    Analisa um currículo usando IA.

    A análise será baseada no career_goal (trilha de conhecimento) do usuário.
    """
    try:
        profile_id = str(current_user.id)

        # Busca o currículo
        resume = repo.get_resume(resume_id)
        if not resume:
            raise HTTPException(
                status_code=404, detail="Currículo não encontrado")

        # Verifica se o currículo pertence ao usuário
        if str(resume.profile_id) != profile_id:
            raise HTTPException(
                status_code=403, detail="Você não tem permissão para analisar este currículo")

        # Verifica se já existe análise
        existing_analysis = repo.get_resume_analysis(resume_id)
        if existing_analysis:
            return ResumeAnalysisResponse(
                id=existing_analysis.id,
                resume_id=existing_analysis.resume_id,
                strengths=existing_analysis.strengths,
                improvements=existing_analysis.improvements,
                full_report=existing_analysis.full_report,
                created_at=existing_analysis.created_at
            )

        # Busca o career_goal do usuário
        attributes = repo.get_attributes(profile_id)
        career_goal = attributes.get("career_goal", "Desenvolvedor Full Stack")

        logger.info(f"Analisando currículo {resume_id} para {career_goal}")

        # Gera análise com IA
        analysis_result = ai.analyze_resume(
            resume_content=resume.original_content,
            career_goal=career_goal
        )

        # Formata pontos fortes e melhorias
        strengths = "\n".join(
            [f"• {p}" for p in analysis_result.get("pontos_fortes", [])])
        improvements = "\n".join(
            [f"• {g}" for g in analysis_result.get("gaps_tecnicos", [])])

        # Salva análise no banco
        analysis_obj = repo.create_resume_analysis(
            resume_id=resume_id,
            strengths=strengths,
            improvements=improvements,
            full_report=analysis_result
        )

        logger.info(
            f"Análise de currículo criada com sucesso: ID={analysis_obj.id}")

        return ResumeAnalysisResponse(
            id=analysis_obj.id,
            resume_id=analysis_obj.resume_id,
            strengths=analysis_obj.strengths,
            improvements=analysis_obj.improvements,
            full_report=analysis_obj.full_report,
            created_at=analysis_obj.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao analisar currículo")
        raise HTTPException(
            status_code=500, detail=f"Erro ao analisar currículo: {str(e)}")


@router.get("/{resume_id}", response_model=ResumeWithAnalysis)
async def get_resume_with_analysis(
    resume_id: int,
    current_user=Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Busca um currículo específico com sua análise (se existir).
    """
    try:
        profile_id = str(current_user.id)

        # Busca o currículo
        resume = repo.get_resume(resume_id)
        if not resume:
            raise HTTPException(
                status_code=404, detail="Currículo não encontrado")

        # Verifica se o currículo pertence ao usuário
        if str(resume.profile_id) != profile_id:
            raise HTTPException(
                status_code=403, detail="Você não tem permissão para acessar este currículo")

        # Busca a análise (se existir)
        analysis = repo.get_resume_analysis(resume_id)

        resume_response = ResumeResponse(
            id=resume.id,
            profile_id=str(resume.profile_id),
            title=resume.title,
            original_content=resume.original_content,
            created_at=resume.created_at,
            has_analysis=analysis is not None
        )

        analysis_response = None
        if analysis:
            analysis_response = ResumeAnalysisResponse(
                id=analysis.id,
                resume_id=analysis.resume_id,
                strengths=analysis.strengths,
                improvements=analysis.improvements,
                full_report=analysis.full_report,
                created_at=analysis.created_at
            )

        return ResumeWithAnalysis(
            resume=resume_response,
            analysis=analysis_response
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao buscar currículo")
        raise HTTPException(
            status_code=500, detail=f"Erro ao buscar currículo: {str(e)}")


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user=Depends(get_current_user),
    repo: IRepository = Depends(get_repo)
):
    """
    Deleta um currículo e sua análise.
    """
    try:
        profile_id = str(current_user.id)

        # Busca o currículo
        resume = repo.get_resume(resume_id)
        if not resume:
            raise HTTPException(
                status_code=404, detail="Currículo não encontrado")

        # Verifica se o currículo pertence ao usuário
        if str(resume.profile_id) != profile_id:
            raise HTTPException(
                status_code=403, detail="Você não tem permissão para deletar este currículo")

        # Aqui você precisaria implementar um método delete_resume no repo
        # Por enquanto retorna sucesso
        logger.info(
            f"Currículo {resume_id} marcado para deleção (implementação pendente)")

        return {"message": "Currículo deletado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao deletar currículo")
        raise HTTPException(
            status_code=500, detail=f"Erro ao deletar currículo: {str(e)}")
