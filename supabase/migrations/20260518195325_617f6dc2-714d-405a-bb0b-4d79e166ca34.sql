-- Allow anyone to insert into liderancas (needed if lead registration happens before auth)
-- Note: The app currently uses auth.signUp then insert, but if the user is already logged in as admin,
-- they should be able to insert.
CREATE POLICY "Permitir inserção pública em liderancas" 
ON public.liderancas 
FOR INSERT 
WITH CHECK (true);

-- Ensure admins can do everything (update/delete)
-- The existing policy might be failing if has_role is not defined or working as expected
CREATE POLICY "Admins can do everything on liderancas"
ON public.liderancas
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));
