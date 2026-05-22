-- Drop existing policies to recreate them with proper roles
DROP POLICY IF EXISTS "eleitores_select_policy" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_update_policy" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_delete_policy" ON public.eleitores;

-- Recreate Select Policy
CREATE POLICY "eleitores_select_policy" ON public.eleitores
FOR SELECT TO authenticated
USING (
  origem_usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.tipo IN ('admin', 'operador')
  )
);

-- Recreate Update Policy
CREATE POLICY "eleitores_update_policy" ON public.eleitores
FOR UPDATE TO authenticated
USING (
  origem_usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.tipo IN ('admin', 'operador')
  )
)
WITH CHECK (
  origem_usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.tipo IN ('admin', 'operador')
  )
);

-- Recreate Delete Policy
CREATE POLICY "eleitores_delete_policy" ON public.eleitores
FOR DELETE TO authenticated
USING (
  origem_usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.id = auth.uid() 
    AND perfis.tipo IN ('admin', 'operador')
  )
);
