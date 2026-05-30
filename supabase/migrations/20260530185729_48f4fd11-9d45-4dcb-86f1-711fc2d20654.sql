-- Função para totais de eleitores do sistema por município
CREATE OR REPLACE FUNCTION public.mapa_rj_totais_eleitores_sistema(
  p_bairro text DEFAULT NULL
)
RETURNS TABLE(municipio text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    UPPER(cidade) as municipio, 
    count(*)::bigint as total
  FROM public.eleitores
  WHERE cidade IS NOT NULL
    AND (p_bairro IS NULL OR bairro ILIKE '%' || p_bairro || '%')
  GROUP BY UPPER(cidade)
  ORDER BY total DESC;
END;
$$;

-- Função para detalhes de eleitores do sistema por bairro
CREATE OR REPLACE FUNCTION public.mapa_rj_detalhe_eleitores_sistema(
  p_municipio text,
  p_bairro text DEFAULT NULL
)
RETURNS TABLE(bairro text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(e.bairro, 'NÃO INFORMADO') as bairro, 
    count(*)::bigint as total
  FROM public.eleitores e
  WHERE UPPER(e.cidade) = UPPER(p_municipio)
    AND (p_bairro IS NULL OR e.bairro ILIKE '%' || p_bairro || '%')
  GROUP BY COALESCE(e.bairro, 'NÃO INFORMADO')
  ORDER BY total DESC;
END;
$$;

-- Função para detalhar o eleitorado do TSE por bairro
CREATE OR REPLACE FUNCTION public.mapa_rj_bairros_municipio_tse(
  p_municipio text,
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL,
  p_bairro text DEFAULT NULL
)
RETURNS TABLE(bairro text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(l.bairro, 'NÃO INFORMADO') as bairro, 
    SUM(e.quantidade)::bigint AS total
  FROM public.eleitorado_rj_agregado e
  LEFT JOIN public.locais_votacao l ON e.municipio = l.municipio AND e.zona = l.zona AND e.secao = l.secao
  WHERE e.municipio = p_municipio
    AND (p_generos IS NULL OR e.genero = ANY(p_generos))
    AND (p_faixas IS NULL OR e.faixa_etaria = ANY(p_faixas))
    AND (p_bairro IS NULL OR l.bairro ILIKE '%' || p_bairro || '%')
  GROUP BY COALESCE(l.bairro, 'NÃO INFORMADO')
  ORDER BY total DESC;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.mapa_rj_totais_eleitores_sistema(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mapa_rj_detalhe_eleitores_sistema(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mapa_rj_bairros_municipio_tse(text, text[], text[], text) TO authenticated;
