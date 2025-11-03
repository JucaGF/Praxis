# 🚀 Docker - Início Rápido

## 💡 Por que usar Docker?

✅ **Consistência entre ambientes**: Linux, Windows, macOS  
✅ **Ideal para equipes**: Todos rodam o mesmo ambiente  
✅ **Sem "funciona na minha máquina"**: Isola dependências  
✅ **Fácil onboarding**: Novos membros começam rapidamente  

## 📝 Antes de começar

1. Tenha Docker e Docker Compose instalados
2. Crie um arquivo `.env` na raiz com suas credenciais

## ⚡ Início Rápido

### **Desenvolvimento** (recomendado para trabalhar no código)

```bash
# Opção 1: Com Make
make dev

# Opção 2: Sem Make
./docker.sh dev

# Opção 3: Docker direto
docker-compose -f docker-compose.dev.yml up
```

**Acesse:** http://localhost:5173

---

### **Produção** (versão final otimizada)

```bash
# Opção 1: Com Make
make prod

# Opção 2: Sem Make
./docker.sh prod

# Opção 3: Docker direto
docker-compose up
```

**Acesse:** http://localhost:80

---

## 🛑 Parar tudo

```bash
make down          # Com Make
./docker.sh down   # Script Shell
docker-compose down && docker-compose -f docker-compose.dev.yml down  # Docker direto
```

---

## 📋 Comandos mais usados

```bash
make dev           # Inicia desenvolvimento
make prod          # Inicia produção
make logs          # Ver logs
make clean         # Limpa tudo
make ps            # Lista containers
```

---

## 🐛 Problemas?

1. **Porta ocupada?** Mude no `docker-compose.yml`
2. **Erro de build?** `make clean && make build-dev`
3. **Não conecta Supabase?** Verifique o `.env`

---

## 📚 Documentação completa

Veja `README_DOCKER.md` para mais detalhes!

