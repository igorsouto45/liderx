GRANT SELECT ON public.eleitorado_rj_agregado TO authenticated;
GRANT ALL ON public.eleitorado_rj_agregado TO service_role;

GRANT SELECT ON public.locais_votacao TO authenticated;
GRANT ALL ON public.locais_votacao TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.eleitores TO authenticated;
GRANT ALL ON public.eleitores TO service_role;