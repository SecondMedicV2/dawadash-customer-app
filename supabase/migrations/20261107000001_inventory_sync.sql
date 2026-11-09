create table if not exists public.inventory_sku (
  source_id text not null,
  sku_id text not null,
  revision numeric not null check (revision >= 0 and revision < 'Infinity'::numeric and revision = trunc(revision)),
  details jsonb,
  composition_key text,
  primary key (source_id, sku_id)
);

create index if not exists inventory_sku_lookup_idx
  on public.inventory_sku (sku_id, source_id) where details is not null;
create index if not exists inventory_sku_composition_idx
  on public.inventory_sku (composition_key, source_id, sku_id) where details is not null;

create table if not exists public.inventory_stock (
  source_id text not null,
  sku_id text not null,
  revision numeric not null check (revision >= 0 and revision < 'Infinity'::numeric and revision = trunc(revision)),
  quantity bigint not null check (quantity >= 0),
  batches jsonb not null check (jsonb_typeof(batches) = 'array'),
  primary key (source_id, sku_id)
);

create table if not exists public.inventory_sync_state (
  source_id text primary key,
  cursor text,
  next_poll_at bigint not null default 0,
  generation bigint not null default 0
);

alter table public.inventory_sku enable row level security;
alter table public.inventory_stock enable row level security;
alter table public.inventory_sync_state enable row level security;
revoke all on public.inventory_sku, public.inventory_stock, public.inventory_sync_state from public, anon, authenticated;
