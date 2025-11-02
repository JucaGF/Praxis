-- ============================================================
-- TRIGGERS PARA DELETAR DADOS DO USUÁRIO EM CASCATA
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Função que deleta todos os dados relacionados ao perfil
CREATE OR REPLACE FUNCTION delete_user_related_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_feedbacks integer;
  deleted_submissions integer;
  deleted_challenges integer;
  deleted_analyses integer;
  deleted_resumes integer;
  deleted_attributes integer;
BEGIN
  -- Ordem de deleção respeitando foreign keys:
  
  -- 1. Deleta feedbacks de submissões (referencia submissions)
  DELETE FROM submission_feedbacks 
  WHERE submission_id IN (
    SELECT id FROM submissions WHERE profile_id = OLD.id
  );
  GET DIAGNOSTICS deleted_feedbacks = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % feedbacks', deleted_feedbacks;
  
  -- 2. Deleta submissões do usuário (referencia challenges e profiles)
  DELETE FROM submissions 
  WHERE profile_id = OLD.id;
  GET DIAGNOSTICS deleted_submissions = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % submissions', deleted_submissions;
  
  -- 3. Deleta análises de currículos (referencia resumes)
  DELETE FROM resume_analyses 
  WHERE resume_id IN (
    SELECT id FROM resumes WHERE profile_id = OLD.id
  );
  GET DIAGNOSTICS deleted_analyses = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % analyses', deleted_analyses;
  
  -- 4. Deleta currículos do usuário (referencia profiles)
  DELETE FROM resumes 
  WHERE profile_id = OLD.id;
  GET DIAGNOSTICS deleted_resumes = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % resumes', deleted_resumes;
  
  -- 5. Deleta desafios do usuário (referencia profiles)
  DELETE FROM challenges 
  WHERE profile_id = OLD.id;
  GET DIAGNOSTICS deleted_challenges = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % challenges', deleted_challenges;
  
  -- 6. Deleta atributos do usuário (usa user_id!)
  DELETE FROM attributes 
  WHERE user_id = OLD.id;
  GET DIAGNOSTICS deleted_attributes = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % attributes', deleted_attributes;
  
  -- Retorna OLD para permitir a deleção do perfil
  RETURN OLD;
END;
$$;

-- 2. Cria o trigger BEFORE DELETE na tabela profiles
DROP TRIGGER IF EXISTS trigger_delete_user_data ON profiles;

CREATE TRIGGER trigger_delete_user_data
BEFORE DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION delete_user_related_data();

-- 3. Comentário
COMMENT ON FUNCTION delete_user_related_data() IS 
  'Trigger que deleta automaticamente todos os dados relacionados quando um perfil é deletado';

-- ============================================================
-- COMO FUNCIONA:
-- 
-- O trigger é executado automaticamente ANTES de deletar um perfil.
-- 
-- Quando você deleta de profiles:
--   DELETE FROM profiles WHERE id = 'user_id';
-- 
-- O trigger deleta automaticamente:
-- 1. Feedbacks de submissões
-- 2. Submissões
-- 3. Análises de currículos
-- 4. Currículos
-- 5. Desafios
-- 6. Atributos
-- 
-- Depois o perfil é deletado normalmente.
-- ============================================================

