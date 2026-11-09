create table if not exists public.payment_journal (
  journal_key text primary key,
  kind text not null check (kind in ('collection', 'settlement', 'payout')),
  partner_id text not null,
  order_id text,
  reference_scope text,
  external_reference text,
  created_at timestamptz not null default now(),
  check ((kind = 'collection') = (order_id is not null)),
  check ((kind = 'settlement' and reference_scope is null and external_reference is null)
      or (kind <> 'settlement' and reference_scope is not null and external_reference is not null)),
  unique (order_id),
  unique (reference_scope, external_reference)
);

create index if not exists payment_journal_partner_idx on public.payment_journal (partner_id);

create table if not exists public.payment_transfer (
  journal_key text not null references public.payment_journal (journal_key),
  line_no integer not null check (line_no > 0),
  debit_account text not null,
  credit_account text not null,
  amount_paise numeric not null check (amount_paise > 0 and amount_paise < 'Infinity'::numeric and amount_paise = trunc(amount_paise)),
  component text check (component is null or (component = 'retail_margin' and credit_account = 'partner_payable')),
  check (debit_account <> credit_account),
  primary key (journal_key, line_no)
);

alter table public.payment_journal enable row level security;
alter table public.payment_transfer enable row level security;
revoke all on public.payment_journal, public.payment_transfer from public, anon, authenticated;
