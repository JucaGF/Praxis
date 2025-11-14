-- ============================================================
-- LIMPAR SKILLS MOCKADAS DO USUÁRIO ATUAL
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Este script remove skills mockadas que foram mescladas com as skills reais
-- durante o onboarding, causando a aparição de skills não selecionadas

-- ⚠️ IMPORTANTE: Este script é para corrigir usuários que já completaram
-- o onboarding mas têm skills mockadas misturadas com as reais

-- ============================================================
-- OPÇÃO 1: LIMPAR APENAS SOFT_SKILLS MOCKADAS
-- ============================================================

-- Identifica soft_skills que parecem mockadas (formato antigo)
-- Formato mockado: [{"name": "Comunicação", "level": "Intermediário"}, ...]
-- Formato real: {"Consigo explicar problemas...": 80, "Divido tarefas...": 65}

-- Verifica se suas soft_skills estão no formato mockado (array)
SELECT 
  user_id,
  jsonb_typeof(soft_skills) as soft_skills_type,
  soft_skills
FROM public.attributes
WHERE jsonb_typeof(soft_skills) = 'array';

-- Se o resultado acima mostrar seu user_id, execute este DELETE:
-- (Isso forçará você a refazer o questionário de soft skills)

-- DELETE FROM public.attributes
-- WHERE user_id = 'SEU_USER_ID_AQUI'
--   AND jsonb_typeof(soft_skills) = 'array';

-- ============================================================
-- OPÇÃO 2: RESETAR COMPLETAMENTE OS ATRIBUTOS
-- ============================================================

-- Se você quiser refazer TODO o onboarding (tech + soft skills):

-- DELETE FROM public.attributes
-- WHERE user_id = 'SEU_USER_ID_AQUI';

-- Isso vai:
-- 1. Remover todos os seus atributos
-- 2. Na próxima vez que você fizer login, será redirecionado para /onboarding
-- 3. Você poderá refazer os questionários do zero

-- ============================================================
-- OPÇÃO 3: LIMPAR APENAS SKILLS ESPECÍFICAS (CIRÚRGICO)
-- ============================================================

-- Se você quiser remover apenas skills específicas que não selecionou:

-- Exemplo: Remover "Deixo comentários claros e úteis no código"
-- UPDATE public.attributes
-- SET soft_skills = soft_skills - 'Deixo comentários claros e úteis no código'
-- WHERE user_id = 'SEU_USER_ID_AQUI';

-- Para remover múltiplas skills:
-- UPDATE public.attributes
-- SET 
--   soft_skills = soft_skills 
--     - 'Skill 1 indesejada'
--     - 'Skill 2 indesejada'
--     - 'Skill 3 indesejada',
--   updated_at = NOW()
-- WHERE user_id = 'SEU_USER_ID_AQUI';

-- ============================================================
-- VERIFICAÇÃO: Ver suas skills atuais
-- ============================================================

-- Ver todas as suas soft_skills:
SELECT 
  user_id,
  jsonb_pretty(soft_skills) as soft_skills,
  jsonb_typeof(soft_skills) as tipo
FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';

-- Ver todas as suas tech_skills:
SELECT 
  user_id,
  jsonb_pretty(tech_skills) as tech_skills,
  jsonb_typeof(tech_skills) as tipo
FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';

-- Ver todas as suas strong_skills:
SELECT 
  user_id,
  jsonb_pretty(strong_skills) as strong_skills,
  jsonb_typeof(strong_skills) as tipo
FROM public.attributes
WHERE user_id = 'SEU_USER_ID_AQUI';

-- ============================================================
-- COMO DESCOBRIR SEU USER_ID
-- ============================================================

-- Execute este SQL para ver seu email e user_id:
SELECT 
  p.id as user_id,
  p.email,
  p.full_name
FROM public.profiles p
ORDER BY p.email;

-- Copie o 'user_id' correspondente ao seu email
-- e substitua 'SEU_USER_ID_AQUI' nos comandos acima

-- ============================================================
-- RECOMENDAÇÃO
-- ============================================================

-- Para o seu caso específico, recomendo:
-- 1. Descobrir seu user_id (query acima)
-- 2. Verificar suas skills atuais (seção VERIFICAÇÃO)
-- 3. Se tiver skills mockadas misturadas:
--    - Use OPÇÃO 2 (resetar tudo) para garantir dados limpos
--    - Refaça o onboarding com as skills corretas
-- 4. Após refazer o onboarding, as skills serão SUBSTITUÍDAS (não mescladas)
--    graças à correção no backend

-- ============================================================

