-- Criar tabela de mensagens
CREATE TABLE public.mensagens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL significa broadcast para todos os líderes
    titulo TEXT,
    conteudo TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear leitura de mensagens de broadcast
CREATE TABLE public.mensagens_lidas (
    mensagem_id UUID REFERENCES public.mensagens(id) ON DELETE CASCADE,
    perfil_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
    lida_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (mensagem_id, perfil_id)
);

-- Habilitar RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_lidas ENABLE ROW LEVEL SECURITY;

-- Políticas para Mensagens
CREATE POLICY "Admins podem ver todas as mensagens"
ON public.mensagens
FOR ALL
USING (EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo = 'admin'));

CREATE POLICY "Usuários podem ver suas próprias mensagens (enviadas ou recebidas)"
ON public.mensagens
FOR SELECT
USING (
    auth.uid() = remetente_id OR 
    auth.uid() = destinatario_id OR 
    (destinatario_id IS NULL AND EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo = 'líder'))
);

CREATE POLICY "Usuários podem enviar mensagens"
ON public.mensagens
FOR INSERT
WITH CHECK (auth.uid() = remetente_id);

-- Políticas para Mensagens Lidas
CREATE POLICY "Usuários podem ver suas confirmações de leitura"
ON public.mensagens_lidas
FOR SELECT
USING (perfil_id = auth.uid() OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND tipo = 'admin'));

CREATE POLICY "Usuários podem marcar como lido"
ON public.mensagens_lidas
FOR INSERT
WITH CHECK (perfil_id = auth.uid());
