from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health
from fastapi.staticfiles import StaticFiles


app = FastAPI()

# para o dataset
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# registra as rotas
app.include_router(health.router)