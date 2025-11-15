"""
Router de saúde da API - Health Check

Este router fornece endpoints para verificar o status da API.
Útil para monitoramento, load balancers e health checks.

Endpoints:
- GET /healthz: Verifica se a API está rodando
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/healthz")
def health():
    """
    Endpoint de health check da API.
    
    Retorna status da API indicando que está rodando.
    Útil para:
    - Monitoramento de saúde
    - Load balancers
    - Verificação de disponibilidade
    
    Returns:
        dict: {"ok": True} se a API está rodando
    """
    return {"ok": True}