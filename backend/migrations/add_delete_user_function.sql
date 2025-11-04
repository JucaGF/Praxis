-- Função para permitir que usuários excluam suas próprias contas
-- Execute este SQL no Supabase SQL Editor

-- 1. Cria a função para deletar usuário
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Pega o ID do usuário autenticado
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Deleta dados relacionados ao usuário em cascade
  -- (Ajuste conforme suas tabelas)
  
  -- Exemplo: Deleta atributos
  DELETE FROM attributes WHERE profile_id = current_user_id;
  
  -- Exemplo: Deleta submissões
  DELETE FROM submissions WHERE profile_id = current_user_id;
  
  -- Exemplo: Deleta desafios
  DELETE FROM challenges WHERE profile_id = current_user_id;
  
  -- Deleta o usuário da tabela auth.users
  -- NOTA: Isso só funciona se você tiver permissões adequadas
  -- Em produção, considere usar um trigger ou job background
  DELETE FROM auth.users WHERE id = current_user_id;
  
END;
$$;

-- 2. Concede permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- 3. Comentário explicativo
COMMENT ON FUNCTION delete_user() IS 'Permite que usuários autenticados excluam suas próprias contas e dados relacionados';

