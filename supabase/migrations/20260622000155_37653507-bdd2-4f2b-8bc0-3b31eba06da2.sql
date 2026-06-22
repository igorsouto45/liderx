
DROP POLICY IF EXISTS "Autenticados leem candidato" ON public.candidato;

CREATE POLICY "Admin/operador leem candidato"
  ON public.candidato FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));
