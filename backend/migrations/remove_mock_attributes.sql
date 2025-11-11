-- ============================================================
-- REMOVER ATTRIBUTES MOCKADOS DE USUÁRIOS EXISTENTES
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Este script remove os attributes mockados criados automaticamente
-- para que os usuários sejam redirecionados para o onboarding

-- ⚠️ ATENÇÃO: Execute este script APENAS DEPOIS de atualizar o trigger
-- (update_profile_trigger_no_mock.sql)

-- 1. Identificar e deletar attributes que parecem mockados
DELETE FROM public.attributes
WHERE 
  -- Attributes com soft_skills genéricos (mockados)
  soft_skills::text LIKE '%Comunicação%' 
  AND soft_skills::text LIKE '%Trabalho em Equipe%'
  AND soft_skills::text LIKE '%Resolução de Problemas%'
  AND soft_skills::text LIKE '%Adaptabilidade%'
  -- OU career_goal não definido
  OR career_goal = 'Não definido'
  -- OU tech_skills com valores mockados genéricos
  OR (
    tech_skills::text LIKE '%JavaScript%' 
    AND tech_skills::text LIKE '%Excel%'
    AND jsonb_array_length(tech_skills) = 4
  );

-- 2. Verificar quantos attributes restaram (devem ser apenas os reais)
SELECT COUNT(*) as attributes_reais_restantes FROM public.attributes;

-- 3. Verificar se há usuários sem attributes (que precisam de onboarding)
SELECT 
  p.id,
  p.full_name,
  p.email,
  CASE 
    WHEN a.user_id IS NULL THEN '❌ Sem attributes (precisa onboarding)'
    ELSE '✅ Com attributes'
  END as status
FROM public.profiles p
LEFT JOIN public.attributes a ON p.id = a.user_id
ORDER BY p.full_name;

-- ============================================================
-- EXPLICAÇÃO:
-- 
-- Este script:
-- 1. Remove attributes que foram criados pelo trigger antigo (mockados)
-- 2. Força usuários a completarem o onboarding na próxima vez que fizerem login
-- 3. Preserva attributes reais (se houver)
-- 
-- Critérios para identificar attributes mockados:
-- - Contém as 4 soft_skills padrão (Comunicação, Trabalho em Equipe, etc)
-- - career_goal é "Não definido"
-- - tech_skills contém exatamente 4 skills genéricas (JavaScript, Python, Excel, SQL)
-- 
-- ⚠️ IMPORTANTE: 
-- - Se você tiver usuários com dados reais que coincidam com esses padrões,
--   ajuste os critérios do DELETE antes de executar
-- - Faça backup antes de executar em produção
-- 
-- ALTERNATIVA MAIS SEGURA (marcar ao invés de deletar):
-- Se preferir não deletar, você pode adicionar uma coluna para marcar:
-- 
-- ALTER TABLE public.attributes ADD COLUMN is_onboarding_complete BOOLEAN DEFAULT false;
-- 
-- UPDATE public.attributes SET is_onboarding_complete = false
-- WHERE (condições acima);
-- 
-- E então, no frontend, verificar:
-- if (!attributes.is_onboarding_complete) navigate("/onboarding");
-- ============================================================
