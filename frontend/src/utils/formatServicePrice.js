import { formatCurrency } from './formatCurrency'

// Shared by the admin service table and every public price display so a
// service's price/range/"from"/per-unit fields only ever get formatted one
// way across the app.
export function formatServicePrice(service = {}) {
  const { price, priceFrom, priceTo, priceIsFrom, priceUnitLabel, priceOptions } = service
  let base

  if (Array.isArray(priceOptions) && priceOptions.length > 1) {
    base = priceOptions.map((option) => formatCurrency(option)).join(' • ')
  } else if (priceFrom != null && priceTo != null && Number(priceTo) > Number(priceFrom)) {
    base = `${formatCurrency(priceFrom)}–${formatCurrency(priceTo)}`
  } else if (priceIsFrom && (priceFrom != null || price)) {
    base = `From ${formatCurrency(priceFrom ?? price)}`
  } else {
    base = formatCurrency(price)
  }

  return priceUnitLabel ? `${base} ${priceUnitLabel}` : base
}
