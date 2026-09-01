import { env } from '../config/env.js'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatDate(value) {
  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw || 'To be confirmed'
  const [year, month, day] = raw.split('-').map(Number)
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

function servicePriceNote(service) {
  const options = Array.isArray(service.price_options) ? service.price_options.map(Number).filter(Number.isFinite) : []
  if (options.length > 1) return `${options.map(formatCurrency).join(' / ')} options`

  const from = Number(service.price_from)
  const to = Number(service.price_to)
  if (Number.isFinite(from) && Number.isFinite(to) && to > from) return `${formatCurrency(from)}–${formatCurrency(to)}`

  const label = service.price_is_from ? `From ${formatCurrency(service.price)}` : formatCurrency(service.price)
  return service.price_unit_label ? `${label} ${service.price_unit_label}` : label
}

export function hasVariableBookingPrice(services = []) {
  return services.some((service) => {
    const options = Array.isArray(service.price_options) ? service.price_options : []
    return options.length > 1
      || Boolean(service.price_is_from)
      || (service.price_from != null && service.price_to != null && Number(service.price_to) > Number(service.price_from))
  })
}

export function buildWhatsAppMessage({ booking, services = [] }) {
  const variablePrice = hasVariableBookingPrice(services)
  const serviceLines = services.map((service, index) => `${index + 1}. ${service.name} — ${servicePriceNote(service)}`)
  const lines = [
    'Hello Allay House, I would like to complete this booking request.',
    '',
    `BOOKING CODE: ${booking.booking_reference}`,
    'STATUS: Pending manual confirmation',
    '',
    'CUSTOMER',
    `Name: ${booking.customer_name}`,
    `Email: ${booking.customer_email}`,
    `Phone: ${booking.customer_phone}`,
    '',
    'PREFERRED APPOINTMENT',
    `Date: ${formatDate(booking.appointment_date)}`,
    `Time: ${String(booking.start_time || '').slice(0, 5)}`,
    '',
    'SERVICES',
    ...serviceLines,
    '',
    'PRICE SUMMARY',
    `Subtotal: ${formatCurrency(booking.subtotal)}`,
    `Discount: ${formatCurrency(booking.discount_amount)}`,
    `${variablePrice ? 'Estimated total' : 'Total'}: ${formatCurrency(booking.total_amount)}`,
  ]

  if (booking.customer_note) lines.push('', `Customer note: ${booking.customer_note}`)
  if (variablePrice) lines.push('', 'Some selected services have “from”, range, or option-based pricing. Please confirm the final total.')
  lines.push('', 'Please confirm availability, the final price, and payment instructions. Thank you.')
  return lines.join('\n')
}

export function buildWhatsAppHandoff({ booking, services = [] }) {
  const message = buildWhatsAppMessage({ booking, services })
  const number = String(env.ALLAY_WHATSAPP_NUMBER || '').replace(/\D/g, '')
  const hasDirectNumber = number.length >= 10

  return {
    provider: 'whatsapp',
    url: hasDirectNumber
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : env.ALLAY_WHATSAPP_SHORT_LINK,
    message,
    prefilled: hasDirectNumber,
    requiresCopy: !hasDirectNumber,
  }
}
