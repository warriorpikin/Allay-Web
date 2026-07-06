import { useMemo, useState } from 'react'
import { loginAdmin } from '../services/adminApi'
import { ADMIN_PROFILE_KEY, ADMIN_TOKEN_KEY } from '../utils/constants'
import { AdminAuthContext } from './admin-auth-context'

function readAdmin() {
  try { return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY)) }
  catch { return null }
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(readAdmin)
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY))

  const login = async (credentials) => {
    const data = await loginAdmin(credentials)
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(data.admin))
    setToken(data.token)
    setAdmin(data.admin)
    return data
  }

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_PROFILE_KEY)
    setToken(null)
    setAdmin(null)
  }

  const value = useMemo(() => ({ admin, token, isAuthenticated: Boolean(token), login, logout }), [admin, token])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

