-- Create whatsapp_config table
CREATE TABLE public.whatsapp_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_url TEXT,
    api_key TEXT,
    session_name TEXT DEFAULT 'default',
    anti_ban_delay_min INTEGER DEFAULT 5,
    anti_ban_delay_max INTEGER DEFAULT 15,
    auto_responder_enabled BOOLEAN DEFAULT false,
    ai_brain_enabled BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create whatsapp_mensagens table
CREATE TABLE public.whatsapp_mensagens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    remote_jid TEXT NOT NULL,
    contact_name TEXT,
    from_me BOOLEAN NOT NULL DEFAULT false,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Policies for whatsapp_config
CREATE POLICY "Users can manage their own whatsapp_config"
ON public.whatsapp_config
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for whatsapp_mensagens
CREATE POLICY "Users can view their own whatsapp_mensagens"
ON public.whatsapp_mensagens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp_mensagens"
ON public.whatsapp_mensagens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on whatsapp_config
CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON public.whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
