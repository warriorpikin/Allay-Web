import { query } from '../config/database.js'

function normalizeCode(code = '') {
  return String(code).trim().toUpperCase()
}

function toMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100
}

async function getEligibleSubtotal(discountId, services) {
  const linked = await query('SELECT service_id FROM discount_code_services WHERE discount_code_id = $1', [discountId])
  if (!linked.rows.length) return services.filter((service) => service.is_discount_eligible !== false).reduce((sum, service) => sum + Number(service.price || 0), 0)
  const eligibleIds = new Set(linked.rows.map((row) => String(row.service_id)))
  return services
    .filter((service) => eligibleIds.has(String(service.id)) && service.is_discount_eligible !== false)
    .reduce((sum, service) => sum + Number(service.price || 0), 0)
}

function calculateDiscountAmount(discount, eligibleSubtotal, subtotal) {
  if (!eligibleSubtotal || !subtotal) return 0
  const raw = discount.discount_type === 'percentage'
    ? eligibleSubtotal * (Number(discount.discount_value) / 100)
    : Number(discount.discount_value)
  return toMoney(Math.min(Math.max(raw, 0), subtotal))
}

export async function validateDiscountCode({ code, services = [], subtotal = 0 }) {
  const normalizedCode = normalizeCode(code)
  if (!normalizedCode) {
    const error = new Error('Enter a discount code.')
    error.status = 400
    throw error
  }

  const result = await query(
    `SELECT *
     FROM discount_codes
     WHERE UPPER(code) = $1
     LIMIT 1`,
    [normalizedCode],
  )
  const discount = result.rows[0]
  if (!discount || !discount.is_active) {
    const error = new Error('This discount code is not active.')
    error.status = 404
    throw error
  }
  const now = new Date()
  if (discount.valid_from && new Date(discount.valid_from) > now) {
    const error = new Error('This discount code is not active yet.')
    error.status = 400
    throw error
  }
  if (discount.valid_until && new Date(discount.valid_until) < now) {
    const error = new Error('This discount code has expired.')
    error.status = 400
    throw error
  }
  if (Number(discount.used_count) >= Number(discount.usage_limit)) {
    const error = new Error('This discount code has already been used.')
    error.status = 400
    throw error
  }

  const safeSubtotal = toMoney(subtotal || services.reduce((sum, service) => sum + Number(service.price || 0), 0))
  const eligibleSubtotal = await getEligibleSubtotal(discount.id, services)
  const discountAmount = calculateDiscountAmount(discount, eligibleSubtotal, safeSubtotal)
  if (discountAmount <= 0) {
    const error = new Error('This discount code does not apply to the selected services.')
    error.status = 400
    throw error
  }

  return {
    id: discount.id,
    code: discount.code,
    discountType: discount.discount_type,
    discountValue: Number(discount.discount_value),
    discountAmount,
    total: toMoney(Math.max(safeSubtotal - discountAmount, 0)),
  }
}

export async function markDiscountCodeUsed(client, discountId) {
  if (!discountId) return
  const result = await client.query(
    `UPDATE discount_codes
     SET used_count = used_count + 1
     WHERE id = $1 AND used_count < usage_limit
     RETURNING id`,
    [discountId],
  )
  if (!result.rows[0]) {
    const error = new Error('This discount code is no longer available.')
    error.status = 409
    throw error
  }
}
