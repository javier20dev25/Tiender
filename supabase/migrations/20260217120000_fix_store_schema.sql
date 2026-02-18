-- supabase/migrations/20260217120000_fix_store_schema.sql

-- Add 'slug' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'slug') THEN
        ALTER TABLE public.stores ADD COLUMN slug TEXT;
        -- Create a unique index on slug
        CREATE UNIQUE INDEX idx_stores_slug ON public.stores(slug);
    END IF;
END $$;

-- Add 'community_link' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'community_link') THEN
        ALTER TABLE public.stores ADD COLUMN community_link TEXT;
    END IF;
END $$;

-- Add 'plan_type' column if it doesn't exist (it might be named 'plan' in the init script, we need to unify)
-- The init script used 'plan' (trial | basic | pro). The code uses 'plan_type' (standard | full).
-- We should standardize on 'plan_type'.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'plan_type') THEN
        ALTER TABLE public.stores ADD COLUMN plan_type TEXT DEFAULT 'trial';
    END IF;
END $$;

-- Backfill slugs for existing stores
UPDATE public.stores
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(id::text from 1 for 4)
WHERE slug IS NULL;

-- Ensure slug is not null after backfill (optional, but good practice if we want to enforce NOT NULL later)
-- ALTER TABLE public.stores ALTER COLUMN slug SET NOT NULL;
