-- Removemos a política restritiva anterior
DROP POLICY IF EXISTS "Permitir inserção vinculada ao usuário" ON public.eleitores;

-- Criamos uma política de inserção aberta para todos os usuários autenticados
CREATE POLICY "Qualquer autenticado pode inserir eleitores" 
ON public.eleitores 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Garantir que o campo status tenha um valor padrão (usando o tipo correto eleitor_status)
ALTER TABLE public.eleitores ALTER COLUMN status SET DEFAULT 'indeciso'::eleitor_status;
