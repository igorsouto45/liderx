-- Tabela para metadados dos documentos
CREATE TABLE public.documentos_lideranca (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lider_id UUID NOT NULL REFERENCES public.liderancas(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    caminho_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT,
    tamanho_arquivo BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.documentos_lideranca ENABLE ROW LEVEL SECURITY;

-- Políticas para documentos
CREATE POLICY "Documentos visíveis por admins e operadores" 
ON public.documentos_lideranca 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
    )
);

CREATE POLICY "Documentos inseríveis por admins e operadores" 
ON public.documentos_lideranca 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
    )
);

CREATE POLICY "Documentos deletáveis por admins e operadores" 
ON public.documentos_lideranca 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
    )
);

-- Configuração do Storage (Bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-liderancas', 'documentos-liderancas', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Acesso aos documentos por admins e operadores"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documentos-liderancas' AND
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
    )
);

CREATE POLICY "Upload de documentos por admins e operadores"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documentos-liderancas' AND
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
    )
);

CREATE POLICY "Remoção de documentos por admins e operadores"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documentos-liderancas' AND
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
    )
);