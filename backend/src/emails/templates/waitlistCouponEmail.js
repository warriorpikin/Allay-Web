import { env } from '../../config/env.js'
import {
  bodyFontStack,
  brandColors,
  escapeHtml,
  formatCurrency,
  headingFontStack,
  renderButton,
  renderEmailShell,
  renderSupportFooter,
  renderSupportFooterText,
} from '../layouts/allayEmailLayout.js'

function discountLabel(discountType, discountValue) {
  return discountType === 'fixed' ? `${formatCurrency(discountValue)} off` : `${Number(discountValue)}% off`
}

// Never trusts a price/discount submitted by the client — `services` here
// must already come from an authoritative DB read (see waitlistService.js).
function calculateDiscountedPrice(price, discountType, discountValue) {
  const numericPrice = Number(price)
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return null
  const raw = discountType === 'fixed'
    ? numericPrice - Number(discountValue)
    : numericPrice * (1 - Number(discountValue) / 100)
  return Math.max(0, Math.round(raw))
}

function serviceRowHtml(service, discountType, discountValue) {
  const price = Number(service.price)
  const hasPrice = Number.isFinite(price) && price > 0
  const discounted = hasPrice ? calculateDiscountedPrice(price, discountType, discountValue) : null
  const priceHtml = !hasPrice
    ? '<span>Price available on request</span>'
    : discounted !== null
      ? `<span style="text-decoration:line-through;color:${brandColors.taupe};">${formatCurrency(price)}</span> &nbsp; <strong style="color:${brandColors.espresso};">${formatCurrency(discounted)}</strong>`
      : `<span>${formatCurrency(price)}</span>`

  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid ${brandColors.stone};">
      <p style="margin:0 0 3px;font-family:${bodyFontStack};font-size:14px;font-weight:700;color:${brandColors.espresso};">${escapeHtml(service.name)}</p>
      <p style="margin:0;font-family:${bodyFontStack};font-size:13px;color:${brandColors.mutedBrown};">${priceHtml}</p>
    </td>
  </tr>`
}

function serviceRowText(service, discountType, discountValue) {
  const price = Number(service.price)
  const hasPrice = Number.isFinite(price) && price > 0
  const discounted = hasPrice ? calculateDiscountedPrice(price, discountType, discountValue) : null
  if (!hasPrice) return `- ${service.name}`
  if (discounted === null) return `- ${service.name}: ${formatCurrency(price)}`
  return `- ${service.name}: ${formatCurrency(price)} -> ${formatCurrency(discounted)}`
}

/**
 * Renders the waitlist coupon email in both HTML and plain-text. `services`
 * must be authoritative rows { name, price } already resolved server-side.
 */
export function renderWaitlistCouponEmail({
  fullName,
  couponCode,
  discountType = 'percent',
  discountValue = 15,
  services = [],
  isTest = false,
}) {
  const safeName = escapeHtml(fullName || 'there')
  const label = discountLabel(discountType, discountValue)
  const websiteUrl = env.ALLAY_SERVICES_URL
  const subjectLine = isTest ? '[TEST] Your Allay House launch offer' : 'Allay House is open — your early access offer'

  const testBannerHtml = isTest
    ? `<div style="margin:0 0 20px;padding:10px 14px;border-radius:10px;background:${brandColors.error}1A;border:1px solid ${brandColors.error};">
        <p style="margin:0;font-family:${bodyFontStack};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${brandColors.error};">Test email &mdash; not a real coupon</p>
      </div>`
    : ''

  const servicesHtml = services.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">${services.map((service) => serviceRowHtml(service, discountType, discountValue)).join('')}</table>`
    : ''

  const innerHtml = `
    ${testBannerHtml}
    <p style="margin:0 0 10px;font-family:${bodyFontStack};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${brandColors.mutedBrown};">Allay House is open</p>
    <h1 style="margin:0 0 16px;font-family:${headingFontStack};font-size:30px;font-weight:500;line-height:1.15;color:${brandColors.espresso};">Hello ${safeName}, your early access has arrived.</h1>
    <p style="margin:0 0 22px;font-family:${bodyFontStack};font-size:15px;line-height:1.7;color:${brandColors.espresso};">As promised, here is your considered launch offer of <strong>${escapeHtml(label)}</strong> for your first Allay House visit.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td align="center" style="background:${brandColors.stone};border-radius:12px;padding:18px;">
          <p style="margin:0 0 6px;font-family:${bodyFontStack};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${brandColors.mutedBrown};">Copy this code</p>
          <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:700;letter-spacing:0.14em;color:${brandColors.espresso};user-select:all;">${escapeHtml(couponCode)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:8px 0 26px;font-family:${bodyFontStack};font-size:12px;color:${brandColors.mutedBrown};text-align:center;">Tap and hold (or select) the code above to copy it.</p>

    ${services.length ? `<p style="margin:0 0 8px;font-family:${bodyFontStack};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${brandColors.mutedBrown};">Your selected experiences</p>${servicesHtml}` : ''}

    ${renderButton({ label: 'View Your Selected Services', url: websiteUrl })}

    <p style="margin:20px 0 0;font-family:${bodyFontStack};font-size:12px;line-height:1.6;color:${brandColors.mutedBrown};">Enter this code at checkout on the Allay House website. One code per customer; standard terms apply.</p>
  `

  const footerHtml = renderSupportFooter({
    replyMode: env.EMAIL_DEFAULT_REPLY_TO ? 'default' : 'none',
    supportEnabled: Boolean(env.EMAIL_SUPPORT_ADDRESS),
    supportAddress: env.EMAIL_SUPPORT_ADDRESS,
    mailSubject: 'Your Allay House Coupon',
  })

  const html = renderEmailShell({
    preheader: `${isTest ? '[TEST] ' : ''}Your ${label} Allay House launch code: ${couponCode}`,
    innerHtml,
    footerHtml,
  })

  const servicesText = services.length
    ? `\n\nYour selected experiences:\n${services.map((service) => serviceRowText(service, discountType, discountValue)).join('\n')}`
    : ''

  const text = `${isTest ? '[TEST EMAIL — not a real coupon]\n\n' : ''}Hello ${fullName || 'there'}, your early access has arrived.

As promised, here is your considered launch offer of ${label} for your first Allay House visit.

Your coupon code: ${couponCode}
${servicesText}

View your selected services: ${websiteUrl}

Enter this code at checkout on the Allay House website. One code per customer; standard terms apply.

${renderSupportFooterText({
  replyMode: env.EMAIL_DEFAULT_REPLY_TO ? 'default' : 'none',
  supportEnabled: Boolean(env.EMAIL_SUPPORT_ADDRESS),
  supportAddress: env.EMAIL_SUPPORT_ADDRESS,
})}

Allay House`

  return { subject: subjectLine, html, text }
}
