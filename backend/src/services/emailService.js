import { query } from '../config/database.js'
import { env } from '../config/env.js'
import { escapeHtml, formatCurrency } from '../emails/layouts/allayEmailLayout.js'
import { renderWaitlistCouponEmail } from '../emails/templates/waitlistCouponEmail.js'
import { getOrCreateWaitlistLaunchDiscount } from './discountService.js'

function formatServices(services = []) {
  return services.map((service) => `<li style="margin-bottom:8px;"><strong>${escapeHtml(service.name || service.service_name)}</strong><br><span>${Number(service.duration_minutes || service.durationMinutes || 0)} minutes / ${formatCurrency(service.price)}</span></li>`).join('')
}

function textServices(services = []) {
  return services.map((service) => `- ${service.name || service.service_name}: ${Number(service.duration_minutes || service.durationMinutes || 0)} minutes / ${formatCurrency(service.price)}`).join('\n')
}

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

// `replyTo: null` explicitly omits the Reply-To header (no-reply mode); `undefined`
// (the default) falls back to the configured default reply-to address.
async function sendViaResend({ to, subject, html, text, from, replyTo }) {
  const payload = { from: from || env.EMAIL_FROM, to, subject, html, text }
  const resolvedReplyTo = replyTo === null ? '' : (replyTo || env.EMAIL_DEFAULT_REPLY_TO)
  if (resolvedReplyTo) payload.reply_to = resolvedReplyTo
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    const error = new Error(`Resend request failed (${response.status}): ${body}`)
    error.providerStatus = response.status
    throw error
  }
  return response.json().catch(() => ({}))
}

export async function sendEmail({ to, subject, html, text, emailType, from, replyTo, relatedWaitlistId = null, relatedBookingId = null }) {
  if (!env.RESEND_API_KEY) {
    console.info(`[email] RESEND_API_KEY not configured — would send "${subject}" to ${to}`)
    await logEmail({ recipient: to, subject, emailType, status: 'skipped', errorMessage: 'RESEND_API_KEY not configured', relatedWaitlistId, relatedBookingId })
    return { sent: false }
  }

  try {
    const result = await sendViaResend({ to, subject, html, text, from, replyTo })
    await logEmail({ recipient: to, subject, emailType, status: 'sent', relatedWaitlistId, relatedBookingId })
    return { sent: true, providerMessageId: result?.id || null }
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error.message)
    await logEmail({ recipient: to, subject, emailType, status: 'failed', errorMessage: error.message, relatedWaitlistId, relatedBookingId })
    return { sent: false, error: error.message, providerStatus: error.providerStatus || null }
  }
}

function bookingConfirmationHtml({ booking, services = [] }) {
  const privacyUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/privacy-policy`
  const termsUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/terms-of-use`
  return `
    <div style="font-family:Georgia,serif;background:#F5F0EA;padding:32px;color:#372418;">
      <div style="max-width:560px;margin:0 auto;background:#F8F3ED;border-radius:18px;padding:32px;">
        <p style="letter-spacing:0.08em;text-transform:uppercase;font-size:12px;color:#7F6D5C;margin:0 0 12px;">Booking confirmed</p>
        <h1 style="font-size:28px;font-weight:500;margin:0 0 16px;">Your Allay House session is booked.</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 18px;">Hello ${escapeHtml(booking.customer_name)}, your booking details are confirmed below. Please contact Allay House if anything looks incorrect.</p>
        <div style="border:1px solid #DFD4C8;border-radius:14px;padding:18px;margin-bottom:18px;">
          <p><strong>Reference:</strong> ${escapeHtml(booking.booking_reference)}</p>
          <p><strong>Date:</strong> ${escapeHtml(booking.appointment_date)}</p>
          <p><strong>Time:</strong> ${escapeHtml(String(booking.start_time).slice(0, 5))}</p>
          <p><strong>Total duration:</strong> ${Number(booking.total_duration_minutes || 0)} minutes</p>
          <p><strong>Total:</strong> ${formatCurrency(booking.total_amount)}</p>
        </div>
        <p style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#7F6D5C;margin:0 0 8px;">Selected services</p>
        <ul style="padding-left:18px;margin:0 0 18px;">${formatServices(services)}</ul>
        <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">Please arrive a few minutes early so we can welcome you calmly. If you need to change your booking, contact Allay House using the details on the website.</p>
        <p style="font-size:12px;line-height:1.6;margin:0;"><a href="${privacyUrl}" style="color:#5F4A3A;">Privacy Policy</a> / <a href="${termsUrl}" style="color:#5F4A3A;">Terms of Use</a></p>
      </div>
    </div>
  `
}

function bookingConfirmationText({ booking, services = [] }) {
  return `Your Allay House session is booked.

Reference: ${booking.booking_reference}
Name: ${booking.customer_name}
Date: ${booking.appointment_date}
Time: ${String(booking.start_time).slice(0, 5)}
Duration: ${Number(booking.total_duration_minutes || 0)} minutes
Total: ${formatCurrency(booking.total_amount)}

Services:
${textServices(services)}

Please contact Allay House if any detail is incorrect.`
}

