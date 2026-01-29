-- Migration 014: Add user_id to subscriptions
-- This migration adds a user_id column to the subscriptions table to
-- make it easier to link subscriptions to users directly, without having to
-- go through the stores table.

alter table public.subscriptions
add column user_id uuid references public.users(id) on delete cascade;

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
