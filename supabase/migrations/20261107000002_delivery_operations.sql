create table if not exists public.inventory_store_override (
  store_id text not null,
  sku_id text not null,
  hidden boolean not null default false,
  not_for_sale boolean not null default false,
  out_of_stock boolean not null default false,
  proposed_rate_paise numeric check (proposed_rate_paise >= 0 and proposed_rate_paise < 'Infinity'::numeric
    and proposed_rate_paise = trunc(proposed_rate_paise)),
  suggested_sku_id text,
  primary key (store_id, sku_id)
);

create table if not exists public.inventory_catalog_edit (
  sku_id text primary key,
  details jsonb not null,
  composition_key text
);

create table if not exists public.delivery_order_update (
  order_id text not null,
  store_id text not null,
  status text check (status in ('approved', 'delayed', 'dispatched', 'ready_for_pickup', 'delivered', 'picked_up')),
  rejected_item_ids text[] not null default '{}',
  primary key (order_id, store_id)
);

alter table public.inventory_store_override enable row level security;
alter table public.inventory_catalog_edit enable row level security;
alter table public.delivery_order_update enable row level security;
revoke all on public.inventory_store_override, public.inventory_catalog_edit, public.delivery_order_update
  from public, anon, authenticated;
