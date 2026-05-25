CREATE OR REPLACE FUNCTION public.mapa_rj_totais_municipio(
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL
)
RETURNS TABLE (municipio text, total bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT municipio, SUM(quantidade)::bigint AS total
  FROM public.eleitorado_rj_agregado
  WHERE (p_generos IS NULL OR genero = ANY(p_generos))
    AND (p_faixas IS NULL OR faixa_etaria = ANY(p_faixas))
  GROUP BY municipio
  ORDER BY total DESC;
$$;

CREATE OR REPLACE FUNCTION public.mapa_rj_detalhe_municipio(
  p_municipio text,
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL
)
RETURNS TABLE (zona integer, secao integer, total bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT zona, secao, SUM(quantidade)::bigint AS total
  FROM public.eleitorado_rj_agregado
  WHERE municipio = p_municipio
    AND (p_generos IS NULL OR genero = ANY(p_generos))
    AND (p_faixas IS NULL OR faixa_etaria = ANY(p_faixas))
  GROUP BY zona, secao
  ORDER BY zona, secao;
$$;

GRANT EXECUTE ON FUNCTION public.mapa_rj_totais_municipio(text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mapa_rj_detalhe_municipio(text, text[], text[]) TO authenticated;