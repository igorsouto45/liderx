-- Create metas_votos table
CREATE TABLE public.metas_votos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('geral', 'bairro', 'municipio')),
    nome TEXT,
    meta INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.metas_votos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own goals" 
ON public.metas_votos 
FOR SELECT 
USING (auth.uid() = lider_id);

CREATE POLICY "Users can create their own goals" 
ON public.metas_votos 
FOR INSERT 
WITH CHECK (auth.uid() = lider_id);

CREATE POLICY "Users can update their own goals" 
ON public.metas_votos 
FOR UPDATE 
USING (auth.uid() = lider_id);

CREATE POLICY "Users can delete their own goals" 
ON public.metas_votos 
FOR DELETE 
USING (auth.uid() = lider_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_metas_votos_updated_at
BEFORE UPDATE ON public.metas_votos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add index for better performance
CREATE INDEX idx_metas_votos_lider_id ON public.metas_votos(lider_id);
