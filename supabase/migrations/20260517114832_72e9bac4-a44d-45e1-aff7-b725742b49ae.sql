-- Eleitores: restrict SELECT to admin or origin user
DROP POLICY IF EXISTS "Leitura pública de eleitores" ON public.eleitores;

CREATE POLICY "Admins e origem podem ver eleitores"
ON public.eleitores
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR origem_usuario_id = auth.uid()
);

-- Explicit UPDATE policy (admin or origin user)
CREATE POLICY "Admins e origem podem atualizar eleitores"
ON public.eleitores
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR origem_usuario_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR origem_usuario_id = auth.uid()
);

-- Explicit DELETE policy (admin only)
CREATE POLICY "Admins podem deletar eleitores"
ON public.eleitores
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Perfis: explicit write policies for admins
CREATE POLICY "Admins podem inserir perfis"
ON public.perfis
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins podem atualizar perfis"
ON public.perfis
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins podem deletar perfis"
ON public.perfis
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
