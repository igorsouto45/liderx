-- Remover políticas antigas de SELECT
DROP POLICY IF EXISTS "Permitir visualização para admins ou dono" ON public.eleitores;
DROP POLICY IF EXISTS "Permitir visualização por admin ou dono" ON public.eleitores;

-- Criar nova política de SELECT robusta
CREATE POLICY "Admins veem tudo, donos veem o seu"
ON public.eleitores
FOR SELECT
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin' OR 
  origem_usuario_id = auth.uid()
);

-- Remover políticas antigas de INSERT
DROP POLICY IF EXISTS "Permitir inserção por usuários autenticados" ON public.eleitores;
DROP POLICY IF EXISTS "Qualquer autenticado pode inserir eleitores" ON public.eleitores;

-- Criar nova política de INSERT que permite cadastros anônimos (públicos)
CREATE POLICY "Qualquer pessoa pode se cadastrar"
ON public.eleitores
FOR INSERT
WITH CHECK (true);

-- Ajustar permissões de UPDATE e DELETE para garantir consistência
DROP POLICY IF EXISTS "Permitir atualização para admins ou dono" ON public.eleitores;
DROP POLICY IF EXISTS "Permitir atualização por admin ou dono" ON public.eleitores;

CREATE POLICY "Admins ou donos podem atualizar"
ON public.eleitores
FOR UPDATE
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin' OR 
  origem_usuario_id = auth.uid()
)
WITH CHECK (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin' OR 
  origem_usuario_id = auth.uid()
);

DROP POLICY IF EXISTS "Permitir deleção apenas para admins" ON public.eleitores;
DROP POLICY IF EXISTS "Permitir exclusão por admin ou dono" ON public.eleitores;

CREATE POLICY "Admins podem deletar tudo, donos deletam o seu"
ON public.eleitores
FOR DELETE
USING (
  (SELECT tipo FROM public.perfis WHERE id = auth.uid()) = 'admin' OR 
  origem_usuario_id = auth.uid()
);
