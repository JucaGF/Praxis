# backend/app/config.py
"""
CONFIGURAÇÃO CENTRALIZADA - Settings

Por que centralizar configurações?
1. ORGANIZAÇÃO: Todas as configs em um só lugar
2. VALIDAÇÃO: Pydantic valida automaticamente
3. DEFAULTS: Valores padrão bem definidos
4. TYPE SAFETY: Editor ajuda com autocomplete
5. AMBIENTES: Fácil ter configs diferentes (dev/prod)

Como funciona?
- Lê do arquivo .env automaticamente
- Valida tipos e obrigatoriedade
- Fornece valores padrão
- Gera erro claro se faltar algo obrigatório
"""

import uuid
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


# ==================== CONSTANTES ====================

# UUID fixo para o usuário de desenvolvimento (quando AUTH_ENABLED=false)
# Este UUID é usado para permitir desenvolvimento sem autenticação
DEV_USER_UUID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class Settings(BaseSettings):
    """
    Configurações da aplicação.
    
    Pydantic Settings carrega automaticamente:
    1. Variáveis de ambiente do sistema
    2. Arquivo .env (se existir)
    
    Ordem de prioridade (maior para menor):
    1. Variável de ambiente do sistema
    2. Valor no .env
    3. Valor padrão definido aqui
    
    Exemplo de uso:
        settings = Settings()
        print(settings.DATABASE_URL)  # Lê do .env
    """
    
    # ==================== BANCO DE DADOS ====================
    
    DATABASE_URL: str
    """
    URL de conexão com o banco de dados.
    
    Formato: postgresql://user:password@host:port/database
    OBRIGATÓRIO: Sem valor padrão, deve estar no .env
    
    Exemplo:
        DATABASE_URL=postgresql://user:pass@localhost:5432/praxis
    """
    
    DATABASE_POOL_SIZE: int = 5
    """
    Tamanho do pool de conexões com o banco.
    
    - Poucas conexões: Pode ficar lento sob carga
    - Muitas conexões: Pode sobrecarregar o banco
    
    Default: 5 (bom para desenvolvimento)
    Produção: 10-20 (dependendo da carga)
    """
    
    DATABASE_MAX_OVERFLOW: int = 10
    """
    Conexões extras além do pool quando necessário.
    
    Default: 10
    """
    
    DATABASE_POOL_TIMEOUT: int = 30
    """
    Timeout (segundos) ao aguardar conexão do pool.
    
    Default: 30 segundos
    """
    
    # ==================== API / FASTAPI ====================
    
    API_TITLE: str = "Praxis API"
    """Título da API (aparece na documentação /docs)"""
    
    API_VERSION: str = "1.0.0"
    """Versão da API"""
    
    API_DESCRIPTION: str = "API para plataforma de preparação profissional"
    """Descrição da API (aparece na documentação)"""
    
    DEBUG: bool = False
    """
    Modo debug (desenvolvimento vs produção).
    
    - True: Logs verbosos, erros detalhados, hot reload
    - False: Logs mínimos, erros genéricos (produção)
    
    NUNCA deixar True em produção!
    """
    
    # ==================== CORS ====================
    
    CORS_ORIGINS: List[str] = ["*"]
    """
    Origens permitidas para CORS (Cross-Origin Resource Sharing).
    
    Desenvolvimento: ["*"] (permite tudo)
    Produção: ["https://meusite.com"] (apenas domínios específicos)
    
    Exemplo no .env:
        CORS_ORIGINS=["http://localhost:3000","https://praxis.app"]
    """
    
    CORS_CREDENTIALS: bool = True
    """Permite envio de cookies/credentials em requisições CORS"""
    
    CORS_METHODS: List[str] = ["*"]
    """Métodos HTTP permitidos (GET, POST, etc). Default: todos"""
    
    CORS_HEADERS: List[str] = ["*"]
    """Headers permitidos. Default: todos"""
    
    # ==================== AMBIENTE ====================
    
    ENVIRONMENT: str = "development"
    """
    Ambiente de execução.
    
    Valores: "development", "staging", "production"
    
    Usado para:
    - Logs diferentes por ambiente
    - Comportamentos específicos
    - Alertas condicionais
    """
    
    # ==================== AUTENTICAÇÃO (SUPABASE) ====================
    
    SUPABASE_URL: str = ""
    """
    URL do projeto Supabase.
    
    Formato: https://xxxxx.supabase.co
    
    Onde encontrar:
    - Dashboard Supabase → Project Settings → API → Project URL
    
    IMPORTANTE: Se vazio, autenticação será desabilitada (modo dev)
    """
    
    SUPABASE_KEY: str = ""
    """
    Chave pública (anon key) do Supabase.
    
    Onde encontrar:
    - Dashboard Supabase → Project Settings → API → anon public key
    
    IMPORTANTE: Se vazio, autenticação será desabilitada (modo dev)
    """
    
    SUPABASE_JWT_SECRET: str = ""
    """
    Secret para validar tokens JWT do Supabase.
    
    Onde encontrar:
    - Dashboard Supabase → Project Settings → API → JWT Secret
    
    Usado para validar tokens offline (mais rápido).
    Se vazio, valida online via API do Supabase (mais lento).
    """
    
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    """
    Service Role Key do Supabase (para operações admin).
    
    Onde encontrar:
    - Dashboard Supabase → Project Settings → API → service_role key
    
    ⚠️ ATENÇÃO: Esta chave tem privilégios totais!
    - NUNCA exponha no frontend
    - NUNCA commite no git
    - Use apenas no backend
    
    Usada para:
    - Deletar usuários
    - Operações administrativas
    """
    
    AUTH_ENABLED: bool = True
    """
    Habilita/desabilita autenticação.
    
    - True: Endpoints protegidos requerem token válido
    - False: Modo desenvolvimento (permite acesso sem token)
    
    NUNCA usar False em produção!
    """
    
    # ==================== INTELIGÊNCIA ARTIFICIAL ====================
    
    AI_PROVIDER: str = "fake"
    """
    Provedor de IA a usar.
    
    Opções:
    - "fake": IA mock para desenvolvimento (rápido, grátis, sem API calls)
    - "gemini": Google Gemini (IA real, requer API key)
    
    Uso:
    - Desenvolvimento/Testes: use "fake"
    - Produção: use "gemini"
    
    Exemplo no .env:
        AI_PROVIDER=fake  # ou gemini
    """
    
    GEMINI_API_KEY: str = ""
    """
    API Key do Google Gemini.
    
    Onde conseguir:
    1. Acesse: https://aistudio.google.com/app/apikey
    2. Faça login com conta Google
    3. Clique em "Create API Key"
    4. Copie a chave
    
    IMPORTANTE:
    - Obrigatório se AI_PROVIDER=gemini
    - Mantenha secreta (não commite no git!)
    - Grátis: 60 requests/minuto
    
    Exemplo no .env:
        GEMINI_API_KEY=AIzaSyA...
    """
    
    GEMINI_MODEL: str = "models/gemini-2.5-flash"
    """
    Modelo do Gemini a usar.
    
    Opções:
    - "models/gemini-2.5-flash": Versão estável e rápida (RECOMENDADO)
    - "models/gemini-2.5-pro": Versão mais inteligente
    - "models/gemini-flash-latest": Sempre atualizado
    
    Gemini 2.5 Flash é excelente: rápido, inteligente e gratuito!
    """
    
    AI_MAX_RETRIES: int = 5
    """
    Número máximo de tentativas em caso de erro na API.
    
    Se uma chamada falhar (timeout, rate limit, erro temporário),
    o sistema retenta automaticamente com backoff exponencial.
    
    Para erros 503 (modelo sobrecarregado), usa backoff mais longo:
    - Erros 503: 5s, 10s, 20s, 30s, 30s
    - Outros erros: 2s, 4s, 8s, 16s, 30s
    
    Recomendado: 5 (melhor para lidar com sobrecarga temporária do Gemini)
    """
    
    AI_TIMEOUT: int = 60
    """
    Timeout em segundos para chamadas à API de IA.
    
    Se a IA não responder em X segundos, cancela e retenta.
    
    Recomendado:
    - Desenvolvimento: 30s
    - Produção: 60s (prompts complexos podem demorar)
    """
    
    # ==================== CONFIGURAÇÃO DO PYDANTIC ====================
    
    model_config = SettingsConfigDict(
        # Procura .env em backend/.env (relativo ao arquivo config.py)
        env_file="backend/.env",  
        env_file_encoding="utf-8",
        case_sensitive=False,  # DATABASE_URL = database_url
        extra="ignore"  # Ignora variáveis extras no .env
    )


