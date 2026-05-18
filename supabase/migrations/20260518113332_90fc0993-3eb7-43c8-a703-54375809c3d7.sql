-- Conceder permissão de execução explicitamente para evitar o erro 42501
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, anon, service_role;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Qualquer um logado pode inserir eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios eleitores ou admins todos" ON public.eleitores;
DROP POLICY IF EXISTS "Eleitores selection policy" ON public.eleitores;
DROP POLICY IF EXISTS "Eleitores insertion policy" ON public.eleitores;
DROP POLICY IF EXISTS "Eleitores update policy" ON public.eleitores;
DROP POLICY IF EXISTS "Eleitores deletion policy" ON public.eleitores;

-- Política de inserção simplificada para garantir o cadastro
CREATE POLICY "Permitir inserção por usuários autenticados" ON public.eleitores
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política de seleção (Admin vê tudo, outros vêm apenas o que cadastraram)
CREATE POLICY "Permitir visualização por admin ou dono" ON public.eleitores
FOR SELECT
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin'
  OR 
  origem_usuario_id = auth.uid()
);

-- Política de atualização
CREATE POLICY "Permitir atualização por admin ou dono" ON public.eleitores
FOR UPDATE
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin'
  OR 
  origem_usuario_id = auth.uid()
);

-- Política de exclusão
CREATE POLICY "Permitir exclusão por admin ou dono" ON public.eleitores
FOR DELETE
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin'
  OR 
  origem_usuario_id = auth.uid()
);
