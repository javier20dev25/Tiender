-- 20260224120000_account_lifecycle.sql
-- Adds soft-delete support to stores and an account_deletion_requests table
-- for the 30-day grace period before hard deletion.

-- 1. Add deleted_at to stores (soft-delete marker)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create account_deletion_requests table
--    When a user cancels, we record a deletion scheduled 30 days out.
--    The cleanup-abandoned-accounts Edge Function (or a cron) handles the hard delete.
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE, -- one request per user
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  reason        TEXT,             -- 'trial_expired' | 'user_cancelled' | 'admin'
  processed     BOOLEAN NOT NULL DEFAULT FALSE
);

-- Only service_role / admin can read & write this table
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only_deletion_requests"
  ON public.account_deletion_requests
  USING (false);          -- deny all; service_role bypasses RLS

-- 3. Index for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_deletion_requests_scheduled
  ON public.account_deletion_requests (scheduled_for)
  WHERE processed = FALSE;
