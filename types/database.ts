// Reverse-engineered from field usage across app/**, components/** and lib/**.
// Regenerate with `supabase gen types typescript` against the real schema when possible —
// this file is a starting point to remove `any` from Supabase call sites, not a source of truth.

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface BusinessSettings {
  id: string
  name: string | null
  slug: string
  description: string | null
  phone: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  city: string | null
  country: string | null
  whatsapp: string | null
  instagram: string | null
  currency: string | null
  timezone: string | null
  time_format: '12h' | '24h' | null
  booking_enabled: boolean
  auto_confirm_appointments: boolean
  products_enabled: boolean
  reviews_enabled: boolean
  lgbtq_friendly: boolean
  google_reviews_url: string | null
  google_review_qr_url: string | null
  landing_language: string | null
  primary_color: string | null
  accent_color: string | null
  background_color: string | null
  surface_color: string | null
  text_color: string | null
  muted_text_color: string | null
}

export interface Staff {
  id: string
  auth_user_id: string
  full_name: string
  is_admin: boolean
  is_worker: boolean
  telegram_chat_id: string | null
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface Appointment {
  id: string
  service_id: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
  customer_ip: string | null
  device_fingerprint: string | null
  cancel_token: string
  cancelled_at: string | null
  cancellation_source: 'client' | 'admin' | null
  created_at: string
  worker_id: string | null
  services?: Pick<Service, 'name'> | null
  staff?: Pick<Staff, 'full_name'> | null
}

export interface AvailabilityRule {
  id: string
  worker_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface Break {
  id: string
  worker_id: string
  name: string | null
  date: string
  start_time: string
  end_time: string
  is_active: boolean
}

export interface DayOff {
  id: string
  worker_id: string | null
  date: string
  reason: string | null
}

export interface GalleryImage {
  id: string
  image_url: string
  alt_text: string | null
  sort_order: number
  is_active: boolean
}

export interface GoogleReview {
  id: string
  author_name: string
  comment: string | null
  rating: number
  sort_order: number
  is_active: boolean
}
