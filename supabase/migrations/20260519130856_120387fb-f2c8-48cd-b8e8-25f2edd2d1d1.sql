CREATE TABLE public.ia_mensagens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ia_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI messages"
ON public.ia_mensagens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI messages"
ON public.ia_mensagens FOR INSERT
WITH CHECK (auth.uid() = user_id);
