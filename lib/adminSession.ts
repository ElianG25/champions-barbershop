export const ADMIN_INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000
export const ADMIN_LAST_ACTIVITY_KEY = 'champions_admin_last_activity'
export const ADMIN_LOGOUT_REASON_KEY = 'champions_admin_logout_reason'

export function touchAdminActivity() {
  localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()))
}

export function getAdminInactivityExpired() {
  const lastActivity = Number(localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY) || 0)

  if (!lastActivity) return false

  return Date.now() - lastActivity > ADMIN_INACTIVITY_LIMIT_MS
}

export function setLogoutReason(reason: string) {
  sessionStorage.setItem(ADMIN_LOGOUT_REASON_KEY, reason)
}

export function consumeLogoutReason() {
  const reason = sessionStorage.getItem(ADMIN_LOGOUT_REASON_KEY)
  sessionStorage.removeItem(ADMIN_LOGOUT_REASON_KEY)
  return reason
}

export function clearAdminActivity() {
  localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY)
}