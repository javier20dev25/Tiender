-- Migration to support AI report limits, extra product capacity, themes, and product update limits.

-- Table: stores
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS ai_reports_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_product_capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS theme_color TEXT;

-- Table: products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updates_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_update_date DATE DEFAULT CURRENT_DATE;

-- Table: subscriptions_addons (New)
CREATE TABLE IF NOT EXISTS public.subscriptions_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL, -- e.g., '+5_products', '+10_products'
  quantity INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Policies for subscriptions_addons
ALTER TABLE public.subscriptions_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store addons"
ON public.subscriptions_addons FOR SELECT
USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- We intentionally don't add insert/update policies here because those should be handled 
-- securely via backend Edge Functions (like the PayPal webhook).

-- Function to reset product update limits safely (can be called via cron or manually on update)
CREATE OR REPLACE FUNCTION public.check_and_reset_product_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If the last_update_date is not today, reset the count and update the date
  IF NEW.last_update_date < CURRENT_DATE THEN
    NEW.updates_count = 0;
    NEW.last_update_date = CURRENT_DATE;
  END IF;
  
  -- Prevent update if limit reached (example limit: 5)
  IF NEW.updates_count >= 5 THEN
    RAISE EXCEPTION 'Límite de actualizaciones diarias alcanzado (5/5). Vuelve a intentarlo mañana.';
  END IF;

  -- Increment update count
  NEW.updates_count = NEW.updates_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We don't attach the trigger yet since we need to make sure frontend updates pass through without crashing if they don't handle the exception well.
-- Instead, we will handle this via RPC or frontend logic, but the columns are there.
