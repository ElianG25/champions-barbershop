-- ============================================================================
-- Champions Barbershop — Trabajadores múltiples + roles (admin / trabajador)
-- ============================================================================
-- Cómo ejecutar: Supabase → SQL Editor → pegar todo y correr. Es seguro
-- volver a correrlo (idempotente): si algo de esto ya existe, se salta sin
-- error y no duplica ni pisa nada.
-- No toca RLS en ninguna tabla (sigue desactivado en las nueve, igual que hoy).
-- Los roles se aplican en la app, no en la base de datos.
--
-- El bloque 4 (INSERT INTO staff) trae los auth_user_id reales conocidos
-- hasta ahora. Para el próximo trabajador ya no hace falta tocar SQL: se crea
-- su cuenta en Supabase → Authentication → Users, y luego se agrega desde el
-- panel admin → Equipo → Nuevo trabajador, pegando ahí su UID.
-- ============================================================================

-- 1. Tabla de trabajadores/roles ---------------------------------------------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  is_admin boolean not null default false,
  is_worker boolean not null default false,
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Mismo nivel de acceso que el resto de tablas hoy (sin RLS): el público solo
-- necesita poder leerla (selector de barbero en la reserva); el panel admin
-- necesita CRUD completo cuando el usuario está autenticado.
grant select on public.staff to anon;
grant select, insert, update, delete on public.staff to authenticated;

-- 2. worker_id en las tablas existentes --------------------------------------
-- Se reutilizan las tablas actuales en vez de crear tablas paralelas.
alter table public.availability_rules add column if not exists worker_id uuid references public.staff(id) on delete cascade;
alter table public.breaks add column if not exists worker_id uuid references public.staff(id) on delete cascade;

-- days_off: NULL = cierra todo el negocio (feriado). Con valor = solo ese
-- trabajador libre ese día (vacaciones personales). Los demás trabajadores
-- siguen operando con normalidad.
alter table public.days_off add column if not exists worker_id uuid references public.staff(id) on delete cascade;

alter table public.appointments add column if not exists worker_id uuid references public.staff(id) on delete set null;

-- 3. days_off tenía UNIQUE(date) — ahora puede haber una fila de negocio
--    (worker_id NULL) y además una fila por trabajador para la misma fecha,
--    sin permitir duplicados dentro de cada grupo.
alter table public.days_off drop constraint if exists days_off_date_key;
create unique index if not exists days_off_date_worker_uidx on public.days_off (date, worker_id) nulls not distinct;

-- ============================================================================
-- 4. Alta de los usuarios ya existentes en Supabase Auth.
-- ============================================================================
insert into public.staff (auth_user_id, full_name, is_admin, is_worker)
values
  ('decea464-c3ed-4eab-b68c-4983cd1ad4db', 'Roberto Santana', true, true),
  ('6fed253e-d072-4b36-9acf-992ac5b17497', 'Elian', true, false),
  ('4eb9f522-8bfb-4a6a-bf3b-973ed7041740', 'Juan Luis', false, true)
on conflict (auth_user_id) do nothing;

-- 5. Backfill — todo lo creado hasta ahora era, en la práctica, de Roberto.
update public.availability_rules
  set worker_id = (select id from public.staff where full_name = 'Roberto Santana')
  where worker_id is null;

update public.breaks
  set worker_id = (select id from public.staff where full_name = 'Roberto Santana')
  where worker_id is null;

update public.appointments
  set worker_id = (select id from public.staff where full_name = 'Roberto Santana')
  where worker_id is null;

-- A partir de aquí, toda regla de horario y todo descanso debe pertenecer a
-- un trabajador concreto (ya no existen como "del negocio en general").
alter table public.availability_rules alter column worker_id set not null;
alter table public.breaks alter column worker_id set not null;

-- days_off.worker_id y appointments.worker_id se quedan NULLABLE a propósito:
-- un día libre puede seguir siendo "de todo el negocio", y las citas
-- históricas previas a esta migración no tienen barbero asignado.
