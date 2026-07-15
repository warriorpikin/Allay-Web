import {
  bodyFontStack,
  brandColors,
  escapeHtml,
  escapedTextToHtml,
  headingFontStack,
  renderButton,
  renderEmailShell,
  renderSupportFooter,
  renderSupportFooterText,
  safeUrl,
} from '../layouts/allayEmailLayout.js'

const EYEBROW_BY_TYPE = {
  standard: 'Allay House',
  announcement: 'Announcement',
  promotion: 'Special offer',
  coupon: 'Your coupon',
}

/**
 * Renders an admin-composed campaign email. `bodyText` is raw, unescaped
 * admin-entered plain text — it is escaped here before any HTML conversion,
 * so it can never inject markup, scripts, or event handlers.
 */
export function renderAdminCampaignEmail({
  emailType = 'standard',
  subject,
  preheader = '',
  heading = '',
  bodyText = '',
  imageUrl = '',
  imageAlt = '',
  ctaLabel = '',
  ctaUrl = '',
  recipientName = '',
  replyMode = 'default',
  supportEnabled = true,
  supportAddress = '',
  isTest = false,
}) {
  const eyebrow = EYEBROW_BY_TYPE[emailType] || EYEBROW_BY_TYPE.standard
  const greeting = recipientName ? `Hello ${escapeHtml(recipientName)},` : 'Hello,'
  const safeImage = safeUrl(imageUrl)
  const escapedBodyHtml = escapedTextToHtml(escapeHtml(bodyText))

  const testBannerHtml = isTest
    ? `<div style="margin:0 0 20px;padding:10px 14px;border-radius:10px;background:${brandColors.error}1A;border:1px solid ${brandColors.error};">
        <p style="margin:0;font-family:${bodyFontStack};font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${brandColors.error};">Test email &mdash; sent only to configured test recipients</p>
      </div>`
    : ''

  const innerHtml = `
    ${testBannerHtml}
    <p style="margin:0 0 10px;font-family:${bodyFontStack};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${brandColors.mutedBrown};">${escapeHtml(eyebrow)}</p>
    ${heading ? `<h1 style="margin:0 0 16px;font-family:${headingFontStack};font-size:28px;font-weight:500;line-height:1.2;color:${brandColors.espresso};">${escapeHtml(heading)}</h1>` : ''}
    <p style="margin:0 0 16px;font-family:${bodyFontStack};font-size:15px;line-height:1.7;color:${brandColors.espresso};">${greeting}</p>
    ${escapedBodyHtml}
    ${safeImage ? `<img src="${safeImage}" alt="${escapeHtml(imageAlt || 'Allay House')}" width="496" style="display:block;width:100%;max-width:496px;height:auto;border:0;outline:none;border-radius:12px;margin:8px 0 20px;" />` : ''}
    ${renderButton({ label: ctaLabel, url: ctaUrl })}
  `

  const footerHtml = renderSupportFooter({ replyMode, supportEnabled, supportAddress, mailSubject: subject })

  const html = renderEmailShell({
    preheader: `${isTest ? '[TEST] ' : ''}${preheader || subject}`,
    innerHtml,
    footerHtml,
  })

  const ctaText = ctaLabel && safeUrl(ctaUrl) ? `\n\n${ctaLabel}: ${ctaUrl}` : ''
  const text = `${isTest ? '[TEST EMAIL — sent only to configured test recipients]\n\n' : ''}${greeting}

${bodyText}${ctaText}

${renderSupportFooterText({ replyMode, supportEnabled, supportAddress })}

Allay House`

  return { subject, html, text }
}
