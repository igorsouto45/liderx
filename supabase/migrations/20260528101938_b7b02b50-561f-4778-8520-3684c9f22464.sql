-- Add electoral columns to liderancas
ALTER TABLE public.liderancas 
ADD COLUMN IF NOT EXISTS situacao_eleitoral TEXT DEFAULT 'Não informado',
ADD COLUMN IF NOT EXISTS data_consulta_eleitoral TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS comprovante_situacao_eleitoral TEXT,
ADD COLUMN IF NOT EXISTS observacao_situacao_eleitoral TEXT,
ADD COLUMN IF NOT EXISTS situacao_eleitoral_validada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_validacao_eleitoral TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS usuario_validacao_eleitoral UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS titulo_eleitor TEXT;

-- Create history table
CREATE TABLE public.historico_situacao_eleitoral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lider_id UUID NOT NULL REFERENCES public.liderancas(id) ON DELETE CASCADE,
    situacao_anterior TEXT,
    situacao_nova TEXT,
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    usuario_id UUID REFERENCES auth.users(id),
    observacao TEXT,
    comprovante TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT ON public.historico_situacao_eleitoral TO authenticated;
GRANT ALL ON public.historico_situacao_eleitoral TO service_role;

-- Enable RLS
ALTER TABLE public.historico_situacao_eleitoral ENABLE ROW LEVEL SECURITY;

-- Policies for historico_situacao_eleitoral
CREATE POLICY "Admins can view all electoral history" 
ON public.historico_situacao_eleitoral 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'admin'
  )
);

CREATE POLICY "Operators can view all electoral history" 
ON public.historico_situacao_eleitoral 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE id = auth.uid() AND tipo = 'operador'
  )
);

CREATE POLICY "Authenticated users can insert history" 
ON public.historico_situacao_eleitoral 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Storage bucket for proof files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes-eleitorais', 'comprovantes-eleitorais', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload proof" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'comprovantes-eleitorais' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view proof" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'comprovantes-eleitorais' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete proof" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'comprovantes-eleitorais' AND auth.role() = 'authenticated');
