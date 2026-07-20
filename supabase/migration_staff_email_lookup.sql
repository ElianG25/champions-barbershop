-- ============================================================================
-- Champions Barbershop — Buscar auth_user_id por email al crear un trabajador
-- ============================================================================
-- Requiere que exista public.staff (migration_staff_roles.sql). Se puede
-- correr en cualquier momento; es seguro volver a correrlo.
--
-- El anon key no puede leer auth.users directamente, así que esta función
-- hace la búsqueda con permisos elevados (security definer) pero solo
-- responde si quien la llama ya es un admin activo en public.staff — así
-- solo el panel admin (sección Equipo) puede usarla, no cualquier sesión.
-- ============================================================================

create or replace function public.find_auth_user_id_by_email(lookup_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result uuid;
begin
  if not exists (
    select 1 from public.staff
    where auth_user_id = auth.uid() and is_admin = true and is_active = true
  ) then
    return null;
  end if;

  select id into result from auth.users where email = lookup_email limit 1;
  return result;
end;
$$;

grant execute on function public.find_auth_user_id_by_email(text) to authenticated;
revoke execute on function public.find_auth_user_id_by_email(text) from anon;
