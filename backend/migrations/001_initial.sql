-- Extensions


-- Enums
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

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

-- Partners
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_letter text not null,
  description text not null default '',
  website text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partners_slug_idx on public.partners(slug);
drop trigger if exists trg_partners_updated on public.partners;
create trigger trg_partners_updated before update on public.partners
for each row execute function public.set_updated_at();

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_slug_idx on public.categories(slug);
drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated before update on public.categories
for each row execute function public.set_updated_at();

-- Extensions
create table if not exists public.extensions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  partner_id uuid not null references public.partners(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  short_description text not null default '',
  description text not null default '',
  price_from numeric(10,2) not null default 0,
  price_type price_type not null default 'one-time',
  rating numeric(2,1) not null default 0,
  reviews integer not null default 0,
  recommended boolean not null default false,
  best_seller boolean not null default false,
  affiliate_url text not null default '',
  magento_versions text[] not null default '{}',
  hyva_compatible boolean not null default false,
  pwa_ready boolean not null default false,
  edition magento_edition not null default 'both',
  install_complexity install_complexity not null default 'simple',
  has_trial boolean not null default false,
  has_demo boolean not null default false,
  support_months integer not null default 0,
  features text[] not null default '{}',
  use_cases text[] not null default '{}',
  tags text[] not null default '{}',
  install_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists extensions_slug_idx on public.extensions(slug);
create index if not exists extensions_partner_idx on public.extensions(partner_id);
create index if not exists extensions_category_idx on public.extensions(category_id);
create index if not exists extensions_tags_gin on public.extensions using gin(tags);
create index if not exists extensions_features_gin on public.extensions using gin(features);
create index if not exists extensions_versions_gin on public.extensions using gin(magento_versions);
drop trigger if exists trg_extensions_updated on public.extensions;
create trigger trg_extensions_updated before update on public.extensions
for each row execute function public.set_updated_at();

-- Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  includes text[] not null default '{}',
  duration text not null default '',
  price numeric(10,2) not null default 0,
  unit text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists services_slug_idx on public.services(slug);
drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated before update on public.services
for each row execute function public.set_updated_at();

-- Blog posts
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  cover text not null default '',
  category text not null default '',
  tags text[] not null default '{}',
  author text not null default '',
  date date not null default current_date,
  read_minutes integer not null default 5,
  toc jsonb not null default '[]'::jsonb,
  content jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_tags_gin on public.blog_posts using gin(tags);
create index if not exists blog_posts_published_idx on public.blog_posts(published, date desc);
drop trigger if exists trg_blog_posts_updated on public.blog_posts;
create trigger trg_blog_posts_updated before update on public.blog_posts
for each row execute function public.set_updated_at();

-- SEO landings
create table if not exists public.seo_landings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  meta_description text not null default '',
  intro text not null default '',
  filter jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seo_landings_slug_idx on public.seo_landings(slug);
drop trigger if exists trg_seo_landings_updated on public.seo_landings;
create trigger trg_seo_landings_updated before update on public.seo_landings
for each row execute function public.set_updated_at();

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('PUB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  service_id uuid not null references public.services(id) on delete restrict,
  extension_id uuid references public.extensions(id) on delete set null,
  customer_name text not null,
  email text not null,
  website text,
  notes text,
  amount numeric(10,2) not null default 0,
  status order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status, created_at desc);
create index if not exists orders_email_idx on public.orders(email);
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
for each row execute function public.set_updated_at();


ALTER TABLE extensions ADD COLUMN cover_image text NOT NULL DEFAULT '';
ALTER TABLE extensions ADD COLUMN gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE extensions ADD COLUMN user_guide_url text NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN position integer NOT NULL DEFAULT 0;
CREATE TABLE app_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 paddle_token_live text NOT NULL DEFAULT '', paddle_token_sandbox text NOT NULL DEFAULT '',
 paddle_mode text NOT NULL DEFAULT 'sandbox' CHECK (paddle_mode IN ('live','sandbox')),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO app_settings (id) VALUES (true);
CREATE TABLE contact_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL,
 subject text, message text NOT NULL, ip text, user_agent text,
 status text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE suppressed_emails (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE,
 reason text NOT NULL CHECK (reason IN ('unsubscribe','bounce','complaint')),
 metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE email_unsubscribe_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token text NOT NULL UNIQUE,
 email text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), used_at timestamptz
);
CREATE TABLE email_send_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id text, template_name text NOT NULL,
 recipient_email text NOT NULL, status text NOT NULL, error_message text, metadata jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX email_send_log_sent_unique ON email_send_log(message_id) WHERE status = 'sent';
CREATE TABLE email_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id),
 template_name text NOT NULL CHECK(template_name IN ('order-notification','order-confirmation')),
 recipient_email text NOT NULL, attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz,
 last_error text, UNIQUE(order_id,template_name)
);
CREATE TABLE request_limits (
 key text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), count integer NOT NULL DEFAULT 1
);
