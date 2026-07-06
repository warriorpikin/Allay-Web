import { useEffect, useState } from 'react'
import { getCurrentCustomer, logoutCustomer, signInCustomer, signUpCustomer } from '../services/authApi'
import { CUSTOMER_TOKEN_KEY, CUSTOMER_USER_KEY } from '../utils/constants'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getCurrentCustomer()
      .then((session) => { setUser(session?.user || null); setToken(session?.token || null) })
      .finally(() => setIsLoading(false))
  }, [])

  const persistSession = (session) => {
    // Replace this localStorage persistence when the backend issues secure auth sessions.
    localStorage.setItem(CUSTOMER_TOKEN_KEY, session.token)
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(session.user))
    setUser(session.user)
    setToken(session.token)
    return session
  }

  const login = async (credentials) => persistSession(await signInCustomer(credentials))
  const signup = async (details) => persistSession(await signUpCustomer(details))
  const logout = async () => {
    await logoutCustomer()
    localStorage.removeItem(CUSTOMER_TOKEN_KEY)
    localStorage.removeItem(CUSTOMER_USER_KEY)
    setUser(null)
    setToken(null)
  }

  const value = { user, token, isAuthenticated: Boolean(token && user), isLoading, login, signup, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
