-- Migration to create the necessary tables for the Anti-Fraud / Visit Gate system.

-- Step 1: Define an ENUM for the status of each visit.
-- This allows us to classify traffic effectively.
CREATE TYPE public.visit_status AS ENUM (
  'pending_verification', -- The initial state of a visit request.
  'verified',             -- The visit has passed the gate and received a token.
  'bot_suspected',        -- The visit failed checks and was flagged as suspicious.
  'token_used'            -- The frontend has used the token to request main content.
);

-- Step 2: Create the 'visits' table.
-- This table will log every visit attempt and its associated trust score.
CREATE TABLE IF NOT EXISTS public.visits (
  id bigserial PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- We store a hash of the IP, not the raw IP, for privacy.
  ip_hash text NOT NULL,
  
  -- The short-lived JWT issued by the visit-gate.
  visit_token text,
  
  -- Browser and request metadata for scoring.
  user_agent text,
  referer text,
  
  -- The core of our anti-fraud system.
  trust_score integer NOT NULL DEFAULT 0,
  status public.visit_status NOT NULL DEFAULT 'pending_verification',
  
  -- Timestamps for tracking and token expiration.
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Step 3: Add indexes for efficient querying.
-- We will frequently query by store_id and ip_hash.
CREATE INDEX IF NOT EXISTS idx_visits_store_id ON public.visits(store_id);
CREATE INDEX IF NOT EXISTS idx_visits_ip_hash ON public.visits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON public.visits(created_at);

-- Step 4: Enable Row Level Security on the new table.
-- By default, no one can access it. Access will be granted via service roles in Edge Functions.
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Note: We are not creating policies here because this table should ONLY be accessible
-- by the backend through the 'service_role' key, never by an authenticated user directly from the client.
