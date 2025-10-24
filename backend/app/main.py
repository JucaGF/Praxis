from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from backend.app.routers.session import router as session_router
from backend.app.routers.attributes import router as attributes_router
from backend.app.routers.health import router as health_router
from backend.app.routers.challenges import router as challenges_router
from backend.app.routers.submissions import router as submissions_router




app = FastAPI()

# para o dataset
BASE_DIR = Path(__file__).resolve().parent.parent
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# registra as rotas
app.include_router(health_router)
app.include_router(session_router)
app.include_router(attributes_router)
app.include_router(challenges_router)
app.include_router(submissions_router)

@app.get("/")
def read_root():
    return {"message": "API is running"}