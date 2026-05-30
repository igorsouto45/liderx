-- Atualizar função de totais de eleitores do sistema com filtros
CREATE OR REPLACE FUNCTION public.mapa_rj_totais_eleitores_sistema(
  p_bairro text DEFAULT NULL,
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL
)
RETURNS TABLE(municipio text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH eleitores_processados AS (
    SELECT 
      UPPER(cidade) as municipio_up,
      bairro,
      CASE 
        WHEN situacao_eleitoral ILIKE '%FEMININO%' OR situacao_eleitoral ILIKE '%FEM%' THEN 'FEMININO'
        WHEN situacao_eleitoral ILIKE '%MASCULINO%' OR situacao_eleitoral ILIKE '%MASC%' THEN 'MASCULINO'
        ELSE 'NÃO INFORMADO'
      END as genero_calc,
      CASE 
        WHEN data_nascimento IS NULL THEN 'Inválida'
        ELSE 
          CASE 
            WHEN date_part('year', age(data_nascimento)) < 16 THEN 'Inválida'
            WHEN date_part('year', age(data_nascimento)) = 16 THEN '16 anos'
            WHEN date_part('year', age(data_nascimento)) = 17 THEN '17 anos'
            WHEN date_part('year', age(data_nascimento)) = 18 THEN '18 anos'
            WHEN date_part('year', age(data_nascimento)) = 19 THEN '19 anos'
            WHEN date_part('year', age(data_nascimento)) = 20 THEN '20 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 21 AND 24 THEN '21 a 24 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 25 AND 29 THEN '25 a 29 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 30 AND 34 THEN '30 a 34 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 35 AND 39 THEN '35 a 39 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 40 AND 44 THEN '40 a 44 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 45 AND 49 THEN '45 a 49 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 50 AND 54 THEN '50 a 54 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 55 AND 59 THEN '55 a 59 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 60 AND 64 THEN '60 a 64 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 65 AND 69 THEN '65 a 69 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 70 AND 74 THEN '70 a 74 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 75 AND 79 THEN '75 a 79 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 80 AND 84 THEN '80 a 84 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 85 AND 89 THEN '85 a 89 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 90 AND 94 THEN '90 a 94 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 95 AND 99 THEN '95 a 99 anos'
            ELSE '100 anos ou mais'
          END
      END as faixa_calc
    FROM public.eleitores
    WHERE cidade IS NOT NULL
  )
  SELECT 
    municipio_up as municipio, 
    count(*)::bigint as total
  FROM eleitores_processados
  WHERE (p_bairro IS NULL OR bairro ILIKE '%' || p_bairro || '%')
    AND (p_generos IS NULL OR genero_calc = ANY(p_generos))
    AND (p_faixas IS NULL OR faixa_calc = ANY(p_faixas))
  GROUP BY municipio_up
  ORDER BY total DESC;
END;
$$;

-- Atualizar função de detalhes de eleitores do sistema com filtros
CREATE OR REPLACE FUNCTION public.mapa_rj_detalhe_eleitores_sistema(
  p_municipio text,
  p_bairro text DEFAULT NULL,
  p_generos text[] DEFAULT NULL,
  p_faixas text[] DEFAULT NULL
)
RETURNS TABLE(bairro text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH eleitores_processados AS (
    SELECT 
      COALESCE(e.bairro, 'NÃO INFORMADO') as bairro_final,
      UPPER(cidade) as municipio_up,
      CASE 
        WHEN situacao_eleitoral ILIKE '%FEMININO%' OR situacao_eleitoral ILIKE '%FEM%' THEN 'FEMININO'
        WHEN situacao_eleitoral ILIKE '%MASCULINO%' OR situacao_eleitoral ILIKE '%MASC%' THEN 'MASCULINO'
        ELSE 'NÃO INFORMADO'
      END as genero_calc,
      CASE 
        WHEN data_nascimento IS NULL THEN 'Inválida'
        ELSE 
          CASE 
            WHEN date_part('year', age(data_nascimento)) < 16 THEN 'Inválida'
            WHEN date_part('year', age(data_nascimento)) = 16 THEN '16 anos'
            WHEN date_part('year', age(data_nascimento)) = 17 THEN '17 anos'
            WHEN date_part('year', age(data_nascimento)) = 18 THEN '18 anos'
            WHEN date_part('year', age(data_nascimento)) = 19 THEN '19 anos'
            WHEN date_part('year', age(data_nascimento)) = 20 THEN '20 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 21 AND 24 THEN '21 a 24 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 25 AND 29 THEN '25 a 29 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 30 AND 34 THEN '30 a 34 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 35 AND 39 THEN '35 a 39 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 40 AND 44 THEN '40 a 44 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 45 AND 49 THEN '45 a 49 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 50 AND 54 THEN '50 a 54 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 55 AND 59 THEN '55 a 59 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 60 AND 64 THEN '60 a 64 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 65 AND 69 THEN '65 a 69 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 70 AND 74 THEN '70 a 74 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 75 AND 79 THEN '75 a 79 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 80 AND 84 THEN '80 a 84 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 85 AND 89 THEN '85 a 89 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 90 AND 94 THEN '90 a 94 anos'
            WHEN date_part('year', age(data_nascimento)) BETWEEN 95 AND 99 THEN '95 a 99 anos'
            ELSE '100 anos ou mais'
          END
      END as faixa_calc
    FROM public.eleitores e
  )
  SELECT 
    bairro_final as bairro, 
    count(*)::bigint as total
  FROM eleitores_processados
  WHERE municipio_up = UPPER(p_municipio)
    AND (p_bairro IS NULL OR bairro_final ILIKE '%' || p_bairro || '%')
    AND (p_generos IS NULL OR genero_calc = ANY(p_generos))
    AND (p_faixas IS NULL OR faixa_calc = ANY(p_faixas))
  GROUP BY bairro_final
  ORDER BY total DESC;
END;
$$;

-- Regrant permissions
GRANT EXECUTE ON FUNCTION public.mapa_rj_totais_eleitores_sistema(text, text[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mapa_rj_detalhe_eleitores_sistema(text, text, text[], text[]) TO authenticated;
