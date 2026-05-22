DROP POLICY IF EXISTS "eleitores_insert_policy" ON public.eleitores;

CREATE POLICY "eleitores_insert_policy" 
ON public.eleitores 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (auth.uid() = origem_usuario_id) OR 
  (EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'operador')
  ))
);