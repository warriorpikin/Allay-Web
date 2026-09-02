export const ALLAY_WHATSAPP_NUMBER = String(import.meta.env.VITE_WHATSAPP_NUMBER || '2347012119202').replace(/\D/g, '')

export function membershipWhatsAppMessage(membership) {
  const price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(membership?.monthlyPrice || 0))
  return [
    'Hello Allay House, I would like to join a membership plan.',
    '',
    `Membership: ${membership?.name || 'Allay House membership'}`,
    `Monthly price: ${price}`,
    membership?.tagline ? `Plan: ${membership.tagline}` : null,
    '',
    'Please confirm availability, membership terms, and payment instructions. Thank you.',
  ].filter((line) => line !== null).join('\n')
}

export async function copyText(text) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    return copied
  }
}

export function clientWhatsAppHandoff(message) {
  return {
    url: `https://wa.me/${ALLAY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message || '')}`,
    message,
    prefilled: true,
    requiresCopy: false,
  }
}

export async function prepareWhatsAppHandoff(handoff) {
  if (!handoff?.url) throw new Error('WhatsApp is not configured.')
  if (!handoff.requiresCopy) return { copied: false }
  const copied = await copyText(handoff.message)
  if (!copied) throw new Error('The WhatsApp message could not be copied.')
  return { copied: true }
}
