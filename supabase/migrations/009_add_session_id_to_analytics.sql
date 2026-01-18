-- supabase/migrations/009_add_session_id_to_analytics.sql

-- Add a session_id to track unique user sessions for analytics
ALTER TABLE public.product_analytics
ADD COLUMN session_id UUID;

-- Add an index for faster queries on session_id
CREATE INDEX ON public.product_analytics (session_id);

-- Also, let's fix the check constraint.
-- The original idea was that a 'VISIT' event is for the store, not a product.
-- However, we want to track product page views as part of a single "visit" session.
-- Let's relax this constraint to allow 'VISIT' events with a product_id,
-- which will be crucial for more detailed analytics.
ALTER TABLE public.product_analytics
DROP CONSTRAINT IF EXISTS visit_requires_no_product;
