-- Se a coluna instancia_id não existir, adicione-a
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_mensagens' AND column_name = 'instancia_id') THEN
        ALTER TABLE public.whatsapp_mensagens ADD COLUMN instancia_id UUID REFERENCES public.whatsapp_instancias(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_mensagens' AND column_name = 'message_type') THEN
        ALTER TABLE public.whatsapp_mensagens ADD COLUMN message_type TEXT DEFAULT 'text';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_mensagens' AND column_name = 'external_id') THEN
        ALTER TABLE public.whatsapp_mensagens ADD COLUMN external_id TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all messages" ON public.whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can manage their own instance messages" ON public.whatsapp_mensagens;

-- New policies
CREATE POLICY "Admins can manage all whatsapp messages" 
ON public.whatsapp_mensagens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'admin'
  )
);

CREATE POLICY "Users can manage messages from their instances" 
ON public.whatsapp_mensagens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_instancias 
    WHERE id = instancia_id AND (owner_id = auth.uid() OR auth.uid() IS NOT NULL)
  )
);
