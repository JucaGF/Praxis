-- backend/migrations/fix_invalid_categories.sql
-- Script para deletar desafios com categorias inválidas geradas pela IA antiga

-- Deleta desafios com categorias antigas (inválidas)
DELETE FROM challenges
WHERE category NOT IN ('code', 'daily-task', 'organization');

-- Mostra quantos desafios foram deletados
SELECT 'Desafios com categorias inválidas foram removidos' as mensagem;

-- Mostra os desafios restantes por categoria
SELECT 
    category,
    COUNT(*) as total
FROM challenges
GROUP BY category
ORDER BY total DESC;


