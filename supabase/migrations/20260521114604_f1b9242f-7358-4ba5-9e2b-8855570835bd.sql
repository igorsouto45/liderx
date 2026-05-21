-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "eleitores_select" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_insert_public" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_update" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_delete" ON public.eleitores;

-- Re-enable RLS just in case
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can see their own voters, or Admins/Operators can see all
CREATE POLICY "eleitores_select" ON public.eleitores
FOR SELECT
USING (
  (auth.uid() = origem_usuario_id) OR 
  (EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  ))
);

-- 2. INSERT: Allow anyone to insert (public form) or authenticated users
-- The application logic ensures that for public forms 'origem_usuario_id' is set from the ref parameter
-- and for internal forms it's the auth.uid()
CREATE POLICY "eleitores_insert" ON public.eleitores
FOR INSERT
WITH CHECK (true);

-- 3. UPDATE: Users can update their own voters, or Admins/Operators can update all
CREATE POLICY "eleitores_update" ON public.eleitores
FOR UPDATE
USING (
  (auth.uid() = origem_usuario_id) OR 
  (EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  ))
);

-- 4. DELETE: Users can delete their own voters, or Admins/Operators can delete all
CREATE POLICY "eleitores_delete" ON public.eleitores
FOR DELETE
USING (
  (auth.uid() = origem_usuario_id) OR 
  (EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  ))
);