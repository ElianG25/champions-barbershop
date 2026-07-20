-- ============================================================================
-- Champions Barbershop — Bloqueos recurrentes (se repiten cada semana)
-- ============================================================================
-- Requiere que exista public.breaks con worker_id (migration_staff_roles.sql).
-- Es seguro volver a correrla.
--
-- Un bloqueo de un solo día sigue usando "date" (como hoy). Un bloqueo
-- recurrente ("todos los días", "de lunes a viernes", "todos los martes")
-- se guarda como una fila por cada día de la semana elegido, con "date" en
-- NULL y "day_of_week" puesto, y comparten un mismo "group_id" para que el
-- panel los trate como una sola entrada al editar/eliminar.
-- ============================================================================

alter table public.breaks alter column date drop not null;
alter table public.breaks add column if not exists day_of_week integer;
alter table public.breaks add column if not exists group_id uuid;

do $$
begin
  alter table public.breaks
    add constraint breaks_day_of_week_range
    check (day_of_week is null or (day_of_week between 1 and 7));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.breaks
    add constraint breaks_date_or_recurring
    check (
      (date is not null and day_of_week is null)
      or (date is null and day_of_week is not null)
    );
exception
  when duplicate_object then null;
end $$;
