-- ============================================================
-- CORRIGIR USUÁRIOS EXISTENTES SEM PERFIL
-- Execute este SQL DEPOIS de criar o trigger (create_profile_trigger.sql)
-- ============================================================

-- Cria perfis para usuários que existem em auth.users mas não em profiles
INSERT INTO public.profiles (id, full_name, email)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name', 
    u.raw_user_meta_data->>'nome',
    'Usuário'
  ) AS full_name,
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verifica quantos perfis foram criados
SELECT COUNT(*) AS perfis_criados
FROM public.profiles;

-- ============================================================
-- EXPLICAÇÃO:
-- 
-- Este script:
-- 1. Busca todos os usuários em auth.users
-- 2. Verifica quais NÃO têm perfil em profiles
-- 3. Cria perfis para esses usuários
-- 4. Copia o nome de raw_user_meta_data (full_name ou nome)
-- 
-- Execute este script UMA VEZ para corrigir usuários antigos.
-- Novos usuários terão perfis criados automaticamente pelo trigger.
-- ============================================================

