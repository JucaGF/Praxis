# backend/app/routers/submissions.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from backend.app.deps import get_repo, get_ai, non_linear_delta, apply_skill_update
from backend.app.schemas.submissions import SubmissionCreateIn, SubmissionResultOut
from backend.app.schemas.challenges import ChallengeOut  # só p/ tipar mentalmente (não é obrigatório)

router = APIRouter(prefix="/submissions", tags=["submissions"])

@router.post("", response_model=SubmissionResultOut)
def create_and_score_submission(body: SubmissionCreateIn, repo = Depends(get_repo), ai = Depends(get_ai)):
    """
    Fluxo completo:
    - cria submissão (status 'sent')
    - marca 'evaluating'
    - chama IA fake p/ avaliar
    - salva feedback
    - aplica progressão não-linear na tech_skill alvo
    - marca 'scored'
    - retorna resultado consolidado
    """
    # 0) checagens leves
    challenge = repo.get_challenge(body.challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge não encontrado")

    # 1) descobrir número de tentativas
    attempts = repo.count_attempts(body.profile_id, body.challenge_id) + 1

    # 2) cria submissão (status 'sent')
    payload = body.model_dump()
    payload["status"] = "sent"
    payload["attempt_number"] = attempts
    sub = repo.create_submission(payload)  # {"id":..., ...}

    # 3) marca 'evaluating'
    repo.update_submission(sub["id"], {"status": "evaluating"})

    # 4) avalia via IA fake
    try:
        eval_result = ai.evaluate_submission(challenge, body.submitted_code)
        # formatações esperadas da IA fake:
        # {
        #   "nota_geral": int,
        #   "metricas": {...},
        #   "pontos_positivos": [...],
        #   "pontos_negativos": [...],
        #   "sugestoes_melhoria": [...],
        #   "feedback_detalhado": "..."
        # }
    except Exception as e:
        repo.update_submission(sub["id"], {"status": "error"})
        raise HTTPException(status_code=500, detail=f"Falha ao avaliar: {e}")

    score = int(eval_result.get("nota_geral", 0))
    metrics = eval_result.get("metricas", {})
    feedback_text = eval_result.get("feedback_detalhado", "Sem detalhes")

    # 5) salva feedback 1:1
    fb = repo.create_submission_feedback({
        "submission_id": sub["id"],
        "feedback": feedback_text,
        "summary": None,
        "score": score,
        "metrics": metrics,
        "raw_ai_response": eval_result
    })

    # 6) progressão de skill (se challenge tiver target_skill)
    difficulty = (challenge.get("difficulty") or {}).get("level", "medium")
    target_skill = (challenge.get("description") or {}).get("target_skill")

    delta_applied: Optional[int] = None
    updated_value: Optional[int] = None

    if target_skill:
        current_skills = repo.get_tech_skills(body.profile_id)
        skill_atual = int(current_skills.get(target_skill, 50))
        delta = non_linear_delta(skill_atual, score, difficulty, attempts)
        new_skills = apply_skill_update(current_skills, target_skill, delta)
        repo.update_tech_skills(body.profile_id, new_skills)

        delta_applied = int(delta)
        updated_value = int(new_skills.get(target_skill, skill_atual))

    # 7) marca 'scored'
    repo.update_submission(sub["id"], {"status": "scored"})

    # 8) retorna consolidado
    return {
        "submission_id": sub["id"],
        "status": "scored",
        "score": score,
        "metrics": metrics,
        "feedback": feedback_text,
        "target_skill": target_skill,
        "delta_applied": delta_applied,
        "updated_skill_value": updated_value
    }
