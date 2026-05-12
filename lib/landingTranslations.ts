const SERVICE_TRANSLATIONS: Record<string, { name: string; description: string }> = {
  'corte': {
    name: 'Haircut',
    description: 'Professional haircut with a clean, precise finish.',
  },
  'corte clásico': {
    name: 'Classic haircut',
    description: 'Classic haircut with a clean, polished finish.',
  },
  'barba': {
    name: 'Beard trim',
    description: 'Beard shaping, trimming and professional finish.',
  },
  'perfilado de barba': {
    name: 'Beard shaping',
    description: 'Beard contouring, shaping and detailed finish.',
  },
  'color': {
    name: 'Color',
    description: 'Hair color service with professional application.',
  },
}

const PRODUCT_TRANSLATIONS: Record<string, { name: string; description: string }> = {}

const REVIEW_TRANSLATIONS: Record<string, string> = {}

export function translateBusinessDescription(description: string | null | undefined) {
  if (!description) {
    return 'Champions Barbershop combines technique, precision and a polished experience so you can book without calls or waiting.'
  }

  return description
    .replaceAll('Barbería premium', 'Premium barbershop')
    .replaceAll('Barcelona especializada en cortes modernos, degradados, barba y estilo masculino', 'in Barcelona specialized in modern haircuts, fades, beard grooming and men’s style')
    .replaceAll('cortes modernos', 'modern haircuts')
    .replaceAll('degradados', 'fades')
    .replaceAll('barba', 'beard grooming')
    .replaceAll('estilo masculino', 'men’s style')
}

export function translateService(service: {
  name: string
  description?: string | null
}) {
  const key = String(service.name || '').trim().toLowerCase()
  const found = SERVICE_TRANSLATIONS[key]

  if (found) return found

  return {
    name: service.name,
    description:
      service.description ||
      'Professional service with a clean, detailed finish.',
  }
}

export function translateProduct(product: {
  name: string
  description?: string | null
}) {
  const key = String(product.name || '').trim().toLowerCase()
  const found = PRODUCT_TRANSLATIONS[key]

  if (found) return found

  return {
    name: product.name,
    description:
      product.description ||
      'Product available in-store. Ask us about availability during your visit.',
  }
}

export function translateReview(comment: string | null | undefined) {
  if (!comment) return ''

  const key = comment.trim().toLowerCase()
  return REVIEW_TRANSLATIONS[key] || comment
}