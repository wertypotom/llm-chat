export interface PageContextField {
  id: string
  name: string
  type: string
  value: string | boolean
  placeholder: string
}

export function capturePageState(): PageContextField[] {
  if (typeof document === 'undefined') return []

  const fields: PageContextField[] = []
  const inputs = document.querySelectorAll('input, select, textarea')

  inputs.forEach((node) => {
    const el = node as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

    // Skip hidden or irrelevant fields
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return

    fields.push({
      id: el.id || '',
      name: el.name || '',
      type: el.type || el.tagName.toLowerCase(),
      value:
        el.type === 'checkbox' || el.type === 'radio' ? (el as HTMLInputElement).checked : el.value,
      placeholder: el instanceof HTMLSelectElement ? '' : el.placeholder || '',
    })
  })

  return fields
}
