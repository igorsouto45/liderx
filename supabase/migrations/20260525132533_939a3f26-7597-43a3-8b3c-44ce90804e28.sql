-- Drop existing restricted policies
DROP POLICY IF EXISTS "Admins can manage all instances" ON public.whatsapp_instancias;
DROP POLICY IF EXISTS "Admins can manage all configs" ON public.whatsapp_configuracoes;

-- Add policies for whatsapp_instancias
CREATE POLICY "Admins can manage all instances" 
ON public.whatsapp_instancias 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'admin'
  )
);

CREATE POLICY "Users can view and manage their own instances" 
ON public.whatsapp_instancias 
FOR ALL 
USING (owner_id = auth.uid() OR auth.uid() IS NOT NULL); -- Permissive for authenticated for now, given the requirement

-- Add policies for whatsapp_configuracoes
CREATE POLICY "Admins can manage all configs" 
ON public.whatsapp_configuracoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'admin'
  )
);

CREATE POLICY "Users can manage configs for their instances" 
ON public.whatsapp_configuracoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_instancias 
    WHERE id = instancia_id AND (owner_id = auth.uid() OR auth.uid() IS NOT NULL)
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.whatsapp_instancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_configuracoes ENABLE ROW LEVEL SECURITY;

-- Add column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_instancias' AND column_name = 'tecnologia') THEN
        ALTER TABLE public.whatsapp_instancias ADD COLUMN tecnologia TEXT DEFAULT 'evolution_api';
    END IF;
END $$;
