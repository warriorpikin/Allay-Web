export function calculateBookingTotal(selectedServices = [], discount = 0) {
  const subtotal = selectedServices.reduce((sum, service) => sum + Number(service.price || 0), 0)
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal)
  return { subtotal, discount: safeDiscount, total: subtotal - safeDiscount }
}

