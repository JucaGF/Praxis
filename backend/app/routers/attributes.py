from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from backend.app.deps import get_repo
from backend.app.schemas.attributes import AttributesOut, AttributesPatchIn

router = APIRouter(prefix="/attributes", tags=["attributes"])

def _validate_skill_dict(d: Dict[str, int], field_name: str):
    for k, v in d.items():
        if not isinstance(v, int):
            raise HTTPException(status_code=422, detail=f"{field_name}.{k} deve ser inteiro")
        if v < 0 or v > 100:
            raise HTTPException(status_code=422, detail=f"{field_name}.{k} deve estar entre 0 e 100")

@router.get("/{profile_id}", response_model=AttributesOut)
def get_attributes(profile_id: str, repo = Depends(get_repo)):
    try:
        return repo.get_attributes(profile_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Atributos não encontrados: {e}")

@router.patch("/{profile_id}", response_model=AttributesOut)
def patch_attributes(profile_id: str, body: AttributesPatchIn, repo = Depends(get_repo)):
    payload = body.dict(exclude_unset=True)
    if "soft_skills" in payload and payload["soft_skills"]:
        _validate_skill_dict(payload["soft_skills"], "soft_skills")
    if "tech_skills" in payload and payload["tech_skills"]:
        _validate_skill_dict(payload["tech_skills"], "tech_skills")
    try:
        return repo.update_attributes(profile_id, payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar atributos: {e}")