# ==================== INSTÂNCIA GLOBAL (Singleton) ====================

_settings: Settings | None = None


def get_settings() -> Settings:
    """
    Retorna instância única de Settings (Singleton pattern).
    
    Por que singleton?
    - Settings é lido uma vez no início
    - Não muda durante execução
    - Economiza processamento
    
    Uso:
        from app.config import get_settings
        
        settings = get_settings()
        print(settings.DATABASE_URL)
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# ==================== HELPER PARA DESENVOLVIMENTO ====================

def print_settings():
    """
    Imprime configurações (útil para debug).
    
    ⚠️ CUIDADO: Não usar em produção (pode expor senhas!)
    """
    settings = get_settings()
    print("\n" + "="*50)
    print("📋 CONFIGURAÇÕES CARREGADAS")
    print("="*50)
    
    # Oculta senha do DATABASE_URL
    db_url = settings.DATABASE_URL
    if "@" in db_url:
        # postgresql://user:SENHA@host/db → postgresql://user:***@host/db
        parts = db_url.split("@")
        before_at = parts[0].split(":")[:-1]  # Remove senha
        db_url_safe = ":".join(before_at) + ":***@" + "@".join(parts[1:])
    else:
        db_url_safe = db_url
    
    print(f"DATABASE_URL: {db_url_safe}")
    print(f"POOL_SIZE: {settings.DATABASE_POOL_SIZE}")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ENVIRONMENT: {settings.ENVIRONMENT}")
    print(f"CORS_ORIGINS: {settings.CORS_ORIGINS}")
    print(f"AI_PROVIDER: {settings.AI_PROVIDER}")
    print(f"GEMINI_MODEL: {settings.GEMINI_MODEL}")
    
    # Oculta API key do Gemini
    gemini_key = settings.GEMINI_API_KEY
    if gemini_key:
        gemini_key_safe = gemini_key[:8] + "..." + gemini_key[-4:] if len(gemini_key) > 12 else "***"
    else:
        gemini_key_safe = "(não configurada)"
    print(f"GEMINI_API_KEY: {gemini_key_safe}")
    
    print("="*50 + "\n")


# Exemplo de uso (comentado)
if __name__ == "__main__":
    # Para testar:
    # cd backend && python -m app.config
    print_settings()

