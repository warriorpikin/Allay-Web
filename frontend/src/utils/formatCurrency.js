export function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0)
}

// A price of exactly 0 means "not yet set" in this schema (services.price defaults to 0) —
// show that honestly instead of an inviting-looking "₦0".
export function formatPriceLabel(amount, currency = 'NGN') {
  return Number(amount) > 0 ? formatCurrency(amount, currency) : 'Price available on request'
}

