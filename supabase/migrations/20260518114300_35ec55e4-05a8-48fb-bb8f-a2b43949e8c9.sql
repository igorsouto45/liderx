-- Trigger function to handle new auth users and profiles
CREATE OR REPLACE FUNCTION public.handle_new_leadership_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with the correct type
  INSERT INTO public.perfis (id, nome, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'liderança'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_leadership ON auth.users;
CREATE TRIGGER on_auth_user_created_leadership
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_leadership_user();
