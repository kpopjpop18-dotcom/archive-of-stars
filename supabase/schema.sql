-- Run this once in Supabase SQL Editor. It provides the shared, production data layer.
create table if not exists collectors (
  id uuid primary key default gen_random_uuid(), username text unique not null,
  recovery_hash text unique not null, avatar text default '🧸', favorite_member text,
  created_at timestamptz default now(), banned boolean default false
);
create table if not exists binders (
  id uuid primary key default gen_random_uuid(), name text unique not null, cover text,
  sort_order integer default 0
);
create table if not exists cards (
  id uuid primary key default gen_random_uuid(), name text not null, image_url text not null,
  binder_id uuid references binders(id), rarity text check (rarity in ('Common','Rare','Ultra Rare')) not null default 'Common',
  enabled boolean default true, created_at timestamptz default now()
);
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(), collector_id uuid references collectors(id) on delete cascade,
  card_id uuid references cards(id), pulled_at timestamptz default now()
);
create table if not exists pulls (
  id uuid primary key default gen_random_uuid(), collector_id uuid references collectors(id), card_id uuid references cards(id),
  pulled_at timestamptz default now(), is_admin_test boolean default false
);
create table if not exists trades (
  id uuid primary key default gen_random_uuid(), sender_id uuid references collectors(id), receiver_id uuid references collectors(id),
  offered_inventory_id uuid references inventory(id), requested_inventory_id uuid references inventory(id),
  status text check (status in ('pending','accepted','declined','cancelled')) default 'pending', created_at timestamptz default now()
);
-- The Netlify server (using your private service key) manages card writes.
-- Players can only read enabled cards through the public API.
alter table cards enable row level security;
drop policy if exists "Anyone can read active cards" on cards;
create policy "Anyone can read active cards" on cards for select using (enabled = true);
insert into storage.buckets (id,name,public) values ('photocards','photocards',true) on conflict (id) do update set public=true;
-- Seed the default binder names.
insert into binders(name,sort_order) values ('ATEEZ',1),('SEONGHWA',2),('HONGJOONG',3),('YUNHO',4),('YEOSANG',5),('SAN',6),('MINGI',7),('WOOYOUNG',8),('JONGHO',9) on conflict(name) do nothing;
