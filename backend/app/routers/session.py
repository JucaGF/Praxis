from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from backend.app.deps import get_repo
from backend.app.schemas.profiles import SessionMockIn, ProfileOut

router = APIRouter(prefix="/session", tags=["session"])

@router.post("/mock", response_model=ProfileOut)
def create_mock_session(body: SessionMockIn, repo = Depends(get_repo)):
    email: Optional[str] = body.email
    full_name = "User Mock"

    if not email:
        track = (body.track or "frontend").lower()
        if track not in ("frontend","backend","data_engineer"):
            track = "frontend"
        email = f"{track}.mock@praxis.dev"
        full_name = {"frontend":"João Silva", "backend":"Maria Santos", "data_engineer":"Ana Data"}[track]

    prof = repo.upsert_mock_profile(email, full_name)
    if not prof:
        raise HTTPException(status_code=500, detail="Falha ao criar/obter perfil")
    return prof
