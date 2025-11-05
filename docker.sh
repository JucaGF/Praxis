#!/bin/bash

# Cores
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funções
show_help() {
    echo -e "${GREEN}Praxis - Comandos Docker${NC}"
    echo ""
    echo "Uso: ./docker.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo ""
    echo -e "  ${YELLOW}dev${NC}              Inicia ambiente de DESENVOLVIMENTO"
    echo -e "  ${YELLOW}prod${NC}             Inicia ambiente de PRODUÇÃO"
    echo -e "  ${YELLOW}build-dev${NC}        Build containers de desenvolvimento"
    echo -e "  ${YELLOW}build-prod${NC}       Build containers de produção"
    echo -e "  ${YELLOW}up-dev${NC}           Sobe desenvolvimento em background"
    echo -e "  ${YELLOW}up-prod${NC}          Sobe produção em background"
    echo -e "  ${YELLOW}down${NC}             Para todos os containers"
    echo -e "  ${YELLOW}logs${NC}             Ver logs"
    echo -e "  ${YELLOW}clean${NC}            Limpa containers e volumes"
    echo -e "  ${YELLOW}ps${NC}               Lista containers rodando"
    echo ""
}

dev() {
    echo -e "${GREEN}🛠️  Iniciando ambiente de DESENVOLVIMENTO...${NC}"
    docker-compose -f docker-compose.dev.yml up
}

prod() {
    echo -e "${GREEN}⚡ Iniciando ambiente de PRODUÇÃO...${NC}"
    docker-compose up
}

build_dev() {
    echo -e "${GREEN}🔨 Building containers de desenvolvimento...${NC}"
    docker-compose -f docker-compose.dev.yml build --no-cache
}

build_prod() {
    echo -e "${GREEN}🔨 Building containers de produção...${NC}"
    docker-compose build --no-cache
}

up_dev() {
    echo -e "${GREEN}🚀 Subindo containers de desenvolvimento...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
}

up_prod() {
    echo -e "${GREEN}🚀 Subindo containers de produção...${NC}"
    docker-compose up -d
}

down_containers() {
    echo -e "${YELLOW}🛑 Parando todos os containers...${NC}"
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
}

show_logs() {
    echo -e "${GREEN}📋 Mostrando logs...${NC}"
    docker-compose logs -f
}

clean_docker() {
    echo -e "${YELLOW}🧹 Limpando Docker...${NC}"
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo -e "${GREEN}✅ Limpeza concluída!${NC}"
}

show_ps() {
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main
case "$1" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    build-dev)
        build_dev
        ;;
    build-prod)
        build_prod
        ;;
    up-dev)
        up_dev
        ;;
    up-prod)
        up_prod
        ;;
    down)
        down_containers
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_docker
        ;;
    ps)
        show_ps
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconhecido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

