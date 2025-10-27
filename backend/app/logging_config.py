# backend/app/logging_config.py
"""
LOGGING ESTRUTURADO - Configuração de Logs

Por que logging é importante?
1. DEBUG: Encontrar problemas em produção
2. MONITORAMENTO: Saber o que está acontecendo
3. AUDITORIA: Rastrear ações de usuários
4. PERFORMANCE: Identificar gargalos

O que é logging estruturado?
- Logs com CONTEXTO (user_id, request_id, etc)
- Formato JSON para ferramentas de análise
- Níveis apropriados (INFO, WARNING, ERROR)
- Fácil de filtrar e pesquisar
"""

import logging
import sys
from pathlib import Path
from typing import Any
import json
from datetime import datetime

from backend.app.config import get_settings

settings = get_settings()


# ==================== FORMATADOR ESTRUTURADO ====================

class StructuredFormatter(logging.Formatter):
    """
    Formata logs em JSON estruturado.
    
    Exemplo de output:
    {
        "timestamp": "2025-10-25T10:30:15.123456",
        "level": "INFO",
        "logger": "app.services",
        "message": "Submissão criada",
        "submission_id": 123,
        "user_id": "abc-123"
    }
    """
    
    def format(self, record: logging.LogRecord) -> str:
        # Dados base do log
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Adiciona contexto extra (se existir)
        if hasattr(record, "extra_data"):
            log_data.update(record.extra_data)
        
        # Se tiver exceção, adiciona informações
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Retorna JSON formatado
        return json.dumps(log_data, ensure_ascii=False)


class SimpleFormatter(logging.Formatter):
    """
    Formata logs de forma simples e legível (desenvolvimento).
    
    Exemplo de output:
    2025-10-25 10:30:15 | INFO | app.services | Submissão criada | submission_id=123
    """
    
    # Cores para o terminal (opcional)
    COLORS = {
        'DEBUG': '\033[36m',     # Ciano
        'INFO': '\033[32m',      # Verde
        'WARNING': '\033[33m',   # Amarelo
        'ERROR': '\033[31m',     # Vermelho
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }
    
    def format(self, record: logging.LogRecord) -> str:
        # Timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')
        
        # Level com cor (se terminal suportar)
        level = record.levelname
        if sys.stdout.isatty():  # Se é terminal (não arquivo)
            color = self.COLORS.get(level, self.COLORS['RESET'])
            level = f"{color}{level}{self.COLORS['RESET']}"
        
        # Mensagem base
        parts = [timestamp, level, record.name, record.getMessage()]
        
        # Adiciona contexto extra
        if hasattr(record, "extra_data"):
            extras = " | ".join(f"{k}={v}" for k, v in record.extra_data.items())
            parts.append(extras)
        
        return " | ".join(parts)


# ==================== CONFIGURAÇÃO DOS LOGGERS ====================

def setup_logging():
    """
    Configura o sistema de logging da aplicação.
    
    Comportamento por ambiente:
    - Development: Logs simples no console (coloridos)
    - Production: Logs JSON estruturados (para análise)
    
    Níveis de log:
    - DEBUG: Detalhes técnicos (só em dev)
    - INFO: Informações normais de operação
    - WARNING: Algo inesperado mas não é erro
    - ERROR: Erro que precisa atenção
    - CRITICAL: Erro grave, sistema comprometido
    """
    
    # Determina nível de log
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # Configura root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove handlers existentes (evita duplicação)
    root_logger.handlers.clear()
    
    # ==================== HANDLER: CONSOLE ====================
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Escolhe formatter baseado no ambiente
    if settings.ENVIRONMENT == "production":
        # Produção: JSON estruturado
        console_handler.setFormatter(StructuredFormatter())
    else:
        # Desenvolvimento: Simples e legível
        console_handler.setFormatter(SimpleFormatter())
    
    root_logger.addHandler(console_handler)
    
    # ==================== HANDLER: ARQUIVO (Opcional) ====================
    
    # Em produção, você pode querer salvar logs em arquivo também
    if settings.ENVIRONMENT == "production":
        # Cria diretório de logs
        log_dir = Path(__file__).parent.parent / "logs"
        log_dir.mkdir(exist_ok=True)
        
        # Handler para arquivo
        file_handler = logging.FileHandler(log_dir / "praxis.log")
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(file_handler)
        
        # Handler separado para erros
        error_handler = logging.FileHandler(log_dir / "errors.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(error_handler)
    
    # ==================== SILENCIA LOGGERS VERBOSOS ====================
    
    # Bibliotecas de terceiros podem logar demais
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Log inicial
    logger = logging.getLogger(__name__)
    logger.info(
        "Logging configurado",
        extra={"extra_data": {
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
            "log_level": logging.getLevelName(log_level)
        }}
    )


# ==================== HELPER: LOG COM CONTEXTO ====================

def get_logger(name: str) -> logging.Logger:
    """
    Retorna logger configurado para um módulo.
    
    Uso:
        from app.logging_config import get_logger
        
        logger = get_logger(__name__)
        logger.info("Algo aconteceu", extra={"extra_data": {"user_id": 123}})
    
    Args:
        name: Nome do módulo (geralmente __name__)
    
    Returns:
        Logger configurado
    """
    return logging.getLogger(name)


# ==================== ADAPTER: LoggerAdapter com Contexto ====================

class ContextLogger(logging.LoggerAdapter):
    """
    Logger que mantém contexto persistente.
    
    Útil quando você quer que todos os logs de uma operação
    tenham o mesmo contexto (ex: request_id, user_id).
    
    Uso:
        logger = ContextLogger(get_logger(__name__), {
            "user_id": "abc-123",
            "request_id": "req-456"
        })
        
        logger.info("Iniciando operação")  # Inclui user_id e request_id
        logger.info("Operação concluída")  # Inclui user_id e request_id
    """
    
    def process(self, msg: str, kwargs: dict) -> tuple[str, dict]:
        # Adiciona contexto persistente a todos os logs
        if "extra" not in kwargs:
            kwargs["extra"] = {}
        if "extra_data" not in kwargs["extra"]:
            kwargs["extra"]["extra_data"] = {}
        
        # Merge contexto persistente com contexto do log específico
        kwargs["extra"]["extra_data"].update(self.extra)
        
        return msg, kwargs


# ==================== EXEMPLO DE USO ====================

if __name__ == "__main__":
    # Para testar:
    # cd backend && python -m app.logging_config
    
    setup_logging()
    
    logger = get_logger(__name__)
    
    logger.debug("Mensagem de debug (detalhes técnicos)")
    logger.info("Operação normal")
    logger.warning("Algo inesperado mas ok")
    logger.error("Erro que precisa atenção")
    
    # Log com contexto extra
    logger.info(
        "Usuário criou submissão",
        extra={"extra_data": {
            "user_id": "abc-123",
            "submission_id": 456,
            "challenge_id": 789
        }}
    )
    
    # Logger com contexto persistente
    context_logger = ContextLogger(logger, {
        "request_id": "req-123",
        "user_id": "user-456"
    })
    
    context_logger.info("Primeira operação")   # Inclui request_id e user_id
    context_logger.info("Segunda operação")    # Inclui request_id e user_id

