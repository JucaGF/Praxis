# 🔧 Guia: Criar Atributos Mockados Automaticamente

## 📋 **Resumo**

Agora o sistema vai:
1. ✅ Criar **atributos mockados** automaticamente quando alguém se cadastra
2. ✅ Perguntar a **trilha de carreira** no cadastro
3. ✅ Gerar **tech skills personalizadas** baseadas na trilha escolhida

---

## 🚀 **Passos para Implementar**

### **1️⃣ Atualizar o Trigger (para novos usuários)**

**Arquivo:** `backend/migrations/create_profile_trigger.sql`

1. Abra o **Supabase SQL Editor**
2. Copie **TODO** o conteúdo atualizado de `backend/migrations/create_profile_trigger.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou Ctrl+Enter)

✅ **O que isso faz:**
- Quando alguém se cadastra, o trigger cria automaticamente:
  - ✅ Perfil (com nome e email)
  - ✅ Atributos mockados (soft_skills + tech_skills)
  - ✅ Career goal (trilha de carreira escolhida)
- Tech skills variam conforme a trilha:
  - **Desenvolvedor**: JavaScript, Python, React, SQL
  - **Dados**: Python, SQL, Power BI, Excel

---

### **2️⃣ Adicionar Atributos para Usuários Existentes**

**Arquivo:** `backend/migrations/add_mock_attributes_existing_users.sql`

1. No **Supabase SQL Editor**
2. Copie o conteúdo de `backend/migrations/add_mock_attributes_existing_users.sql`
3. Cole e clique em **Run**

✅ **O que isso faz:**
- Cria atributos mockados para usuários antigos que não têm atributos
- Define career_goal como "Não definido" para quem não escolheu
- Adiciona tech_skills genéricas

---

## 🎨 **Mudanças no Frontend**

O cadastro agora tem **6 opções de trilhas de carreira**:

- 💻 Desenvolvedor Frontend
- ⚙️ Desenvolvedor Backend
- 🚀 Desenvolvedor Full Stack
- 📊 Engenheiro de Dados
- 🔬 Cientista de Dados
- 📈 Analista de Dados

A trilha escolhida é enviada para o Supabase e usada pelo trigger para personalizar as tech_skills.

---

## 🧪 **Testar**

### **Teste 1: Cadastro Novo**
1. Crie uma nova conta no frontend
2. Escolha uma trilha (ex: "Desenvolvedor Frontend")
3. Confirme o email e faça login
4. Vá para `/home` → deve aparecer o dashboard com os dados mockados

### **Teste 2: Verificar no Supabase**

No **Supabase SQL Editor**, execute:

```sql
-- Ver todos os usuários e seus atributos
SELECT 
  p.id,
  p.full_name,
  p.email,
  a.career_goal,
  a.tech_skills,
  a.soft_skills
FROM public.profiles p
LEFT JOIN public.attributes a ON p.id = a.user_id
ORDER BY p.email;
```

---

## ⚠️ **Ordem de Execução**

**IMPORTANTE:** Execute os scripts nesta ordem:

1. ✅ `create_profile_trigger.sql` **(ATUALIZADO)** - cria perfis + atributos automaticamente
2. ✅ `add_mock_attributes_existing_users.sql` - adiciona atributos para usuários antigos

---

## 🎯 **Resultado Final**

Depois de executar tudo:

- ✅ Novos cadastros criarão perfis + atributos automaticamente
- ✅ Trilha de carreira é escolhida no cadastro
- ✅ Tech skills são personalizadas conforme a trilha
- ✅ Usuários existentes ganham atributos mockados
- ✅ O dashboard `/home` funciona sem erros para todos os usuários

---

## 📊 **Exemplo de Atributos Mockados**

Para um usuário que escolheu **"Desenvolvedor Frontend"**:

```json
{
  "career_goal": "Desenvolvedor Frontend",
  "soft_skills": [
    { "name": "Comunicação", "level": "Intermediário" },
    { "name": "Trabalho em Equipe", "level": "Avançado" },
    { "name": "Resolução de Problemas", "level": "Intermediário" },
    { "name": "Adaptabilidade", "level": "Básico" }
  ],
  "tech_skills": [
    { "name": "JavaScript", "percentage": 65, "last_updated": "2025-11-02" },
    { "name": "Python", "percentage": 50, "last_updated": "2025-11-02" },
    { "name": "React", "percentage": 55, "last_updated": "2025-11-02" },
    { "name": "SQL", "percentage": 45, "last_updated": "2025-11-02" }
  ]
}
```

---

**Me avise quando executar os scripts para testarmos juntos!** 🚀

