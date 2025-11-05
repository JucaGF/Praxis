-- ============================================================
-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- 1. Função que cria o perfil quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_career_goal TEXT;
BEGIN
  -- Insere um novo registro em profiles com os dados do auth.users
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  
  -- Pega a trilha de carreira do metadata (ou define como 'Não definido')
  v_career_goal := COALESCE(NEW.raw_user_meta_data->>'career_goal', 'Não definido');
  
  -- Cria atributos mockados para o novo usuário
  INSERT INTO public.attributes (user_id, career_goal, soft_skills, tech_skills, updated_at)
  VALUES (
    NEW.id,
    v_career_goal,
    -- Soft skills mockadas
    jsonb_build_array(
      jsonb_build_object('name', 'Comunicação', 'level', 'Intermediário'),
      jsonb_build_object('name', 'Trabalho em Equipe', 'level', 'Avançado'),
      jsonb_build_object('name', 'Resolução de Problemas', 'level', 'Intermediário'),
      jsonb_build_object('name', 'Adaptabilidade', 'level', 'Básico')
    ),
    -- Tech skills mockadas (baseadas na trilha escolhida)
    CASE 
      WHEN v_career_goal ILIKE '%desenvolvedor%' OR v_career_goal ILIKE '%programador%' THEN
        jsonb_build_array(
          jsonb_build_object('name', 'JavaScript', 'percentage', 65, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'Python', 'percentage', 50, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'React', 'percentage', 55, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'SQL', 'percentage', 45, 'last_updated', NOW()::TEXT)
        )
      WHEN v_career_goal ILIKE '%dados%' OR v_career_goal ILIKE '%data%' THEN
        jsonb_build_array(
          jsonb_build_object('name', 'Python', 'percentage', 70, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'SQL', 'percentage', 65, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'Power BI', 'percentage', 55, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'Excel', 'percentage', 60, 'last_updated', NOW()::TEXT)
        )
      ELSE
        jsonb_build_array(
          jsonb_build_object('name', 'JavaScript', 'percentage', 50, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'Python', 'percentage', 45, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'Excel', 'percentage', 60, 'last_updated', NOW()::TEXT),
          jsonb_build_object('name', 'SQL', 'percentage', 40, 'last_updated', NOW()::TEXT)
        )
    END,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- 2. Cria o trigger que executa após inserir em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. Comentário
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Cria automaticamente um perfil na tabela profiles quando um novo usuário é criado no auth.users';

-- ============================================================
-- COMO FUNCIONA:
-- 
-- Quando um usuário se registra via supabase.auth.signUp():
-- 1. O registro é inserido em auth.users
-- 2. O trigger é ativado AUTOMATICAMENTE
-- 3. Um registro é criado em profiles com:
--    - id: mesmo UUID do auth.users
--    - full_name: vem de raw_user_meta_data.full_name ou raw_user_meta_data.nome
--    - email: copiado do auth.users.email
-- 4. Atributos mockados são criados automaticamente:
--    - career_goal: trilha de carreira escolhida no cadastro
--    - soft_skills: 4 habilidades interpessoais mockadas
--    - tech_skills: 4 habilidades técnicas mockadas (variam conforme a trilha)
-- ============================================================

