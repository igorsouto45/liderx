-- Set default value for origem_usuario_id to auth.uid()
ALTER TABLE public.eleitores 
ALTER COLUMN origem_usuario_id SET DEFAULT auth.uid();

-- Ensure insert policy is robust
DROP POLICY IF EXISTS "eleitores_insert" ON public.eleitores;
CREATE POLICY "eleitores_insert" ON public.eleitores
FOR INSERT WITH CHECK (true);

-- Ensure select policy allows creator and admins
DROP POLICY IF EXISTS "eleitores_select" ON public.eleitores;
CREATE POLICY "eleitores_select" ON public.eleitores
FOR SELECT USING (
  auth.uid() = origem_usuario_id 
  OR EXISTS (
    SELECT 1 FROM perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);
