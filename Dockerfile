# Dockerfile para produção no Railway usando uv
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Variáveis de ambiente para otimizar Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    UV_SYSTEM_PYTHON=1

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    tesseract-ocr \
    tesseract-ocr-por \
    libtesseract-dev \
    poppler-utils \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar uv e mover para /usr/local/bin (já está no PATH)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    cp /root/.cargo/bin/uv /usr/local/bin/uv && \
    chmod +x /usr/local/bin/uv

# Copiar apenas requirements.txt primeiro (cache layer)
COPY backend/requirements.txt /app/requirements.txt

# Instalar dependências Python usando uv (muito mais rápido que pip)
RUN uv pip install --system -r requirements.txt

# Copiar código do backend (incluindo models.py que está dentro de backend/)
COPY backend/ /app/backend/

# Expor porta (Railway usa variável $PORT)
EXPOSE 8000

# Comando para rodar a aplicação
# Usa python -m uvicorn para garantir que está no PATH correto
# Railway injeta $PORT automaticamente
CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

