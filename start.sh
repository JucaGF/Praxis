#!/bin/sh
set -e

# Usa PORT do Railway ou 8000 como padrão
PORT=${PORT:-8000}

# Executa o servidor
exec uvicorn backend.app.main:app --host 0.0.0.0 --port "$PORT"

