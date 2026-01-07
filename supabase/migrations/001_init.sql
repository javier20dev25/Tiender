-- 001_init.sql
-- Tablas principales para Tiender (MVP onboarding sellers + products + metrics + subscriptions)

-- 1) stores
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- vinculado a auth.users
  name text not null,
  whatsapp_number text not null,
  logo_url text,
  plan text default 'trial', -- trial | basic | pro
  plan_expires_at timestamptz,
  status text default 'active', -- active | paused | cancelled
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  price numeric(10,2) default 0.00,
  currency text default 'USD',
  image_url text,
  likes_count int default 0,
  dislikes_count int default 0,
  added_to_cart_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) metrics (event logging)
create table if not exists public.metrics (
  id bigserial primary key,
  store_id uuid,
  product_id uuid,
  event_type text not null, -- view | like | dislike | add_to_cart | order
  event_payload jsonb, -- flexible for future
  created_at timestamptz default now()
);

-- 4) subscriptions (billing status)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  provider text, -- paypal, stripe...
  provider_subscription_id text,
  status text, -- active | trialing | cancelled | past_due
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INDEXES útiles
create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_metrics_product_id on public.metrics(product_id);
create index if not exists idx_metrics_store_id on public.metrics(store_id);

-- ---------------------------------------------------------
-- RLS: habilitar Row Level Security en tablas que se van a proteger
-- ---------------------------------------------------------
alter table public.stores enable row level security;
alter table public.products enable row level security;

-- Policies for stores:
--  - Public read (anyone can SELECT stores)
create policy "public_select_stores" on public.stores
  for select using (true);

--  - INSERT only if user sets user_id = auth.uid()
create policy "insert_stores_owner" on public.stores
  for insert with check ( auth.uid() is not null and user_id = auth.uid() );

--  - UPDATE/DELETE only by owner
create policy "owner_modify_stores" on public.stores
  for update, delete using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

-- Policies for products:
--  - Public read (anyone can SELECT products)
create policy "public_select_products" on public.products
  for select using ( true );

--  - INSERT only if the authenticated user owns the referenced store
create policy "insert_products_if_owner" on public.products
  for insert with check (
    auth.uid() is not null and
    exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.user_id = auth.uid()
    )
  );

--  - UPDATE/DELETE only by owner (must be owner of product's store)
create policy "owner_modify_products" on public.products
  for update, delete using (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id and s.user_id = auth.uid()
    )
  );

-- Opcional: permitir INSERT en metrics desde Edge Functions/Server (service role) or authenticated users
-- Para simplicidad en el MVP, permitimos INSERT desde authenticated users (cliente) but consider moving to Edge Function later
alter table public.metrics enable row level security;
create policy "insert_metrics_auth" on public.metrics
  for insert with check ( auth.uid() is not null );
create policy "select_metrics_internal" on public.metrics
  for select using ( auth.role() = 'authenticated' or auth.role() = 'service_role' );
