@echo off
REM Script para gerenciar Docker no Windows
REM Uso: docker.bat [comando]

if "%1"=="" (
    echo Uso: docker.bat [comando]
    echo.
    echo Comandos disponiveis:
    echo   dev         - Inicia ambiente de desenvolvimento
    echo   prod        - Inicia ambiente de producao
    echo   build-dev   - Constroi imagens de desenvolvimento
    echo   build-prod  - Constroi imagens de producao
    echo   down-dev    - Para ambiente de desenvolvimento
    echo   down-prod   - Para ambiente de producao
    echo   logs        - Mostra logs dos containers
    echo   clean       - Remove containers, volumes e imagens
    echo   shell-be    - Acessa shell do backend
    echo   shell-fe    - Acessa shell do frontend
    goto :eof
)

if "%1"=="dev" (
    echo Iniciando ambiente de DESENVOLVIMENTO...
    docker-compose -f docker-compose.dev.yml up
    goto :eof
)

if "%1"=="prod" (
    echo Iniciando ambiente de PRODUCAO...
    docker-compose up
    goto :eof
)

if "%1"=="build-dev" (
    echo Construindo imagens de DESENVOLVIMENTO...
    docker-compose -f docker-compose.dev.yml build
    goto :eof
)

if "%1"=="build-prod" (
    echo Construindo imagens de PRODUCAO...
    docker-compose build
    goto :eof
)

if "%1"=="down-dev" (
    echo Parando ambiente de DESENVOLVIMENTO...
    docker-compose -f docker-compose.dev.yml down
    goto :eof
)

if "%1"=="down-prod" (
    echo Parando ambiente de PRODUCAO...
    docker-compose down
    goto :eof
)

if "%1"=="logs" (
    if "%2"=="" (
        docker-compose -f docker-compose.dev.yml logs -f
    ) else (
        docker-compose -f docker-compose.dev.yml logs -f %2
    )
    goto :eof
)

if "%1"=="clean" (
    echo Limpando containers, volumes e imagens...
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose down -v
    docker system prune -af --volumes
    goto :eof
)

if "%1"=="shell-be" (
    echo Acessando shell do backend...
    docker exec -it praxis-backend-dev /bin/bash
    goto :eof
)

if "%1"=="shell-fe" (
    echo Acessando shell do frontend...
    docker exec -it praxis-frontend-dev /bin/sh
    goto :eof
)

echo Comando invalido: %1
echo Use: docker.bat (sem argumentos) para ver comandos disponiveis
