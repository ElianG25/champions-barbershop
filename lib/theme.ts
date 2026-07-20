export function buildThemeStyle(business?: any): React.CSSProperties {
  return {
    '--brand': business?.primary_color || '#ffffff',
    '--app-bg': business?.background_color || '#0a0a0a',
    '--app-surface': business?.surface_color || '#171717',
    '--app-text': business?.text_color || '#ffffff',
    '--app-muted': business?.muted_text_color || '#a3a3a3',
  } as React.CSSProperties
}
