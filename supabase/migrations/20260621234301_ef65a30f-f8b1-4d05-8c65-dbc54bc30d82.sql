
-- comprovantes-eleitorais: restrict to admin/operador only (page is admin-facing)
DROP POLICY IF EXISTS "Authenticated users can upload proof" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view proof" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete proof" ON storage.objects;

CREATE POLICY "Admin/operador upload proof"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'comprovantes-eleitorais'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'))
  );

CREATE POLICY "Admin/operador view proof"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'comprovantes-eleitorais'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'))
  );

CREATE POLICY "Admin/operador update proof"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'comprovantes-eleitorais'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'))
  )
  WITH CHECK (
    bucket_id = 'comprovantes-eleitorais'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'))
  );

CREATE POLICY "Admin delete proof"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'comprovantes-eleitorais'
    AND public.has_role(auth.uid(), 'admin')
  );

-- fotos-reunioes: add missing UPDATE policy scoped to owner folder + admin
CREATE POLICY "Líder atualiza fotos próprias"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fotos-reunioes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'fotos-reunioes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
