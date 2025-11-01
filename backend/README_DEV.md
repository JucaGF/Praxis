# 🚀 Guia Rápido: Como Testar o Backend

## TL;DR (Versão Ultra Rápida)

```bash
# 1. Configure o .env
echo "AUTH_ENABLED=false" >> .env

# 2. Execute o script de setup
python backend/setup_dev.py

# 3. Inicie o servidor
uvicorn backend.app.main:app --reload

# 4. Teste (em outro terminal)
curl http://localhost:8000/attributes
curl -X POST http://localhost:8000/challenges/generate
```

**Pronto!** Não precisa de token, não precisa fazer login. Tudo funciona automaticamente.

---

## 📚 Explicação Detalhada

### Por que AUTH_ENABLED=false?

Quando você coloca `AUTH_ENABLED=false` no `.env`, o sistema:
- ✅ **NÃO** pede token JWT
- ✅ **NÃO** precisa fazer login no Supabase
- ✅ Usa automaticamente um usuário de desenvolvimento
- ✅ Todas as rotas funcionam sem header Authorization

É como se você estivesse **sempre logado** como um usuário de teste.

### O que o script setup_dev.py faz?

1. **Limpa** dados antigos do usuário dev
2. **Cria** um profile com UUID fixo: `00000000-0000-0000-0000-000000000001`
3. **Adiciona** attributes com skills mockadas (Python 60, FastAPI 55, etc)
4. **Verifica** se tudo foi criado corretamente

### Como funciona por baixo dos panos?

Quando `AUTH_ENABLED=false`, o código em `auth_service.py` faz isso:

```python
def get_current_user(self, authorization: Optional[str]) -> AuthUser:
    if not self.auth_enabled:  # ← AUTH_ENABLED=false
        return AuthUser(
            id="00000000-0000-0000-0000-000000000001",  # ← Sempre retorna este ID
            email="dev@mock.local",
            role="authenticated"
        )
    # ... resto do código normal
```

**Ou seja:** Não importa se você envia token ou não, o sistema sempre usa o usuário dev!

---

## 🧪 Testando as Rotas

### 1. Ver seus atributos
```bash
curl http://localhost:8000/attributes
```

Retorna:
```json
{
  "profile_id": "00000000-0000-0000-0000-000000000001",
  "career_goal": "Desenvolver habilidades técnicas e soft skills de forma equilibrada",
  "soft_skills": {...},
  "tech_skills": {...}
}
```

### 2. Gerar desafios personalizados
```bash
curl -X POST http://localhost:8000/challenges/generate
```

Retorna array com 3 desafios baseados nas suas skills mockadas.

### 3. Listar desafios ativos
```bash
curl http://localhost:8000/challenges/active
```

### 4. Ver um desafio específico
```bash
curl http://localhost:8000/challenges/1
```

### 5. Submeter uma solução
```bash
curl -X POST http://localhost:8000/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": 1,
    "submitted_code": {
      "solution": "def soma(a, b):\n    return a + b"
    },
    "commit_message": "Minha primeira solução"
  }'
```

### 6. Atualizar suas skills
```bash
curl -X PATCH http://localhost:8000/attributes \
  -H "Content-Type: application/json" \
  -d '{
    "tech_skills": {
      "Python": 80,
      "FastAPI": 75
    }
  }'
```

---

## 🔄 Se algo der errado

### Resetar tudo:
```bash
python backend/setup_dev.py
```

O script sempre limpa e recria do zero.

### Verificar logs:
O servidor mostra no console:
```
2025-10-28 15:30:45 | WARNING | Auth desabilitado - retornando usuário mock
```

Se você ver essa mensagem, está tudo certo!

---

## 🔒 Quando ativar autenticação real?

### Para integrar com o frontend:

1. **Mude o `.env`:**
```bash
AUTH_ENABLED=true
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_anon_key
SUPABASE_JWT_SECRET=seu_jwt_secret
```

2. **Frontend faz login:**
```javascript
const { data } = await supabase.auth.signInWithPassword({
  email: 'usuario@example.com',
  password: 'senha123'
})
const token = data.session.access_token
```

3. **Frontend envia token nas requests:**
```javascript
fetch('http://localhost:8000/attributes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Nada muda no backend!** O mesmo código funciona com ou sem autenticação.

---

## ❓ FAQ

### P: Preciso criar vários usuários para testar?
**R:** Não! No modo `AUTH_ENABLED=false`, você tem um usuário fixo que é suficiente para testar tudo.

### P: Posso testar no Swagger/Postman?
**R:** Sim! Com `AUTH_ENABLED=false`, você pode ignorar o campo "Authorization" completamente.

### P: Como testar com usuários diferentes?
**R:** Para isso, você precisa ativar `AUTH_ENABLED=true` e criar usuários reais no Supabase.

### P: Onde está o banco de dados?
**R:** Configurado na variável `DATABASE_URL` do `.env`. Pode ser:
- Postgres local
- Supabase (produção ou local)
- Outro Postgres qualquer

### P: O que fazer se der "Attributes não encontrados"?
**R:** Execute `python backend/setup_dev.py` novamente.

---

## 📋 Checklist de Troubleshooting

- [ ] `AUTH_ENABLED=false` no `.env`?
- [ ] Executou `python backend/setup_dev.py`?
- [ ] Banco de dados está rodando?
- [ ] `DATABASE_URL` está correta no `.env`?
- [ ] Servidor está rodando (`uvicorn backend.app.main:app --reload`)?
- [ ] Testando na porta certa (8000 por padrão)?

Se todos os itens estão ✅, deve funcionar!

---

## 🎯 Próximos Passos

1. ✅ Testar todas as rotas sem autenticação
2. ✅ Validar que os desafios são gerados corretamente
3. ✅ Testar submissões e feedbacks
4. 🔄 Integrar com frontend
5. 🔒 Ativar autenticação em produção

**Dúvidas?** Veja o arquivo `TESTE_GUIA.md` para mais detalhes.

