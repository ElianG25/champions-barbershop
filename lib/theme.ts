import type { CSSProperties } from 'react'

export type ThemeSettings = {
  primary_color?: string | null
  background_color?: string | null
  surface_color?: string | null
  text_color?: string | null
  muted_text_color?: string | null
}

export const THEME_PRESETS = [
  {
    name: 'Gold Premium',
    primary_color: '#d4af37',
    background_color: '#0a0a0a',
    surface_color: '#171717',
    text_color: '#ffffff',
    muted_text_color: '#a3a3a3',
  },
  {
    name: 'Blue Steel',
    primary_color: '#38bdf8',
    background_color: '#020617',
    surface_color: '#0f172a',
    text_color: '#f8fafc',
    muted_text_color: '#94a3b8',
  },
  {
    name: 'Emerald Fresh',
    primary_color: '#34d399',
    background_color: '#022c22',
    surface_color: '#064e3b',
    text_color: '#ecfdf5',
    muted_text_color: '#a7f3d0',
  },
  {
    name: 'Red Barber',
    primary_color: '#ef4444',
    background_color: '#111827',
    surface_color: '#1f2937',
    text_color: '#ffffff',
    muted_text_color: '#d1d5db',
  },
]

export function buildThemeStyle(business?: any): React.CSSProperties {
  return {
    '--brand': business?.primary_color || '#ffffff',
    '--app-bg': business?.background_color || '#0a0a0a',
    '--app-surface': business?.surface_color || '#171717',
    '--app-text': business?.text_color || '#ffffff',
    '--app-muted': business?.muted_text_color || '#a3a3a3',
  } as React.CSSProperties
}

export function themePatch(settings?: ThemeSettings | null) {
  return {
    style: buildThemeStyle(settings),
    className: 'bg-[var(--app-bg)] text-[var(--app-text)]',
  }
}
