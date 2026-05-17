
CREATE TABLE IF NOT EXISTS public.locais_votacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uf text NOT NULL,
  municipio text NOT NULL,
  zona integer NOT NULL,
  secao integer NOT NULL,
  local_numero integer,
  local_nome text,
  endereco text,
  bairro text,
  cep text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locais_cep ON public.locais_votacao(cep);
CREATE INDEX IF NOT EXISTS idx_locais_bairro_mun ON public.locais_votacao(bairro, municipio);

ALTER TABLE public.locais_votacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locais votação leitura autenticados"
ON public.locais_votacao FOR SELECT
TO authenticated USING (true);

ALTER TABLE public.eleitores
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf text,
  ADD COLUMN IF NOT EXISTS zona_votacao integer,
  ADD COLUMN IF NOT EXISTS secao_votacao integer,
  ADD COLUMN IF NOT EXISTS local_votacao_nome text;
