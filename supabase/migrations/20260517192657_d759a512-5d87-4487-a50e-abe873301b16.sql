-- Sincronizar user_roles com perfis existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, tipo FROM public.perfis
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualizar o trigger para também inserir em user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserir no perfil
  INSERT INTO public.perfis (id, nome, tipo)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'líder');
  
  -- Inserir na role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'líder');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
