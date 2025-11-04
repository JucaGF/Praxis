-- Script para deletar desafios com difficulty inválido
-- Execute no Supabase SQL Editor

-- Mostra quantos desafios serão deletados
SELECT COUNT(*) as total_invalid
FROM challenges 
WHERE difficulty = '{}'::jsonb 
   OR difficulty IS NULL
   OR NOT (difficulty ? 'level' AND difficulty ? 'time_limit');

-- Deleta os desafios inválidos
DELETE FROM challenges 
WHERE difficulty = '{}'::jsonb 
   OR difficulty IS NULL
   OR NOT (difficulty ? 'level' AND difficulty ? 'time_limit');

-- Confirma a limpeza
SELECT COUNT(*) as total_remaining FROM challenges;

