ALTER TABLE public.eleitores 
ADD COLUMN situacao_eleitoral TEXT DEFAULT 'Não informado',
ADD COLUMN data_consulta_eleitoral TIMESTAMP WITH TIME ZONE,
ADD COLUMN comprovante_situacao_eleitoral TEXT,
ADD COLUMN observacao_situacao_eleitoral TEXT,
ADD COLUMN situacao_eleitoral_validada BOOLEAN DEFAULT FALSE,
ADD COLUMN data_validacao_eleitoral TIMESTAMP WITH TIME ZONE,
ADD COLUMN usuario_validacao_eleitoral UUID REFERENCES public.perfis(id),
ADD COLUMN titulo_eleitor TEXT;

-- Create history table for eleitores if it doesn't exist
CREATE TABLE IF NOT EXISTS public.historico_situacao_eleitoral_eleitores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleitor_id UUID NOT NULL REFERENCES public.eleitores(id) ON DELETE CASCADE,
    situacao_anterior TEXT,
    situacao_nova TEXT,
    usuario_id UUID REFERENCES public.perfis(id),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_situacao_eleitoral_eleitores TO authenticated;
GRANT ALL ON public.historico_situacao_eleitoral_eleitores TO service_role;

-- Enable RLS
ALTER TABLE public.historico_situacao_eleitoral_eleitores ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view history of electoral status" 
ON public.historico_situacao_eleitoral_eleitores FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert history of electoral status" 
ON public.historico_situacao_eleitoral_eleitores FOR INSERT 
TO authenticated 
WITH CHECK (true);
