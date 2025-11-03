.PHONY: help dev prod build-dev build-prod up-dev up-prod down-dev down-prod logs clean

# Cores para output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(GREEN)Praxis - Comandos Docker$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

# ============================================
# DESENVOLVIMENTO
# ============================================

dev: ## Inicia ambiente de DESENVOLVIMENTO (hot-reload)
	@echo "$(GREEN)🛠️  Iniciando ambiente de DESENVOLVIMENTO...$(NC)"
	docker-compose -f docker-compose.dev.yml up

build-dev: ## Build containers de desenvolvimento
	@echo "$(GREEN)🔨 Building containers de desenvolvimento...$(NC)"
	docker-compose -f docker-compose.dev.yml build --no-cache

up-dev: ## Inicia desenvolvimento em background
	@echo "$(GREEN)🚀 Subindo containers de desenvolvimento...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d

down-dev: ## Para ambiente de desenvolvimento
	@echo "$(YELLOW)🛑 Parando containers de desenvolvimento...$(NC)"
	docker-compose -f docker-compose.dev.yml down

logs-dev: ## Ver logs do desenvolvimento
	docker-compose -f docker-compose.dev.yml logs -f

# ============================================
# PRODUÇÃO
# ============================================

prod: ## Inicia ambiente de PRODUÇÃO
	@echo "$(GREEN)⚡ Iniciando ambiente de PRODUÇÃO...$(NC)"
	docker-compose up

build-prod: ## Build containers de produção
	@echo "$(GREEN)🔨 Building containers de produção...$(NC)"
	docker-compose build --no-cache

up-prod: ## Inicia produção em background
	@echo "$(GREEN)🚀 Subindo containers de produção...$(NC)"
	docker-compose up -d

down-prod: ## Para ambiente de produção
	@echo "$(YELLOW)🛑 Parando containers de produção...$(NC)"
	docker-compose down

logs-prod: ## Ver logs da produção
	docker-compose logs -f

# ============================================
# UTILITÁRIOS
# ============================================

logs: ## Ver logs de todos os containers
	docker-compose logs -f

ps: ## Lista containers rodando
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

clean: ## Limpa containers, imagens e volumes
	@echo "$(YELLOW)🧹 Limpando Docker...$(NC)"
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

backend-shell: ## Abre shell no container do backend
	docker-compose exec backend bash

frontend-shell: ## Abre shell no container do frontend
	docker-compose exec frontend sh

restart-backend: ## Reinicia apenas o backend
	docker-compose restart backend

restart-frontend: ## Reinicia apenas o frontend
	docker-compose restart frontend

