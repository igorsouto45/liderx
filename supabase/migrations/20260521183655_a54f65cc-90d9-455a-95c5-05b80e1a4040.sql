DROP POLICY IF EXISTS "eleitores_insert_policy" ON public.eleitores;
CREATE POLICY "eleitores_insert_policy"
ON public.eleitores
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND origem_usuario_id = auth.uid()
);