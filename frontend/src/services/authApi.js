import { CUSTOMER_TOKEN_KEY, CUSTOMER_USER_KEY } from '../utils/constants'

const createMockToken = () => `allay_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`

// Frontend-only adapters. Replace these resolved mock responses with API calls
// when customer authentication endpoints are available.
export async function signUpCustomer(data) {
  return { token: createMockToken(), user: { id: `customer_${Date.now()}`, fullName: data.fullName.trim(), email: data.email.trim().toLowerCase(), phone: data.phone.trim() } }
}

export async function signInCustomer(data) {
  let savedUser = null
  try { savedUser = JSON.parse(localStorage.getItem(CUSTOMER_USER_KEY)) }
  catch { savedUser = null }
  const email = data.email.trim().toLowerCase()
  const user = savedUser?.email === email ? savedUser : { id: `customer_${Date.now()}`, fullName: email.split('@')[0], email, phone: '' }
  return { token: createMockToken(), user }
}

export async function getCurrentCustomer() {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  try {
    const user = JSON.parse(localStorage.getItem(CUSTOMER_USER_KEY))
    return token && user ? { token, user } : null
  } catch { return null }
}

export async function logoutCustomer() {
  return { success: true }
}

