-- Délios — banco, permissões e proteção dos relatos
-- Execute este arquivo no SQL Editor do Supabase.
-- criado as pressas CHANCE DE DAR BOM DE PRIMEIRA 0
--deu bom garaiiiiii
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.support_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reporter_name text check (reporter_name is null or char_length(reporter_name) <= 120),
  school_year text check (school_year is null or char_length(school_year) <= 30),
  class_group text check (class_group is null or char_length(class_group) <= 30),
  category text not null check (category in (
    'bullying', 'cyberbullying', 'exclusao', 'ameaca', 'preconceito',
    'conflito', 'casa', 'outro', 'nao_sei'
  )),
  description text not null check (char_length(description) between 20 and 4000),
  status text not null default 'novo' check (status in ('novo', 'em_analise', 'encaminhado', 'concluido')),
  privacy_notice_acknowledged boolean not null default false
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_reports_set_updated_at on public.support_reports;
create trigger support_reports_set_updated_at
before update on public.support_reports
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.set_updated_at() from public;

alter table public.profiles enable row level security;
alter table public.support_reports enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

revoke all on table public.support_reports from anon, authenticated;
grant insert on table public.support_reports to anon, authenticated;
grant select, update on table public.support_reports to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Anyone can submit a protected report" on public.support_reports;
create policy "Anyone can submit a protected report"
on public.support_reports
for insert
to anon, authenticated
with check (
  status = 'novo'
  and privacy_notice_acknowledged = true
  and char_length(description) between 20 and 4000
);

drop policy if exists "Admins can read reports" on public.support_reports;
create policy "Admins can read reports"
on public.support_reports
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can update reports" on public.support_reports;
create policy "Admins can update reports"
on public.support_reports
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Depois de criar o usuário administrativo em Authentication > Users,
-- copie o UUID e execute a linha abaixo trocando o valor:
-- insert into public.profiles (id, role) values ('UUID_DO_USUARIO', 'admin')
-- on conflict (id) do update set role = 'admin';
