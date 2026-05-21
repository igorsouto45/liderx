-- Fix Eleitores RLS
DROP POLICY IF EXISTS "eleitores_insert_policy" ON public.eleitores;
CREATE POLICY "eleitores_insert_policy" 
ON public.eleitores 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "eleitores_select_policy" ON public.eleitores;
CREATE POLICY "eleitores_select_policy" 
ON public.eleitores 
FOR SELECT 
TO authenticated 
USING (
  (origem_usuario_id = auth.uid()) OR 
  (EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND tipo IN ('admin', 'operador')))
);

-- Fix Mensagens RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_select_policy" ON public.mensagens;
CREATE POLICY "mensagens_select_policy" 
ON public.mensagens 
FOR SELECT 
TO authenticated 
USING (
  (remetente_id = auth.uid()) OR 
  (destinatario_id = auth.uid()) OR 
  (destinatario_id IS NULL) OR
  (EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND tipo = 'admin'))
);

DROP POLICY IF EXISTS "mensagens_insert_policy" ON public.mensagens;
CREATE POLICY "mensagens_insert_policy" 
ON public.mensagens 
FOR INSERT 
TO authenticated 
WITH CHECK (remetente_id = auth.uid());
