
-- historico_situacao_eleitoral: replace perfis.tipo-based policies with has_role()
DROP POLICY IF EXISTS "Admins can view all electoral history" ON public.historico_situacao_eleitoral;
DROP POLICY IF EXISTS "Operators can view all electoral history" ON public.historico_situacao_eleitoral;
DROP POLICY IF EXISTS "Authenticated users can insert history" ON public.historico_situacao_eleitoral;

CREATE POLICY "Admin/operador view electoral history"
  ON public.historico_situacao_eleitoral FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE POLICY "Admin/operador insert electoral history"
  ON public.historico_situacao_eleitoral FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

-- historico_situacao_eleitoral_eleitores: restrict to admin/operador
DROP POLICY IF EXISTS "Users can view history of electoral status" ON public.historico_situacao_eleitoral_eleitores;
DROP POLICY IF EXISTS "Users can insert history of electoral status" ON public.historico_situacao_eleitoral_eleitores;

CREATE POLICY "Admin/operador view eleitor history"
  ON public.historico_situacao_eleitoral_eleitores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE POLICY "Admin/operador insert eleitor history"
  ON public.historico_situacao_eleitoral_eleitores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));
