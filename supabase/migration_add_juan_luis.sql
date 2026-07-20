-- Ya corriste migration_staff_roles.sql una vez (por eso "staff" ya existe).
-- Este bloque solo agrega al trabajador nuevo, sin tocar nada más.
insert into public.staff (auth_user_id, full_name, is_admin, is_worker)
values ('4eb9f522-8bfb-4a6a-bf3b-973ed7041740', 'Juan Luis', false, true)
on conflict (auth_user_id) do nothing;
