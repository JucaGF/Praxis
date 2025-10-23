from app.infra.repo_sql import SqlRepo
r = SqlRepo()

# 1) criar/buscar perfil
p = r.upsert_mock_profile("joao@mock.dev", "João Silva")
print(p)

# 2) ler / atualizar atributos
a = r.get_attributes(p["id"]); print(a)
r.update_attributes(p["id"], {"tech_skills": {"CSS": 50}})

# 3) criar desafios (só funciona se o UNIQUE em challenges.user_id foi removido no banco)
chs = r.create_challenges_for_profile(p["id"], [
  {"title":"Teste 1","description":{"text":"..."}, "difficulty":{"level":"Fácil","time_limit":20}, "fs":None, "category":"bugfix"},
  {"title":"Teste 2","description":{"text":"..."}, "difficulty":{"level":"Médio","time_limit":30}, "fs":None, "category":"planejamento"}
])
print(len(chs), "desafios criados")

# 4) listar ativos
print(r.list_active_challenges(p["id"]))
