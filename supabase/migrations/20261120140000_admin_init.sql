-- Migration: Admin user initialization and admin helper functions
-- Ensures pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (
    coalesce(auth.jwt() ->> 'email', '') = 'sleytherelax18@gmail.com'
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
    OR coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );
$$;

-- Create or update admin user in auth.users safely
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'sleytherelax18@gmail.com';

  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'sleytherelax18@gmail.com',
      crypt('SERPONGE777', gen_salt('bf', 10)),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"admin","is_admin":true}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('SERPONGE777', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = raw_user_meta_data || '{"role":"admin","is_admin":true}'::jsonb,
      updated_at = NOW()
    WHERE id = admin_user_id;
  END IF;
END $$;
