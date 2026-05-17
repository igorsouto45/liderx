
-- Enums para controle de acesso e status
CREATE TYPE public.app_role AS ENUM ('admin', 'líder', 'operador');
CREATE TYPE public.eleitor_status AS ENUM ('apoiador', 'indeciso', 'rejeição');

-- Tabela de usuários (perfis)
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo public.app_role NOT NULL DEFAULT 'operador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de eleitores
CREATE TABLE public.eleitores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    bairro TEXT,
    status public.eleitor_status NOT NULL DEFAULT 'indeciso',
    origem_usuario_id UUID REFERENCES public.perfis(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de interações
CREATE TABLE public.interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleitor_id UUID REFERENCES public.eleitores(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    resposta TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Leitura pública para usuários autenticados" ON public.perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Leitura pública de eleitores" ON public.eleitores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Adição de eleitores" ON public.eleitores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Gestão de interações" ON public.interacoes FOR ALL TO authenticated USING (true);
