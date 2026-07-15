// Shared, email-safe building blocks used by every outgoing Allay House email
// (waitlist coupon, admin campaigns). Inspired by the admin login page
// (frontend/src/pages/admin/AdminLogin.jsx + styles/admin.css): a warm
// espresso/cream palette, a serif display heading over a soft sans body, a
// centered rounded card over a full-bleed background image with a solid
// color fallback. Converted to table-based, inline-styled HTML because email
// clients cannot render React components, external stylesheets, or modern
// CSS layout.
import { env } from '../../config/env.js'

// Allay House brand palette (frontend/src/styles/variables.css), duplicated
// here in hex because emails can't read CSS custom properties.
export const brandColors = {
  ivory: '#F5F0EA',
  cream: '#F8F3ED',
  stone: '#E7DED3',
  beige: '#D6C9BA',
  taupe: '#A6917C',
  mutedBrown: '#7F6D5C',
  espresso: '#372418',
  brown: '#684A36',
  charcoalBrown: '#2B211B',
  error: '#8A4B3B',
}

// Georgia/Times New Roman fallback because "Cormorant Garamond" (the brand
// display font, frontend/src/styles/variables.css --font-heading) is a
// self-hosted web font most email clients block entirely.
export const headingFontStack = '"Cormorant Garamond", Georgia, "Times New Roman", serif'
export const bodyFontStack = 'Arial, Helvetica, sans-serif'

export function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0))
}

// Only allow http(s) URLs into href/src attributes so escaped user- or
// admin-supplied links can never become a javascript: or data: URI.
export function safeUrl(value) {
  const trimmed = String(value || '').trim()
  if (!/^https?:\/\//i.test(trimmed)) return ''
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed)
    return trimmed
  } catch {
    return ''
  }
}

// Converts escaped, plain-text paragraphs (already HTML-escaped by the
// caller) into <p> blocks, turning blank lines into paragraph breaks and
// single newlines into <br>. Never call this on raw/unescaped input.
export function escapedTextToHtml(escapedText = '') {
  return String(escapedText)
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${brandColors.espresso};">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function renderButton({ label, url }) {
  const safeHref = safeUrl(url)
  if (!label || !safeHref) return ''
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" bgcolor="${brandColors.espresso}" style="border-radius:999px;">
          <a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:15px 34px;font-family:${bodyFontStack};font-size:14px;font-weight:600;letter-spacing:0.04em;color:${brandColors.cream};text-decoration:none;border-radius:999px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`
}

function buildMailtoHref({ address, subject, body }) {
  if (!address) return ''
  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return `mailto:${address}${params.length ? `?${params.join('&')}` : ''}`
}

// Renders the footer's support/reply section. Two distinct concepts, kept
// separate per spec: the Reply-To header (how a normal reply routes) vs this
// visible mailto: link (a support contact the recipient can click).
export function renderSupportFooter({ replyMode = 'default', supportEnabled = true, supportAddress = '', mailSubject = '' }) {
  const rows = []

  if (replyMode === 'none') {
    rows.push(`<p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${brandColors.mutedBrown};">This message was sent from an address that is not monitored. Please do not reply directly to this email.</p>`)
  } else {
    rows.push(`<p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${brandColors.mutedBrown};">You may reply directly to this email and our team will see it.</p>`)
  }

  if (supportEnabled && supportAddress) {
    const mailto = buildMailtoHref({
      address: supportAddress,
      subject: mailSubject ? `Regarding: ${mailSubject}` : 'Regarding your Allay House email',
      body: mailSubject ? `Hello Allay House,\n\nI am contacting you regarding the email titled "${mailSubject}".` : '',
    })
    rows.push(`<p style="margin:0;font-size:12px;line-height:1.6;color:${brandColors.mutedBrown};">Need help? Contact <a href="${escapeHtml(mailto)}" style="color:${brandColors.brown};">${escapeHtml(supportAddress)}</a></p>`)
  }

  return rows.join('')
}

export function renderSupportFooterText({ replyMode = 'default', supportEnabled = true, supportAddress = '' }) {
  const lines = []
  if (replyMode === 'none') lines.push('This message was sent from an address that is not monitored. Please do not reply directly to this email.')
  else lines.push('You may reply directly to this email and our team will see it.')
  if (supportEnabled && supportAddress) lines.push(`Need help? Contact ${supportAddress}`)
  return lines.join('\n')
}

/**
 * Wraps templated inner HTML in the full, table-based, Outlook-safe email
 * shell: preheader, background image with solid-color fallback, centered
 * card, logo, and closing footer. `innerHtml` must already be fully rendered
 * (escaped where needed) — this function does not escape its input.
 */
export function renderEmailShell({ preheader = '', innerHtml = '', footerHtml = '', backgroundUrl = env.ALLAY_EMAIL_BACKGROUND_URL, logoUrl = env.ALLAY_EMAIL_LOGO_URL }) {
  const safeBackground = safeUrl(backgroundUrl)
  const safeLogo = safeUrl(logoUrl)

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<title>Allay House</title>
</head>
<body style="margin:0;padding:0;background-color:${brandColors.ivory};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${brandColors.ivory};${safeBackground ? `background-image:url('${safeBackground}');background-position:center top;background-repeat:no-repeat;background-size:cover;` : ''}">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 20px;">
              ${safeLogo ? `<img src="${safeLogo}" alt="Allay House" width="132" style="display:block;max-width:132px;height:auto;border:0;outline:none;" />` : `<span style="font-family:${headingFontStack};font-size:24px;color:${brandColors.espresso};letter-spacing:0.04em;">Allay House</span>`}
            </td>
          </tr>
          <tr>
            <td style="background-color:${brandColors.cream};border-radius:18px;padding:36px 32px;box-shadow:0 12px 35px rgba(55,36,24,0.10);">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 20px 6px;">
              ${footerHtml}
              <p style="margin:14px 0 0;font-size:11px;line-height:1.6;color:${brandColors.mutedBrown};text-align:center;">Allay House &middot; Lagos, Nigeria</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
