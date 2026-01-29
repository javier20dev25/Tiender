-- Migration 012: Add RLS Policies for Product Images
-- This migration secures the 'product-images' bucket by enabling Row Level Security
-- and defining policies for safe access.

-- 1. Enable RLS on the storage objects.
-- This is the master switch. Without this, no policies will be applied.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy for PUBLIC READ access.
-- We want anyone to be able to view the product images.
CREATE POLICY "Allow public read access to product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 3. Create a policy for AUTHENTICATED a.k.a LOGGED IN USER for INSERT access.
-- This is the most critical policy. It ensures that a logged-in user can only
-- upload files into a folder path that starts with their own store_id.
CREATE POLICY "Allow authenticated users to upload to their own store folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    -- This subquery gets the store ID(s) owned by the currently logged-in user.
    SELECT id::text
    FROM public.stores
    WHERE user_id = auth.uid()
  )
);

-- 4. Create a policy for UPDATING images.
-- Allows a user to update images only within their own store's folder.
CREATE POLICY "Allow authenticated users to update images in their own store folder"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.stores
    WHERE user_id = auth.uid()
  )
);


-- 5. Create a policy for DELETING images.
-- Allows a user to delete images only within their own store's folder.
CREATE POLICY "Allow authenticated users to delete images in their own store folder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text
    FROM public.stores
    WHERE user_id = auth.uid()
  )
);
