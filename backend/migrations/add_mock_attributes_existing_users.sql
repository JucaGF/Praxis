-- ============================================================
-- CRIAR ATRIBUTOS MOCKADOS PARA USUÁRIOS EXISTENTES
-- Execute este SQL DEPOIS de criar o trigger atualizado
-- ============================================================

-- Cria atributos mockados para usuários que têm perfil mas não têm atributos
INSERT INTO public.attributes (user_id, career_goal, soft_skills, tech_skills, updated_at)
SELECT 
  p.id AS user_id,
  COALESCE(
    u.raw_user_meta_data->>'career_goal',
    'Não definido'
  ) AS career_goal,
  -- Soft skills mockadas (iguais para todos)
  jsonb_build_array(
    jsonb_build_object('name', 'Comunicação', 'level', 'Intermediário'),
    jsonb_build_object('name', 'Trabalho em Equipe', 'level', 'Avançado'),
    jsonb_build_object('name', 'Resolução de Problemas', 'level', 'Intermediário'),
    jsonb_build_object('name', 'Adaptabilidade', 'level', 'Básico')
  ) AS soft_skills,
  -- Tech skills mockadas (genéricas para usuários antigos)
  jsonb_build_array(
    jsonb_build_object('name', 'JavaScript', 'percentage', 50, 'last_updated', NOW()::TEXT),
    jsonb_build_object('name', 'Python', 'percentage', 45, 'last_updated', NOW()::TEXT),
    jsonb_build_object('name', 'Excel', 'percentage', 60, 'last_updated', NOW()::TEXT),
    jsonb_build_object('name', 'SQL', 'percentage', 40, 'last_updated', NOW()::TEXT)
  ) AS tech_skills,
  NOW() AS updated_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.attributes a ON p.id = a.user_id
WHERE a.user_id IS NULL;

-- ============================================================
-- EXPLICAÇÃO:
-- 
-- Este script:
-- 1. Busca todos os perfis que NÃO têm atributos
-- 2. Cria atributos mockados para esses usuários:
--    - career_goal: "Não definido" (se não tiver no metadata)
--    - soft_skills: 4 habilidades interpessoais mockadas
--    - tech_skills: 4 habilidades técnicas genéricas
-- 
-- Execute este script UMA VEZ para corrigir usuários antigos.
-- Novos usuários terão atributos criados automaticamente pelo trigger.
--
-- VERIFICAÇÃO MANUAL:
-- Para verificar se funcionou, execute separadamente:
--
-- SELECT COUNT(*) FROM public.attributes;
--
-- SELECT p.full_name, p.email, a.career_goal 
-- FROM public.profiles p
-- JOIN public.attributes a ON p.id = a.user_id
-- ORDER BY p.email;
-- ============================================================
