import { query } from '../config/database.js'
import { env } from '../config/env.js'

async function logEmail({ recipient, subject, emailType, status, errorMessage = null, relatedWaitlistId = null, relatedBookingId = null }) {
  try {
    await query(
      `INSERT INTO email_logs (recipient, subject, email_type, status, error_message, related_booking_id, related_waitlist_id, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [recipient, subject, emailType, status, errorMessage, relatedBookingId, relatedWaitlistId, status === 'sent' ? new Date() : null],
    )
  } catch (error) {
    if (status !== 'skipped') throw error
    await query(
      `INSERT INTO email_logs (recipient, subject, email_type, status, error_message, related_booking_id, related_waitlist_id, sent_at)
       VALUES ($1, $2, $3, 'queued', $4, $5, $6, NULL)`,
      [recipient, subject, emailType, errorMessage || error.message, relatedBookingId, relatedWaitlistId],
    )
  }
}

async function sendViaResend({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend request failed (${response.status}): ${body}`)
  }
}

export async function sendEmail({ to, subject, html, emailType, relatedWaitlistId = null, relatedBookingId = null }) {
  if (!env.RESEND_API_KEY) {
    console.info(`[email] RESEND_API_KEY not configured — would send "${subject}" to ${to}`)
    await logEmail({ recipient: to, subject, emailType, status: 'skipped', errorMessage: 'RESEND_API_KEY not configured', relatedWaitlistId, relatedBookingId })
    return { sent: false }
  }

  try {
    await sendViaResend({ to, subject, html })
    await logEmail({ recipient: to, subject, emailType, status: 'sent', relatedWaitlistId, relatedBookingId })
    return { sent: true }
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error.message)
    await logEmail({ recipient: to, subject, emailType, status: 'failed', errorMessage: error.message, relatedWaitlistId, relatedBookingId })
    return { sent: false }
  }
}

function waitlistConfirmationHtml({ services }) {
  const serviceList = services.length
    ? `<ul style="padding-left:18px;margin:12px 0;color:#372418;">${services.map((service) => `<li style="margin-bottom:4px;">${service.name}</li>`).join('')}</ul>`
    : ''
  return `
    <div style="font-family:Georgia,serif;background:#F5F0EA;padding:32px;color:#372418;">
      <div style="max-width:480px;margin:0 auto;background:#F8F3ED;border-radius:18px;padding:32px;">
        <p style="letter-spacing:0.08em;text-transform:uppercase;font-size:12px;color:#7F6D5C;margin:0 0 12px;">Private opening access</p>
        <h1 style="font-size:26px;font-weight:500;margin:0 0 16px;">You're on the Allay House waitlist.</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Thank you for joining. You will be among the first to know when Allay House launches, with considered offers shaped around the experiences you selected.</p>
        ${serviceList ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#7F6D5C;margin:0 0 4px;">Your selected experiences</p>${serviceList}` : ''}
        <p style="font-size:15px;line-height:1.6;margin:16px 0 0;">With care,<br />Allay House</p>
      </div>
    </div>
  `
}

export async function sendWaitlistConfirmationEmail({ email, services = [], relatedWaitlistId = null }) {
  return sendEmail({
    to: email,
    subject: 'You are on the Allay House waitlist',
    html: waitlistConfirmationHtml({ services }),
    emailType: 'waitlist_confirmation',
    relatedWaitlistId,
  })
}

function launchCouponHtml({ couponCode, discountType, discountValue }) {
  const discountLabel = discountType === 'percent' ? `${discountValue}% off` : `₦${Number(discountValue).toLocaleString('en-NG')} off`
  return `
    <div style="font-family:Georgia,serif;background:#F5F0EA;padding:32px;color:#372418;">
      <div style="max-width:480px;margin:0 auto;background:#F8F3ED;border-radius:18px;padding:32px;">
        <p style="letter-spacing:0.08em;text-transform:uppercase;font-size:12px;color:#7F6D5C;margin:0 0 12px;">Allay House is open</p>
        <h1 style="font-size:26px;font-weight:500;margin:0 0 16px;">Your early access has arrived.</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">As promised, here is your considered launch offer of <strong>${discountLabel}</strong> for your first Allay House visit.</p>
        <p style="font-size:20px;letter-spacing:0.08em;text-align:center;background:#E7DED3;border-radius:12px;padding:14px;margin:0 0 16px;"><strong>${couponCode}</strong></p>
        <p style="font-size:15px;line-height:1.6;margin:0;">We look forward to welcoming you.<br />With care, Allay House</p>
      </div>
    </div>
  `
}

// Not triggered automatically anywhere — call this manually (e.g. one-off admin script or a future
// admin "send launch email" action) once launch mode goes live, to avoid an accidental mass-send.
export async function sendLaunchCouponEmail({ email, relatedWaitlistId = null }) {
  return sendEmail({
    to: email,
    subject: 'Allay House is open — your early access offer',
    html: launchCouponHtml({
      couponCode: env.WAITLIST_LAUNCH_COUPON_CODE,
      discountType: env.WAITLIST_LAUNCH_DISCOUNT_TYPE,
      discountValue: env.WAITLIST_LAUNCH_DISCOUNT_VALUE,
    }),
    emailType: 'waitlist_launch_offer',
    relatedWaitlistId,
  })
}
