-- ============================================================================
-- Champions Barbershop — Notificaciones de Telegram por trabajador
-- ============================================================================
-- Requiere haber corrido antes migration_staff_roles.sql (necesita que exista
-- la tabla public.staff). Cómo ejecutar: Supabase → SQL Editor → pegar y correr.
-- ============================================================================

alter table public.staff add column if not exists telegram_chat_id text;

-- Roberto ya recibía las notificaciones con el chat_id que hoy está fijo en
-- TELEGRAM_ADMIN_CHAT_ID (variable de entorno, valor actual: 903561629).
-- Lo copiamos a su fila para que siga recibiendo sus propias citas sin que
-- tengas que volver a buscarlo.
update public.staff
  set telegram_chat_id = '903561629'
  where auth_user_id = 'decea464-c3ed-4eab-b68c-4983cd1ad4db';

-- Para cada trabajador nuevo: que le escriba cualquier mensaje al bot de
-- Telegram del negocio, y luego consigues su chat_id con este link en el
-- navegador (sustituyendo <TOKEN> por TELEGRAM_BOT_TOKEN):
-- https://api.telegram.org/bot<TOKEN>/getUpdates
-- Ahí aparece "chat":{"id": 123456789, ...} — ese número es el chat_id.
-- Se pega en el panel admin → Equipo → editar trabajador → "Chat ID de Telegram".
