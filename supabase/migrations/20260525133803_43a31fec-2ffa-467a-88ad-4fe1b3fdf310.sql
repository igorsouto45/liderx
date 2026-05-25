
-- ============== LIDERANCAS ==============
DROP POLICY IF EXISTS "Permitir inserção pública em liderancas" ON public.liderancas;
DROP POLICY IF EXISTS "Lideranças visíveis por todos os autenticados" ON public.liderancas;
DROP POLICY IF EXISTS "Admin pode tudo em liderancas" ON public.liderancas;
DROP POLICY IF EXISTS "Admins can do everything on liderancas" ON public.liderancas;

CREATE POLICY "Admins/operators can view liderancas"
ON public.liderancas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "Admins/operators can insert liderancas"
ON public.liderancas FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "Admins/operators can update liderancas"
ON public.liderancas FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "Admins can delete liderancas"
ON public.liderancas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== METAS_VOTOS ==============
DROP POLICY IF EXISTS "Everyone can view goals" ON public.metas_votos;
DROP POLICY IF EXISTS "Only admins/operators can manage goals" ON public.metas_votos;

CREATE POLICY "Admins/operators can manage goals"
ON public.metas_votos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

-- ============== PRIORIDADES ==============
DROP POLICY IF EXISTS "Everyone can view priorities" ON public.prioridades;
DROP POLICY IF EXISTS "Only admins/operators can manage priorities" ON public.prioridades;
DROP POLICY IF EXISTS "Admin vê todas as prioridades" ON public.prioridades;

CREATE POLICY "Admins/operators view all priorities"
ON public.prioridades FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "Admins/operators manage priorities"
ON public.prioridades FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

-- ============== DOCUMENTOS_LIDERANCA ==============
DROP POLICY IF EXISTS "Documentos visíveis por admins e operadores" ON public.documentos_lideranca;
DROP POLICY IF EXISTS "Documentos inseríveis por admins e operadores" ON public.documentos_lideranca;
DROP POLICY IF EXISTS "Documentos deletáveis por admins e operadores" ON public.documentos_lideranca;

CREATE POLICY "Documents viewable by admins/operators"
ON public.documentos_lideranca FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "Documents insertable by admins/operators"
ON public.documentos_lideranca FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "Documents deletable by admins/operators"
ON public.documentos_lideranca FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role));

-- ============== ELEITORES ==============
DROP POLICY IF EXISTS "eleitores_insert_policy" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_select_policy" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_update_policy" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_delete_policy" ON public.eleitores;

CREATE POLICY "eleitores_select_policy"
ON public.eleitores FOR SELECT TO authenticated
USING (origem_usuario_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "eleitores_insert_policy"
ON public.eleitores FOR INSERT TO authenticated
WITH CHECK (auth.uid() = origem_usuario_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "eleitores_update_policy"
ON public.eleitores FOR UPDATE TO authenticated
USING (origem_usuario_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'operador'::app_role))
WITH CHECK (origem_usuario_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'operador'::app_role));

CREATE POLICY "eleitores_delete_policy"
ON public.eleitores FOR DELETE TO authenticated
USING (origem_usuario_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'operador'::app_role));

-- ============== MENSAGENS ==============
DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
DROP POLICY IF EXISTS "mensagens_select_policy" ON public.mensagens;

CREATE POLICY "mensagens_select_policy"
ON public.mensagens FOR SELECT TO authenticated
USING (remetente_id = auth.uid()
  OR destinatario_id = auth.uid()
  OR destinatario_id IS NULL
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'operador'::app_role));

-- ============== MENSAGENS_LIDAS ==============
DROP POLICY IF EXISTS "Usuários podem ver suas confirmações de leitura" ON public.mensagens_lidas;

CREATE POLICY "Users view their read receipts"
ON public.mensagens_lidas FOR SELECT TO authenticated
USING (perfil_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============== WHATSAPP_INSTANCIAS ==============
DROP POLICY IF EXISTS "Admins can manage all instances" ON public.whatsapp_instancias;
DROP POLICY IF EXISTS "Users can view and manage their own instances" ON public.whatsapp_instancias;

CREATE POLICY "Admins manage all whatsapp instances"
ON public.whatsapp_instancias FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage their own whatsapp instances"
ON public.whatsapp_instancias FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- ============== WHATSAPP_MENSAGENS ==============
DROP POLICY IF EXISTS "Admins can manage all whatsapp messages" ON public.whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can manage messages from their instances" ON public.whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can view their own whatsapp_mensagens" ON public.whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can insert their own whatsapp_mensagens" ON public.whatsapp_mensagens;

CREATE POLICY "Admins manage all whatsapp messages"
ON public.whatsapp_mensagens FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage messages from their own instances"
ON public.whatsapp_mensagens FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.whatsapp_instancias
  WHERE whatsapp_instancias.id = whatsapp_mensagens.instancia_id
    AND whatsapp_instancias.owner_id = auth.uid()
) OR auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============== WHATSAPP_CONFIGURACOES ==============
DROP POLICY IF EXISTS "Admins can manage all configs" ON public.whatsapp_configuracoes;
DROP POLICY IF EXISTS "Users can manage configs for their instances" ON public.whatsapp_configuracoes;

CREATE POLICY "Admins manage all whatsapp configs"
ON public.whatsapp_configuracoes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users manage configs for own instances"
ON public.whatsapp_configuracoes FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.whatsapp_instancias
  WHERE whatsapp_instancias.id = whatsapp_configuracoes.instancia_id
    AND whatsapp_instancias.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.whatsapp_instancias
  WHERE whatsapp_instancias.id = whatsapp_configuracoes.instancia_id
    AND whatsapp_instancias.owner_id = auth.uid()
));

-- ============== STORAGE: documentos-liderancas ==============
DROP POLICY IF EXISTS "Acesso aos documentos por admins e operadores" ON storage.objects;
DROP POLICY IF EXISTS "Upload de documentos por admins e operadores" ON storage.objects;
DROP POLICY IF EXISTS "Remoção de documentos por admins e operadores" ON storage.objects;

CREATE POLICY "Documentos SELECT admins/operators"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-liderancas'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role)));

CREATE POLICY "Documentos INSERT admins/operators"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-liderancas'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role)));

CREATE POLICY "Documentos UPDATE admins/operators"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-liderancas'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role)))
WITH CHECK (bucket_id = 'documentos-liderancas'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role)));

CREATE POLICY "Documentos DELETE admins/operators"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos-liderancas'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'operador'::app_role)));
