-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- WhatsApp Instances Table
CREATE TABLE public.whatsapp_instancias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  instancia_key TEXT,
  token TEXT,
  status TEXT DEFAULT 'disconnected',
  last_connected TIMESTAMP WITH TIME ZONE,
  qrcode_data TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_instancias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all instances" 
ON public.whatsapp_instancias 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'admin'
  )
);

-- WhatsApp Configurations Table (Anti-ban, Auto-responder)
CREATE TABLE public.whatsapp_configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instancia_id UUID REFERENCES public.whatsapp_instancias(id) ON DELETE CASCADE,
  anti_ban_delay_min INTEGER DEFAULT 5,
  anti_ban_delay_max INTEGER DEFAULT 15,
  anti_ban_batch_size INTEGER DEFAULT 50,
  auto_responder_enabled BOOLEAN DEFAULT false,
  auto_responder_brain TEXT, -- AI context/instructions
  auto_responder_limit_per_contact INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all configs" 
ON public.whatsapp_configuracoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'admin'
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_whatsapp_instancias_updated_at
BEFORE UPDATE ON public.whatsapp_instancias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_configuracoes_updated_at
BEFORE UPDATE ON public.whatsapp_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
