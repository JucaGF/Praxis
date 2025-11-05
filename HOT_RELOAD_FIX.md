# 🔥 Fix para Hot-Reload no Docker (Windows)

## Problema
Mudanças nos arquivos do frontend não são detectadas automaticamente no Docker, especialmente no Windows.

## ✅ Solução Implementada

### 1. Configurações já aplicadas:

**vite.config.js:**
- ✅ Adicionado `usePolling: true` 
- ✅ Adicionado `interval: 1000`

**docker-compose.dev.yml:**
- ✅ Adicionado `CHOKIDAR_USEPOLLING=true`
- ✅ Adicionado `WATCHPACK_POLLING=true`
- ✅ Volumes com `:cached` para melhor performance
- ✅ Montado `vite.config.js` no container

### 2. Passos para aplicar:

```bash
# 1. Parar os containers
docker compose -f docker-compose.dev.yml down

# 2. Rebuild (necessário para pegar novas configs)
docker compose -f docker-compose.dev.yml build frontend

# 3. Subir novamente
docker compose -f docker-compose.dev.yml up
```

### 3. Verificar se está funcionando:

1. Abra um arquivo em `frontend/src/`
2. Faça uma mudança simples (ex: mude um texto)
3. Salve o arquivo
4. Aguarde 1-2 segundos
5. Veja se o navegador atualizou automaticamente

## 🐛 Se ainda não funcionar

### Opção 1: Remover user no docker-compose (pode ter problema de permissão)

Edite `docker-compose.dev.yml`, linha 38, comente ou remova:
```yaml
# user: "1000:1000"   # Comente esta linha
```

### Opção 2: Usar WSL 2 (Recomendado para Windows)

O hot-reload funciona MUITO melhor no WSL 2:

1. Instale WSL 2: https://learn.microsoft.com/en-us/windows/wsl/install
2. Clone o projeto dentro do WSL (não use `/mnt/c/`)
3. Use Docker Desktop com integração WSL 2
4. Rode os comandos dentro do WSL

### Opção 3: Rodar sem Docker (desenvolvimento local)

Se o hot-reload é crítico e Docker não está funcionando:

```bash
# No diretório frontend/
npm install
npm run dev
```

Depois ajuste o `.env` para apontar para o backend correto.

## 📊 Logs para Debug

Se precisar investigar:

```bash
# Ver logs do frontend
docker logs -f praxis-frontend-dev

# Entrar no container
docker exec -it praxis-frontend-dev sh

# Verificar se os arquivos estão sendo montados
ls -la /app/src
```

## 🎯 Performance

Com polling ativado, o CPU pode ter uso um pouco maior (normal). Se incomodar, aumente o `interval`:

```javascript
// vite.config.js
watch: {
  usePolling: true,
  interval: 2000, // 2 segundos em vez de 1
}
```

## ✅ Confirmação de Sucesso

Quando funcionar, você verá no terminal do Docker:

```
praxis-frontend-dev  | 12:34:56 PM [vite] page reload src/App.jsx
```

Ou algo similar indicando que o Vite detectou a mudança.

