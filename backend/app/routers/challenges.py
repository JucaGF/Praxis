# backend/app/routers/challenges.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.deps import get_repo, get_ai
from backend.app.schemas.challenges import GenerateIn, ChallengeOut  # << seus modelos

router = APIRouter(prefix="/challenges", tags=["challenges"])

@router.post("/generate", response_model=List[ChallengeOut])
def generate_challenges(body: GenerateIn, repo = Depends(get_repo), ai = Depends(get_ai)):
    profile = repo.get_profile(body.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile não encontrado")
    attrs = repo.get_attributes(body.profile_id)

    generated = ai.generate_challenges(profile, attrs)[:3]  # no MVP: 3
    created = repo.create_challenges_for_profile(body.profile_id, generated)
    return created

@router.get("/active", response_model=List[ChallengeOut])
def list_active(profile_id: str, limit: int = Query(3, ge=1, le=10), repo = Depends(get_repo)):
    return repo.list_active_challenges(profile_id, limit)

@router.get("/{challenge_id}", response_model=ChallengeOut)
def get_one(challenge_id: int, repo = Depends(get_repo)):
    ch = repo.get_challenge(challenge_id)
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge não encontrado")
    return ch
