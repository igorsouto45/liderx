-- Cleanup redundant eleitores policies
DROP POLICY IF EXISTS "Admins veem tudo, donos veem o seu" ON public.eleitores;
DROP POLICY IF EXISTS "Admins ou donos podem atualizar" ON public.eleitores;
DROP POLICY IF EXISTS "Admins podem deletar tudo, donos deletam o seu" ON public.eleitores;
DROP POLICY IF EXISTS "Qualquer pessoa pode se cadastrar" ON public.eleitores;
DROP POLICY IF EXISTS "Users can insert their own voters" ON public.eleitores;
DROP POLICY IF EXISTS "Users can update voters they registered or all if admin/operato" ON public.eleitores;
DROP POLICY IF EXISTS "Users see voters they registered or all if admin/operator" ON public.eleitores;

-- Re-create clean eleitores policies
CREATE POLICY "eleitores_select" ON public.eleitores
    FOR SELECT
    USING (
        auth.uid() = origem_usuario_id OR 
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
        )
    );

CREATE POLICY "eleitores_insert_public" ON public.eleitores
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "eleitores_update" ON public.eleitores
    FOR UPDATE
    USING (
        auth.uid() = origem_usuario_id OR 
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
        )
    )
    WITH CHECK (
        auth.uid() = origem_usuario_id OR 
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
        )
    );

CREATE POLICY "eleitores_delete" ON public.eleitores
    FOR DELETE
    USING (
        auth.uid() = origem_usuario_id OR 
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
        )
    );

-- Cleanup redundant mensagens policies
DROP POLICY IF EXISTS "Admins podem ver todas as mensagens" ON public.mensagens;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias mensagens (enviadas ou receb" ON public.mensagens;
DROP POLICY IF EXISTS "Usuários podem enviar mensagens" ON public.mensagens;
DROP POLICY IF EXISTS "Users can read their own messages, broadcast messages, or messa" ON public.mensagens;

-- Re-create clean mensagens policies
CREATE POLICY "mensagens_select" ON public.mensagens
    FOR SELECT
    USING (
        remetente_id = auth.uid() OR 
        destinatario_id = auth.uid() OR 
        destinatario_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.perfis 
            WHERE id = auth.uid() AND tipo IN ('admin', 'operador')
        )
    );

CREATE POLICY "mensagens_insert" ON public.mensagens
    FOR INSERT
    WITH CHECK (remetente_id = auth.uid());
