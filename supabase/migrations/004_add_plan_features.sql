-- Migration 004: Add fields for Plan Features (Standard vs. Full)
-- This migration adds the necessary columns to support the features outlined in the Full plan.

-- 1. STORES TABLE
-- For clarity and future consistency, rename the 'plan' column to 'plan_type'.
-- We will use this column to differentiate between 'standard' and 'full' plans.
ALTER TABLE public.stores RENAME COLUMN plan TO plan_type;

-- Update the default value to reflect the new primary plan type.
-- Existing 'trial' values will be handled by the application logic, 
-- but new stores will default to 'standard'.
ALTER TABLE public.stores ALTER COLUMN plan_type SET DEFAULT 'standard';


-- 2. PRODUCTS TABLE
-- Add columns to support Full plan features.

-- Add a field for the optional YouTube video URL.
ALTER TABLE public.products ADD COLUMN youtube_url TEXT;
COMMENT ON COLUMN public.products.youtube_url IS 'URL for an optional product video (Full plan feature).';

-- Add a field for the optional link to an external store (e.g., Shopify).
ALTER TABLE public.products ADD COLUMN external_store_url TEXT;
COMMENT ON COLUMN public.products.external_store_url IS 'URL to the product page on an external e-commerce site (Full plan feature).';

-- Add a counter for "skip" actions on the Tinder-like interface.
ALTER TABLE public.products ADD COLUMN skips_count INT DEFAULT 0 NOT NULL;
COMMENT ON COLUMN public.products.skips_count IS 'Counter for how many times a product was skipped (Full plan feature).';
