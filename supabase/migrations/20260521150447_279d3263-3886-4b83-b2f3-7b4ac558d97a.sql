-- Primeiro, removemos todas as políticas existentes para limpar o terreno
DROP POLICY IF EXISTS "eleitores_select" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_insert" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_update" ON public.eleitores;
DROP POLICY IF EXISTS "eleitores_delete" ON public.eleitores;
DROP POLICY IF EXISTS "Users can view their own data or admins can view all" ON public.eleitores;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.eleitores;
DROP POLICY IF EXISTS "Users can update their own data" ON public.eleitores;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.eleitores;
DROP POLICY IF EXISTS "Admins can do everything" ON public.eleitores;

-- Habilitar RLS (caso não esteja)
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;

-- 1. Política de INSERÇÃO: Qualquer usuário autenticado pode inserir
CREATE POLICY "eleitores_insert_policy" 
ON public.eleitores 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Política de SELEÇÃO: 
-- Admins/Operadores veem tudo. 
-- Líderes veem apenas o que cadastraram (origem_usuario_id).
CREATE POLICY "eleitores_select_policy" 
ON public.eleitores 
FOR SELECT 
TO authenticated 
USING (
  origem_usuario_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'operador')
  )
);

-- 3. Política de ATUALIZAÇÃO:
-- Admins/Operadores podem atualizar tudo.
-- Líderes podem atualizar apenas o que cadastraram.
CREATE POLICY "eleitores_update_policy" 
ON public.eleitores 
FOR UPDATE 
TO authenticated 
USING (
  origem_usuario_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'operador')
  )
)
WITH CHECK (
  origem_usuario_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'operador')
  )
);

-- 4. Política de EXCLUSÃO:
-- Admins/Operadores podem excluir tudo.
-- Líderes podem excluir apenas o que cadastraram.
CREATE POLICY "eleitores_delete_policy" 
ON public.eleitores 
FOR DELETE 
TO authenticated 
USING (
  origem_usuario_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() 
    AND tipo IN ('admin', 'operador')
  )
);
