-- Drop existing policies for eleitores
DROP POLICY IF EXISTS "eleitores_insert" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_select" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_update" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_delete" ON public.eleitores;

-- Recreate policies with correct logic
-- INSERT: Allow anyone to insert (public or authenticated)
-- The application code or a trigger should handle setting the correct origem_usuario_id
CREATE POLICY "eleitores_insert" ON public.eleitores
FOR INSERT WITH CHECK (true);

-- SELECT: Leaders can see their own, admins/operators see all
CREATE POLICY "eleitores_select" ON public.eleitores
FOR SELECT USING (
  auth.uid() = origem_usuario_id OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);

-- UPDATE: Leaders can update their own, admins/operators update all
CREATE POLICY "eleitores_update" ON public.eleitores
FOR UPDATE USING (
  auth.uid() = origem_usuario_id OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
) WITH CHECK (
  auth.uid() = origem_usuario_id OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);

-- DELETE: Leaders can delete their own, admins/operators delete all
CREATE POLICY "eleitores_delete" ON public.eleitores
FOR DELETE USING (
  auth.uid() = origem_usuario_id OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);
