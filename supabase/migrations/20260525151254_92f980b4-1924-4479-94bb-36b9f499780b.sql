CREATE TABLE IF NOT EXISTS public.eleitorado_rj_agregado (
  id bigserial PRIMARY KEY,
  municipio text NOT NULL,
  zona integer NOT NULL,
  secao integer NOT NULL,
  genero text NOT NULL,
  faixa_etaria text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_eleitorado_rj_municipio ON public.eleitorado_rj_agregado (municipio);
CREATE INDEX IF NOT EXISTS idx_eleitorado_rj_genero ON public.eleitorado_rj_agregado (genero);
CREATE INDEX IF NOT EXISTS idx_eleitorado_rj_faixa ON public.eleitorado_rj_agregado (faixa_etaria);
CREATE INDEX IF NOT EXISTS idx_eleitorado_rj_zona_secao ON public.eleitorado_rj_agregado (municipio, zona, secao);

ALTER TABLE public.eleitorado_rj_agregado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read eleitorado RJ" ON public.eleitorado_rj_agregado;
CREATE POLICY "Authenticated can read eleitorado RJ"
ON public.eleitorado_rj_agregado FOR SELECT
TO authenticated
USING (true);