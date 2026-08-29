-- KNUST Students' Online Market (KSOM)
-- Run this in Supabase: SQL Editor → New query → Run
-- Also enable Email auth in Authentication → Providers.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  knust_email text,
  whatsapp_number text,
  student_id_number text,
  id_card_path text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  category text not null check (
    category in (
      'Electronics',
      'Fashion',
      'Books',
      'Hostel Essentials',
      'Others'
    )
  ),
  condition text not null check (condition in ('New', 'Used')),
  location text,
  image_url text,
  is_sold boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_seller_id_idx on public.products (seller_id);
create index if not exists products_is_sold_idx on public.products (is_sold);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, knust_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;

drop policy if exists "profiles readable by all" on public.profiles;
create policy "profiles readable by all"
  on public.profiles for select
  using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "products readable by all" on public.products;
create policy "products readable by all"
  on public.products for select
  using (true);

drop policy if exists "verified users insert products" on public.products;
create policy "verified users insert products"
  on public.products for insert
  with check (
    auth.uid() = seller_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_verified = true
    )
  );

drop policy if exists "owner update products" on public.products;
create policy "owner update products"
  on public.products for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "owner delete products" on public.products;
create policy "owner delete products"
  on public.products for delete
  using (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('id-cards', 'id-cards', false)
on conflict (id) do update set public = false;

-- product-images: anyone can view; verified sellers upload to their own folder
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "verified upload product images" on storage.objects;
create policy "verified upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_verified = true
    )
  );

drop policy if exists "owner update product images" on storage.objects;
create policy "owner update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "owner delete product images" on storage.objects;
create policy "owner delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- id-cards: PRIVATE. Students upload their own card; they cannot list others.
-- Admins view files via the service role (server action), which bypasses RLS.
drop policy if exists "users upload own id cards" on storage.objects;
create policy "users upload own id cards"
  on storage.objects for insert
  with check (
    bucket_id = 'id-cards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users update own id cards" on storage.objects;
create policy "users update own id cards"
  on storage.objects for update
  using (
    bucket_id = 'id-cards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users read own id cards" on storage.objects;
create policy "users read own id cards"
  on storage.objects for select
  using (
    bucket_id = 'id-cards'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
