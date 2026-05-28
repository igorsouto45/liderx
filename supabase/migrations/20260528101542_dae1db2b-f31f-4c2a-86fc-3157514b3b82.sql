-- Add index for efficient joining
CREATE INDEX IF NOT EXISTS idx_locais_votacao_join ON public.locais_votacao (municipio, zona, secao);

-- Add GIN index for faster ILIKE search on bairro if needed, or just a regular index with upper()
-- Since we use ILIKE '%...%', a standard index won't be used unless we use pg_trgm.
-- But for 29k rows, ILIKE is usually fast enough. Let's add a trgm index just in case if extension is available.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_locais_votacao_bairro_trgm ON public.locais_votacao USING gin (bairro gin_trgm_ops);

-- Update totais RPC
CREATE OR REPLACE FUNCTION public.mapa_rj_totais_municipio(
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL,
  p_bairro text DEFAULT NULL
)
RETURNS TABLE(municipio text, total bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT e.municipio, SUM(e.quantidade)::bigint AS total
  FROM public.eleitorado_rj_agregado e
  LEFT JOIN public.locais_votacao l ON e.municipio = l.municipio AND e.zona = l.zona AND e.secao = l.secao
  WHERE (p_generos IS NULL OR e.genero = ANY(p_generos))
    AND (p_faixas IS NULL OR e.faixa_etaria = ANY(p_faixas))
    AND (p_bairro IS NULL OR l.bairro ILIKE '%' || p_bairro || '%')
  GROUP BY e.municipio
  ORDER BY total DESC;
END;
$$;

-- Update detalhe RPC
CREATE OR REPLACE FUNCTION public.mapa_rj_detalhe_municipio(
  p_municipio text,
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL,
  p_bairro text DEFAULT NULL
)
RETURNS TABLE(zona integer, secao integer, total bigint, bairro text, local_nome text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT e.zona, e.secao, SUM(e.quantidade)::bigint AS total, l.bairro, l.local_nome
  FROM public.eleitorado_rj_agregado e
  LEFT JOIN public.locais_votacao l ON e.municipio = l.municipio AND e.zona = l.zona AND e.secao = l.secao
  WHERE e.municipio = p_municipio
    AND (p_generos IS NULL OR e.genero = ANY(p_generos))
    AND (p_faixas IS NULL OR e.faixa_etaria = ANY(p_faixas))
    AND (p_bairro IS NULL OR l.bairro ILIKE '%' || p_bairro || '%')
  GROUP BY e.zona, e.secao, l.bairro, l.local_nome
  ORDER BY e.zona, e.secao;
END;
$$;
