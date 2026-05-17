-- Create the admin user directly in auth.users
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Only create if user doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'igor.souto@agencialapiscriativo.com.br') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'igor.souto@agencialapiscriativo.com.br',
      crypt('Ju45098601#', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, 'igor.souto@agencialapiscriativo.com.br')::jsonb,
      'email',
      new_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;
END $$;
