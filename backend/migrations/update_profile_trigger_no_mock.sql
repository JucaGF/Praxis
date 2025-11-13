-- ============================================================
-- TRIGGER ATUALIZADO PARA CRIAR APENAS PROFILE (SEM MOCK)
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Função atualizada que cria APENAS o perfil (sem attributes mockados)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insere um novo registro em profiles com os dados do auth.users
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  
  -- NÃO cria attributes automaticamente
  -- O usuário deve completar o questionário de onboarding primeiro
  
  RETURN NEW;
END;
$$;

-- 2. Recria o trigger (já existe, mas garantimos que está correto)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. Comentário atualizado
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Cria automaticamente um perfil na tabela profiles quando um novo usuário é criado no auth.users. 
  Attributes devem ser criados pelo fluxo de onboarding (questionário).';

-- ============================================================
-- COMO FUNCIONA AGORA:
-- 
-- Quando um usuário se registra via supabase.auth.signUp():
-- 1. O registro é inserido em auth.users
-- 2. O trigger é ativado AUTOMATICAMENTE
-- 3. Um registro é criado APENAS em profiles com:
--    - id: mesmo UUID do auth.users
--    - full_name: vem de raw_user_meta_data.full_name ou raw_user_meta_data.nome
--    - email: copiado do auth.users.email
-- 4. Attributes NÃO são criados automaticamente
-- 5. O frontend detecta a ausência de attributes e redireciona para /onboarding
-- 6. O onboarding coleta dados reais do usuário via questionários
-- 7. Ao finalizar o onboarding, os attributes são criados com dados reais
-- ============================================================
