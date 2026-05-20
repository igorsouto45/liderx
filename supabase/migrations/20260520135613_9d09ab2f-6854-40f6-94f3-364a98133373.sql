-- Ensure RLS is enabled
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prioridades ENABLE ROW LEVEL SECURITY;

-- 1. Policies for eleitores (Voters)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.eleitores;
DROP POLICY IF EXISTS "Users see voters they registered or all if admin/operator" ON public.eleitores;

CREATE POLICY "Users see voters they registered or all if admin/operator" 
ON public.eleitores 
FOR SELECT 
USING (
  auth.uid() = origem_usuario_id OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);

DROP POLICY IF EXISTS "Users can insert their own voters" ON public.eleitores;
CREATE POLICY "Users can insert their own voters" 
ON public.eleitores 
FOR INSERT 
WITH CHECK (auth.uid() = origem_usuario_id);

DROP POLICY IF EXISTS "Users can update voters they registered or all if admin/operator" ON public.eleitores;
CREATE POLICY "Users can update voters they registered or all if admin/operator" 
ON public.eleitores 
FOR UPDATE 
USING (
  auth.uid() = origem_usuario_id OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);

-- 2. Policies for metas_votos (Goals)
DROP POLICY IF EXISTS "Enable access for all" ON public.metas_votos;
DROP POLICY IF EXISTS "Everyone can view goals" ON public.metas_votos;
CREATE POLICY "Everyone can view goals" 
ON public.metas_votos 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Only admins/operators can manage goals" ON public.metas_votos;
CREATE POLICY "Only admins/operators can manage goals" 
ON public.metas_votos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);

-- 3. Policies for prioridades (Priorities)
DROP POLICY IF EXISTS "Enable access for all" ON public.prioridades;
DROP POLICY IF EXISTS "Everyone can view priorities" ON public.prioridades;
CREATE POLICY "Everyone can view priorities" 
ON public.prioridades 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Only admins/operators can manage priorities" ON public.prioridades;
CREATE POLICY "Only admins/operators can manage priorities" 
ON public.prioridades 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);
