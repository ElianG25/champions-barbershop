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

// No hay un servicio de traducción real conectado: los nombres y
// descripciones de productos y el texto de las reseñas se muestran tal cual
// los escribió el negocio (en español) también en la versión en inglés del
// sitio. Si en el futuro se agrega traducción automática o campos editables
// en el admin (ej. name_en/description_en), esta es la función a actualizar.
export function translateBusinessDescription(description: string | null | undefined) {
  if (!description) {
    return 'Champions Barbershop combines technique, precision and a polished experience so you can book without calls or waiting.'
  }

  return description
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
  return {
    name: product.name,
    description:
      product.description ||
      'Product available in-store. Ask us about availability during your visit.',
  }
}

export function translateReview(comment: string | null | undefined) {
  return comment || ''
}