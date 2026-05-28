ALTER TABLE public.historico_situacao_eleitoral 
DROP CONSTRAINT IF EXISTS historico_situacao_eleitoral_usuario_id_fkey,
ADD CONSTRAINT historico_situacao_eleitoral_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES public.perfis(id);
