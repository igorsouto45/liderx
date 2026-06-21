
CREATE POLICY "Líder envia fotos próprias"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-reunioes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Líder lê fotos próprias"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'fotos-reunioes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'operador')
    )
  );

CREATE POLICY "Líder remove fotos próprias"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-reunioes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
