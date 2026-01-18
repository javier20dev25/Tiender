-- Create a new public bucket for storing shareable images if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('share-images', 'share-images', true)
ON CONFLICT (id) DO UPDATE SET public = true; -- Ensure it's public if it exists

-- Define policies for the 'share-images' bucket.
-- These policies are simplified; in a production environment with more granular access,
-- you might link them to user roles or specific function roles.

-- 1. Allow public read access to all files in the bucket.
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'share-images');

-- 2. Allow service_role (used by edge functions) to perform all actions.
-- This is a broad permission but secure as it's limited to backend functions.
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;
CREATE POLICY "Service Role Full Access"
ON storage.objects FOR ALL
USING (bucket_id = 'share-images' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'share-images' AND auth.role() = 'service_role');
