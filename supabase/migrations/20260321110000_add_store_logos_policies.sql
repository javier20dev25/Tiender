-- Migration: Add RLS Policies for Store Logos
-- This migration secures the 'store-logos' bucket and ensures users can only manage their own logos.

-- 1. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS should already be enabled on storage.objects from Migration 012.
-- If not, it will be handled by the system or a superuser.

-- 3. Policy for PUBLIC READ access
CREATE POLICY "Allow public read access to store logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-logos' );

-- 4. Policy for AUTHENTICATED users to INSERT
CREATE POLICY "Allow authenticated users to upload their own store logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.stores
    WHERE user_id = auth.uid()
  )
);

-- 5. Policy for AUTHENTICATED users to UPDATE
CREATE POLICY "Allow authenticated users to update their own store logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.stores
    WHERE user_id = auth.uid()
  )
);

-- 6. Policy for AUTHENTICATED users to DELETE
CREATE POLICY "Allow authenticated users to delete their own store logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-logos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.stores
    WHERE user_id = auth.uid()
  )
);
