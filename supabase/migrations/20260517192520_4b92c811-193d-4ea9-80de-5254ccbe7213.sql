-- 1. Garantir que perfis existam para usuários atuais
INSERT INTO public.perfis (id, nome, tipo)
SELECT id, email, 'líder'::public.app_role FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, tipo)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'líder');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabela de Lideranças
CREATE TABLE IF NOT EXISTS public.liderancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  data_nascimento DATE,
  cpf TEXT,
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  zona_votacao INTEGER,
  secao_votacao INTEGER,
  local_votacao_nome TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de Prioridades
CREATE TABLE IF NOT EXISTS public.prioridades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'pendente',
  lider_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Adicionar geolocalização aos eleitores
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.eleitores ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 6. Habilitar RLS
ALTER TABLE public.liderancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prioridades ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acesso (RLS)
-- Lideranças
CREATE POLICY "Lideranças visíveis por todos os autenticados" ON public.liderancas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin pode tudo em liderancas" ON public.liderancas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Prioridades
CREATE POLICY "Líder vê suas próprias prioridades" ON public.prioridades
  FOR SELECT USING (lider_id = auth.uid());

CREATE POLICY "Admin vê todas as prioridades" ON public.prioridades
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Líder cria suas prioridades" ON public.prioridades
  FOR INSERT WITH CHECK (lider_id = auth.uid());

-- Eleitores (Ajuste)
DROP POLICY IF EXISTS "Usuários veem apenas seus eleitores" ON public.eleitores;
CREATE POLICY "Líder vê apenas seus eleitores" ON public.eleitores
  FOR SELECT USING (
    origem_usuario_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Líder insere seus eleitores" ON public.eleitores
  FOR INSERT WITH CHECK (
    origem_usuario_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'operador'::public.app_role)
  );
