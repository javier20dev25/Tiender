-- Convert the existing 'status' column in the 'subscriptions' table from TEXT to a typed ENUM.
-- This enforces data integrity by ensuring the 'status' can only hold predefined values.

-- Step 1: Create the new ENUM type that will serve as our state machine.
-- We are including all previously text-based states and adding 'unpaid' for more granularity.
CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'canceled'
);

-- Step 2: Alter the 'subscriptions' table to use the new ENUM type.
-- The USING clause handles the conversion from text to the new enum type.
-- This will fail if any existing text values are not in the ENUM, but based on
-- 'init.sql', all potential values are included.
ALTER TABLE public.subscriptions
  ALTER COLUMN status TYPE public.subscription_status
  USING (status::text::public.subscription_status);
