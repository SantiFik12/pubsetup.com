-- =====================================================================
-- implement.it — Magento 2 catalog schema
-- Run in Supabase SQL Editor (project: bfmuthucwogeklucsptj)
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
do $$ begin
  create type price_type as enum ('one-time', 'subscription', 'free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type magento_edition as enum ('open-source', 'commerce', 'both');
exception when duplicate_object then null; end $$;

do $$ begin
  create type install_complexity as enum ('simple', 'complex');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('admin', 'editor');
exception when duplicate_object then null; end $$;

-- ---------- Helper: updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =====================================================================
-- Core catalog tables
-- =====================================================================

-- Partners (extension vendors)
create table if not exists public.partners (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  logo_letter  text not null,
  description  text not null default '',
  website      text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists partners_slug_idx on public.partners(slug);

drop trigger if exists trg_partners_updated on public.partners;
create trigger trg_partners_updated before update on public.partners
for each row execute function public.set_updated_at();

-- Categories
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  icon         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists categories_slug_idx on public.categories(slug);

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
for each row execute function public.set_updated_at();

-- Extensions
create table if not exists public.extensions (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  partner_id         uuid not null references public.partners(id) on delete restrict,
  category_id        uuid not null references public.categories(id) on delete restrict,
  short_description  text not null default '',
  description        text not null default '',
  price_from         numeric(10,2) not null default 0,
  price_type         price_type not null default 'one-time',
  rating             numeric(2,1) not null default 0,
  reviews            integer not null default 0,
  recommended        boolean not null default false,
  best_seller        boolean not null default false,
  affiliate_url      text not null default '',
  magento_versions   text[] not null default '{}',
  hyva_compatible    boolean not null default false,
  pwa_ready          boolean not null default false,
  edition            magento_edition not null default 'both',
  install_complexity install_complexity not null default 'simple',
  has_trial          boolean not null default false,
  has_demo           boolean not null default false,
  support_months     integer not null default 0,
  features           text[] not null default '{}',
  use_cases          text[] not null default '{}',
  tags               text[] not null default '{}',
  install_price      numeric(10,2) not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists extensions_slug_idx        on public.extensions(slug);
create index if not exists extensions_partner_idx     on public.extensions(partner_id);
create index if not exists extensions_category_idx    on public.extensions(category_id);
create index if not exists extensions_tags_gin        on public.extensions using gin(tags);
create index if not exists extensions_features_gin    on public.extensions using gin(features);
create index if not exists extensions_versions_gin    on public.extensions using gin(magento_versions);

drop trigger if exists trg_extensions_updated on public.extensions;
create trigger trg_extensions_updated before update on public.extensions
for each row execute function public.set_updated_at();

-- Services
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  includes    text[] not null default '{}',
  duration    text not null default '',
  price       numeric(10,2) not null default 0,
  unit        text,
  featured    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists services_slug_idx on public.services(slug);

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
for each row execute function public.set_updated_at();

-- Blog posts
create table if not exists public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null default '',
  cover         text not null default '',
  category      text not null default '',
  tags          text[] not null default '{}',
  author        text not null default '',
  date          date not null default current_date,
  read_minutes  integer not null default 5,
  toc           jsonb not null default '[]'::jsonb, -- [{ id, label }]
  content       jsonb not null default '[]'::jsonb, -- [{ type, text?, items?, extensionSlug? }]
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists blog_posts_slug_idx      on public.blog_posts(slug);
create index if not exists blog_posts_tags_gin      on public.blog_posts using gin(tags);
create index if not exists blog_posts_published_idx on public.blog_posts(published, date desc);

drop trigger if exists trg_blog_posts_updated on public.blog_posts;
create trigger trg_blog_posts_updated before update on public.blog_posts
for each row execute function public.set_updated_at();

-- SEO landing pages (auto-generated aggregations)
create table if not exists public.seo_landings (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  meta_description text not null default '',
  intro            text not null default '',
  -- filter shape: { tag?, categorySlug?, partnerSlug?, hyvaCompatible?, priceMax? }
  filter           jsonb not null default '{}'::jsonb,
  published        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists seo_landings_slug_idx on public.seo_landings(slug);

drop trigger if exists trg_seo_landings_updated on public.seo_landings;
create trigger trg_seo_landings_updated before update on public.seo_landings
for each row execute function public.set_updated_at();

-- =====================================================================
-- Orders (checkout)
-- =====================================================================
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_code    text not null unique default ('IMP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  service_id    uuid not null references public.services(id) on delete restrict,
  extension_id  uuid references public.extensions(id) on delete set null,
  customer_name text not null,
  email         text not null,
  website       text,
  notes         text,
  amount        numeric(10,2) not null default 0,
  status        order_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status, created_at desc);
create index if not exists orders_email_idx  on public.orders(email);

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute function public.set_updated_at();

-- =====================================================================
-- Roles (admin access) — separate table, NEVER on profiles/users
-- =====================================================================
create table if not exists public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- =====================================================================
-- Row-Level Security
-- =====================================================================
alter table public.partners      enable row level security;
alter table public.categories    enable row level security;
alter table public.extensions    enable row level security;
alter table public.services      enable row level security;
alter table public.blog_posts    enable row level security;
alter table public.seo_landings  enable row level security;
alter table public.orders        enable row level security;
alter table public.user_roles    enable row level security;

-- Public read for catalog content
do $$ begin
  create policy "public read partners"     on public.partners     for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read categories"   on public.categories   for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read extensions"   on public.extensions   for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read services"     on public.services     for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read blog"         on public.blog_posts   for select using (published = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "public read seo landings" on public.seo_landings for select using (published = true);
exception when duplicate_object then null; end $$;

-- Admin write on catalog
do $$ begin
  create policy "admin write partners"    on public.partners
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin write categories"  on public.categories
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin write extensions"  on public.extensions
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin write services"    on public.services
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin write blog"        on public.blog_posts
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin write seo landings" on public.seo_landings
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- Orders: anyone can create, only admins can read/update
do $$ begin
  create policy "anyone can create order" on public.orders
    for insert to anon, authenticated with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin read orders"       on public.orders
    for select to authenticated using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin update orders"     on public.orders
    for update to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- user_roles: only admins manage; users can read their own roles
do $$ begin
  create policy "users read own roles"    on public.user_roles
    for select to authenticated using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admin manage roles"      on public.user_roles
    for all to authenticated
    using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- =====================================================================
-- Bootstrap your first admin (run AFTER you signed up via Supabase Auth):
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com';
-- =====================================================================
