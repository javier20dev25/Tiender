-- Migration to add missing columns for new features
-- Apply this in the Supabase SQL Editor

-- 1. Check and add columns to 'products' table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS external_link text,
ADD COLUMN IF NOT EXISTS video_link text,
ADD COLUMN IF NOT EXISTS hashtags text[],
ADD COLUMN IF NOT EXISTS discount_timer_seconds integer,
ADD COLUMN IF NOT EXISTS discount_percentage integer,
ADD COLUMN IF NOT EXISTS wholesale_threshold integer,
ADD COLUMN IF NOT EXISTS wholesale_price numeric;

-- 2. Check and add columns to 'subscriptions' table
-- Note: Subscriptions might not exist if it's a fresh setup, creating it just in case
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    paypal_subscription_id text UNIQUE,
    status text,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- If it already exists, ensure the columns are there
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

-- 3. Update RLS (Row Level Security) if needed
-- Assuming authenticated users can read/write their own data
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add policies if missing (Optional, adjust to your exact needs)
-- CREATE POLICY "Users can manage their own subscriptions" ON subscriptions
--     FOR ALL USING (auth.uid() = user_id);
