# 🔧 Troubleshooting Docker no Windows

## ℹ️ Nota sobre Compatibilidade

**Flag `:z` nos volumes**: Se você ver a flag `:z` nos volumes do `docker-compose.yml`, não se preocupe! 
Esta flag é específica para sistemas Linux com SELinux (como Fedora) e é **completamente ignorada no Windows e macOS**. 
Não causará erros nem afetará o funcionamento da aplicação no Windows.

Exemplo:
```yaml
volumes:
  - ./frontend/src:/app/src:z  # Esta flag é ignorada no Windows
```

---

## Erro: "unable to get image" ou "500 Internal Server Error"

Se você recebeu esse erro ao tentar rodar `docker-compose up --build`:

```
unable to get image 'praxis-frontend': request returned 500 Internal Server Error for API route
```

### 🎯 Soluções (tente nesta ordem):

---

## 1️⃣ Limpar Cache do Docker (Mais Comum)

Abra o PowerShell ou CMD como **Administrador** e execute:

```powershell
# Para todos os containers
docker-compose -f docker-compose.dev.yml down -v

# Limpa imagens antigas e cache
docker system prune -af

# Remove volumes órfãos
docker volume prune -f

# Tenta buildar novamente
docker-compose -f docker-compose.dev.yml build --no-cache
```

---

## 2️⃣ Reiniciar o Docker Desktop

1. Abra o **Docker Desktop**
2. Clique no ícone da **engrenagem** (Settings)
3. Vá em **Troubleshoot**
4. Clique em **Restart Docker**
5. Aguarde o Docker reiniciar completamente (ícone ficará verde)
6. Tente novamente:

```powershell
docker-compose -f docker-compose.dev.yml up --build
```

---

## 3️⃣ Verificar se o Docker está Rodando

```powershell
# Teste se o Docker está respondendo
docker ps

# Se der erro, reinicie o Docker Desktop
```

---

## 4️⃣ Atualizar o Docker Desktop

1. Abra o **Docker Desktop**
2. Clique no ícone da **engrenagem** (Settings)
3. Vá em **Software updates**
4. Se houver atualização, clique em **Update**
5. Após atualizar, reinicie o computador

---

## 5️⃣ Resetar o Docker Desktop (Último Recurso)

⚠️ **ATENÇÃO**: Isso vai remover TODAS as imagens, containers e volumes!

1. Abra o **Docker Desktop**
2. Clique no ícone da **engrenagem** (Settings)
3. Vá em **Troubleshoot**
4. Clique em **Clean / Purge data**
5. Confirme e aguarde
6. Reinicie o Docker Desktop
7. Tente buildar novamente

---

## 6️⃣ Verificar Configurações do Docker Desktop

### WSL 2 (Recomendado)

1. Abra o **Docker Desktop**
2. Settings → General
3. Certifique-se de que **"Use WSL 2 based engine"** está **MARCADO**
4. Settings → Resources → WSL Integration
5. Ative a integração com sua distribuição WSL

### Recursos

1. Settings → Resources
2. Certifique-se de ter pelo menos:
   - **4 GB de RAM**
   - **2 CPUs**
   - **20 GB de espaço em disco**

---

## 7️⃣ Verificar Arquivo .env

Certifique-se de que o arquivo `.env` está na **raiz do projeto** (mesma pasta que `docker-compose.dev.yml`):

```
Praxis/
├── .env                          ← Deve estar aqui!
├── docker-compose.dev.yml
├── backend/
└── frontend/
```

**Conteúdo do .env** (copie do `backend/.env`):

```env
DATABASE_URL="postgresql://postgres.yiswjxgpvhjhonqnuyzp:Praxis123!@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL=https://yiswjxgpvhjhonqnuyzp.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpc3dqeGdwdmhqaG9ucW51eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjUzMTEsImV4cCI6MjA3NjIwMTMxMX0.sMQxgXmZeO8UAg1mhSUzkoyAGqC07xeyLI_5Sw2wW3c
SUPABASE_JWT_SECRET=U/3Ya/FpdAcoTmqUseRerngsbZ9PoXMRrJPIrMZisn1jIE2Y4wGd6SChWIs8oG+jGodvHFMc2iT9Y3tcfC0LGw==
AUTH_ENABLED=true
GEMINI_API_KEY=AIzaSyCEuctGPPXCW4sPSi51Icb_OPuz5EyQ70E
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpc3dqeGdwdmhqaG9ucW51eXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYyNTMxMSwiZXhwIjoyMDc2MjAxMzExfQ.JBEYO1DLzv-s7wJt7JD_2ejbkNZhjAC6K7aZH5lgnUU
```

---

## 8️⃣ Usar o Script Alternativo

Se o Docker Compose continuar com problemas, tente usar o `docker.bat`:

```cmd
# No CMD ou PowerShell
docker.bat dev
```

Ou manualmente:

```powershell
# Limpa tudo
docker-compose -f docker-compose.dev.yml down -v

# Build sem cache
docker-compose -f docker-compose.dev.yml build --no-cache --pull

# Sobe os containers
docker-compose -f docker-compose.dev.yml up
```

---

## 9️⃣ Verificar Logs Detalhados

Para ver o que está acontecendo:

```powershell
# Ver logs do build
docker-compose -f docker-compose.dev.yml build --no-cache --progress=plain

# Ver logs dos containers
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 🆘 Se Nada Funcionar

### Reinstalar o Docker Desktop

1. Desinstale o Docker Desktop
2. Reinicie o computador
3. Baixe a versão mais recente: https://www.docker.com/products/docker-desktop/
4. Instale e reinicie novamente
5. Habilite o WSL 2 se solicitado
6. Tente o build novamente

---

## ✅ Comando Completo Recomendado

Depois de resolver o problema, use este comando:

```powershell
# Limpa tudo
docker-compose -f docker-compose.dev.yml down -v

# Build limpo
docker-compose -f docker-compose.dev.yml build --no-cache

# Sobe os containers
docker-compose -f docker-compose.dev.yml up
```

Ou usando o Makefile (se tiver make no Windows):

```powershell
make clean
make build-dev
make dev
```

---

## 📞 Precisa de Ajuda?

Se o erro persistir, compartilhe no grupo:

1. **Versão do Docker**: `docker --version`
2. **Sistema**: `systeminfo | findstr OS`
3. **Logs completos**: `docker-compose -f docker-compose.dev.yml build --no-cache --progress=plain > build.log 2>&1`

---

## 🎯 TL;DR (Solução Rápida)

```powershell
# No PowerShell como Administrador
docker system prune -af
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

Se não funcionar, reinicie o Docker Desktop e tente novamente.

