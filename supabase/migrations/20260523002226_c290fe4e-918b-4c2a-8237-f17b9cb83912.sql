CREATE OR REPLACE FUNCTION public.get_campaign_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_voters INT;
    total_leaders INT;
    voters_last_30_days INT;
    leaders_last_30_days INT;
    top_neighborhoods JSONB;
    top_leaders JSONB;
    registration_trend JSONB;
    total_neighborhoods INT;
BEGIN
    -- Basic counts
    SELECT count(*) INTO total_voters FROM public.eleitores;
    SELECT count(*) INTO total_leaders FROM public.liderancas;
    
    -- Recent growth (last 30 days)
    SELECT count(*) INTO voters_last_30_days FROM public.eleitores WHERE created_at > now() - interval '30 days';
    SELECT count(*) INTO leaders_last_30_days FROM public.liderancas WHERE created_at > now() - interval '30 days';

    -- Neighborhood stats
    SELECT count(DISTINCT bairro) INTO total_neighborhoods FROM public.eleitores WHERE bairro IS NOT NULL AND bairro != '';
    
    SELECT jsonb_agg(t) INTO top_neighborhoods
    FROM (
        SELECT bairro, count(*) as count, 
               round(count(*) * 100.0 / NULLIF(total_voters, 0), 2) as percentage
        FROM public.eleitores
        WHERE bairro IS NOT NULL AND bairro != ''
        GROUP BY bairro
        ORDER BY count DESC
        LIMIT 10
    ) t;

    -- Top leaders (recruiters)
    SELECT jsonb_agg(l) INTO top_leaders
    FROM (
        SELECT lid.nome, count(e.id) as voters_count
        FROM public.liderancas lid
        LEFT JOIN public.eleitores e ON e.origem_usuario_id = lid.auth_user_id
        GROUP BY lid.id, lid.nome
        HAVING count(e.id) > 0
        ORDER BY voters_count DESC
        LIMIT 5
    ) l;

    -- Registration trend (last 6 months)
    SELECT jsonb_agg(trend) INTO registration_trend
    FROM (
        SELECT to_char(created_at, 'YYYY-MM') as month, count(*) as count
        FROM public.eleitores
        WHERE created_at > now() - interval '6 months'
        GROUP BY month
        ORDER BY month ASC
    ) trend;

    RETURN jsonb_build_object(
        'total_voters', total_voters,
        'total_leaders', total_leaders,
        'growth', jsonb_build_object(
            'voters_30d', voters_last_30_days,
            'leaders_30d', leaders_last_30_days
        ),
        'neighborhood_stats', jsonb_build_object(
            'total_neighborhoods', total_neighborhoods,
            'top_list', top_neighborhoods
        ),
        'top_recruiters', top_leaders,
        'registration_trend', registration_trend,
        'last_updated', now()
    );
END;
$function$;