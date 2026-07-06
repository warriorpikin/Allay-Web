import { useMemo, useState } from 'react'
import { loginAdmin } from '../services/adminApi'
import { AUTH_ADMIN_KEY, AUTH_TOKEN_KEY } from '../utils/constants'
import { AuthContext } from './auth-context'

function readAdmin() {
  try { return JSON.parse(localStorage.getItem(AUTH_ADMIN_KEY)) }
  catch { return null }
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(readAdmin)
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY))

  const login = async (credentials) => {
    const data = await loginAdmin(credentials)
    localStorage.setItem(AUTH_TOKEN_KEY, data.token)
    localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(data.admin))
    setToken(data.token)
    setAdmin(data.admin)
    return data
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_ADMIN_KEY)
    setToken(null)
    setAdmin(null)
  }

  const value = useMemo(() => ({ admin, token, isAuthenticated: Boolean(token), login, logout }), [admin, token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
