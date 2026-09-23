// The database commit is the booking's success boundary, not email delivery.
// On the long-running Express server, slow email delivery can finish after the
// response. Never report a committed booking as failed or make the browser wait
// indefinitely for a provider or email-log write.
export async function settleBookingNotifications(send, { timeoutMs = 1500, onError = () => {} } = {}) {
  let timer
  const delivery = Promise.resolve().then(send).catch((error) => {
    try { onError(error) } catch { /* logging must not change a saved booking */ }
    return { customer: false, admin: false }
  })
  try {
    return await Promise.race([
      delivery,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve({ customer: false, admin: false, pending: true }), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
