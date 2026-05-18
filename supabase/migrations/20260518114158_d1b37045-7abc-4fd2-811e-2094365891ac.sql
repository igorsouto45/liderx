-- Add email column to liderancas if it doesn't exist
ALTER TABLE public.liderancas ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add auth_user_id column to liderancas if it doesn't exist to link with auth.users
ALTER TABLE public.liderancas ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
