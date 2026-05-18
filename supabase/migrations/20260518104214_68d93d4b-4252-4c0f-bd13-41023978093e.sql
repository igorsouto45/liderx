-- Primeiro, removemos as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Admins e origem podem atualizar eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Admins e origem podem ver eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Admins podem deletar eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Líder insere seus eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Líder vê apenas seus eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir eleitores" ON public.eleitores;

-- Habilitar RLS (garantindo que esteja ativado)
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;

-- Política de INSERÇÃO: Qualquer usuário autenticado pode cadastrar um eleitor
-- O campo origem_usuario_id é preenchido pelo frontend ou via trigger/default
CREATE POLICY "Permitir inserção para usuários autenticados" 
ON public.eleitores 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política de SELEÇÃO: 
-- Admins veem tudo. 
-- Outros usuários (Líderes/Operadores) veem apenas o que eles mesmos cadastraram.
CREATE POLICY "Permitir visualização para admins ou dono" 
ON public.eleitores 
FOR SELECT 
TO authenticated 
USING (
  has_role(auth.uid(), 'admin') OR 
  origem_usuario_id = auth.uid()
);

-- Política de ATUALIZAÇÃO:
-- Admins podem atualizar qualquer um.
-- Usuários podem atualizar seus próprios cadastros.
CREATE POLICY "Permitir atualização para admins ou dono" 
ON public.eleitores 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'admin') OR 
  origem_usuario_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  origem_usuario_id = auth.uid()
);

-- Política de DELEÇÃO: Apenas admins podem deletar
CREATE POLICY "Permitir deleção apenas para admins" 
ON public.eleitores 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'));
