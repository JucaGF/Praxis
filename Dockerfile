# Dockerfile para produção no Railway
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Variáveis de ambiente para otimizar Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

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
    && rm -rf /var/lib/apt/lists/*

# Copiar apenas requirements.txt primeiro (cache layer)
COPY backend/requirements.txt /app/requirements.txt

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código do backend (incluindo models.py que está dentro de backend/)
COPY backend/ /app/backend/

# Expor porta (Railway usa variável $PORT)
EXPOSE 8000

# Comando para rodar a aplicação
# Railway injeta $PORT automaticamente via variável de ambiente
CMD sh -c "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"

