-- Ajustando a política de inserção para garantir que o origem_usuario_id seja validado
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.eleitores;

CREATE POLICY "Permitir inserção vinculada ao usuário" 
ON public.eleitores 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (origem_usuario_id = auth.uid()) OR 
  has_role(auth.uid(), 'admin')
);
