
-- Remover políticas permissivas
DROP POLICY "Adição de eleitores" ON public.eleitores;
DROP POLICY "Gestão de interações" ON public.interacoes;

-- Políticas mais restritas
CREATE POLICY "Usuários autenticados podem inserir eleitores" 
ON public.eleitores FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar interações" 
ON public.interacoes FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL);
