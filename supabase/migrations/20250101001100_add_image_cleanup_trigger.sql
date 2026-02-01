-- This migration creates a trigger to automatically delete a store's share image
-- from Supabase Storage when the store is deleted from the public.stores table.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_store_delete_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Important: The function needs elevated privileges to delete from storage
AS $$
BEGIN
  -- OLD variable contains the data of the row being deleted
  -- Remove the corresponding image from the 'share-images' bucket
  PERFORM storage.delete_object('share-images', OLD.id || '.png');
  
  RETURN OLD;
END;
$$;

-- 2. Create the trigger that calls the function
DROP TRIGGER IF EXISTS on_store_deleted_cleanup ON public.stores;
CREATE TRIGGER on_store_deleted_cleanup
AFTER DELETE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_store_delete_cleanup();
