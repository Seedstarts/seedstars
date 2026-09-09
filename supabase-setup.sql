
-- SEEDSTARS – Supabase setup
-- Run this in Supabase SQL Editor after creating the project.
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  city text,
  review text not null,
  rating int not null default 5 check (rating between 1 and 5),
  photo_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'Update',
  description text,
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date,
  image_url text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  caption text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.consultation_settings (
  id int primary key default 1,
  whatsapp text default '919088873337',
  phone text default '9088873337',
  email text default 'contact@seedstars.org.in'
);
insert into public.consultation_settings(id) values (1) on conflict do nothing;

alter table public.admin_profiles enable row level security;
drop policy if exists "admins read own profile" on public.admin_profiles;
create policy "admins read own profile" on public.admin_profiles for select using (id=auth.uid());

alter table public.reviews enable row level security;
alter table public.updates enable row level security;
alter table public.events enable row level security;
alter table public.gallery enable row level security;
alter table public.consultation_settings enable row level security;

-- Helper: authenticated user is an admin.
create or replace function public.is_seedstars_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_profiles where id=auth.uid() and role='admin'); $$;

-- Public read policies.
drop policy if exists "public read published reviews" on public.reviews;
create policy "public read published reviews" on public.reviews for select using (published=true or public.is_seedstars_admin());
drop policy if exists "admins manage reviews" on public.reviews;
create policy "admins manage reviews" on public.reviews for all using (public.is_seedstars_admin()) with check (public.is_seedstars_admin());

drop policy if exists "public read published updates" on public.updates;
create policy "public read published updates" on public.updates for select using (published=true or public.is_seedstars_admin());
drop policy if exists "admins manage updates" on public.updates;
create policy "admins manage updates" on public.updates for all using (public.is_seedstars_admin()) with check (public.is_seedstars_admin());

drop policy if exists "public read published events" on public.events;
create policy "public read published events" on public.events for select using (published=true or public.is_seedstars_admin());
drop policy if exists "admins manage events" on public.events;
create policy "admins manage events" on public.events for all using (public.is_seedstars_admin()) with check (public.is_seedstars_admin());

drop policy if exists "public read published gallery" on public.gallery;
create policy "public read published gallery" on public.gallery for select using (published=true or public.is_seedstars_admin());
drop policy if exists "admins manage gallery" on public.gallery;
create policy "admins manage gallery" on public.gallery for all using (public.is_seedstars_admin()) with check (public.is_seedstars_admin());

drop policy if exists "public read settings" on public.consultation_settings;
create policy "public read settings" on public.consultation_settings for select using (true);
drop policy if exists "admins manage settings" on public.consultation_settings;
create policy "admins manage settings" on public.consultation_settings for all using (public.is_seedstars_admin()) with check (public.is_seedstars_admin());

-- ============================================================
-- CREATE ADMIN USER (email + password + admin role)
-- Email:    seedstars.in@gmail.com
-- Password: SeedStars@2026   (change later from Admin → Account)
-- Safe to re-run: skips if email already exists.
-- ============================================================
do $$
declare
  v_user_id uuid;
  v_encrypted_pw text;
  v_email text := 'seedstars.in@gmail.com';
  v_password text := 'SeedStars@2026';
begin
  -- If user already exists, reuse that id; otherwise create
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(v_password, gen_salt('bf'));

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', v_user_id, v_email)::jsonb,
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  end if;

  insert into public.admin_profiles (id, role)
  values (v_user_id, 'admin')
  on conflict (id) do nothing;
end $$;

-- Storage bucket for admin-uploaded review/event/gallery images.
insert into storage.buckets(id,name,public) values ('seedstars-media','seedstars-media',true) on conflict (id) do nothing;

drop policy if exists "public view seedstars media" on storage.objects;
create policy "public view seedstars media" on storage.objects for select using (bucket_id='seedstars-media');
drop policy if exists "admins upload seedstars media" on storage.objects;
create policy "admins upload seedstars media" on storage.objects for insert with check (bucket_id='seedstars-media' and public.is_seedstars_admin());
drop policy if exists "admins update seedstars media" on storage.objects;
create policy "admins update seedstars media" on storage.objects for update using (bucket_id='seedstars-media' and public.is_seedstars_admin());
drop policy if exists "admins delete seedstars media" on storage.objects;
create policy "admins delete seedstars media" on storage.objects for delete using (bucket_id='seedstars-media' and public.is_seedstars_admin());
