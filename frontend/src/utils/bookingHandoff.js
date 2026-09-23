import { clientWhatsAppHandoff } from './whatsapp.js'

const money = (value) => new Intl.NumberFormat('en-NG', {
  style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
}).format(Number(value || 0))

const priceOptions = (service) => {
  const options = service.priceOptions ?? service.price_options
  return Array.isArray(options) ? options.map(Number).filter(Number.isFinite) : []
}

export function hasVariablePrice(services = []) {
  return services.some((service) => priceOptions(service).length > 1
    || Boolean(service.priceIsFrom ?? service.price_is_from)
    || ((service.priceFrom ?? service.price_from) != null
      && (service.priceTo ?? service.price_to) != null
      && Number(service.priceTo ?? service.price_to) > Number(service.priceFrom ?? service.price_from)))
}

export function servicePriceLabel(service) {
  const options = priceOptions(service)
  const from = service.priceFrom ?? service.price_from
  const to = service.priceTo ?? service.price_to
  let label = money(service.price)
  if (options.length > 1) label = `${options.map(money).join(' / ')} options`
  else if (from != null && to != null && Number(to) > Number(from)) label = `${money(from)}–${money(to)}`
  else if (service.priceIsFrom ?? service.price_is_from) label = `From ${money(service.price)}`
  const unit = service.priceUnitLabel ?? service.price_unit_label
  return unit ? `${label} ${unit}` : label
}

function displayDate(value) {
  const raw = String(value || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw || 'To be confirmed'
  const date = new Date(`${raw}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? raw
    : new Intl.DateTimeFormat('en-NG', { dateStyle: 'full', timeZone: 'UTC' }).format(date)
}

export function bookingWhatsAppMessage(confirmation) {
  const saved = confirmation.saveState !== 'unverified' && Boolean(confirmation.reference)
  const lines = [
    'Hello Allay House, I would like to request a booking and an invoice.',
    '',
    saved ? `BOOKING CODE: ${confirmation.reference}` : 'BOOKING REQUEST: Website save not verified',
    saved ? 'STATUS: Pending manual confirmation — unpaid' : 'STATUS: Request only — availability and payment not confirmed',
    '',
    'CUSTOMER',
    `Name: ${confirmation.customer?.fullName || ''}`,
    `Email: ${confirmation.customer?.email || ''}`,
    `Phone: ${confirmation.customer?.phone || ''}`,
    '',
    'PREFERRED APPOINTMENT',
    `Date: ${displayDate(confirmation.date)}`,
    `Time: ${String(confirmation.time || '').slice(0, 5)} WAT (Nigeria)`,
    `Total duration: ${Number(confirmation.totalDurationMinutes || 0)} minutes`,
    '',
    'SERVICES',
    ...(confirmation.services || []).map((service, index) => {
      const duration = service.durationLabel || service.duration_label
        || `${Number(service.durationMinutes ?? service.duration_minutes ?? 0)} minutes`
      return `${index + 1}. ${service.name} — ${servicePriceLabel(service)} — ${duration}`
    }),
    '',
    'PRICE SUMMARY',
    `Subtotal: ${money(confirmation.subtotal)}`,
    `Discount: ${money(confirmation.discountAmount)}`,
    ...(confirmation.discountCode ? [`Discount code: ${confirmation.discountCode}`] : []),
    `${confirmation.priceIsEstimated || !saved ? 'Estimated total' : 'Total'}: ${money(confirmation.totalAmount)}`,
  ]
  if (confirmation.customerNote) lines.push('', `Customer note: ${confirmation.customerNote}`)
  if (!saved) lines.push('', 'The website could not verify that this request was saved. Please check for an existing request using my email, phone and appointment details before creating another. Please verify the prices, discount and availability.')
  else if (confirmation.priceIsEstimated) lines.push('', 'Some services have variable pricing. Please confirm the final total.')
  lines.push('', 'Please confirm availability and the final amount, then send me an invoice so I can make payment. Thank you.')
  return lines.join('\n')
}

export function buildBookingConfirmation({ booking, totals, discountCode = '', response = null }) {
  const server = response?.confirmation || {}
  const reference = server.reference || response?.bookingReference || null
  const services = (server.services || booking.services).map((service) => ({
    ...booking.services.find((selected) => (service.id && selected.id === service.id) || (service.slug && selected.slug === service.slug)),
    ...service,
  }))
  const confirmation = {
    ...server,
    reference,
    saveState: reference ? 'saved' : 'unverified',
    status: reference ? (server.status || 'pending') : 'request_only',
    customer: { ...booking.customer, ...server.customer },
    services,
    date: String(server.date || booking.date).slice(0, 10),
    time: String(server.time || booking.time).slice(0, 5),
    totalDurationMinutes: server.totalDurationMinutes ?? totals.totalDuration,
    subtotal: server.subtotal ?? totals.subtotal,
    discountAmount: server.discountAmount ?? totals.discount,
    totalAmount: server.totalAmount ?? totals.total,
    discountCode: server.discountCode ?? discountCode,
    customerNote: server.customerNote ?? booking.note ?? '',
    priceIsEstimated: !reference || Boolean(server.priceIsEstimated) || hasVariablePrice(services) || hasVariablePrice(booking.services),
    emailSent: Boolean(reference && server.emailSent),
  }
  // Always build the complete message and use the owner-supplied destination;
  // old API responses may have a short link or no WhatsApp payload at all.
  confirmation.whatsapp = clientWhatsAppHandoff(bookingWhatsAppMessage(confirmation))
  return confirmation
}

export function canContinueAsWhatsAppRequest(error) {
  const status = error?.response?.status
  // Validation, authentication, pre-launch restrictions and slot conflicts are
  // deliberate rejections, not outages. Never silently turn them into success.
  return !status || [404, 405, 408, 429].includes(status) || status >= 500
}

export async function submitBookingForWhatsApp(details, createBooking) {
  const { booking, discountCode = '' } = details
  let response
  try {
    response = await createBooking({
      customerName: booking.customer.fullName.trim(),
      customerEmail: booking.customer.email.trim(),
      customerPhone: booking.customer.phone.trim(),
      selectedServices: booking.services,
      appointmentDate: booking.date,
      preferredTime: booking.time,
      discountCode,
      customerNote: booking.note,
    })
  } catch (error) {
    if (!canContinueAsWhatsAppRequest(error)) throw error
    // A timeout can happen after a commit. Do not retry the POST, invent a
    // booking code, or claim the booking failed/succeeded; ask the team to check.
    response = null
  }
  return buildBookingConfirmation({ ...details, response })
}

export function persistBookingConfirmation(confirmation) {
  try {
    sessionStorage.setItem('allay:lastBookingConfirmation', JSON.stringify(confirmation))
    return true
  } catch {
    // Blocked/full browser storage must never block opening WhatsApp.
    return false
  }
}

export function recordHandoffWithoutWaiting(reference, recordHandoff) {
  if (!reference) return
  try { Promise.resolve(recordHandoff(reference)).catch(() => {}) } catch { /* optional telemetry */ }
}
