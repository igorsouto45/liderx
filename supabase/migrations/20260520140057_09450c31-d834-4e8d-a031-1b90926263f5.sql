-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for all" ON public.mensagens;

-- Create more restricted policy for messages
CREATE POLICY "Users can read their own messages, broadcast messages, or messages they sent"
ON public.mensagens
FOR SELECT
USING (
  destinatario_id = auth.uid() OR 
  destinatario_id IS NULL OR 
  remetente_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
  )
);
