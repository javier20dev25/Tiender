-- Add index for user_id on stores table to speed up AuthContext lookups
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