function adminBookingHtml({ booking, services = [] }) {
  const adminUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/allay-admin/bookings/${booking.id}`
  return `
    <div style="font-family:Arial,sans-serif;background:#F5F0EA;padding:28px;color:#372418;">
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;">
        <h1 style="margin:0 0 14px;">New Allay House booking</h1>
        <p><strong>Reference:</strong> ${escapeHtml(booking.booking_reference)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(booking.customer_name)} / ${escapeHtml(booking.customer_email)} / ${escapeHtml(booking.customer_phone)}</p>
        <p><strong>Date and time:</strong> ${escapeHtml(booking.appointment_date)} at ${escapeHtml(String(booking.start_time).slice(0, 5))}</p>
        <p><strong>Total:</strong> ${formatCurrency(booking.total_amount)}</p>
        ${booking.customer_note ? `<p><strong>Customer note:</strong> ${escapeHtml(booking.customer_note)}</p>` : ''}
        <ul>${formatServices(services)}</ul>
        <p><a href="${adminUrl}">Open booking in admin</a></p>
      </div>
    </div>
  `
}

function adminBookingText({ booking, services = [] }) {
  return `New Allay House booking

Reference: ${booking.booking_reference}
Customer: ${booking.customer_name} / ${booking.customer_email} / ${booking.customer_phone}
Date and time: ${booking.appointment_date} at ${String(booking.start_time).slice(0, 5)}
Total: ${formatCurrency(booking.total_amount)}
Customer note: ${booking.customer_note || '-'}

Services:
${textServices(services)}`
}

export async function sendBookingEmails({ booking, services = [] }) {
  const customerEmail = await sendEmail({
    to: booking.customer_email,
    subject: `Allay House booking confirmed: ${booking.booking_reference}`,
    html: bookingConfirmationHtml({ booking, services }),
    text: bookingConfirmationText({ booking, services }),
    emailType: 'booking_confirmation',
    relatedBookingId: booking.id,
  })

  const adminRecipient = env.ADMIN_EMAIL || env.ADMIN_NOTIFICATION_EMAIL
  const adminEmail = adminRecipient ? await sendEmail({
    to: adminRecipient,
    subject: `New Allay House booking: ${booking.booking_reference}`,
    html: adminBookingHtml({ booking, services }),
    text: adminBookingText({ booking, services }),
    emailType: 'booking_admin_notification',
    relatedBookingId: booking.id,
  }) : { sent: false }

  return { customer: customerEmail.sent, admin: adminEmail.sent }
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
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Thank you for joining. You will be among the first to know when Allay House launches, and your 15% first-booking discount code will be sent by email when bookings officially open.</p>
        ${serviceList ? `<p style="font-size:13px;text-transform:uppercase;letter-spacing:0.06em;color:#7F6D5C;margin:0 0 4px;">Your selected experiences</p>${serviceList}` : ''}
        <p style="font-size:15px;line-height:1.6;margin:16px 0 0;">With care,<br />Allay House</p>
      </div>
    </div>
  `
}

function waitlistConfirmationText({ services }) {
  const serviceList = services.length ? `\n\nSelected experiences:\n${services.map((service) => `- ${service.name}`).join('\n')}` : ''
  return `You are on the Allay House waitlist.

Thank you for joining. You will be among the first to know when Allay House launches, and your 15% first-booking discount code will be sent by email when bookings officially open.${serviceList}

With care,
Allay House`
}

export async function sendWaitlistConfirmationEmail({ email, services = [], relatedWaitlistId = null }) {
  return sendEmail({
    to: email,
    subject: 'You are on the Allay House waitlist',
    html: waitlistConfirmationHtml({ services }),
    text: waitlistConfirmationText({ services }),
    emailType: 'waitlist_confirmation',
    relatedWaitlistId,
  })
}

async function getWaitlistEntryForCoupon(waitlistEntryId) {
  const entryResult = await query('SELECT id, full_name AS "fullName", email FROM waitlist_entries WHERE id = $1', [waitlistEntryId])
  const entry = entryResult.rows[0]
  if (!entry) return null
  const servicesResult = await query(
    `SELECT s.name, s.price
     FROM waitlist_selected_services wss
     JOIN services s ON s.id = wss.service_id
     WHERE wss.waitlist_entry_id = $1
     ORDER BY s.display_order ASC, s.name ASC`,
    [waitlistEntryId],
  )
  return { ...entry, services: servicesResult.rows }
}

// Triggered by the admin "Send coupon emails" action (waitlistService.sendCouponEmailsToWaitlist)
// once launch mode goes live. The caller is responsible for skipping entries whose coupon
// email was already sent and for recording success against `launch_email_sent`.
export async function sendLaunchCouponEmail({ email, relatedWaitlistId = null }) {
  const waitlistEntry = relatedWaitlistId ? await getWaitlistEntryForCoupon(relatedWaitlistId) : null
  const discount = relatedWaitlistId
    ? await getOrCreateWaitlistLaunchDiscount({ waitlistEntryId: relatedWaitlistId, email })
    : {
        code: env.WAITLIST_LAUNCH_COUPON_CODE,
        discountType: env.WAITLIST_LAUNCH_DISCOUNT_TYPE,
        discountValue: env.WAITLIST_LAUNCH_DISCOUNT_VALUE,
      }

  const rendered = renderWaitlistCouponEmail({
    fullName: waitlistEntry?.fullName,
    couponCode: discount.code,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    services: waitlistEntry?.services || [],
  })

  return sendEmail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    emailType: 'waitlist_launch_offer',
    relatedWaitlistId,
  })
}

// Sends the same production template to only the configured
// WAITLIST_COUPON_TEST_RECIPIENTS allow-list, using a non-redeemable test
// coupon code. Never touches discount_codes, launch_email_sent, or waitlist status.
export async function sendWaitlistCouponTestEmail({ to, fullName, services = [] }) {
  const rendered = renderWaitlistCouponEmail({
    fullName,
    couponCode: 'TEST-ALLAY-15',
    discountType: env.WAITLIST_LAUNCH_DISCOUNT_TYPE,
    discountValue: env.WAITLIST_LAUNCH_DISCOUNT_VALUE,
    services,
    isTest: true,
  })

  return sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    emailType: 'waitlist_coupon_test',
  })
}
