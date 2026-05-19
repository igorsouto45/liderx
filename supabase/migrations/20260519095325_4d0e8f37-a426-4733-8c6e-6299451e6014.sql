-- Drop redundant triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_leadership ON auth.users;

-- Update the main trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _nome text;
  _role app_role;
BEGIN
  -- Get name from metadata (try 'nome' first, then 'full_name', then fallback to email)
  _nome := COALESCE(
    new.raw_user_meta_data->>'nome', 
    new.raw_user_meta_data->>'full_name', 
    new.email
  );

  -- Get role from metadata, ensuring it's a valid app_role value
  -- If not provided or invalid, default to 'líder'
  BEGIN
    _role := (new.raw_user_meta_data->>'tipo')::app_role;
  EXCEPTION WHEN OTHERS THEN
    _role := 'líder'::app_role;
  END;

  -- Special case: always ensure this specific email is an admin
  IF NEW.email = 'igor.souto@agencialapiscriativo.com.br' THEN
    _role := 'admin'::app_role;
  END IF;

  -- Insert or update profile
  INSERT INTO public.perfis (id, nome, tipo)
  VALUES (new.id, _nome, _role)
  ON CONFLICT (id) DO UPDATE SET 
    nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo;
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If it's an admin, also ensure they have the admin role record
  IF _role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN new;
END;
$function$;

-- Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();