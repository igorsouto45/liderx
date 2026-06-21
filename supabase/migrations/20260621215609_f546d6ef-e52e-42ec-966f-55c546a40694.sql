
-- ============ CANDIDATO (singleton) ============
CREATE TABLE public.candidato (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nome_completo TEXT,
  nome_urna TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  nacionalidade TEXT DEFAULT 'Brasileiro(a)',
  estado_civil TEXT,
  profissao TEXT,
  cargo_pretendido TEXT,
  partido_sigla TEXT,
  coligacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT candidato_singleton CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidato TO authenticated;
GRANT ALL ON public.candidato TO service_role;

ALTER TABLE public.candidato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam candidato"
  ON public.candidato FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Autenticados leem candidato"
  ON public.candidato FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER trg_candidato_updated_at
  BEFORE UPDATE ON public.candidato
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.candidato (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============ REUNIÕES ============
CREATE TABLE public.reunioes_lideranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lideranca_user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  local_nome TEXT,
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'agendada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reunioes_lideranca TO authenticated;
GRANT ALL ON public.reunioes_lideranca TO service_role;

ALTER TABLE public.reunioes_lideranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Líder gerencia próprias reuniões"
  ON public.reunioes_lideranca FOR ALL
  USING (lideranca_user_id = auth.uid())
  WITH CHECK (lideranca_user_id = auth.uid());

CREATE POLICY "Admin/Operador veem todas reuniões"
  ON public.reunioes_lideranca FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE TRIGGER trg_reunioes_updated_at
  BEFORE UPDATE ON public.reunioes_lideranca
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reunioes_lider ON public.reunioes_lideranca(lideranca_user_id, data_hora DESC);

-- ============ FOTOS DE REUNIÃO ============
CREATE TABLE public.fotos_reuniao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id UUID REFERENCES public.reunioes_lideranca(id) ON DELETE SET NULL,
  lideranca_user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capturada_em TIMESTAMPTZ NOT NULL,
  enviada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacao TEXT
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fotos_reuniao TO authenticated;
GRANT ALL ON public.fotos_reuniao TO service_role;

ALTER TABLE public.fotos_reuniao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Líder gerencia próprias fotos"
  ON public.fotos_reuniao FOR ALL
  USING (lideranca_user_id = auth.uid())
  WITH CHECK (lideranca_user_id = auth.uid());

CREATE POLICY "Admin/Operador veem todas fotos"
  ON public.fotos_reuniao FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE INDEX idx_fotos_lider ON public.fotos_reuniao(lideranca_user_id, capturada_em DESC);

-- ============ RECIBOS ============
CREATE SEQUENCE IF NOT EXISTS public.recibos_numero_seq;

CREATE TABLE public.recibos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT nextval('public.recibos_numero_seq') UNIQUE,
  pagador_nome TEXT NOT NULL,
  pagador_cpf TEXT,
  valor NUMERIC(12,2) NOT NULL,
  descricao TEXT,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  lideranca_user_id UUID,
  pdf_path TEXT,
  emitido_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recibos TO authenticated;
GRANT ALL ON public.recibos TO service_role;

ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia recibos"
  ON public.recibos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Líder vê próprios recibos"
  ON public.recibos FOR SELECT
  USING (lideranca_user_id = auth.uid());

CREATE TRIGGER trg_recibos_updated_at
  BEFORE UPDATE ON public.recibos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE policies for fotos-reunioes (bucket criado em seguida) ============
-- Políticas serão adicionadas após a criação do bucket via tool.
