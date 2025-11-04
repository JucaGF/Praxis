-- ============================================================
-- ATUALIZAR NOMES VAZIOS EM PERFIS EXISTENTES
-- Execute este SQL para atualizar perfis que não têm nome
-- ============================================================

-- Atualiza perfis que têm full_name NULL ou vazio
UPDATE public.profiles p
SET full_name = COALESCE(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'nome',
  'Usuário'
)
FROM auth.users u
WHERE p.id = u.id
  AND (p.full_name IS NULL OR p.full_name = '');

-- Verifica quantos perfis foram atualizados
SELECT 
  p.id,
  p.full_name,
  p.email,
  u.raw_user_meta_data->>'full_name' AS metadata_full_name,
  u.raw_user_meta_data->>'nome' AS metadata_nome
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.id;

-- ============================================================
-- EXPLICAÇÃO:
-- 
-- Este script:
-- 1. Busca todos os perfis com full_name NULL ou vazio
-- 2. Tenta pegar o nome de auth.users.raw_user_meta_data
-- 3. Atualiza o full_name no perfil
-- 
-- Execute este script UMA VEZ para corrigir dados antigos.
-- ============================================================

