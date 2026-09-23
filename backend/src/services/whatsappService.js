const ALLAY_WHATSAPP_NUMBER = '2347012119202'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
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
  let label = service.price_is_from ? `From ${formatCurrency(service.price)}` : formatCurrency(service.price)
  if (options.length > 1) label = `${options.map(formatCurrency).join(' / ')} options`
  else if (service.price_from != null && service.price_to != null && Number(service.price_to) > Number(service.price_from)) {
    label = `${formatCurrency(service.price_from)}–${formatCurrency(service.price_to)}`
  }
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
  const serviceLines = services.map((service, index) => {
    const duration = service.duration_label || `${Number(service.duration_minutes || 0)} minutes`
    return `${index + 1}. ${service.name} — ${servicePriceNote(service)} — ${duration}`
  })
  const lines = [
    'Hello Allay House, I would like to request a booking and an invoice.',
    '',
    `BOOKING CODE: ${booking.booking_reference}`,
    'STATUS: Pending manual confirmation — unpaid',
    '',
    'CUSTOMER',
    `Name: ${booking.customer_name}`,
    `Email: ${booking.customer_email}`,
    `Phone: ${booking.customer_phone}`,
    '',
    'PREFERRED APPOINTMENT',
    `Date: ${formatDate(booking.appointment_date)}`,
    `Time: ${String(booking.start_time || '').slice(0, 5)} WAT (Nigeria)`,
    `Total duration: ${Number(booking.total_duration_minutes || 0)} minutes`,
    '',
    'SERVICES',
    ...serviceLines,
    '',
    'PRICE SUMMARY',
    `Subtotal: ${formatCurrency(booking.subtotal)}`,
    `Discount: ${formatCurrency(booking.discount_amount)}`,
    ...(booking.discount_code ? [`Discount code: ${booking.discount_code}`] : []),
    `${variablePrice ? 'Estimated total' : 'Total'}: ${formatCurrency(booking.total_amount)}`,
  ]
  if (booking.customer_note) lines.push('', `Customer note: ${booking.customer_note}`)
  if (variablePrice) lines.push('', 'Some selected services have “from”, range, or option-based pricing. Please confirm the final total.')
  lines.push('', 'Please confirm availability and the final amount, then send me an invoice so I can make payment. Thank you.')
  return lines.join('\n')
}

export function buildWhatsAppHandoff({ booking, services = [] }) {
  const message = buildWhatsAppMessage({ booking, services })
  return {
    provider: 'whatsapp',
    url: `https://wa.me/${ALLAY_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    message,
    prefilled: true,
    requiresCopy: false,
  }
}
