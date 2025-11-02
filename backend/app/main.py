from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path

from backend.app.routers.session import router as session_router
from backend.app.routers.attributes import router as attributes_router
from backend.app.routers.health import router as health_router
from backend.app.routers.challenges import router as challenges_router
from backend.app.routers.submissions import router as submissions_router
from backend.app.routers.dev import router as dev_router
from backend.app.routers.account import router as account_router
from backend.app.config import get_settings
from backend.app.logging_config import setup_logging, get_logger
from backend.app.domain.exceptions import PraxisError, get_http_status_code

# Configura logging ANTES de tudo
setup_logging()
logger = get_logger(__name__)

# Carrega configurações centralizadas
settings = get_settings()

logger.info("Iniciando aplicação Praxis", extra={"extra_data": {
    "environment": settings.ENVIRONMENT,
    "debug": settings.DEBUG,
    "version": settings.API_VERSION
}})

# Cria app com configurações do settings
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    debug=settings.DEBUG,
)


# ==================== EXCEPTION HANDLERS GLOBAIS ====================

@app.exception_handler(PraxisError)
async def praxis_exception_handler(request: Request, exc: PraxisError):
    """
    Handler global para TODAS as exceções PraxisError.
    
    Por que isso é importante?
    - Exceções lançadas em dependencies são capturadas automaticamente
    - Converte exceção customizada em HTTPException apropriada
    - Loga o erro automaticamente
    - Retorna JSON estruturado
    
    Antes:
    - Exceção em dependency → crash não tratado
    
    Depois:
    - Exceção em dependency → capturada aqui → HTTP correto
    
    Exemplo:
    - TokenInvalidError → HTTP 401
    - ChallengeNotFoundError → HTTP 404
    - AIEvaluationError → HTTP 503
    """
    status_code = get_http_status_code(exc)
    
    # Log do erro
    logger.warning(
        f"Exceção capturada: {exc.__class__.__name__}",
        extra={"extra_data": {
            "exception_type": exc.__class__.__name__,
            "message": str(exc),
            "status_code": status_code,
            "path": request.url.path,
            "details": getattr(exc, 'details', {})
        }}
    )
    
    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)}
    )

# para o dataset
BASE_DIR = Path(__file__).resolve().parent.parent
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# CORS com configurações centralizadas
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ✅ Configurável!
    allow_credentials=settings.CORS_CREDENTIALS,  # ✅ Configurável!
    allow_methods=settings.CORS_METHODS,  # ✅ Configurável!
    allow_headers=settings.CORS_HEADERS,  # ✅ Configurável!
)

# registra as rotas
app.include_router(health_router)
app.include_router(session_router)
app.include_router(attributes_router)
app.include_router(challenges_router)
app.include_router(submissions_router)
app.include_router(account_router)  # Gerenciamento de conta
app.include_router(dev_router)  # Endpoints de desenvolvimento/mock

@app.get("/")
def read_root():
    return {"message": "API is running"}