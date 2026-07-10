import api from './api'
import { CUSTOMER_TOKEN_KEY, CUSTOMER_USER_KEY } from '../utils/constants'

export async function signUpCustomer(data) {
  return api.post('/auth/signup', data).then(({ data: response }) => response)
}

export async function signInCustomer(data) {
  return api.post('/auth/login', data).then(({ data: response }) => response)
}

export async function getCurrentCustomer() {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  try {
    const user = JSON.parse(localStorage.getItem(CUSTOMER_USER_KEY))
    return token && user ? { token, user } : null
  } catch {
    return null
  }
}

export async function logoutCustomer() {
  return { success: true }
}
